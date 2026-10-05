/* Parcours vélo — application : formulaire, planification, résultats, favoris, profil. */
import { SESSIONS, QUIET_LEVELS, compass, compassLong, haversine, bearing, cumulative, ascentOf, parseGPX, toGPX, simulate, overlapRatio, windShares, scoreRoute, compareStarts, simplify, windAt } from './core/ride.js';
import { planRoute } from './core/planner.js';
import { planMultiDay, clampDays, stageGPX, MIN_DAYS, MAX_DAYS } from './core/trip.js';
import { dateKey, addDays, combine, hhmm, hLabel, dayLabel } from './core/dates.js';
import { brouterWebLink } from './services/routing.js';
import { fetchWind } from './services/wind.js';
import { suggest, reverse } from './services/geocode.js';
import * as store from './services/store.js';
import { fetchCarnetMetrics } from './services/carnet-metrics.js';
import { icon, windArrow } from './ui/icons.js';
import { elevationChart, startsChart } from './ui/charts.js';
import * as mapUi from './ui/map.js';
import { initCols, setColsActive } from './ui/cols.js';
import { initRaces, renderRaces } from './ui/races.js';

const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const num = v => {
  const n = Number(String(v ?? '').trim().replace(',', '.'));
  return String(v ?? '').trim() === '' || !Number.isFinite(n) ? null : n;
};
const pct = x => `${Math.round(x * 100)} %`;
const fmtKm = m => `${(m / 1000).toFixed(m < 100000 ? 1 : 0).replace('.', ',')} km`;
const fmtDur = s => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return m === 60 ? `${h + 1} h 00` : `${h} h ${String(m).padStart(2, '0')}`;
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const uid = () => Math.random().toString(36).slice(2, 9);
const isPoint = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon);
const ll = p => [p.lat, p.lon];
/** Modes point à point (nécessitent une arrivée), par opposition à la boucle. */
const needsEnd = mode => mode === 'oneway' || mode === 'multi';

/* ---------- Préférences (avec migration de l'ancien format) ---------- */
const DEFAULT_START = { lat: 47.2378, lon: 6.0241, name: 'Besançon' };
const prefs = store.loadPrefs({ mode: 'loop', session: 'endurance', km: SESSIONS.endurance.km, ascent: '', quiet: 'quiet', start: DEFAULT_START, end: null, vias: [], days: 3 });
if (Array.isArray(prefs.start)) prefs.start = { lat: prefs.start[0], lon: prefs.start[1], name: prefs.startName || null };
delete prefs.startName;
if (!isPoint(prefs.start)) prefs.start = { ...DEFAULT_START };
if (!SESSIONS[prefs.session]) prefs.session = 'endurance';
if (!QUIET_LEVELS[prefs.quiet]) prefs.quiet = 'quiet';
if (!['loop', 'oneway', 'multi'].includes(prefs.mode)) prefs.mode = 'loop';
if (!isPoint(prefs.end)) prefs.end = null;
prefs.days = clampDays(prefs.days);
prefs.vias = Array.isArray(prefs.vias) ? prefs.vias.filter(isPoint).map(v => ({ ...v, id: v.id || uid() })) : [];
prefs.km = Math.min(200, Math.max(20, Number(prefs.km) || SESSIONS[prefs.session].km));
const savePrefs = () => store.savePrefs(prefs);

let profile = store.loadProfile();
let carnetSync = store.loadCarnetSync();
let saved = store.loadSaved();
let result = null; // { routes, wind, windNow, startTime, target, source, loop, kind, note }
let selected = 0;
let running = null;
let picking = null; // étape en attente d'un appui sur la carte
const drafts = new Map(); // id -> texte saisi non validé

/* ---------- Petits composants ---------- */
function toast(message, { error = false } = {}) {
  const el = document.createElement('div');
  el.className = `toast${error ? ' toast--error' : ''}`;
  el.textContent = message;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), error ? 5000 : 2800);
}

const rider = () => ({
  power: profile.ftp * SESSIONS[prefs.session].ftp,
  mass: profile.weight + profile.bike,
  cda: profile.cda
});

/* ---------- Thème ---------- */
const isDark = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  const dark = isDark();
  $('#themeToggle').innerHTML = icon(dark ? 'sun' : 'moon', 20);
  $('#themeToggle').setAttribute('aria-label', dark ? 'Passer en thème clair' : 'Passer en thème sombre');
  mapUi.setMapTheme(dark);
}

/* ---------- Onglets ---------- */
function showTab(name) {
  // Le bouton Profil vit dans l'en-tête, hors de la barre d'onglets (role="tablist") :
  // c'est un simple bouton bascule, donc aria-pressed plutôt qu'aria-selected.
  document.querySelectorAll('[data-tab]').forEach(b => {
    const active = b.dataset.tab === name;
    b.setAttribute(b.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-pressed', String(active));
  });
  ['ride', 'cols', 'saved', 'races', 'profile'].forEach(t => ($(`#pane-${t}`).hidden = t !== name));
  if (name === 'saved') renderSaved();
  if (name === 'races') renderRaces();
  if (name === 'profile') syncFromCarnet({ silent: true });
  setColsActive(name === 'cols');
}

/* =========================================================
   FORMULAIRE
   ========================================================= */

/** Étapes dans l'ordre d'affichage. */
function stopList() {
  const list = [{ id: 'start', kind: 'start', point: prefs.start }];
  prefs.vias.forEach(v => list.push({ id: v.id, kind: 'via', point: v }));
  if (needsEnd(prefs.mode)) list.push({ id: 'end', kind: 'end', point: prefs.end });
  return list;
}

const stopTitle = (stop, index) => (stop.kind === 'start' ? 'Départ' : stop.kind === 'end' ? 'Arrivée' : `Passage ${index}`);
const stopBadge = (stop, index) => (stop.kind === 'start' ? 'A' : stop.kind === 'end' ? 'B' : String(index));

function getStop(id) {
  if (id === 'start') return prefs.start;
  if (id === 'end') return prefs.end;
  return prefs.vias.find(v => v.id === id) || null;
}

function setStopPoint(id, latlng, name = null) {
  const point = { lat: Number(latlng[0].toFixed(5)), lon: Number(latlng[1].toFixed(5)), name };
  if (id === 'start') prefs.start = point;
  else if (id === 'end') prefs.end = point;
  else {
    const v = prefs.vias.find(x => x.id === id);
    if (!v) return;
    Object.assign(v, point);
  }
  drafts.delete(id);
  savePrefs();
  renderStops();
  syncMap();
  invalidateResult();
  // Nom lisible si le point vient de la carte.
  if (!name) {
    reverse(point.lat, point.lon)
      .then(label => {
        const current = getStop(id);
        if (label && current && current.lat === point.lat && current.lon === point.lon && !current.name) {
          current.name = label;
          savePrefs();
          renderStops();
        }
      })
      .catch(() => {});
  }
}

function addVia(point = null) {
  const via = { id: uid(), ...(point || {}) };
  prefs.vias.push(via);
  savePrefs();
  renderStops();
  syncMap();
  invalidateResult();
  return via.id;
}

function removeVia(id) {
  prefs.vias = prefs.vias.filter(v => v.id !== id);
  drafts.delete(id);
  savePrefs();
  renderStops();
  renderDistance();
  syncMap();
  invalidateResult();
}

function renderStops() {
  const list = stopList();
  let n = 0;
  const rows = list.map(stop => {
    const index = stop.kind === 'via' ? ++n : 0;
    const title = stopTitle(stop, index);
    const value = drafts.has(stop.id) ? drafts.get(stop.id) : stop.point?.name || (isPoint(stop.point) ? 'Point sur la carte' : '');
    const placeholder = stop.kind === 'start' ? 'Départ : ville, adresse…' : stop.kind === 'end' ? 'Arrivée : ville, adresse…' : 'Passer par : village, col…';
    return `<li class="stop stop--${stop.kind}${picking === stop.id ? ' is-picking' : ''}" data-stop="${stop.id}">
      <span class="stop__badge" aria-hidden="true">${stopBadge(stop, index)}</span>
      <div class="stop__body">
        <input class="stop__input" type="text" value="${esc(value)}" placeholder="${placeholder}" aria-label="${title}" autocomplete="off" enterkeyhint="search" role="combobox" aria-autocomplete="list" aria-expanded="false" spellcheck="false">
        <ul class="suggest" role="listbox" aria-label="Suggestions" hidden></ul>
      </div>
      <button type="button" class="stop__btn" data-stop-action="pick" aria-label="${title} : placer sur la carte" title="Placer sur la carte">${icon('pin', 18)}</button>
      ${stop.kind === 'start' ? `<button type="button" class="stop__btn" data-stop-action="locate" aria-label="Partir de ma position" title="Ma position">${icon('locate', 18)}</button>` : ''}
      ${stop.kind === 'via' ? `<button type="button" class="stop__btn" data-stop-action="remove" aria-label="Retirer ${title}" title="Retirer">${icon('close', 18)}</button>` : ''}
    </li>`;
  });
  if (prefs.mode === 'loop') rows.push(`<li class="stop stop--return"><span class="stop__badge" aria-hidden="true">${icon('loop', 14)}</span><div class="stop__body"><span class="stop__static">Retour au départ</span></div></li>`);
  $('#stops').innerHTML = rows.join('');
  $('#addVia').querySelector('span:last-child').textContent = prefs.vias.length ? 'Ajouter un autre passage' : 'Ajouter un point de passage';
}

function syncMap() {
  let n = 0;
  const stops = stopList()
    .filter(s => isPoint(s.point))
    .map(s => {
      const index = s.kind === 'via' ? ++n : 0;
      return { id: s.id, kind: s.kind, label: stopBadge(s, index), title: stopTitle(s, index), latlng: ll(s.point) };
    });
  mapUi.setStops(stops);
}

/* ---------- Suggestions de lieux ---------- */
let suggestTimer = null;
let suggestAbort = null;

function closeSuggest(li) {
  const box = li?.querySelector('.suggest');
  if (!box) return;
  box.hidden = true;
  box.innerHTML = '';
  li.querySelector('.stop__input').setAttribute('aria-expanded', 'false');
}

function onStopInput(e) {
  const input = e.target.closest('.stop__input');
  if (!input) return;
  const li = input.closest('[data-stop]');
  const id = li.dataset.stop;
  const q = input.value.trim();
  drafts.set(id, input.value);
  clearTimeout(suggestTimer);
  suggestAbort?.abort();
  if (q.length < 3) return closeSuggest(li);
  suggestTimer = setTimeout(async () => {
    suggestAbort = new AbortController();
    try {
      const near = isPoint(prefs.start) ? ll(prefs.start) : null;
      const hits = await suggest(q, near, suggestAbort.signal);
      const box = li.querySelector('.suggest');
      if (!box || !li.isConnected) return;
      box.innerHTML = hits.length
        ? hits.map((h, i) => `<li role="option" id="sg-${id}-${i}" data-lat="${h.lat}" data-lon="${h.lon}" data-name="${esc(h.name)}" tabindex="-1"><strong>${esc(h.name)}</strong>${h.detail ? `<span>${esc(h.detail)}</span>` : ''}</li>`).join('')
        : '<li class="suggest__empty">Aucun lieu trouvé</li>';
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    } catch (error) {
      if (error.name !== 'AbortError') closeSuggest(li);
    }
  }, 280);
}

function chooseSuggestion(option) {
  const li = option.closest('[data-stop]');
  if (!option.dataset.lat) return;
  setStopPoint(li.dataset.stop, [Number(option.dataset.lat), Number(option.dataset.lon)], option.dataset.name);
  mapUi.panTo([Number(option.dataset.lat), Number(option.dataset.lon)]);
}

function onStopKeydown(e) {
  const input = e.target.closest('.stop__input');
  if (!input) return;
  const li = input.closest('[data-stop]');
  const box = li.querySelector('.suggest');
  const options = [...box.querySelectorAll('[data-lat]')];
  if (e.key === 'ArrowDown' && options.length) {
    e.preventDefault();
    options[0].focus();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (options.length) chooseSuggestion(options[0]);
  } else if (e.key === 'Escape') closeSuggest(li);
}

function onSuggestKeydown(e) {
  const option = e.target.closest('.suggest [data-lat]');
  if (!option) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    chooseSuggestion(option);
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    option.nextElementSibling?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    (option.previousElementSibling || option.closest('[data-stop]').querySelector('.stop__input')).focus();
  }
}

/* ---------- Placement sur la carte ---------- */
function startPicking(id) {
  picking = id;
  const stop = stopList().find(s => s.id === id);
  let n = 0;
  const index = stop?.kind === 'via' ? prefs.vias.findIndex(v => v.id === id) + 1 : n;
  $('#mapBannerText').innerHTML = `Touchez la carte pour placer : <strong>${esc(stop ? stopTitle(stop, index) : 'le point')}</strong>`;
  $('#mapBanner').hidden = false;
  renderStops();
  if (matchMedia('(max-width: 959px)').matches) $('.map-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function stopPicking() {
  if (!picking) return;
  const id = picking;
  picking = null;
  $('#mapBanner').hidden = true;
  // Un passage ajouté puis abandonné sans position est retiré.
  const v = prefs.vias.find(x => x.id === id);
  if (v && !isPoint(v)) removeVia(id);
  else renderStops();
}

function onMapTap(latlng) {
  if (picking) {
    const id = picking;
    picking = null;
    $('#mapBanner').hidden = true;
    setStopPoint(id, latlng);
    return;
  }
  const actions = [{ label: 'Départ ici', run: () => setStopPoint('start', latlng) }];
  actions.push({ label: 'Ajouter un passage', primary: true, run: () => setStopPoint(addVia(), latlng) });
  if (needsEnd(prefs.mode)) actions.push({ label: 'Arrivée ici', run: () => setStopPoint('end', latlng) });
  mapUi.showActions(latlng, actions);
}

function locate() {
  if (!navigator.geolocation) return toast('Géolocalisation indisponible sur cet appareil.', { error: true });
  navigator.geolocation.getCurrentPosition(
    pos => {
      setStopPoint('start', [pos.coords.latitude, pos.coords.longitude], 'Ma position');
      mapUi.panTo(ll(prefs.start));
    },
    () => toast('Position refusée ou introuvable.', { error: true }),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function onStopsClick(e) {
  const option = e.target.closest('.suggest [data-lat]');
  if (option) return chooseSuggestion(option);
  const btn = e.target.closest('[data-stop-action]');
  if (!btn) return;
  const id = btn.closest('[data-stop]').dataset.stop;
  const action = btn.dataset.stopAction;
  if (action === 'remove') removeVia(id);
  if (action === 'locate') locate();
  if (action === 'pick') (picking === id ? stopPicking() : startPicking(id));
}

/* ---------- Mode, séance, distance, jour, routes ---------- */
function renderMode() {
  document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === prefs.mode)));
  $('#submitLabel').textContent = prefs.mode === 'loop' ? 'Trouver mes boucles' : prefs.mode === 'multi' ? 'Planifier mon itinéraire' : 'Trouver mon itinéraire';
  renderDistance();
  renderDays();
}

function setMode(mode) {
  if (prefs.mode === mode) return;
  prefs.mode = mode;
  savePrefs();
  renderMode();
  renderStops();
  syncMap();
  invalidateResult();
  if (needsEnd(mode) && !isPoint(prefs.end)) {
    const input = $('[data-stop="end"] .stop__input');
    input?.focus();
  }
}

/** Pas à pas du nombre de jours (mode « Plusieurs jours »). */
function renderDays() {
  const field = $('#daysField');
  if (!field) return;
  field.hidden = prefs.mode !== 'multi';
  $('#daysOut').textContent = `${prefs.days} jour${prefs.days > 1 ? 's' : ''}`;
  $('#f-days').value = prefs.days;
  $('#f-days').min = MIN_DAYS;
  $('#f-days').max = MAX_DAYS;
}

function renderSessions() {
  $('#sessionChips').innerHTML = Object.entries(SESSIONS)
    .map(([k, s]) => `<button type="button" class="chip" role="radio" data-session="${k}" aria-checked="${k === prefs.session}">${esc(s.label)}</button>`)
    .join('');
  $('#sessionHint').textContent = SESSIONS[prefs.session].hint;
}

/** Curseur : 15 = « au plus court » quand il y a des passages. */
const SHORTEST = 15;
function renderDistance() {
  const field = $('#distanceField');
  field.hidden = prefs.mode !== 'loop';
  const slider = $('#f-km');
  const withVias = prefs.vias.some(isPoint);
  slider.min = withVias ? SHORTEST : 20;
  if (!withVias && prefs.km < 20) prefs.km = SESSIONS[prefs.session].km;
  slider.value = prefs.km;
  const shortest = withVias && prefs.km <= SHORTEST;
  $('#kmOut').textContent = shortest ? 'Au plus court' : `${prefs.km} km`;
  slider.setAttribute('aria-valuetext', shortest ? 'Au plus court par vos points' : `${prefs.km} kilomètres`);
  $('#distanceHint').textContent = withVias
    ? shortest
      ? 'La boucle passe par vos points par le chemin le plus direct.'
      : 'La boucle passe par vos points et ajoute un détour si besoin pour atteindre la distance.'
    : '';
  $('#distanceHint').hidden = !withVias;
  renderRider();
}

function renderRider() {
  const s = SESSIONS[prefs.session];
  const auto = s.climb === null || prefs.mode !== 'loop' ? null : Math.round(s.climb * prefs.km);
  $('#f-ascent').placeholder = auto === null ? 'Libre' : `Auto · ${auto} m`;
  $('#riderNote').innerHTML = `Allure visée : <strong>${Math.round(rider().power)} W</strong> (${Math.round(s.ftp * 100)} % de votre FTP de ${profile.ftp} W)${
    profile.custom ? '' : ' — <button type="button" class="link" data-go="profile">renseignez votre profil</button>'
  }.`;
}

function renderQuiet() {
  $('#quietSwitch').innerHTML = Object.entries(QUIET_LEVELS)
    .map(([k, q]) => `<button type="button" role="radio" data-quiet="${k}" aria-checked="${k === prefs.quiet}">${esc(q.short || q.label)}</button>`)
    .join('');
}

function setDay(day) {
  const today = new Date();
  document.querySelectorAll('[data-day]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.day === day)));
  const date = $('#f-date');
  date.hidden = day !== 'other';
  if (day === 'today') date.value = dateKey(today);
  if (day === 'tomorrow') date.value = dateKey(addDays(today, 1));
  if (day === 'other' && !date.value) date.value = dateKey(addDays(today, 2));
}

const getStartTime = () => combine($('#f-date').value, $('#f-time').value);

function initWhen() {
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  let day = 'today';
  if (next.getHours() > 19 || next.getHours() < 6) {
    if (next.getHours() > 19) day = 'tomorrow';
    next.setHours(9);
  }
  const date = $('#f-date');
  date.min = dateKey(new Date());
  date.max = dateKey(addDays(new Date(), 15));
  setDay(day);
  $('#f-time').value = hhmm(next);
}

/** Les réglages ont changé : le résultat affiché n'est plus à jour (sauf l'heure, recalculée seule). */
function invalidateResult() {
  if (!result || result.source !== 'plan') return;
  $('#submitBtn').classList.add('is-stale');
}

/* ---------- Lecture et calcul ---------- */
function readForm() {
  const fail = (el, message) => {
    if (el) {
      el.setAttribute('aria-invalid', 'true');
      el.focus();
    }
    toast(message, { error: true });
    return null;
  };
  document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  if (!isPoint(prefs.start)) return fail($('[data-stop="start"] .stop__input'), 'Choisissez un point de départ.');
  if (needsEnd(prefs.mode) && !isPoint(prefs.end)) return fail($('[data-stop="end"] .stop__input'), 'Choisissez une arrivée.');
  const pending = prefs.vias.find(v => !isPoint(v));
  if (pending) return fail($(`[data-stop="${pending.id}"] .stop__input`), 'Choisissez un lieu dans la liste pour ce passage, ou retirez-le.');
  if (prefs.mode === 'multi') {
    // Pas de simulation de vent ni de dénivelé visé pour ce mode : distance, dénivelé
    // et qualité de route sont lus par étape une fois l'itinéraire calculé.
    const startTime = getStartTime() || new Date();
    return { mode: prefs.mode, start: ll(prefs.start), end: ll(prefs.end), vias: prefs.vias.map(ll), km: null, ascent: null, startTime, quiet: prefs.quiet, days: prefs.days };
  }
  const ascentRaw = num($('#f-ascent').value);
  if (ascentRaw !== null && (ascentRaw < 0 || ascentRaw > 6000)) {
    $('.more').open = true;
    return fail($('#f-ascent'), 'Indiquez un dénivelé entre 0 et 6000 m, ou laissez vide.');
  }
  const startTime = getStartTime();
  if (!startTime) return fail($('#f-time'), 'Choisissez le jour et l’heure de départ.');
  if (startTime > addDays(new Date(), 15)) return fail($('#f-date'), 'Les prévisions de vent couvrent les 15 prochains jours.');
  const vias = prefs.vias.map(ll);
  const shortest = vias.length && prefs.km <= SHORTEST;
  const km = prefs.mode === 'oneway' || shortest ? null : prefs.km;
  const s = SESSIONS[prefs.session];
  const ascent = ascentRaw ?? (s.climb === null || !km ? null : Math.round(s.climb * km));
  return { mode: prefs.mode, start: ll(prefs.start), end: prefs.end ? ll(prefs.end) : null, vias, km, ascent, startTime, quiet: prefs.quiet };
}

function setProgress(done, total, label) {
  const el = $('#progress');
  el.hidden = false;
  el.querySelector('.progress__bar').style.setProperty('--value', `${Math.round((done / total) * 100)}%`);
  el.querySelector('.progress__label').textContent = label;
}

async function generate(event) {
  event?.preventDefault();
  stopPicking();
  const input = readForm();
  if (!input) return;
  prefs.ascent = $('#f-ascent').value.trim();
  savePrefs();
  running?.abort();
  const controller = new AbortController();
  running = controller;
  $('#submitBtn').disabled = true;
  setProgress(0, 1, 'Préparation…');
  try {
    if (input.mode === 'multi') {
      const trip = await planMultiDay({ ...input, onProgress: setProgress, signal: controller.signal });
      result = { kind: 'multi', mode: 'multi', source: 'plan', trip, startNameLabel: prefs.start.name, endNameLabel: prefs.end.name };
      $('#submitBtn').classList.remove('is-stale');
      renderAll();
      if (matchMedia('(max-width: 959px)').matches) $('.map-wrap').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const planned = await planRoute({ ...input, ...rider(), onProgress: setProgress, signal: controller.signal });
    if (!planned.routes.length) throw new Error('Aucun itinéraire trouvé.');
    planned.routes.forEach(r => (r.quiet = input.quiet));
    const kind = input.mode === 'oneway' ? 'oneway' : input.vias.length ? 'via' : 'free';
    result = { ...planned, startTime: input.startTime, source: 'plan', kind, mode: input.mode };
    selected = 0;
    $('#submitBtn').classList.remove('is-stale');
    renderAll();
    if (planned.note) toast(planned.note);
    if (matchMedia('(max-width: 959px)').matches) $('.map-wrap').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    if (error.name !== 'AbortError') toast(friendlyError(error), { error: true });
  } finally {
    if (running === controller) running = null;
    $('#submitBtn').disabled = false;
    $('#progress').hidden = true;
  }
}

function friendlyError(error) {
  const m = String(error?.message || '');
  if (error?.name === 'TypeError' || /fetch|network|réseau/i.test(m)) return 'Pas de connexion aux services d’itinéraire ou de météo. Vérifiez le réseau et réessayez.';
  if (/not mapped|position/i.test(m)) return 'Un de vos points est trop loin d’une route. Déplacez-le sur une route et réessayez.';
  return m || 'Calcul impossible pour le moment.';
}

/* ---------- Recalcul du vent sans re-router (changement d'heure, favori) ---------- */
function resimulate(routes, startTime, wind) {
  const t0 = startTime.getTime();
  const target = result?.target || { km: routes[0].meters / 1000, ascent: null };
  const loop = result ? result.loop !== false : true;
  routes.forEach(r => {
    r.sim = simulate(r.coords, { ...rider(), startTime: t0, wind });
    r.shares = windShares(r.sim);
    r.overlap ??= overlapRatio(r.coords);
    r.score = scoreRoute(r, target, { loop });
    // GPX importé : même parcours dans l'autre sens, pour comparer l'effet du vent.
    if (result?.source === 'gpx') {
      const back = simulate([...r.coords].reverse(), { ...rider(), startTime: t0, wind });
      r.reverseGain = r.sim.seconds - back.seconds;
    }
  });
}

async function refreshTime() {
  if (!result) return;
  const startTime = getStartTime();
  if (!startTime || startTime > addDays(new Date(), 15)) return;
  try {
    const first = result.routes[0].coords[0];
    const wind = await fetchWind(first[0], first[1], startTime);
    const current = result.routes[selected];
    const t0 = startTime.getTime();
    result.wind = wind;
    result.startTime = startTime;
    result.windNow = wind.reduce((b, h) => (Math.abs(h.t - t0) < Math.abs(b.t - t0) ? h : b), wind[0]);
    resimulate(result.routes, startTime, wind);
    if (result.source === 'plan') result.routes.sort((a, b) => a.score.total - b.score.total);
    selected = Math.max(0, result.routes.indexOf(current));
    renderAll({ fit: false });
  } catch (error) {
    toast(friendlyError(error), { error: true });
  }
}

/* ---------- Rendu des résultats ---------- */
function renderAll({ fit = true } = {}) {
  if (result?.kind === 'multi') return renderMultiAll({ fit });
  $('#forecast').hidden = false;
  renderForecast();
  const has = !!result?.routes.length;
  $('#results').hidden = !has;
  if (!has) {
    mapUi.clearRoutes();
    return;
  }
  $('#options').hidden = false;
  renderOptions();
  renderDetail();
  mapUi.drawRoute(result.routes[selected], { fit });
}

/* ---------- Planification multi-jours (sans simulation de vent) ---------- */
function renderMultiAll({ fit = true } = {}) {
  $('#forecast').hidden = true;
  $('#options').hidden = true;
  $('#results').hidden = false;
  renderMultiDetail();
  mapUi.drawRoute({ coords: result.trip.coords }, { fit });
}

function renderMultiDetail() {
  const t = result.trip;
  const startName = esc(result.startNameLabel || 'Départ');
  const endName = esc(result.endNameLabel || 'Arrivée');
  const warnings = [];
  if (t.roadProfile === false) warnings.push('Profil vélo de route indisponible sur le serveur : itinéraire calculé avec un profil BRouter standard, vérifiez les portions non asphaltées.');
  $('#detail').innerHTML = `
    <h3 class="detail__title">${startName} → ${endName}</h3>
    <p class="detail__sub">${t.days.length} étapes · ${esc(QUIET_LEVELS[prefs.quiet]?.label || '')}</p>
    <div class="stats">
      <div class="stat"><strong>${fmtKm(t.meters)}</strong><span>Distance totale</span></div>
      <div class="stat"><strong>${Math.round(t.ascent)} m</strong><span>Dénivelé positif total</span></div>
      <div class="stat"><strong>${t.days.length}</strong><span>Jours</span></div>
      <div class="stat"><strong>${fmtKm(t.meters / t.days.length)}</strong><span>Moyenne / jour</span></div>
    </div>
    ${warnings.length ? `<section class="block">${warnings.map(w => `<p class="warn">${icon('alert', 16)}<span>${esc(w)}</span></p>`).join('')}</section>` : ''}
    <section class="block">
      <h4 class="block__title">Étapes</h4>
      <div class="options" role="list">
        ${t.days
          .map(
            (d, i) => `<div class="option" role="listitem">
              <span class="option__top"><span class="option__name">Jour ${i + 1}</span></span>
              <span class="option__stats"><span>${fmtKm(d.meters)}</span><span>${Math.round(d.ascent)} m D+</span></span>
              <button type="button" class="btn btn--soft btn--sm" data-action="stage-gpx" data-stage="${i}" style="margin-top:8px">${icon('download', 16)}<span>Export GPX étape ${i + 1}</span></button>
            </div>`
          )
          .join('')}
      </div>
    </section>
    <div class="actions">
      <button type="button" class="btn btn--primary" data-action="trip-gpx">${icon('download')}<span>Exporter l’itinéraire complet (GPX)</span></button>
      <p class="export-hint">Chaque étape peut aussi être exportée séparément pour votre GPS ou votre app (Komoot, Garmin, Wahoo).</p>
    </div>`;
}

function exportTripGPX() {
  const t = result.trip;
  const name = `${result.startNameLabel || 'Départ'} → ${result.endNameLabel || 'Arrivée'} · ${Math.round(t.meters / 1000)} km`;
  const fileName = `itineraire-${t.days.length}jours-${Math.round(t.meters / 1000)}km.gpx`;
  shareOrDownloadFile(new File([toGPX(name, t.coords)], fileName, { type: 'application/gpx+xml' }), name);
}

function exportStageGPX(index) {
  const t = result.trip;
  const name = `Étape ${index + 1} · ${Math.round(t.days[index].meters / 1000)} km`;
  const fileName = `etape-${index + 1}-${Math.round(t.days[index].meters / 1000)}km.gpx`;
  shareOrDownloadFile(new File([stageGPX(t, index, 'Échappée')], fileName, { type: 'application/gpx+xml' }), name);
}

function renderForecast() {
  const host = $('#forecast');
  if (!result) {
    host.hidden = true;
    return;
  }
  const w = result.windNow;
  const r = result.routes[selected];
  const t0 = result.startTime.getTime();
  const t1 = t0 + (r?.sim?.seconds || 3 * 3600) * 1000;
  const day = dateKey(result.startTime);
  const hours = result.wind.filter(h => dateKey(h.t) === day && new Date(h.t).getHours() >= 6 && new Date(h.t).getHours() <= 21);
  let advice;
  if (w.speed < 8) advice = 'Vent faible : il ne pèsera pas sur la sortie.';
  else if (result.loop === false && r) advice = r.shares.head > 0.45 ? `Vent de face sur ${pct(r.shares.head)} du trajet : prévoyez de la marge.` : r.shares.tail > 0.45 ? `Vent favorable sur ${pct(r.shares.tail)} du trajet.` : 'Vent surtout de côté sur ce trajet.';
  else if (result.source === 'gpx') advice = r?.reverseGain >= 180 ? 'Avec ce vent, ce parcours est plus favorable dans l’autre sens.' : 'Ce sens de parcours est le bon avec ce vent.';
  else if (result.kind === 'via') advice = 'Le sens de la boucle a été choisi pour finir avec le vent le plus favorable.';
  else advice = `Partez vers le ${compassLong(w.dir)}, face au vent : le retour se fera vent dans le dos.`;
  host.hidden = false;
  host.innerHTML = `
    <div class="forecast__head">
      <div class="wind-arrow" title="Sens du vent">${windArrow(w.dir)}</div>
      <div>
        <div class="forecast__title">Vent de ${compass(w.dir)} · ${Math.round(w.speed)} km/h</div>
        <div class="forecast__sub">${esc(cap(dayLabel(result.startTime)))} à ${hhmm(result.startTime)} · rafales ${Math.round(w.gust)} km/h${Number.isFinite(w.temp) ? ` · ${Math.round(w.temp)} °C` : ''}${Number.isFinite(w.rain) ? ` · pluie ${w.rain} %` : ''}</div>
        <div class="forecast__advice">${esc(advice)}</div>
      </div>
    </div>
    <div class="strip" aria-label="Vent heure par heure">
      ${hours
        .map(h => {
          const inRide = h.t >= t0 - 1800000 && h.t <= t1;
          return `<div class="strip__h${inRide ? ' is-ride' : ''}" title="${new Date(h.t).getHours()} h : vent de ${compass(h.dir)} ${Math.round(h.speed)} km/h">${new Date(h.t).getHours()}h${windArrow(h.dir, 16)}<b>${Math.round(h.speed)}</b></div>`;
        })
        .join('')}
    </div>`;
}

function routeName(r) {
  return r.name || `Boucle ${compassLong(r.heading ?? 0)}`;
}

function renderOptions() {
  $('#options').innerHTML = result.routes
    .map(
      (r, i) => `<button type="button" class="option" role="option" data-route="${i}" aria-selected="${i === selected}">
        <span class="option__top"><span class="option__name">${esc(routeName(r))}</span>${i === 0 && result.source === 'plan' && result.routes.length > 1 ? '<span class="badge">Recommandée</span>' : ''}</span>
        ${r.subtitle ? `<span class="option__sub">${esc(r.subtitle)}</span>` : ''}
        <span class="option__stats"><span>${fmtKm(r.meters)}</span><span>${Math.round(r.ascent)} m D+</span><span>${fmtDur(r.sim.seconds)}</span></span>
        <span class="bar" aria-hidden="true"><span style="--c:var(--tail);flex:${r.shares.tail}"></span><span style="--c:var(--cross);flex:${r.shares.cross}"></span><span style="--c:var(--head);flex:${r.shares.head}"></span></span>
      </button>`
    )
    .join('');
}

function warningsFor(r) {
  const out = [];
  const t = result.target;
  const mix = r.mix || {};
  if (result.source === 'plan' && result.kind !== 'oneway' && t.km && Math.abs(r.meters / 1000 - t.km) / t.km > 0.12) out.push(`Distance éloignée de l’objectif (${t.km} km) : le réseau routier autour du départ limite les possibilités.`);
  if (result.source === 'plan' && result.kind !== 'oneway' && t.ascent !== null && Math.abs(r.ascent - t.ascent) > Math.max(250, t.ascent * 0.35))
    out.push(r.ascent < t.ascent ? `Moins de dénivelé que prévu (${t.ascent} m visés) : essayez un départ plus proche du relief.` : `Plus de dénivelé que prévu (${t.ascent} m visés) : réduisez la distance ou choisissez une autre boucle.`);
  if (r.roadProfile === false) out.push('Profil vélo de route indisponible sur le serveur : itinéraire calculé avec un profil BRouter standard, vérifiez les portions non asphaltées.');
  if (mix.major > 0.08) out.push(`${pct(mix.major)} sur routes principales : choisissez « Très calme » pour les éviter.`);
  if (mix.unpaved > 0.03) out.push(`${pct(mix.unpaved)} de revêtement non asphalté selon OpenStreetMap.`);
  if (result.note) out.push(result.note);
  if (r.overlap > 0.15) out.push(`${pct(r.overlap)} de la boucle repasse par les mêmes routes.`);
  const end = result.startTime.getTime() + r.sim.seconds * 1000;
  const during = result.wind.filter(h => h.t >= result.startTime.getTime() - 1800000 && h.t <= end);
  const gust = Math.max(0, ...during.map(h => h.gust));
  const rain = Math.max(0, ...during.map(h => h.rain ?? 0));
  if (gust >= 45) out.push(`Rafales jusqu’à ${Math.round(gust)} km/h pendant la sortie : attention aux passages exposés et aux descentes.`);
  if (rain >= 50) out.push(`Risque de pluie jusqu’à ${rain} % pendant la sortie.`);
  return out;
}

function startSlots(r) {
  const day = result.startTime;
  const lastWind = result.wind[result.wind.length - 1].t;
  const starts = [];
  for (let h = 6; h <= 20; h++) {
    const t = new Date(day);
    t.setHours(h, 0, 0, 0);
    if (t.getTime() + r.sim.seconds * 1000 <= lastWind && t.getTime() >= result.wind[0].t) starts.push(t.getTime());
  }
  return compareStarts(r.coords, { ...rider(), wind: result.wind }, starts).map(s => {
    const end = s.t + s.seconds * 1000;
    const rains = result.wind.filter(h => h.t >= s.t - 1800000 && h.t <= end && Number.isFinite(h.rain)).map(h => h.rain);
    return { ...s, rain: rains.length ? Math.max(...rains) : null };
  });
}

function renderDetail() {
  const r = result.routes[selected];
  const width = $('#detail').clientWidth - 34 || 360;
  const speed = r.meters / 1000 / (r.sim.seconds / 3600);
  const lost = r.sim.seconds - r.sim.secondsNoWind;
  const { first, second } = r.score.half;
  const fh = v => (Math.abs(v) < 1.5 ? 'vent neutre' : v > 0 ? `${Math.round(v)} km/h de face` : `${Math.round(-v)} km/h dans le dos`);
  const back = new Date(result.startTime.getTime() + r.sim.seconds * 1000);
  const mix = r.mix || { quiet: 0, medium: 0, major: 0, other: 1, cycleRoute: 0, unpaved: 0 };
  const slots = startSlots(r);
  const best = slots.length ? slots.reduce((a, b) => (b.seconds < a.seconds ? b : a)) : null;
  const gain = best ? Math.round((r.sim.seconds - best.seconds) / 60) : 0;
  const isSaved = saved.some(s => s.id === r.savedId);

  $('#detail').innerHTML = `
    <h3 class="detail__title">${esc(routeName(r))}</h3>
    <p class="detail__sub">${esc(SESSIONS[prefs.session].label)} · départ ${hhmm(result.startTime)} · ${result.loop === false ? 'arrivée' : 'retour'} vers ${hLabel(back)}${r.subtitle ? ` · ${esc(r.subtitle.toLowerCase())}` : ''}</p>
    <div class="stats">
      <div class="stat"><strong>${fmtKm(r.meters)}</strong><span>Distance</span></div>
      <div class="stat"><strong>${Math.round(r.ascent)} m</strong><span>Dénivelé positif</span></div>
      <div class="stat"><strong>${fmtDur(r.sim.seconds)}</strong><span>Durée estimée</span></div>
      <div class="stat"><strong>${speed.toFixed(1).replace('.', ',')} km/h</strong><span>Moyenne à ${Math.round(rider().power)} W</span></div>
    </div>

    <section class="block">
      <h4 class="block__title">Vent sur le parcours</h4>
      <div class="bar"><span style="--c:var(--tail);flex:${r.shares.tail}"></span><span style="--c:var(--cross);flex:${r.shares.cross}"></span><span style="--c:var(--head);flex:${r.shares.head}"></span></div>
      <div class="legend"><span style="--c:var(--tail)">Dos ${pct(r.shares.tail)}</span><span style="--c:var(--cross)">Côté ${pct(r.shares.cross)}</span><span style="--c:var(--head)">Face ${pct(r.shares.head)}</span></div>
      <p class="text">${result.loop === false ? '1re moitié' : 'Aller'} : <strong>${fh(first)}</strong> · ${result.loop === false ? '2de moitié' : 'Retour'} : <strong>${fh(second)}</strong>. ${
        Math.abs(lost) >= 60 ? `Le vent ${lost > 0 ? 'coûte' : 'fait gagner'} environ <strong>${Math.round(Math.abs(lost) / 60)} min</strong>.` : 'Effet du vent négligeable.'
      }</p>
      ${
        result.source === 'gpx' && r.reverseGain >= 180
          ? `<p class="text">Dans l’autre sens, ce parcours prendrait environ <strong>${Math.round(r.reverseGain / 60)} min de moins</strong> avec ce vent.</p><button type="button" class="btn btn--soft btn--sm" data-action="reverse" style="margin-top:8px">${icon('loop', 16)}<span>Inverser le sens</span></button>`
          : ''
      }
    </section>

    ${
      slots.length > 2
        ? `<section class="block">
      <h4 class="block__title">Meilleur créneau de départ</h4>
      ${startsChart(slots, result.startTime.getTime(), width)}
      <p class="text">${
        gain >= 3
          ? `En partant à <strong>${new Date(best.t).getHours()} h</strong>, ce parcours prend <strong>${gain} min de moins</strong> grâce au vent. Touchez une barre pour changer l’heure.`
          : 'Votre heure de départ est déjà parmi les plus favorables. Touchez une barre pour comparer.'
      }</p>
    </section>`
        : ''
    }

    <section class="block">
      <h4 class="block__title">Profil</h4>
      ${elevationChart(r, width)}
    </section>

    ${
      r.mix
        ? `<section class="block">
      <h4 class="block__title">Routes empruntées</h4>
      <div class="bar"><span style="--c:var(--tail);flex:${mix.quiet}"></span><span style="--c:var(--sky);flex:${mix.medium}"></span><span style="--c:var(--danger);flex:${mix.major}"></span><span style="--c:var(--text-3);flex:${mix.other}"></span></div>
      <div class="legend"><span style="--c:var(--tail)">Petites routes ${pct(mix.quiet)}</span><span style="--c:var(--sky)">Départementales ${pct(mix.medium)}</span><span style="--c:var(--danger)">Grands axes ${pct(mix.major)}</span>${mix.other > 0.01 ? `<span style="--c:var(--text-3)">Autres ${pct(mix.other)}</span>` : ''}</div>
      ${mix.cycleRoute > 0.05 ? `<p class="text">${pct(mix.cycleRoute)} sur des itinéraires cyclables balisés.</p>` : ''}
      ${warningsFor(r).map(w => `<p class="warn">${icon('alert', 16)}<span>${esc(w)}</span></p>`).join('')}
    </section>`
        : warningsFor(r).length
          ? `<section class="block"><h4 class="block__title">À savoir</h4>${warningsFor(r).map(w => `<p class="warn">${icon('alert', 16)}<span>${esc(w)}</span></p>`).join('')}</section>`
          : ''
    }

    <div class="actions">
      <button type="button" class="btn btn--primary" data-action="gpx">${icon('download')}<span>Exporter GPX</span></button>
      <button type="button" class="btn btn--soft" data-action="save" ${isSaved ? 'disabled' : ''}>${icon('star')}<span>${isSaved ? 'Enregistré' : 'Enregistrer'}</span></button>
      <a class="btn btn--soft" href="${esc(stravaLink(r))}" target="_blank" rel="noopener">${icon('external')}<span>Heatmap Strava</span></a>
      ${r.waypoints ? `<a class="btn btn--soft" href="${esc(brouterWebLink(r.waypoints, r.quiet || prefs.quiet))}" target="_blank" rel="noopener">${icon('edit')}<span>Retoucher</span></a>` : ''}
      <p class="export-hint">Komoot, Garmin, Wahoo : exportez le GPX puis choisissez l’app dans la feuille de partage (ou importez-le sur komoot.com).</p>
    </div>`;
}

function stravaLink(r) {
  const lats = r.coords.map(c => c[0]);
  const lons = r.coords.map(c => c[1]);
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const lon = (Math.min(...lons) + Math.max(...lons)) / 2;
  return `https://www.strava.com/maps/global-heatmap?sport=Ride&style=dark&gColor=hot#${r.meters > 90000 ? 10 : 11}/${lat.toFixed(4)}/${lon.toFixed(4)}`;
}

/* ---------- Export et favoris ---------- */
async function shareOrDownloadFile(file, title) {
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Fichier GPX téléchargé');
}

async function exportGPX(r) {
  const name = `${routeName(r)} · ${Math.round(r.meters / 1000)} km`;
  const fileName = `parcours-${Math.round(r.meters / 1000)}km-${compass(r.heading ?? 0).toLowerCase()}.gpx`;
  await shareOrDownloadFile(new File([toGPX(name, r.coords)], fileName, { type: 'application/gpx+xml' }), name);
}

function saveRoute(r) {
  const id = Date.now().toString(36);
  const item = {
    id,
    name: `${routeName(r)} · ${Math.round(r.meters / 1000)} km`,
    savedAt: Date.now(),
    start: ll(prefs.start),
    startName: prefs.start.name,
    mode: result.mode || 'loop',
    loop: result.loop !== false,
    session: prefs.session,
    heading: r.heading,
    meters: Math.round(r.meters),
    ascent: Math.round(r.ascent),
    mix: r.mix,
    quiet: r.quiet,
    waypoints: r.waypoints,
    coords: simplify(r.coords, 8).map(([a, b, e]) => [Number(a.toFixed(5)), Number(b.toFixed(5)), e === null ? null : Math.round(e)])
  };
  saved.unshift(item);
  if (!store.storeSaved(saved)) {
    saved.shift();
    toast('Stockage plein : supprimez un favori pour en enregistrer un nouveau.', { error: true });
    return;
  }
  r.savedId = id;
  renderSavedCount();
  renderDetail();
  toast('Parcours enregistré dans vos favoris');
}

function renderSavedCount() {
  $('#savedCount').textContent = saved.length ? String(saved.length) : '';
}

function renderSaved() {
  const host = $('#savedList');
  if (!saved.length) {
    host.innerHTML = `<div class="empty">Aucun parcours enregistré.<br>Générez une boucle puis touchez « Enregistrer ».</div>`;
    return;
  }
  host.innerHTML = saved
    .map(
      s => `<article class="saved" data-id="${esc(s.id)}">
        <div><div class="saved__name">${esc(s.name)}</div>
        <div class="saved__meta">${s.loop === false ? 'Aller simple' : 'Boucle'} · ${fmtKm(s.meters)} · ${s.ascent} m D+ · départ ${esc(s.startName || 'point personnalisé')} · ${new Date(s.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div></div>
        <div class="saved__actions">
          <button type="button" class="btn btn--primary btn--sm" data-saved="open">${icon('map', 16)}<span>Ouvrir avec le vent</span></button>
          <button type="button" class="btn btn--soft btn--sm" data-saved="gpx">${icon('download', 16)}<span>GPX</span></button>
          <button type="button" class="btn btn--soft btn--sm" data-saved="rename">${icon('edit', 16)}<span>Renommer</span></button>
          <button type="button" class="btn btn--danger btn--sm" data-saved="delete">${icon('trash', 16)}<span>Supprimer</span></button>
        </div>
      </article>`
    )
    .join('');
}

async function openSaved(item) {
  const startTime = getStartTime() || new Date();
  try {
    const wind = await fetchWind(item.start[0], item.start[1], startTime);
    const t0 = startTime.getTime();
    const r = { ...item, coords: item.coords, name: item.name, savedId: item.id };
    prefs.session = SESSIONS[item.session] ? item.session : prefs.session;
    renderSessions();
    renderRider();
    result = { routes: [r], wind, windNow: wind.reduce((b, h) => (Math.abs(h.t - t0) < Math.abs(b.t - t0) ? h : b), wind[0]), startTime, target: { km: item.meters / 1000, ascent: null }, source: 'saved', loop: item.loop !== false, kind: item.loop === false ? 'oneway' : 'free' };
    resimulate(result.routes, startTime, wind);
    selected = 0;
    showTab('ride');
    renderAll();
  } catch (error) {
    toast(friendlyError(error), { error: true });
  }
}

function onSavedAction(e) {
  const btn = e.target.closest('[data-saved]');
  if (!btn) return;
  const card = btn.closest('[data-id]');
  const item = saved.find(s => s.id === card.dataset.id);
  if (!item) return;
  const action = btn.dataset.saved;
  if (action === 'open') openSaved(item);
  if (action === 'gpx') exportGPX({ ...item, heading: item.heading });
  if (action === 'rename') {
    const nameEl = card.querySelector('.saved__name');
    const input = Object.assign(document.createElement('input'), { className: 'input', value: item.name, maxLength: 80 });
    input.setAttribute('aria-label', 'Nom du parcours');
    nameEl.replaceWith(input);
    input.focus();
    input.select();
    const commit = () => {
      item.name = input.value.trim() || item.name;
      store.storeSaved(saved);
      renderSaved();
    };
    input.addEventListener('blur', commit, { once: true });
    input.addEventListener('keydown', ev => ev.key === 'Enter' && input.blur());
  }
  if (action === 'delete') {
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm = '1';
      btn.querySelector('span').textContent = 'Confirmer';
      setTimeout(() => {
        if (btn.isConnected) {
          btn.dataset.confirm = '';
          btn.querySelector('span').textContent = 'Supprimer';
        }
      }, 3000);
      return;
    }
    saved = saved.filter(s => s !== item);
    store.storeSaved(saved);
    renderSaved();
    renderSavedCount();
    toast('Parcours supprimé');
  }
}

/* ---------- Profil ---------- */
function fillProfile() {
  const f = $('#profileForm');
  f.ftp.value = profile.ftp;
  f.weight.value = String(profile.weight).replace('.', ',');
  f.bike.value = String(profile.bike).replace('.', ',');
  f.cda.value = [0.4, 0.36, 0.32].reduce((a, b) => (Math.abs(b - profile.cda) < Math.abs(a - profile.cda) ? b : a)).toFixed(2);
}

/** « 3 oct. » à partir d'une clé AAAA-MM-JJ, sans décalage de fuseau. */
function shortDate(key) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
  if (!m) return '';
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function applyCarnetSyncUI() {
  const btn = $('#carnetSyncToggle');
  btn.setAttribute('aria-pressed', String(carnetSync));
  btn.querySelector('span').textContent = carnetSync ? 'Lié à Carnet ✓' : 'Lier à Carnet';
}

/**
 * Reprend le FTP et le poids depuis les dernières valeurs de l'onglet Mesures
 * de Carnet, si la liaison est activée. Réglage strictement local : n'affecte
 * que la personne qui l'active elle-même (ex. un ami utilisant cette app sans
 * Carnet n'est jamais concerné). Si Carnet n'a encore rien enregistré ou est
 * injoignable, la saisie manuelle en cours reste inchangée.
 */
async function syncFromCarnet({ silent = false } = {}) {
  if (!carnetSync) return;
  const status = $('#carnetSyncStatus');
  status.hidden = false;
  try {
    const { weight, ftp } = await fetchCarnetMetrics();
    if (!weight && !ftp) {
      status.textContent = 'Pas encore de FTP ni de poids dans Carnet : saisie manuelle conservée ici.';
      return;
    }
    if (ftp) profile.ftp = Math.round(ftp.value);
    if (weight) profile.weight = weight.value;
    profile.custom = true;
    store.saveProfile(profile);
    fillProfile();
    renderWeightCategory();
    renderRider();
    const parts = [];
    if (ftp) parts.push(`FTP ${Math.round(ftp.value)} W (${shortDate(ftp.date)})`);
    if (weight) parts.push(`poids ${String(weight.value).replace('.', ',')} kg (${shortDate(weight.date)})`);
    status.textContent = `Depuis Carnet : ${parts.join(' · ')}. Vous pouvez toujours corriger ci-dessous.`;
  } catch (error) {
    if (!silent) status.textContent = 'Carnet injoignable pour le moment : les valeurs saisies ici sont conservées.';
  }
}

/** Clin d'œil : au-dessus de 82 kg, le cycliste passe dans la catégorie « Gros ». */
function renderWeightCategory() {
  const w = num($('#p-weight').value);
  const el = $('#weightCat');
  const gros = w !== null && w > 82;
  el.hidden = !gros;
  if (gros) el.innerHTML = '<span class="weight-cat__badge">Catégorie : Gros</span> Imbattable en descente, un peu moins dans les cols.';
}

/** Enregistre le profil dès qu'un champ valide change (pas de bouton à penser à toucher). */
function saveProfileFromForm() {
  const f = $('#profileForm');
  const fields = [
    [f.ftp, num(f.ftp.value), 60, 600, 'FTP entre 60 et 600 W'],
    [f.weight, num(f.weight.value), 30, 200, 'Poids entre 30 et 200 kg'],
    [f.bike, num(f.bike.value), 4, 30, 'Vélo et équipement entre 4 et 30 kg']
  ];
  const bad = fields.find(([, v, lo, hi]) => v === null || v < lo || v > hi);
  fields.forEach(([el, v, lo, hi]) => el.toggleAttribute('aria-invalid', v === null || v < lo || v > hi));
  const status = $('#profileStatus');
  if (bad) {
    status.textContent = `${bad[4]} : valeur non enregistrée.`;
    status.classList.add('is-error');
    return;
  }
  profile = { ftp: Math.round(fields[0][1]), weight: fields[1][1], bike: fields[2][1], cda: Number(f.cda.value), custom: true };
  const ok = store.saveProfile(profile);
  status.classList.toggle('is-error', !ok);
  status.textContent = ok ? 'Profil enregistré ✓' : 'Enregistrement impossible : stockage du navigateur indisponible (navigation privée ?).';
  renderRider();
  if (result) {
    resimulate(result.routes, result.startTime, result.wind);
    renderAll({ fit: false });
  }
}

/* ---------- Sauvegarde / restauration des données ---------- */
async function saveBackup() {
  const backup = store.exportBackup();
  const day = new Date().toISOString().slice(0, 10);
  const name = `echappee-sauvegarde-${day}.json`;
  const file = new File([JSON.stringify(backup, null, 2)], name, { type: 'application/json' });
  try {
    // iPhone : feuille de partage → « Enregistrer dans Fichiers » ou iCloud Drive.
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Sauvegarde Échappée' });
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Sauvegarde téléchargée');
}

let pendingBackup = null;

async function readBackupFile(file) {
  const box = $('#backupConfirm');
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('Fichier trop volumineux pour une sauvegarde Échappée.');
    const { data, summary } = store.readBackup(await file.text());
    pendingBackup = data;
    const when = summary.exportedAt ? new Date(summary.exportedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'date inconnue';
    box.innerHTML = `
      <p><strong>Sauvegarde du ${esc(when)}</strong> : ${summary.profil ? 'profil, ' : ''}${summary.favoris} favori${summary.favoris > 1 ? 's' : ''}, ${summary.cols} col${summary.cols > 1 ? 's' : ''} fait${summary.cols > 1 ? 's' : ''}.</p>
      <p class="hint">Les données actuelles de ce téléphone seront remplacées.</p>
      <div class="backup__actions">
        <button type="button" class="btn btn--primary" data-backup="apply">Restaurer</button>
        <button type="button" class="btn btn--soft" data-backup="cancel">Annuler</button>
      </div>`;
    box.hidden = false;
  } catch (error) {
    pendingBackup = null;
    box.hidden = true;
    toast(error.message || 'Lecture de la sauvegarde impossible.', { error: true });
  }
}

function onBackupConfirm(e) {
  const action = e.target.closest('[data-backup]')?.dataset.backup;
  if (!action) return;
  const box = $('#backupConfirm');
  if (action === 'cancel' || !pendingBackup) {
    pendingBackup = null;
    box.hidden = true;
    return;
  }
  if (!store.applyBackup(pendingBackup)) return toast('Restauration impossible : stockage du navigateur indisponible.', { error: true });
  toast('Données restaurées');
  setTimeout(() => location.reload(), 600);
}

/* ---------- Import d'un GPX : effet du vent sur un parcours existant ---------- */
async function importGPX(file) {
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) return toast('Fichier trop volumineux (15 Mo maximum).', { error: true });
  try {
    const { name, coords } = parseGPX(await file.text());
    const startTime = getStartTime() || new Date();
    const wind = await fetchWind(coords[0][0], coords[0][1], startTime);
    const t0 = startTime.getTime();
    const cum = cumulative(coords);
    const loop = haversine(coords[0], coords[coords.length - 1]) < 1000;
    const r = {
      coords,
      meters: cum[cum.length - 1],
      ascent: Math.round(ascentOf(coords)),
      messages: [],
      mix: null,
      name: name || file.name.replace(/\.gpx$/i, ''),
      subtitle: `GPX importé · ${loop ? 'boucle' : 'aller simple'}`,
      heading: bearing(coords[0], coords[Math.min(coords.length - 1, Math.floor(coords.length / 4))])
    };
    result = { routes: [r], wind, windNow: wind.reduce((b, h) => (Math.abs(h.t - t0) < Math.abs(b.t - t0) ? h : b), wind[0]), startTime, target: { km: null, ascent: null }, source: 'gpx', loop, kind: loop ? 'gpx' : 'oneway' };
    resimulate(result.routes, startTime, wind);
    selected = 0;
    renderAll();
    if (!coords.some(c => c[2] !== null)) toast('Ce GPX ne contient pas d’altitude : la pente n’est pas prise en compte.');
    if (matchMedia('(max-width: 959px)').matches) $('.map-wrap').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.warn('[gpx]', error);
    toast(/fetch|network/i.test(error.message) ? friendlyError(error) : error.message || 'Lecture du GPX impossible.', { error: true });
  }
}

/* ---------- Initialisation ---------- */
function init() {
  applyTheme(store.loadTheme());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(store.loadTheme()));
  document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  $('#f-ascent').value = prefs.ascent;
  initWhen();
  renderMode();
  renderStops();
  renderSessions();
  renderQuiet();
  renderDistance();
  fillProfile();
  renderWeightCategory();
  applyCarnetSyncUI();
  if (carnetSync) syncFromCarnet({ silent: true });
  renderSavedCount();

  const mapReady = () => {
    mapUi.initMap($('#map'), {
      center: ll(prefs.start),
      dark: isDark(),
      onTap: onMapTap,
      onMoveStop: (id, latlng) => setStopPoint(id, latlng)
    });
    syncMap();
  };
  if (window.L) mapReady();
  else window.addEventListener('load', mapReady, { once: true });

  // En-tête et onglets
  $('#themeToggle').addEventListener('click', () => {
    const theme = isDark() ? 'light' : 'dark';
    store.saveTheme(theme);
    applyTheme(theme);
  });
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) showTab(go.dataset.go);
    // Fermer les suggestions en touchant ailleurs
    if (!e.target.closest('.stop')) document.querySelectorAll('.stop').forEach(li => closeSuggest(li));
  });

  // Formulaire
  $('#modeSwitch').addEventListener('click', e => {
    const b = e.target.closest('[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  $('#stops').addEventListener('input', onStopInput);
  $('#stops').addEventListener('keydown', onStopKeydown);
  $('#stops').addEventListener('keydown', onSuggestKeydown);
  $('#stops').addEventListener('click', onStopsClick);
  $('#stops').addEventListener('focusin', e => {
    const input = e.target.closest('.stop__input');
    if (input && !drafts.has(input.closest('[data-stop]').dataset.stop)) input.select();
  });
  $('#addVia').addEventListener('click', () => {
    const id = addVia();
    renderDistance();
    $(`[data-stop="${id}"] .stop__input`)?.focus();
  });
  $('#mapBannerCancel').addEventListener('click', stopPicking);
  $('#sessionChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-session]');
    if (!chip) return;
    const previous = SESSIONS[prefs.session];
    prefs.session = chip.dataset.session;
    // La distance suit la séance tant qu'elle n'a pas été personnalisée.
    if (prefs.km === previous.km) prefs.km = SESSIONS[prefs.session].km;
    savePrefs();
    renderSessions();
    renderDistance();
    invalidateResult();
  });
  $('#f-km').addEventListener('input', e => {
    prefs.km = Number(e.target.value);
    renderDistance();
  });
  $('#f-km').addEventListener('change', () => {
    savePrefs();
    invalidateResult();
  });
  $('#f-days')?.addEventListener('input', e => {
    prefs.days = clampDays(e.target.value);
    renderDays();
  });
  $('#f-days')?.addEventListener('change', () => {
    savePrefs();
    invalidateResult();
  });
  $('#quietSwitch').addEventListener('click', e => {
    const b = e.target.closest('[data-quiet]');
    if (!b) return;
    prefs.quiet = b.dataset.quiet;
    savePrefs();
    renderQuiet();
    invalidateResult();
  });
  $('#dayChips').addEventListener('click', e => {
    const b = e.target.closest('[data-day]');
    if (!b) return;
    setDay(b.dataset.day);
    if (b.dataset.day === 'other') $('#f-date').focus();
    refreshTime();
  });
  $('#rideForm').addEventListener('submit', generate);
  $('#backupSave').addEventListener('click', saveBackup);
  $('#backupFile').addEventListener('change', e => {
    readBackupFile(e.target.files?.[0]);
    e.target.value = '';
  });
  $('#backupConfirm').addEventListener('click', onBackupConfirm);
  $('#gpxFile').addEventListener('change', e => {
    importGPX(e.target.files?.[0]);
    e.target.value = '';
  });
  $('#f-date').addEventListener('change', refreshTime);
  $('#f-time').addEventListener('change', refreshTime);

  // Résultats
  $('#options').addEventListener('click', e => {
    const opt = e.target.closest('[data-route]');
    if (!opt) return;
    selected = Number(opt.dataset.route);
    renderOptions();
    renderDetail();
    renderForecast();
    mapUi.drawRoute(result.routes[selected]);
  });
  $('#detail').addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (result?.kind === 'multi') {
      if (action === 'trip-gpx') exportTripGPX();
      if (action === 'stage-gpx') exportStageGPX(Number(e.target.closest('[data-stage]').dataset.stage));
      return;
    }
    const r = result?.routes[selected];
    if (action === 'gpx') exportGPX(r);
    if (action === 'save') saveRoute(r);
    if (action === 'reverse' && r) {
      r.coords = [...r.coords].reverse();
      r.name = r.name.endsWith(' (sens inverse)') ? r.name.replace(' (sens inverse)', '') : `${r.name} (sens inverse)`;
      resimulate(result.routes, result.startTime, result.wind);
      renderAll({ fit: false });
    }
    const slot = e.target.closest('[data-start]');
    if (slot) pickStart(Number(slot.dataset.start));
  });
  $('#detail').addEventListener('keydown', e => {
    const slot = e.target.closest('[data-start]');
    if (slot && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      pickStart(Number(slot.dataset.start));
    }
  });
  $('#savedList').addEventListener('click', onSavedAction);
  $('#carnetSyncToggle').addEventListener('click', () => {
    carnetSync = !carnetSync;
    store.saveCarnetSync(carnetSync);
    applyCarnetSyncUI();
    if (carnetSync) syncFromCarnet();
    else {
      const status = $('#carnetSyncStatus');
      status.hidden = false;
      status.textContent = 'Liaison coupée : vos valeurs ne sont plus reprises depuis Carnet.';
    }
  });
  const profileForm = $('#profileForm');
  let profileTimer = null;
  profileForm.addEventListener('submit', e => {
    e.preventDefault();
    saveProfileFromForm();
  });
  profileForm.addEventListener('input', () => {
    renderWeightCategory();
    clearTimeout(profileTimer);
    profileTimer = setTimeout(saveProfileFromForm, 500);
  });
  profileForm.addEventListener('change', () => {
    clearTimeout(profileTimer);
    saveProfileFromForm();
  });
  initCols({
    getStart: () => (isPoint(prefs.start) ? ll(prefs.start) : null),
    onRide: col => {
      // Le col devient un point de passage de la prochaine sortie.
      if (needsEnd(prefs.mode) && !isPoint(prefs.end)) setStopPoint('end', [col.lat, col.lon], col.name);
      else setStopPoint(addVia(), [col.lat, col.lon], col.name);
      renderDistance();
      showTab('ride');
      const far = isPoint(prefs.start) ? haversine(ll(prefs.start), [col.lat, col.lon]) / 1000 : 0;
      toast(
        far > 50
          ? `${col.name} est à ${Math.round(far)} km de votre départ : déplacez le départ près du col (pied : ${col.from}).`
          : `${col.name} ajouté à votre sortie`,
        { error: far > 50 }
      );
    }
  });

  initRaces({ toast });

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

function pickStart(t) {
  const d = new Date(t);
  $('#f-time').value = hhmm(d);
  refreshTime();
}

init();

// Utilisé par les tests de bout en bout.
window.__pv = { get result() { return result; }, get prefs() { return prefs; }, windAt };
