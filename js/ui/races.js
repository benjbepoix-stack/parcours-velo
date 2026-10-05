/* Onglet Courses : cyclosportives à ajouter d'un geste au planning de l'app Carnet. */
import * as store from '../services/store.js';
import { addRaceToCarnet } from '../services/carnet-sync.js';
import { icon } from './icons.js';
import { RACES, RACE_GROUPS } from '../data/races.js';
import { haversine } from '../core/ride.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let added = new Set(store.loadRacesAdded());
const saveAdded = () => store.saveRacesAdded([...added]);


const MAX_RADIUS = 600; // curseur au maximum : toute la France
const savedView = store.loadRacesView();
const view = {
  group: 'all',
  yearIdx: 0,
  query: '',
  sort: savedView.sort === 'distance' ? 'distance' : 'date',
  radius: Math.min(MAX_RADIUS, Math.max(25, Number(savedView.radius) || MAX_RADIUS)),
  onlyPicked: Boolean(savedView.onlyPicked),
  here: null // position de l'appareil, si demandée
};
const persistView = () => store.saveRacesView({ sort: view.sort, radius: view.radius, onlyPicked: view.onlyPicked });
let getStart = () => null;
/** Origine des distances : position de l'appareil si demandée, sinon le départ choisi dans « Sortie ». */
const origin = () => view.here || getStart();
const distanceOf = r => {
  const o = origin();
  return o && r.coords ? haversine([o.lat, o.lon], r.coords) / 1000 : null;
};
/** Course « retenue » : ajoutée au planning ou marquée (cadre en surbrillance) pour l'édition affichée. */
const isPicked = (r, edition) => added.has(addedKey(r.id, edition.year));
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let toast = () => {};

function addedKey(raceId, year) {
  return `${raceId}@${year}`;
}

function raceCard(r) {
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const isAdded = added.has(addedKey(r.id, edition.year));
  const km = distanceOf(r);
  return `<article class="race ${isAdded ? 'is-added' : ''}" data-race="${r.id}">
    <header class="race__head">
      <label class="race__check"><input type="checkbox" data-race-check ${isAdded ? 'disabled' : ''}></label>
      <div class="race__titles">
        <h3 class="race__name">${esc(r.name)}</h3>
        <p class="race__meta">${esc(r.location)}${km !== null ? ` · <strong class="race__km">${Math.round(km)} km</strong>` : ''}</p>
        <p class="race__period">${esc(r.period)}${edition.confirmed ? '' : ' · <em>à vérifier</em>'}</p>
      </div>
      <button type="button" class="race__mark ${isAdded ? 'is-on' : ''}" data-race-mark aria-pressed="${isAdded}" title="${isAdded ? 'Ajoutée au calendrier · toucher pour retirer la marque' : 'Marquer comme déjà ajoutée au calendrier (sans repasser par Carnet)'}">${icon(isAdded ? 'check' : 'calendar', 15)}</button>
    </header>
    <p class="race__dist">${esc(r.distance)}</p>
    ${r.notes ? `<p class="race__notes">${esc(r.notes)}</p>` : ''}
    <div class="race__actions">
      <input type="date" class="input race__date" data-race-date value="${esc(edition.date)}" aria-label="Date de l'édition ${edition.year} pour ${esc(r.name)}">
      <button type="button" class="btn btn--soft btn--sm" data-race-action="add" ${isAdded ? 'disabled' : ''}>${icon(isAdded ? 'check' : 'plus', 15)}<span>${isAdded ? 'Ajoutée ✓' : 'Ajouter'}</span></button>
      <a class="btn btn--soft btn--sm" href="${esc(r.link)}" target="_blank" rel="noopener">${/google\.[a-z.]+\/search/.test(r.link) ? 'Rechercher le site' : 'Site officiel'}</a>
    </div>
  </article>`;
}

/** Marque/démarque manuellement une course comme « déjà ajoutée au calendrier », sans passer par Carnet. */
function toggleMark(card) {
  const id = card.dataset.race;
  const r = RACES.find(x => x.id === id);
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const key = addedKey(id, edition.year);
  const now = !added.has(key);
  if (now) added.add(key);
  else added.delete(key);
  saveAdded();
  if (view.onlyPicked && !now) renderRaces();
  else {
    card.outerHTML = raceCard(r);
    renderAround();
  }
  updateBar();
  toast(now ? 'Marquée comme ajoutée au calendrier' : 'Marque retirée', { type: 'info' });
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

/** Bloc « Autour de » : origine, curseur de rayon, tri et filtre « validées ». */
function renderAround() {
  const o = origin();
  $('#racesOrigin').textContent = o ? (view.here ? 'Ma position' : o.name || 'Départ de la sortie') : 'Choisissez un départ dans « Sortie »';
  $('#racesHere').setAttribute('aria-pressed', String(Boolean(view.here)));
  $('#racesRadius').value = view.radius;
  $('#racesRadiusOut').textContent = view.radius >= MAX_RADIUS ? 'Toute la France' : `${view.radius} km à la ronde`;
  $$('#racesSort [data-race-sort]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.raceSort === view.sort)));
  $('#racesValidated').setAttribute('aria-checked', String(view.onlyPicked));
  const n = RACES.filter(r => isPicked(r, r.editions[view.yearIdx] || r.editions[0])).length;
  $('#racesValidated').textContent = `✓ Mes courses${n ? ` (${n})` : ''}`;
}

export function renderRaces() {
  $$('#racesGroups [data-race-group]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.raceGroup === view.group)));
  $$('#racesYear [data-race-year]').forEach((b, i) => b.setAttribute('aria-checked', String(i === view.yearIdx)));
  const q = norm(view.query.trim());
  const dateOf = r => (r.editions[view.yearIdx] || r.editions[0]).date;
  const editionOf = r => r.editions[view.yearIdx] || r.editions[0];
  const o = origin();
  const radiusOn = o && view.radius < MAX_RADIUS;
  const list = RACES.filter(
    r =>
      (view.group === 'all' || r.group === view.group) &&
      (!q || norm(`${r.name} ${r.location}`).includes(q)) &&
      (!view.onlyPicked || isPicked(r, editionOf(r))) &&
      (!radiusOn || (distanceOf(r) ?? Infinity) <= view.radius)
  ).sort((a, b) => (view.sort === 'distance' && o ? (distanceOf(a) ?? 1e9) - (distanceOf(b) ?? 1e9) : 0) || dateOf(a).localeCompare(dateOf(b)));
  renderAround();
  $('#racesCount').textContent = `${list.length} course${list.length > 1 ? 's' : ''} · ${view.sort === 'distance' && o ? 'de la plus proche à la plus lointaine' : 'par date'}`;
  // Intercalaires par mois pour s'y retrouver dans la liste.
  let month = '';
  $('#racesList').innerHTML = list.length
    ? list
        .map(r => {
          const m = view.sort === 'distance' && o ? month : dateOf(r).slice(0, 7);
          const head = m !== month ? `<h3 class="races-month">${new Date(`${m}-15T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>` : '';
          month = m;
          return head + raceCard(r);
        })
        .join('')
    : '<div class="empty">Aucune course ne correspond.</div>';
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
    // Reflète tout de suite la marque « ajoutée » (surbrillance + badge), pas seulement le bouton.
    card.outerHTML = raceCard(r);
    renderAround();
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
  getStart = h.getStart || getStart;
  $('#racesRadius').max = MAX_RADIUS;
  $('#racesRadius').addEventListener('input', e => {
    view.radius = Number(e.target.value);
    // Un rayon n'a de sens qu'avec le tri par distance : on le bascule automatiquement.
    if (view.radius < MAX_RADIUS) view.sort = 'distance';
    persistView();
    renderRaces();
  });
  $('#racesSort').addEventListener('click', e => {
    const b = e.target.closest('[data-race-sort]');
    if (!b) return;
    view.sort = b.dataset.raceSort;
    persistView();
    renderRaces();
  });
  $('#racesValidated').addEventListener('click', () => {
    view.onlyPicked = !view.onlyPicked;
    persistView();
    renderRaces();
  });
  $('#racesHere').addEventListener('click', () => {
    if (view.here) {
      view.here = null;
      return renderRaces();
    }
    if (!navigator.geolocation) return toast('Géolocalisation indisponible sur cet appareil.', { error: true });
    navigator.geolocation.getCurrentPosition(
      pos => {
        view.here = { lat: pos.coords.latitude, lon: pos.coords.longitude, name: 'Ma position' };
        view.sort = 'distance';
        persistView();
        renderRaces();
      },
      () => toast('Position refusée ou introuvable : le départ de la sortie est utilisé.', { error: true }),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
  const groups = $('#racesGroups');
  groups.innerHTML = ['<button type="button" class="chip" role="radio" data-race-group="all" aria-checked="true">Toutes</button>']
    .concat(RACE_GROUPS.map(g => `<button type="button" class="chip" role="radio" data-race-group="${esc(g.id)}" aria-checked="false">${esc(g.label)}</button>`))
    .join('');
  $('#racesYear').innerHTML = years().map((y, i) => `<button type="button" class="chip" role="radio" data-race-year="${i}" aria-checked="${i === 0}">Édition ${y}</button>`).join('');
  $('#racesSearch').addEventListener('input', e => {
    view.query = e.target.value;
    renderRaces();
  });
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
    if (btn) return addOne(btn.closest('[data-race]'));
    const markBtn = e.target.closest('[data-race-mark]');
    if (markBtn) toggleMark(markBtn.closest('[data-race]'));
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
