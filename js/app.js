/* Parcours vélo — application : formulaire, planification, résultats, favoris, profil. */
import { SESSIONS, QUIET_LEVELS, compass, compassLong, toGPX, simulate, overlapRatio, windShares, scoreRoute, compareStarts, simplify, windAt } from './core/ride.js';
import { planLoops } from './core/planner.js';
import { dateKey, addDays, combine, hhmm, hLabel, dayLabel } from './core/dates.js';
import { brouterWebLink } from './services/routing.js';
import { fetchWind } from './services/wind.js';
import { geocode } from './services/geocode.js';
import * as store from './services/store.js';
import { icon, windArrow } from './ui/icons.js';
import { elevationChart, startsChart } from './ui/charts.js';
import * as mapUi from './ui/map.js';

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

const DEFAULT_START = { start: [47.2378, 6.0241], startName: 'Besançon' };
const prefs = store.loadPrefs({ session: 'endurance', km: SESSIONS.endurance.km, ascent: '', quiet: 'quiet', ...DEFAULT_START });
if (!SESSIONS[prefs.session]) prefs.session = 'endurance';
if (!QUIET_LEVELS[prefs.quiet]) prefs.quiet = 'quiet';
if (!Array.isArray(prefs.start) || prefs.start.length !== 2 || !prefs.start.every(Number.isFinite)) Object.assign(prefs, DEFAULT_START);

let profile = store.loadProfile();
let saved = store.loadSaved();
let result = null; // { routes, wind, windNow, startTime, target, source }
let selected = 0;
let running = null;

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
function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  const dark = theme ? theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  $('#themeToggle').innerHTML = icon(dark ? 'sun' : 'moon', 20);
  $('#themeToggle').setAttribute('aria-label', dark ? 'Passer en thème clair' : 'Passer en thème sombre');
  mapUi.setMapTheme(dark);
}

/* ---------- Onglets ---------- */
function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  ['ride', 'saved', 'profile'].forEach(t => ($(`#pane-${t}`).hidden = t !== name));
  if (name === 'saved') renderSaved();
}

/* ---------- Formulaire de sortie ---------- */
function renderSessions() {
  $('#sessionChips').innerHTML = Object.entries(SESSIONS)
    .map(([k, s]) => `<button type="button" class="chip" role="radio" data-session="${k}" aria-checked="${k === prefs.session}">${esc(s.label)}</button>`)
    .join('');
  $('#sessionHint').textContent = SESSIONS[prefs.session].hint;
}

function renderRider() {
  const s = SESSIONS[prefs.session];
  const km = num($('#f-km').value) || prefs.km;
  const auto = s.climb === null ? null : Math.round(s.climb * km);
  $('#f-ascent').placeholder = auto === null ? 'Libre' : `Auto · ${auto}`;
  $('#riderNote').innerHTML = `Allure visée : <strong>${Math.round(rider().power)} W</strong> (${Math.round(s.ftp * 100)} % de votre FTP de ${profile.ftp} W)${
    profile.custom ? '' : ' — <button type="button" class="link" data-go="profile" style="text-decoration:underline;color:var(--accent)">renseignez votre profil</button>'
  }.`;
}

function renderStart() {
  const [lat, lon] = prefs.start;
  $('#startLabel').textContent = `${prefs.startName || `${lat.toFixed(4)}, ${lon.toFixed(4)}`} · touchez la carte ou déplacez le point pour changer.`;
}

function setStart(latlng, name = null, { pan = false } = {}) {
  prefs.start = [Number(latlng[0].toFixed(5)), Number(latlng[1].toFixed(5))];
  prefs.startName = name;
  store.savePrefs(prefs);
  renderStart();
  mapUi.setStart(prefs.start, { pan });
}

function readForm() {
  const km = num($('#f-km').value);
  const ascentRaw = num($('#f-ascent').value);
  const startTime = combine($('#f-date').value, $('#f-time').value);
  const fail = (sel, message) => {
    $(sel).setAttribute('aria-invalid', 'true');
    $(sel).focus();
    toast(message, { error: true });
    return null;
  };
  document.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  if (!km || km < 10 || km > 300) return fail('#f-km', 'Indiquez une distance entre 10 et 300 km.');
  if (ascentRaw !== null && (ascentRaw < 0 || ascentRaw > 6000)) return fail('#f-ascent', 'Indiquez un dénivelé entre 0 et 6000 m, ou laissez vide.');
  if (!startTime) return fail('#f-date', 'Choisissez le jour et l’heure de départ.');
  if (startTime > addDays(new Date(), 15)) return fail('#f-date', 'Les prévisions de vent couvrent les 15 prochains jours.');
  const s = SESSIONS[prefs.session];
  return { km, ascent: ascentRaw ?? (s.climb === null ? null : Math.round(s.climb * km)), startTime, quiet: $('#f-quiet').value };
}

function setProgress(done, total, label) {
  const el = $('#progress');
  el.hidden = false;
  el.querySelector('.progress__bar').style.setProperty('--value', `${Math.round((done / total) * 100)}%`);
  el.querySelector('.progress__label').textContent = label;
}

async function generate(event) {
  event?.preventDefault();
  const input = readForm();
  if (!input) return;
  Object.assign(prefs, { km: input.km, ascent: $('#f-ascent').value.trim(), quiet: input.quiet });
  store.savePrefs(prefs);
  running?.abort();
  const controller = new AbortController();
  running = controller;
  $('#submitBtn').disabled = true;
  setProgress(0, 1, 'Préparation…');
  try {
    const planned = await planLoops({ start: prefs.start, km: input.km, ascent: input.ascent, quiet: input.quiet, startTime: input.startTime, ...rider(), onProgress: setProgress, signal: controller.signal });
    planned.routes.forEach(r => (r.quiet = input.quiet));
    result = { ...planned, startTime: input.startTime, target: { km: input.km, ascent: input.ascent }, source: 'plan' };
    selected = 0;
    renderAll();
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
  if (/not mapped|position/i.test(m)) return 'Aucune route trouvée autour de ce départ. Déplacez le point de départ sur une route.';
  return m || 'Calcul impossible pour le moment.';
}

/* ---------- Recalcul du vent sans re-router (changement d'heure, favori) ---------- */
function resimulate(routes, startTime, wind) {
  const t0 = startTime.getTime();
  const target = result?.target || { km: routes[0].meters / 1000, ascent: null };
  routes.forEach(r => {
    r.sim = simulate(r.coords, { ...rider(), startTime: t0, wind });
    r.shares = windShares(r.sim);
    r.overlap ??= overlapRatio(r.coords);
    r.score = scoreRoute(r, target);
  });
}

async function refreshTime() {
  if (!result) return;
  const startTime = combine($('#f-date').value, $('#f-time').value);
  if (!startTime || startTime > addDays(new Date(), 15)) return;
  try {
    const wind = await fetchWind(prefs.start[0], prefs.start[1], startTime);
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
  renderForecast();
  const has = !!result?.routes.length;
  $('#results').hidden = !has;
  if (!has) {
    mapUi.clearRoutes();
    return;
  }
  renderOptions();
  renderDetail();
  mapUi.drawRoute(result.routes[selected], { fit });
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
  const advice = w.speed < 8 ? 'Vent faible : toutes les directions se valent, place au relief.' : `Partez vers le ${compassLong(w.dir)}, face au vent : le retour se fera vent dans le dos.`;
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
        <span class="option__top"><span class="option__name">${esc(routeName(r))}</span>${i === 0 && result.source === 'plan' ? '<span class="badge">Recommandée</span>' : ''}</span>
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
  if (result.source === 'plan' && Math.abs(r.meters / 1000 - t.km) / t.km > 0.12) out.push(`Distance éloignée de l’objectif (${t.km} km) : le réseau routier autour du départ limite les possibilités.`);
  if (result.source === 'plan' && t.ascent !== null && Math.abs(r.ascent - t.ascent) > Math.max(250, t.ascent * 0.35))
    out.push(r.ascent < t.ascent ? `Moins de dénivelé que prévu (${t.ascent} m visés) : essayez un départ plus proche du relief.` : `Plus de dénivelé que prévu (${t.ascent} m visés) : réduisez la distance ou choisissez une autre boucle.`);
  if (r.roadProfile === false) out.push('Profil vélo de route indisponible sur le serveur : itinéraire calculé avec un profil BRouter standard, vérifiez les portions non asphaltées.');
  if (mix.major > 0.08) out.push(`${pct(mix.major)} sur routes principales : prudence, ou choisissez « Très peu de trafic ».`);
  if (mix.unpaved > 0.03) out.push(`${pct(mix.unpaved)} de revêtement non asphalté selon OpenStreetMap.`);
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
    <p class="detail__sub">${esc(SESSIONS[prefs.session].label)} · départ ${hhmm(result.startTime)} · retour vers ${hLabel(back)}</p>
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
      <p class="text">Aller : <strong>${fh(first)}</strong> · Retour : <strong>${fh(second)}</strong>. ${
        Math.abs(lost) >= 60 ? `Le vent ${lost > 0 ? 'coûte' : 'fait gagner'} environ <strong>${Math.round(Math.abs(lost) / 60)} min</strong>.` : 'Effet du vent négligeable.'
      }</p>
    </section>

    ${
      slots.length > 2
        ? `<section class="block">
      <h4 class="block__title">Meilleur créneau de départ</h4>
      ${startsChart(slots, result.startTime.getTime(), width)}
      <p class="text">${
        gain >= 3
          ? `En partant à <strong>${new Date(best.t).getHours()} h</strong>, cette boucle prend <strong>${gain} min de moins</strong> grâce au vent. Touchez une barre pour changer l’heure.`
          : 'Votre heure de départ est déjà parmi les plus favorables. Touchez une barre pour comparer.'
      }</p>
    </section>`
        : ''
    }

    <section class="block">
      <h4 class="block__title">Profil</h4>
      ${elevationChart(r, width)}
    </section>

    <section class="block">
      <h4 class="block__title">Routes empruntées</h4>
      <div class="bar"><span style="--c:var(--accent);flex:${mix.quiet}"></span><span style="--c:var(--sky);flex:${mix.medium}"></span><span style="--c:var(--danger);flex:${mix.major}"></span><span style="--c:var(--text-3);flex:${mix.other}"></span></div>
      <div class="legend"><span style="--c:var(--accent)">Petites routes ${pct(mix.quiet)}</span><span style="--c:var(--sky)">Départementales ${pct(mix.medium)}</span><span style="--c:var(--danger)">Grands axes ${pct(mix.major)}</span>${mix.other > 0.01 ? `<span style="--c:var(--text-3)">Autres ${pct(mix.other)}</span>` : ''}</div>
      ${mix.cycleRoute > 0.05 ? `<p class="text">${pct(mix.cycleRoute)} sur des itinéraires cyclables balisés.</p>` : ''}
      ${warningsFor(r).map(w => `<p class="warn">${icon('alert', 16)}<span>${esc(w)}</span></p>`).join('')}
    </section>

    <div class="actions">
      <button type="button" class="btn btn--primary" data-action="gpx">${icon('download')}<span>Exporter GPX</span></button>
      <button type="button" class="btn btn--soft" data-action="save" ${isSaved ? 'disabled' : ''}>${icon('star')}<span>${isSaved ? 'Enregistré' : 'Enregistrer'}</span></button>
      <a class="btn btn--soft" href="${esc(stravaLink(r))}" target="_blank" rel="noopener">${icon('external')}<span>Heatmap Strava</span></a>
      ${r.waypoints ? `<a class="btn btn--soft" href="${esc(brouterWebLink(r.waypoints, r.quiet || prefs.quiet))}" target="_blank" rel="noopener">${icon('edit')}<span>Retoucher</span></a>` : ''}
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
async function exportGPX(r) {
  const name = `${routeName(r)} · ${Math.round(r.meters / 1000)} km`;
  const fileName = `parcours-${Math.round(r.meters / 1000)}km-${compass(r.heading ?? 0).toLowerCase()}.gpx`;
  const file = new File([toGPX(name, r.coords)], fileName, { type: 'application/gpx+xml' });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') return;
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast('Fichier GPX téléchargé');
}

function saveRoute(r) {
  const id = Date.now().toString(36);
  const item = {
    id,
    name: `${routeName(r)} · ${Math.round(r.meters / 1000)} km`,
    savedAt: Date.now(),
    start: prefs.start,
    startName: prefs.startName,
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
        <div class="saved__meta">${fmtKm(s.meters)} · ${s.ascent} m D+ · départ ${esc(s.startName || 'point personnalisé')} · ${new Date(s.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div></div>
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
  const startTime = combine($('#f-date').value, $('#f-time').value) || new Date();
  try {
    const wind = await fetchWind(item.start[0], item.start[1], startTime);
    const t0 = startTime.getTime();
    const r = { ...item, coords: item.coords, name: item.name, savedId: item.id };
    prefs.session = SESSIONS[item.session] ? item.session : prefs.session;
    renderSessions();
    renderRider();
    setStart(item.start, item.startName);
    result = { routes: [r], wind, windNow: wind.reduce((b, h) => (Math.abs(h.t - t0) < Math.abs(b.t - t0) ? h : b), wind[0]), startTime, target: { km: item.meters / 1000, ascent: null }, source: 'saved' };
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

function submitProfile(e) {
  e.preventDefault();
  const f = e.target;
  const ftp = num(f.ftp.value);
  const weight = num(f.weight.value);
  const bike = num(f.bike.value);
  f.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  const bad = (el, msg) => (el.setAttribute('aria-invalid', 'true'), el.focus(), toast(msg, { error: true }));
  if (!ftp || ftp < 60 || ftp > 600) return bad(f.ftp, 'FTP entre 60 et 600 W.');
  if (!weight || weight < 30 || weight > 200) return bad(f.weight, 'Poids entre 30 et 200 kg.');
  if (!bike || bike < 4 || bike > 30) return bad(f.bike, 'Vélo et équipement entre 4 et 30 kg.');
  profile = { ftp: Math.round(ftp), weight, bike, cda: Number(f.cda.value), custom: true };
  store.saveProfile(profile);
  renderRider();
  if (result) {
    resimulate(result.routes, result.startTime, result.wind);
    renderAll({ fit: false });
  }
  toast('Profil enregistré');
}

/* ---------- Initialisation ---------- */
function init() {
  applyTheme(store.loadTheme());
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(store.loadTheme()));
  document.querySelectorAll('[data-icon]').forEach(el => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));

  $('#f-quiet').innerHTML = Object.entries(QUIET_LEVELS)
    .map(([k, q]) => `<option value="${k}"${k === prefs.quiet ? ' selected' : ''}>${esc(q.label)}</option>`)
    .join('');
  $('#f-km').value = prefs.km;
  $('#f-ascent').value = prefs.ascent;
  const next = new Date();
  next.setMinutes(0, 0, 0);
  next.setHours(next.getHours() + 1);
  if (next.getHours() > 20 || next.getHours() < 6) {
    if (next.getHours() > 20) next.setDate(next.getDate() + 1);
    next.setHours(9);
  }
  $('#f-date').value = dateKey(next);
  $('#f-date').min = dateKey(new Date());
  $('#f-date').max = dateKey(addDays(new Date(), 15));
  $('#f-time').value = hhmm(next);

  renderSessions();
  renderRider();
  renderStart();
  fillProfile();
  renderSavedCount();

  const isDark = () => (document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const mapReady = () => mapUi.initMap($('#map'), { start: prefs.start, dark: isDark(), onStart: latlng => setStart(latlng) });
  if (window.L) mapReady();
  else window.addEventListener('load', mapReady, { once: true });

  // Événements
  $('#themeToggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = dark ? 'light' : 'dark';
    store.saveTheme(theme);
    applyTheme(theme);
  });
  document.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) showTab(go.dataset.go);
  });
  $('#sessionChips').addEventListener('click', e => {
    const chip = e.target.closest('[data-session]');
    if (!chip) return;
    const previous = SESSIONS[prefs.session];
    prefs.session = chip.dataset.session;
    if (num($('#f-km').value) === previous.km) $('#f-km').value = SESSIONS[prefs.session].km;
    store.savePrefs(prefs);
    renderSessions();
    renderRider();
  });
  $('#f-km').addEventListener('input', renderRider);
  $('#rideForm').addEventListener('submit', generate);
  $('#f-date').addEventListener('change', refreshTime);
  $('#f-time').addEventListener('change', refreshTime);
  const search = async () => {
    const q = $('#f-place').value.trim();
    if (!q) return;
    try {
      const hit = await geocode(q);
      if (!hit) return toast('Lieu introuvable. Essayez avec le nom de la commune.', { error: true });
      setStart([hit.lat, hit.lon], hit.name, { pan: true });
    } catch {
      toast('Recherche de lieu indisponible pour le moment.', { error: true });
    }
  };
  $('#placeSearch').addEventListener('click', search);
  $('#f-place').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  });
  $('#locateMe').addEventListener('click', () => {
    if (!navigator.geolocation) return toast('Géolocalisation indisponible sur cet appareil.', { error: true });
    navigator.geolocation.getCurrentPosition(
      pos => setStart([pos.coords.latitude, pos.coords.longitude], 'Ma position', { pan: true }),
      () => toast('Position refusée ou introuvable.', { error: true }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
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
    const r = result?.routes[selected];
    if (action === 'gpx') exportGPX(r);
    if (action === 'save') saveRoute(r);
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
  $('#profileForm').addEventListener('submit', submitProfile);

  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
}

function pickStart(t) {
  $('#f-time').value = hhmm(new Date(t));
  refreshTime();
}

init();

// Utilisé par les tests de bout en bout.
window.__pv = { get result() { return result; }, windAt };
