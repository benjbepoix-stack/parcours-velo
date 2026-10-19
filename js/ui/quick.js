/*
 * Questions rapides de l'onglet Étape, une par écran, puis un récapitulatif et le bouton
 * de recherche. La première question (boucle, aller simple, plusieurs jours) décide des
 * suivantes : départ (et arrivée), nombre de jours, séance, terrain, distance, jour, heure.
 * Départ et arrivée se choisissent parmi les lieux enregistrés (Maison, Travail…), la
 * position actuelle ou une recherche. Les réponses règlent le formulaire détaillé.
 */
import { icon } from './icons.js';
import { suggest } from '../services/geocode.js';
import * as store from '../services/store.js';

const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pad = n => String(n).padStart(2, '0');
const DAYS = { today: 'Aujourd’hui', tomorrow: 'Demain' };
const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const inDays = n => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
const validDate = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && v >= inDays(0) && v <= inDays(15);
const dayText = day => DAYS[day] || new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const isPlace = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon);
const uid = () => Math.random().toString(36).slice(2, 9);
const NAME_IDEAS = ['Maison', 'Travail', 'Club'];

/** Prochain quart d'heure, au moins dix minutes plus tard (le temps de s'habiller). */
function soonTime() {
  const d = new Date(Date.now() + 10 * 60000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const validTime = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '');

const MODES = {
  loop: { label: 'Boucle', sub: 'Retour au point de départ', recap: 'Votre boucle' },
  oneway: { label: 'Aller simple', sub: 'D’un point à un autre', recap: 'Votre itinéraire' },
  multi: { label: 'Plusieurs jours', sub: 'Un voyage découpé en étapes', recap: 'Votre voyage' }
};

const QUESTIONS = [
  { key: 'mode', title: 'Quel parcours ?', short: 'Parcours', choices: Object.entries(MODES).map(([value, m]) => ({ value, label: m.label, sub: m.sub })) },
  { key: 'start', title: 'D’où partez-vous ?', short: 'Départ', place: true },
  { key: 'end', title: 'Où arrivez-vous ?', short: 'Arrivée', place: true, modes: ['oneway', 'multi'] },
  { key: 'days', title: 'Combien de jours ?', short: 'Durée', modes: ['multi'] },
  {
    key: 'zone',
    title: 'Quelle séance ?',
    short: 'Séance',
    choices: [
      { value: 'z1', label: 'Récup', sub: 'Très facile, jambes légères' },
      { value: 'z2', label: 'Endurance', sub: 'On peut discuter' },
      { value: 'z3', label: 'Tempo', sub: 'Soutenu mais régulier' },
      { value: 'z4', label: 'Seuil', sub: 'Dur, au train' }
    ]
  },
  {
    key: 'relief',
    title: 'Quel terrain ?',
    short: 'Terrain',
    modes: ['loop', 'oneway'],
    choices: [
      { value: 'flat', label: 'Plat', sub: 'Le moins de côtes possible' },
      { value: 'hilly', label: 'Vallonné', sub: 'Des côtes en plus' },
      { value: 'any', label: 'Peu importe', sub: 'Les routes les plus prisées' }
    ]
  },
  { key: 'km', title: 'Quelle distance ?', short: 'Distance', modes: ['loop'] },
  { key: 'day', title: 'Quel jour ?', short: 'Jour' },
  { key: 'time', title: 'À quelle heure ?', short: 'Heure' }
];

let ctx = null;
let answers = {};
let step = 0;
let fromRecap = false;
// Valeurs en cours de réglage (curseur, jour, heure, recherche de lieu), validées par « Suivant ».
let draft = {};
let places = store.loadPlaces();
let searchTimer = null;
let searchAbort = null;

/** Questions qui s'appliquent au parcours choisi. */
const active = () => QUESTIONS.filter(q => !q.modes || q.modes.includes(answers.mode));
const isSet = q => answers[q.key] !== undefined && answers[q.key] !== null;
const complete = () => Boolean(answers.mode) && active().every(isSet);
const recapIndex = () => active().length;
const current = () => active()[step];
const durationText = km => {
  const d = ctx.duration({ ...answers, km });
  return d ? `≈ ${d}` : '';
};

function valueText(q) {
  const a = answers[q.key];
  if (q.choices) return q.choices.find(c => c.value === a)?.label || '';
  if (q.place) return a.name || 'Point choisi';
  if (q.key === 'km') return `${a} km · ${durationText(a)}`;
  if (q.key === 'days') return `${a} jours`;
  if (q.key === 'day') return dayText(a);
  return a;
}

const next = label => `<button type="button" class="btn btn--primary btn--lg" data-quick-next>${label || 'Suivant'}</button>`;

function renderPlace(q) {
  if (draft.saving) {
    return `<div class="quick__field">
        <label class="label" for="quickPlaceName">Nom du lieu</label>
        <input class="input" id="quickPlaceName" value="${esc(draft.name)}" placeholder="Ex. Maison" autocomplete="off" maxlength="30">
        <div class="chips">${NAME_IDEAS.filter(n => !places.some(p => p.name === n))
          .map(n => `<button type="button" class="chip" data-quick-name="${n}">${n}</button>`)
          .join('')}</div>
        <label class="label" for="quickSearch">Adresse</label>
        ${searchBox()}
        <button type="button" class="chip quick__here" data-quick-here>${icon('locate', 14)} Ma position actuelle</button>
      </div>
      <button type="button" class="link quick__cancel" data-quick-cancel>Annuler</button>`;
  }
  const chosen = answers[q.key];
  const list = places
    .map(
      p => `<div class="quick__place">
        <button type="button" class="quick__choice" role="radio" aria-checked="${isPlace(chosen) && chosen.placeId === p.id}" data-quick-place="${p.id}">
          <strong>${esc(p.name)}</strong><small>${esc(p.label || '')}</small></button>
        <button type="button" class="quick__del" data-quick-del="${p.id}" aria-label="Supprimer ${esc(p.name)}" title="Supprimer">${icon('close', 16)}</button>
      </div>`
    )
    .join('');
  return `<div class="quick__choices" role="radiogroup" aria-labelledby="quickTitle">
      ${list}
      <button type="button" class="quick__choice quick__choice--inline" data-quick-here>${icon('locate', 18)}<strong>Ma position</strong></button>
    </div>
    <div class="quick__field">${searchBox('Ou chercher une adresse, une ville…')}</div>
    <button type="button" class="add-stop quick__add" data-quick-save>${icon('plus')}<span>Enregistrer un lieu (Maison, Travail…)</span></button>`;
}

function searchBox(placeholder = 'Chercher une adresse, une ville…') {
  return `<input class="input" id="quickSearch" type="search" value="${esc(draft.query || '')}" placeholder="${placeholder}" autocomplete="off" aria-label="${placeholder}">
    <ul class="quick__suggest" id="quickSuggest">${suggestions()}</ul>`;
}

function suggestions() {
  if (!draft.hits) return '';
  if (!draft.hits.length) return '<li class="quick__empty">Aucun lieu trouvé</li>';
  return draft.hits
    .map((h, i) => `<li><button type="button" data-quick-hit="${i}"><strong>${esc(h.name)}</strong>${h.detail ? `<span>${esc(h.detail)}</span>` : ''}</button></li>`)
    .join('');
}

function renderInput(q) {
  if (q.place) return renderPlace(q);
  if (q.key === 'km' || q.key === 'days') {
    const km = q.key === 'km';
    const v = draft.value;
    return `<div class="quick__field">
        <output class="quick__big" id="quickOut">${v} ${km ? 'km' : 'jours'}</output>
        ${km ? `<small class="quick__sub" id="quickSub">${esc(durationText(v))}</small>` : '<small class="quick__sub">Étapes de distance égale</small>'}
        <input type="range" id="quickRange" min="${km ? 20 : 2}" max="${km ? 200 : 10}" step="${km ? 5 : 1}" value="${v}" aria-labelledby="quickTitle">
      </div>
      ${next()}`;
  }
  if (q.key === 'day') {
    const other = draft.day === 'other';
    return `<div class="quick__choices" role="radiogroup" aria-labelledby="quickTitle">
        ${Object.entries(DAYS)
          .map(([k, l]) => `<button type="button" class="quick__choice" role="radio" aria-checked="${answers.day === k && !other}" data-quick-day="${k}"><strong>${l}</strong></button>`)
          .join('')}
        <button type="button" class="quick__choice" role="radio" aria-checked="${other}" data-quick-day="other"><strong>Autre jour</strong><small>Jusqu’à 15 jours (prévisions de vent)</small></button>
      </div>
      ${other ? `<div class="quick__field"><input class="input quick__time" id="quickDate" type="date" min="${inDays(2)}" max="${inDays(15)}" value="${esc(draft.date)}" aria-label="Jour de départ"></div>${next()}` : ''}`;
  }
  return `<div class="quick__field">
      <input class="input quick__time" id="quickTime" type="time" step="300" value="${esc(draft.time)}" aria-labelledby="quickTitle">
    </div>
    ${next()}`;
}

function renderQuestion(i) {
  const q = active()[i];
  const total = answers.mode ? active().length : QUESTIONS.length;
  const body = q.choices
    ? `<div class="quick__choices" role="radiogroup" aria-labelledby="quickTitle">
      ${q.choices
        .map(
          c => `<button type="button" class="quick__choice" role="radio" aria-checked="${answers[q.key] === c.value}" data-quick-value="${esc(c.value)}">
        <strong>${esc(c.label)}</strong><small>${esc(c.sub)}</small></button>`
        )
        .join('')}
    </div>`
    : renderInput(q);
  return `<div class="quick__progress" aria-hidden="true"><span style="--value:${((i + 1) / total) * 100}%"></span></div>
    <div class="quick__top">
      ${i > 0 || fromRecap ? `<button type="button" class="quick__back" data-quick-back aria-label="Question précédente">${icon('chevron', 16)}<span>Retour</span></button>` : '<span></span>'}
      <span class="quick__count">${i + 1} / ${total}</span>
    </div>
    <h2 class="quick__title" id="quickTitle">${esc(draft.saving ? 'Enregistrer un lieu' : q.title)}</h2>
    ${body}`;
}

function renderRecap() {
  const rows = active()
    .map((q, i) => {
      const value = valueText(q);
      return `<button type="button" class="quick__row" data-quick-go="${i}" aria-label="${esc(q.short)} : ${esc(value)}. Modifier">
      <span class="quick__row-label">${esc(q.short)}</span><strong>${esc(value)}</strong><span class="quick__row-edit">${icon('edit', 15)}</span></button>`;
    })
    .join('');
  return `<div class="quick__top"><h2 class="quick__title quick__title--recap">${esc(MODES[answers.mode].recap)}</h2>
      <button type="button" class="link" data-quick-restart>Recommencer</button></div>
    <div class="quick__recap">${rows}</div>`;
}

export function renderQuick() {
  if (!ctx) return;
  const asking = step < recapIndex() || !complete();
  if (asking) {
    const q = current();
    if (q.key === 'km') draft.value = draft.value ?? answers.km ?? ctx.currentKm();
    if (q.key === 'days') draft.value = draft.value ?? answers.days ?? ctx.currentDays();
    if (q.key === 'day' && draft.day === undefined && answers.day && !DAYS[answers.day]) draft.day = 'other';
    if (q.key === 'day' && draft.day === 'other') draft.date = draft.date ?? (validDate(answers.day) && !DAYS[answers.day] ? answers.day : inDays(2));
    if (q.key === 'time') draft.time = draft.time ?? answers.time ?? soonTime();
  }
  $('#quick').innerHTML = asking ? renderQuestion(step) : renderRecap();
  $('#rideForm').classList.toggle('is-asking', asking);
}

function goTo(i) {
  step = i;
  draft = {};
  renderQuick();
}

function answer(key, value) {
  answers[key] = value;
  if (complete()) ctx.apply({ ...answers });
  ctx.save({ ...answers });
  const list = active();
  const firstMissing = list.findIndex(q => !isSet(q));
  const i = list.findIndex(q => q.key === key);
  let to = firstMissing === -1 ? list.length : fromRecap ? firstMissing : i + 1;
  // Une question encore sans réponse passe avant le récapitulatif.
  if (to >= list.length && firstMissing !== -1) to = firstMissing;
  if (to === list.length) fromRecap = false;
  goTo(to);
  $('#quick').querySelector('.quick__choice[aria-checked="true"], .quick__choice, #quickRange, #quickTime, .quick__row')?.focus({ preventScroll: true });
}

/** Un lieu choisi (enregistré, position, recherche) répond à la question en cours. */
function choosePlace(place) {
  const q = current();
  answer(q.key, { lat: place.lat, lon: place.lon, name: place.name, placeId: place.id || null });
}

function savePlace(point) {
  const name = (draft.name || '').trim() || point.name || 'Lieu';
  const place = { id: uid(), name: name.slice(0, 30), lat: Number(point.lat.toFixed(5)), lon: Number(point.lon.toFixed(5)), label: point.label || '' };
  places = [...places, place];
  store.savePlaces(places);
  ctx.toast(`« ${place.name} » enregistré`);
  draft = {};
  renderQuick();
}

function onPoint(point) {
  if (draft.saving) savePlace(point);
  else choosePlace(point);
}

function locate() {
  if (!navigator.geolocation) return ctx.toast('Géolocalisation indisponible sur cet appareil.', { error: true });
  navigator.geolocation.getCurrentPosition(
    pos => onPoint({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Ma position', label: 'Position enregistrée' }),
    () => ctx.toast('Position refusée ou introuvable.', { error: true }),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function search(query) {
  draft.query = query;
  clearTimeout(searchTimer);
  searchAbort?.abort();
  if (query.trim().length < 3) {
    draft.hits = null;
    $('#quickSuggest').innerHTML = '';
    return;
  }
  searchTimer = setTimeout(async () => {
    searchAbort = new AbortController();
    try {
      const near = isPlace(answers.start) ? [answers.start.lat, answers.start.lon] : null;
      draft.hits = await suggest(query.trim(), near, searchAbort.signal);
      const box = $('#quickSuggest');
      if (box) box.innerHTML = suggestions();
    } catch (error) {
      if (error.name !== 'AbortError') ctx.toast('Recherche indisponible : vérifiez le réseau.', { error: true });
    }
  }, 300);
}

/** Réponses complètes, ou null. */
export function quickAnswers() {
  return complete() ? { ...answers } : null;
}

/**
 * @param {{saved: object|null, duration: (a:object) => string, currentKm: () => number, currentDays: () => number,
 *   currentStart: () => object|null, apply: (a:object) => void, save: (a:object) => void, toast: Function}} c
 */
export function initQuick(c) {
  ctx = c;
  const saved = c.saved && typeof c.saved === 'object' ? c.saved : {};
  const km = Number(saved.km);
  const days = Number(saved.days);
  // Anciennes réponses (avant la question du parcours) : une boucle partant du départ actuel.
  const mode = MODES[saved.mode] ? saved.mode : saved.zone ? 'loop' : undefined;
  answers = {
    mode,
    start: isPlace(saved.start) ? saved.start : mode ? c.currentStart() : undefined,
    end: isPlace(saved.end) ? saved.end : undefined,
    days: days >= 2 && days <= 10 ? Math.round(days) : undefined,
    zone: ['z1', 'z2', 'z3', 'z4'].includes(saved.zone) ? saved.zone : undefined,
    relief: ['flat', 'hilly', 'any'].includes(saved.relief) ? saved.relief : undefined,
    km: km >= 20 && km <= 200 ? Math.round(km / 5) * 5 : undefined,
    day: undefined,
    time: undefined
  };
  // Le départ n'a de sens que le jour même : il repart sur aujourd'hui, au prochain quart d'heure.
  const rest = active().filter(q => q.key !== 'day' && q.key !== 'time');
  if (mode && rest.every(isSet)) Object.assign(answers, { day: 'today', time: soonTime() });
  step = complete() ? recapIndex() : Math.max(0, active().findIndex(q => !isSet(q)));
  const host = $('#quick');
  host.addEventListener('input', e => {
    const t = e.target;
    if (t.id === 'quickRange') {
      draft.value = Number(t.value);
      const km = current().key === 'km';
      $('#quickOut').textContent = `${draft.value} ${km ? 'km' : 'jours'}`;
      if (km) $('#quickSub').textContent = durationText(draft.value);
    }
    if (t.id === 'quickTime') draft.time = t.value;
    if (t.id === 'quickDate') draft.date = t.value;
    if (t.id === 'quickPlaceName') draft.name = t.value;
    if (t.id === 'quickSearch') search(t.value);
  });
  host.addEventListener('click', e => {
    const t = e.target;
    const choice = t.closest('[data-quick-value]');
    if (choice) return answer(current().key, choice.dataset.quickValue);
    const placeBtn = t.closest('[data-quick-place]');
    if (placeBtn) return choosePlace(places.find(p => p.id === placeBtn.dataset.quickPlace));
    const del = t.closest('[data-quick-del]');
    if (del) {
      const gone = places.find(p => p.id === del.dataset.quickDel);
      places = places.filter(p => p !== gone);
      store.savePlaces(places);
      ctx.toast(`« ${gone?.name} » supprimé`);
      return renderQuick();
    }
    if (t.closest('[data-quick-here]')) return locate();
    const hit = t.closest('[data-quick-hit]');
    if (hit) {
      const h = draft.hits[Number(hit.dataset.quickHit)];
      return onPoint({ lat: h.lat, lon: h.lon, name: h.name, label: [h.name, h.detail].filter(Boolean).join(' · ') });
    }
    if (t.closest('[data-quick-save]')) {
      draft = { saving: true };
      renderQuick();
      return $('#quickPlaceName')?.focus();
    }
    if (t.closest('[data-quick-cancel]')) {
      draft = {};
      return renderQuick();
    }
    const name = t.closest('[data-quick-name]');
    if (name) {
      draft.name = name.dataset.quickName;
      $('#quickPlaceName').value = draft.name;
      return $('#quickSearch').focus();
    }
    const day = t.closest('[data-quick-day]');
    if (day) {
      if (day.dataset.quickDay !== 'other') return answer('day', day.dataset.quickDay);
      draft.day = 'other';
      renderQuick();
      return $('#quickDate')?.focus();
    }
    if (t.closest('[data-quick-next]')) {
      const key = current().key;
      if (key === 'km' || key === 'days') return answer(key, draft.value);
      if (key === 'day') {
        if (validDate(draft.date)) return answer('day', draft.date);
        $('#quickDate').setAttribute('aria-invalid', 'true');
        return $('#quickDate').focus();
      }
      if (validTime(draft.time)) return answer('time', draft.time);
      $('#quickTime').setAttribute('aria-invalid', 'true');
      return $('#quickTime').focus();
    }
    const go = t.closest('[data-quick-go]');
    if (go) {
      fromRecap = true;
      return goTo(Number(go.dataset.quickGo));
    }
    if (t.closest('[data-quick-back]')) {
      if (draft.saving) {
        draft = {};
        return renderQuick();
      }
      const back = fromRecap && complete() ? recapIndex() : Math.max(0, step - 1);
      fromRecap = false;
      return goTo(back);
    }
    if (t.closest('[data-quick-restart]')) {
      answers = {};
      fromRecap = false;
      return goTo(0);
    }
  });
  renderQuick();
}
