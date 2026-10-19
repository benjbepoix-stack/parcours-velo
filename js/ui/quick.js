/*
 * Questions rapides de l'onglet Étape : quatre questions, une par écran, une touche par
 * réponse (séance, terrain, durée, départ), puis un récapitulatif et « Trouver mes boucles ».
 * Les réponses règlent le formulaire détaillé, qui reste accessible à tout moment.
 */
import { icon } from './icons.js';

const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtHours = h => (h < 1 ? `${Math.round(h * 60)} min` : `${Math.floor(h)} h${h % 1 ? ` ${String(Math.round((h % 1) * 60)).padStart(2, '0')}` : ''}`);
const hhmm = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Prochain quart d'heure, au moins dix minutes plus tard (le temps de s'habiller). */
function soon() {
  const d = new Date(Date.now() + 10 * 60000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15);
  return d;
}
const at = (days, h) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, 0, 0, 0);
  return d;
};
/** Créneaux de départ proposés (« Ce soir » seulement s'il est encore temps). */
export const WHEN = {
  now: { label: 'Maintenant', date: soon },
  evening: { label: 'Ce soir', date: () => at(0, 18), available: () => new Date().getHours() < 17 },
  morning: { label: 'Demain matin', date: () => at(1, 9) },
  afternoon: { label: 'Demain après-midi', date: () => at(1, 14) }
};

const QUESTIONS = [
  {
    key: 'zone',
    title: 'Quelle séance ?',
    short: 'Séance',
    choices: () => [
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
    choices: () => [
      { value: 'flat', label: 'Plat', sub: 'Le moins de côtes possible' },
      { value: 'hilly', label: 'Vallonné', sub: 'Des côtes en plus' },
      { value: 'any', label: 'Peu importe', sub: 'Les routes les plus prisées' }
    ]
  },
  {
    key: 'hours',
    title: 'Combien de temps ?',
    short: 'Durée',
    grid: true,
    choices: a => [1, 1.5, 2, 2.5, 3, 4, 5].map(h => ({ value: h, label: fmtHours(h), sub: `≈ ${ctx.estimateKm({ ...a, hours: h })} km` }))
  },
  {
    key: 'when',
    title: 'Départ quand ?',
    short: 'Départ',
    choices: () =>
      Object.entries(WHEN)
        .filter(([, w]) => !w.available || w.available())
        .map(([value, w]) => ({ value, label: w.label, sub: hhmm(w.date()) }))
  }
];
const RECAP = QUESTIONS.length;

let ctx = null;
let answers = {};
let step = 0;
let fromRecap = false;

const complete = () => QUESTIONS.every(q => answers[q.key] !== undefined && answers[q.key] !== null);
const labelOf = (q, value) => q.choices(answers).find(c => c.value === value);

function renderQuestion(i) {
  const q = QUESTIONS[i];
  const choices = q.choices(answers);
  return `<div class="quick__progress" aria-hidden="true"><span style="--value:${((i + 1) / RECAP) * 100}%"></span></div>
    <div class="quick__top">
      ${i > 0 || fromRecap ? `<button type="button" class="quick__back" data-quick-back aria-label="Question précédente">${icon('chevron', 16)}<span>Retour</span></button>` : '<span></span>'}
      <span class="quick__count">${i + 1} / ${RECAP}</span>
    </div>
    <h2 class="quick__title" id="quickTitle">${esc(q.title)}</h2>
    <div class="quick__choices ${q.grid ? 'quick__choices--grid' : ''}" role="radiogroup" aria-labelledby="quickTitle">
      ${choices
        .map(
          c => `<button type="button" class="quick__choice" role="radio" aria-checked="${answers[q.key] === c.value}" data-quick-value="${esc(c.value)}">
        <strong>${esc(c.label)}</strong><small>${esc(c.sub)}</small></button>`
        )
        .join('')}
    </div>`;
}

function renderRecap() {
  const rows = QUESTIONS.map((q, i) => {
    const c = labelOf(q, answers[q.key]);
    const value = q.key === 'hours' ? `${c?.label} · ${c?.sub}` : `${c?.label}${q.key === 'when' ? ` · ${c?.sub}` : ''}`;
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
  const host = $('#quick');
  host.innerHTML = step >= RECAP ? renderRecap() : renderQuestion(step);
  $('#rideForm').classList.toggle('is-asking', step < RECAP);
}

function choose(value) {
  const q = QUESTIONS[step];
  answers[q.key] = q.key === 'hours' ? Number(value) : value;
  if (complete()) ctx.apply({ ...answers });
  ctx.save({ ...answers });
  step = fromRecap || step + 1 >= RECAP ? (complete() ? RECAP : QUESTIONS.findIndex(x => answers[x.key] == null)) : step + 1;
  if (step === RECAP) fromRecap = false;
  renderQuick();
  $('#quick').querySelector('.quick__choice[aria-checked="true"], .quick__choice, .quick__row')?.focus({ preventScroll: true });
}

/** Les réponses du jour : le créneau de départ est toujours reposé (« Maintenant » par défaut). */
export function quickAnswers() {
  return complete() ? { ...answers } : null;
}

/**
 * @param {{saved: object|null, estimateKm: (a:object) => number, startName: () => string,
 *   apply: (a:object) => void, save: (a:object) => void, details: () => void, locate: () => void}} c
 */
export function initQuick(c) {
  ctx = c;
  const saved = c.saved && typeof c.saved === 'object' ? c.saved : {};
  answers = {
    zone: ['z1', 'z2', 'z3', 'z4'].includes(saved.zone) ? saved.zone : undefined,
    relief: ['flat', 'hilly', 'any'].includes(saved.relief) ? saved.relief : undefined,
    hours: [1, 1.5, 2, 2.5, 3, 4, 5].includes(saved.hours) ? saved.hours : undefined,
    when: undefined
  };
  // Le créneau de départ n'a de sens que le jour même : il repart sur « Maintenant ».
  if (answers.zone && answers.relief && answers.hours) answers.when = 'now';
  step = complete() ? RECAP : 0;
  $('#quick').addEventListener('click', e => {
    const t = e.target;
    const choice = t.closest('[data-quick-value]');
    if (choice) return choose(choice.dataset.quickValue);
    const go = t.closest('[data-quick-go]');
    if (go) {
      step = Number(go.dataset.quickGo);
      fromRecap = true;
      return renderQuick();
    }
    if (t.closest('[data-quick-back]')) {
      step = fromRecap ? RECAP : Math.max(0, step - 1);
      fromRecap = false;
      return renderQuick();
    }
    if (t.closest('[data-quick-restart]')) {
      answers = {};
      step = 0;
      fromRecap = false;
      return renderQuick();
    }
    if (t.closest('[data-quick-locate]')) return ctx.locate();
    if (t.closest('[data-quick-details]')) return ctx.details();
  });
  renderQuick();
}
