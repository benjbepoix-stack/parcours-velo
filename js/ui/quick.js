/*
 * Questions rapides de l'onglet Étape : cinq questions, une par écran (séance, terrain,
 * distance, jour, heure), puis un récapitulatif et « Trouver mes boucles ». Séance, terrain
 * et jour se choisissent d'une touche (« Autre jour » ouvre un calendrier) ; distance
 * (curseur) et heure exacte se valident avec « Suivant ». Les réponses règlent le formulaire détaillé, toujours accessible.
 */
import { icon } from './icons.js';

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

/** Prochain quart d'heure, au moins dix minutes plus tard (le temps de s'habiller). */
function soonTime() {
  const d = new Date(Date.now() + 10 * 60000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const validTime = t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t || '');

const QUESTIONS = [
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
    choices: [
      { value: 'flat', label: 'Plat', sub: 'Le moins de côtes possible' },
      { value: 'hilly', label: 'Vallonné', sub: 'Des côtes en plus' },
      { value: 'any', label: 'Peu importe', sub: 'Les routes les plus prisées' }
    ]
  },
  { key: 'km', title: 'Quelle distance ?', short: 'Distance' },
  { key: 'day', title: 'Quel jour ?', short: 'Jour' },
  { key: 'time', title: 'À quelle heure ?', short: 'Heure' }
];
const RECAP = QUESTIONS.length;

let ctx = null;
let answers = {};
let step = 0;
let fromRecap = false;
// Valeurs en cours de réglage (curseur, jour, heure), validées par « Suivant ».
let draft = {};

const complete = () => QUESTIONS.every(q => answers[q.key] !== undefined && answers[q.key] !== null);
const durationText = km => {
  const d = ctx.duration({ ...answers, km });
  return d ? `≈ ${d}` : '';
};

function valueText(q) {
  const a = answers[q.key];
  if (q.choices) return q.choices.find(c => c.value === a)?.label || '';
  if (q.key === 'km') return `${a} km · ${durationText(a)}`;
  if (q.key === 'day') return dayText(a);
  return a;
}

function renderInput(q) {
  if (q.key === 'km') {
    const km = draft.km;
    return `<div class="quick__field">
        <output class="quick__big" id="quickKmOut">${km} km</output>
        <small class="quick__sub" id="quickKmSub">${esc(durationText(km))}</small>
        <input type="range" id="quickKm" min="20" max="200" step="5" value="${km}" aria-labelledby="quickTitle" aria-valuetext="${km} kilomètres">
      </div>
      <button type="button" class="btn btn--primary btn--lg" data-quick-next>Suivant</button>`;
  }
  if (q.key === 'day') {
    const other = draft.day === 'other';
    return `<div class="quick__choices" role="radiogroup" aria-labelledby="quickTitle">
        ${Object.entries(DAYS)
          .map(([k, l]) => `<button type="button" class="quick__choice" role="radio" aria-checked="${answers.day === k && !other}" data-quick-day="${k}"><strong>${l}</strong></button>`)
          .join('')}
        <button type="button" class="quick__choice" role="radio" aria-checked="${other}" data-quick-day="other"><strong>Autre jour</strong><small>Jusqu’à 15 jours (prévisions de vent)</small></button>
      </div>
      ${
        other
          ? `<div class="quick__field"><input class="input quick__time" id="quickDate" type="date" min="${inDays(2)}" max="${inDays(15)}" value="${esc(draft.date)}" aria-label="Jour de départ"></div>
      <button type="button" class="btn btn--primary btn--lg" data-quick-next>Suivant</button>`
          : ''
      }`;
  }
  return `<div class="quick__field">
      <input class="input quick__time" id="quickTime" type="time" step="300" value="${esc(draft.time)}" aria-labelledby="quickTitle">
    </div>
    <button type="button" class="btn btn--primary btn--lg" data-quick-next>Suivant</button>`;
}

function renderQuestion(i) {
  const q = QUESTIONS[i];
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
  return `<div class="quick__progress" aria-hidden="true"><span style="--value:${((i + 1) / RECAP) * 100}%"></span></div>
    <div class="quick__top">
      ${i > 0 || fromRecap ? `<button type="button" class="quick__back" data-quick-back aria-label="Question précédente">${icon('chevron', 16)}<span>Retour</span></button>` : '<span></span>'}
      <span class="quick__count">${i + 1} / ${RECAP}</span>
    </div>
    <h2 class="quick__title" id="quickTitle">${esc(q.title)}</h2>
    ${body}`;
}

function renderRecap() {
  const rows = QUESTIONS.map((q, i) => {
    const value = valueText(q);
    return `<button type="button" class="quick__row" data-quick-go="${i}" aria-label="${esc(q.short)} : ${esc(value)}. Modifier">
      <span class="quick__row-label">${esc(q.short)}</span><strong>${esc(value)}</strong><span class="quick__row-edit">${icon('edit', 15)}</span></button>`;
  }).join('');
  return `<div class="quick__top"><h2 class="quick__title quick__title--recap">Votre boucle</h2>
      <button type="button" class="link" data-quick-restart>Recommencer</button></div>
    <div class="quick__recap">${rows}
      <div class="quick__row quick__row--start">
        <span class="quick__row-label">Lieu</span><strong>${esc(ctx.startName())}</strong>
        <span class="quick__start-actions">
          <button type="button" class="chip" data-quick-locate>${icon('locate', 14)} Ma position</button>
          <button type="button" class="chip" data-quick-details>Autre lieu</button>
        </span>
      </div>
    </div>`;
}

export function renderQuick() {
  if (!ctx) return;
  if (step < RECAP) {
    const key = QUESTIONS[step].key;
    if (key === 'km') draft.km = draft.km ?? answers.km ?? ctx.currentKm();
    if (key === 'day' && draft.day === undefined && answers.day && !DAYS[answers.day]) draft.day = 'other';
    if (key === 'day' && draft.day === 'other') draft.date = draft.date ?? (validDate(answers.day) && !DAYS[answers.day] ? answers.day : inDays(2));
    if (key === 'time') draft.time = draft.time ?? answers.time ?? soonTime();
  }
  $('#quick').innerHTML = step >= RECAP ? renderRecap() : renderQuestion(step);
  $('#rideForm').classList.toggle('is-asking', step < RECAP);
}

function goTo(next) {
  step = next;
  draft = {};
  renderQuick();
}

function answer(key, value) {
  answers[key] = value;
  if (complete()) ctx.apply({ ...answers });
  ctx.save({ ...answers });
  const next = fromRecap || step + 1 >= RECAP ? (complete() ? RECAP : QUESTIONS.findIndex(x => answers[x.key] == null)) : step + 1;
  if (next === RECAP) fromRecap = false;
  goTo(next);
  $('#quick').querySelector('.quick__choice[aria-checked="true"], .quick__choice, #quickKm, #quickTime, .quick__row')?.focus({ preventScroll: true });
}

/** Réponses complètes, ou null. */
export function quickAnswers() {
  return complete() ? { ...answers } : null;
}

/**
 * @param {{saved: object|null, duration: (a:object) => string, currentKm: () => number, startName: () => string,
 *   apply: (a:object) => void, save: (a:object) => void, details: () => void, locate: () => void}} c
 */
export function initQuick(c) {
  ctx = c;
  const saved = c.saved && typeof c.saved === 'object' ? c.saved : {};
  const km = Number(saved.km);
  answers = {
    zone: ['z1', 'z2', 'z3', 'z4'].includes(saved.zone) ? saved.zone : undefined,
    relief: ['flat', 'hilly', 'any'].includes(saved.relief) ? saved.relief : undefined,
    km: km >= 20 && km <= 200 ? Math.round(km / 5) * 5 : undefined,
    day: undefined,
    time: undefined
  };
  // Le départ n'a de sens que le jour même : il repart sur aujourd'hui, au prochain quart d'heure.
  if (answers.zone && answers.relief && answers.km) Object.assign(answers, { day: 'today', time: soonTime() });
  step = complete() ? RECAP : 0;
  const host = $('#quick');
  host.addEventListener('input', e => {
    if (e.target.id === 'quickKm') {
      draft.km = Number(e.target.value);
      e.target.setAttribute('aria-valuetext', `${draft.km} kilomètres`);
      $('#quickKmOut').textContent = `${draft.km} km`;
      $('#quickKmSub').textContent = durationText(draft.km);
    }
    if (e.target.id === 'quickTime') draft.time = e.target.value;
    if (e.target.id === 'quickDate') draft.date = e.target.value;
  });
  host.addEventListener('click', e => {
    const t = e.target;
    const choice = t.closest('[data-quick-value]');
    if (choice) return answer(QUESTIONS[step].key, choice.dataset.quickValue);
    const day = t.closest('[data-quick-day]');
    if (day) {
      if (day.dataset.quickDay !== 'other') return answer('day', day.dataset.quickDay);
      draft.day = 'other';
      renderQuick();
      return $('#quickDate')?.focus();
    }
    if (t.closest('[data-quick-next]')) {
      const key = QUESTIONS[step].key;
      if (key === 'km') return answer('km', draft.km);
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
      const back = fromRecap ? RECAP : Math.max(0, step - 1);
      fromRecap = false;
      return goTo(back);
    }
    if (t.closest('[data-quick-restart]')) {
      answers = {};
      fromRecap = false;
      return goTo(0);
    }
    if (t.closest('[data-quick-locate]')) return ctx.locate();
    if (t.closest('[data-quick-details]')) return ctx.details();
  });
  renderQuick();
}
