/* Onglet Courses : cyclosportives à ajouter d'un geste au planning de l'app Carnet. */
import * as store from '../services/store.js';
import { addRaceToCarnet } from '../services/carnet-sync.js';
import { icon } from './icons.js';
import { RACES, RACE_GROUPS } from '../data/races.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let added = new Set(store.loadRacesAdded());
const saveAdded = () => store.saveRacesAdded([...added]);

const view = { group: 'all', yearIdx: 0 };
let toast = () => {};

function addedKey(raceId, year) {
  return `${raceId}@${year}`;
}

function raceCard(r) {
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const isAdded = added.has(addedKey(r.id, edition.year));
  return `<article class="race" data-race="${r.id}">
    <header class="race__head">
      <label class="race__check"><input type="checkbox" data-race-check ${isAdded ? 'disabled' : ''}></label>
      <div class="race__titles">
        <h3 class="race__name">${esc(r.name)}</h3>
        <p class="race__meta">${esc(r.location)}</p>
        <p class="race__period">${esc(r.period)}${edition.confirmed ? '' : ' · <em>à vérifier</em>'}</p>
      </div>
    </header>
    <p class="race__dist">${esc(r.distance)}</p>
    ${r.notes ? `<p class="race__notes">${esc(r.notes)}</p>` : ''}
    <div class="race__actions">
      <input type="date" class="input race__date" data-race-date value="${esc(edition.date)}" aria-label="Date de l'édition ${edition.year} pour ${esc(r.name)}">
      <button type="button" class="btn btn--soft btn--sm" data-race-action="add" ${isAdded ? 'disabled' : ''}>${icon(isAdded ? 'check' : 'plus', 15)}<span>${isAdded ? 'Ajoutée ✓' : 'Ajouter'}</span></button>
      <a class="btn btn--soft btn--sm" href="${esc(r.link)}" target="_blank" rel="noopener">Site officiel</a>
    </div>
  </article>`;
}

function updateBar() {
  const n = $$('#racesList [data-race-check]:checked').length;
  const bar = $('#racesBar');
  bar.hidden = n === 0;
  $('#racesBarCount').textContent = `${n} course${n > 1 ? 's' : ''} sélectionnée${n > 1 ? 's' : ''}`;
}

function years() {
  // Toutes les courses partagent les mêmes deux années d'édition (en cours / suivante).
  return RACES[0].editions.map(e => e.year);
}

export function renderRaces() {
  $$('#racesGroups [data-race-group]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.raceGroup === view.group)));
  $$('#racesYear [data-race-year]').forEach((b, i) => b.setAttribute('aria-checked', String(i === view.yearIdx)));
  const list = view.group === 'all' ? RACES : RACES.filter(r => r.group === view.group);
  $('#racesList').innerHTML = list.length ? list.map(raceCard).join('') : '<div class="empty">Aucune course dans cette catégorie.</div>';
  updateBar();
}

async function addOne(card, { silent = false } = {}) {
  const id = card.dataset.race;
  const r = RACES.find(x => x.id === id);
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const date = card.querySelector('[data-race-date]').value;
  if (!date) {
    toast(`Indiquez une date pour ${r.name}.`, { error: true });
    return false;
  }
  try {
    // Carnet attend un nombre de km pour « distance » (plusieurs formats possibles ici) :
    // laissé vide pour que vous le précisiez une fois le format choisi.
    await addRaceToCarnet({ name: r.name, sport: 'Cyclisme', date, location: r.location });
    added.add(addedKey(id, edition.year));
    saveAdded();
    card.querySelector('[data-race-check]').checked = false;
    card.querySelector('[data-race-check]').disabled = true;
    const btn = card.querySelector('[data-race-action="add"]');
    btn.disabled = true;
    btn.innerHTML = `${icon('check', 15)}<span>Ajoutée ✓</span>`;
    if (!silent) toast(`${r.name} ajoutée au planning de Carnet`);
    return true;
  } catch (error) {
    if (!silent) toast(`Carnet injoignable : ${error.message}`, { error: true });
    return false;
  }
}

/** @param {{toast:Function}} h */
export function initRaces(h) {
  toast = h.toast;
  const groups = $('#racesGroups');
  groups.innerHTML = ['<button type="button" role="radio" data-race-group="all" aria-checked="true">Toutes</button>']
    .concat(RACE_GROUPS.map(g => `<button type="button" role="radio" data-race-group="${esc(g.id)}" aria-checked="false">${esc(g.label)}</button>`))
    .join('');
  $('#racesYear').innerHTML = years().map((y, i) => `<button type="button" role="radio" data-race-year="${i}" aria-checked="${i === 0}">Édition ${y}</button>`).join('');
  groups.addEventListener('click', e => {
    const b = e.target.closest('[data-race-group]');
    if (!b) return;
    view.group = b.dataset.raceGroup;
    renderRaces();
  });
  $('#racesYear').addEventListener('click', e => {
    const b = e.target.closest('[data-race-year]');
    if (!b) return;
    view.yearIdx = Number(b.dataset.raceYear);
    renderRaces();
  });
  $('#racesList').addEventListener('click', e => {
    const btn = e.target.closest('[data-race-action="add"]');
    if (btn) addOne(btn.closest('[data-race]'));
  });
  $('#racesList').addEventListener('change', e => {
    if (e.target.matches('[data-race-check]')) updateBar();
  });
  $('#racesBarAdd').addEventListener('click', async () => {
    const cards = $$('#racesList [data-race-check]:checked').map(cb => cb.closest('[data-race]'));
    if (!cards.length) return;
    let ok = 0;
    for (const card of cards) {
      // eslint-disable-next-line no-await-in-loop
      if (await addOne(card, { silent: true })) ok++;
    }
    updateBar();
    if (ok) toast(`${ok} course${ok > 1 ? 's' : ''} ajoutée${ok > 1 ? 's' : ''} au planning de Carnet`);
    if (ok < cards.length) toast(`${cards.length - ok} course(s) n'ont pas pu être ajoutées.`, { error: true });
  });
}
