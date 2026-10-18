/*
 * Onglet Courses : cyclosportives à présélectionner pour la saison, puis à envoyer
 * au planning de l'app Cadence une fois le choix validé. Une course présélectionnée
 * reste sur cet appareil : rien ne part vers Cadence tant qu'elle n'est pas validée.
 */
import * as store from '../services/store.js';
import { addRaceToCadence } from '../services/cadence-sync.js';
import { icon } from './icons.js';
import { RACES, RACE_GROUPS } from '../data/races.js';
import { haversine } from '../core/ride.js';

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

let added = new Set(store.loadRacesAdded());
const saveAdded = () => store.saveRacesAdded([...added]);
let shortlist = new Set(store.loadRacesShortlist());
const saveShortlist = () => store.saveRacesShortlist([...shortlist]);


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
/** Course « retenue » pour l'édition affichée : présélectionnée, envoyée à Cadence ou marquée comme déjà dedans. */
const isPicked = (r, edition) => added.has(addedKey(r.id, edition.year)) || shortlist.has(addedKey(r.id, edition.year));
const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
let toast = () => {};

function addedKey(raceId, year) {
  return `${raceId}@${year}`;
}

/** Notes utiles seulement (sans la mention générique de source répétée sur chaque carte). */
const notesOf = r => String(r.notes || '').replace(/\s*Ajoutée d’après les calendriers 2026[^.]*: date 2027 estimée au même jour de la semaine\.\s*/, '').trim();

function raceCard(r) {
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const key = addedKey(r.id, edition.year);
  const isAdded = added.has(key);
  const isShort = !isAdded && shortlist.has(key);
  const km = distanceOf(r);
  const state = isAdded ? 'is-added' : isShort ? 'is-short' : '';
  const actions = isAdded
    ? `<button type="button" class="btn btn--soft btn--sm" disabled>${icon('check', 15)}<span>Dans Cadence</span></button>`
    : isShort
      ? `<button type="button" class="btn btn--primary btn--sm" data-race-action="send">${icon('check', 15)}<span>Valider · Cadence</span></button>`
      : `<button type="button" class="btn btn--soft btn--sm" data-race-action="short">${icon('star', 15)}<span>Présélectionner</span></button>`;
  return `<article class="race ${state}" data-race="${r.id}">
    <header class="race__head">
      <label class="race__check"><input type="checkbox" data-race-check ${isAdded ? 'disabled' : ''} aria-label="Sélectionner ${esc(r.name)}"></label>
      <div class="race__titles">
        <h3 class="race__name">${esc(r.name)}</h3>
        <p class="race__meta">${esc(r.location)}${km !== null ? ` · <strong class="race__km">${Math.round(km)} km</strong>` : ''}</p>
        <p class="race__date-line">${esc(new Date(`${edition.date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }))}${edition.confirmed ? '' : ' <em>· date estimée</em>'}</p>
        ${isShort ? '<p class="race__state">Présélectionnée · pas encore dans Cadence</p>' : ''}
        ${isAdded ? '<p class="race__state race__state--ok">Dans le planning de Cadence</p>' : ''}
      </div>
      ${isShort
        ? `<button type="button" class="race__mark" data-race-action="unshort" aria-label="Retirer de la présélection" title="Retirer de la présélection">${icon('close', 15)}</button>`
        : `<button type="button" class="race__mark ${isAdded ? 'is-on' : ''}" data-race-mark aria-pressed="${isAdded}" title="${isAdded ? 'Dans Cadence · toucher pour retirer la marque' : 'Marquer comme déjà dans Cadence (ajoutée à la main)'}">${icon(isAdded ? 'check' : 'calendar', 15)}</button>`}
    </header>
    ${/^Plusieurs parcours/.test(r.distance) ? '' : `<p class="race__dist">${esc(r.distance)}</p>`}
    ${notesOf(r) ? `<p class="race__notes">${esc(notesOf(r))}</p>` : ''}
    <div class="race__actions">
      <input type="date" class="input race__date" data-race-date value="${esc(edition.date)}" aria-label="Date de l'édition ${edition.year} pour ${esc(r.name)}">
      ${actions}
      <a class="btn btn--soft btn--sm race__link" href="${esc(r.link)}" target="_blank" rel="noopener" aria-label="${/google\.[a-z.]+\/search/.test(r.link) ? 'Rechercher le site' : 'Site officiel'}" title="${/google\.[a-z.]+\/search/.test(r.link) ? 'Rechercher le site' : 'Site officiel'}">${icon('external', 16)}</a>
    </div>
  </article>`;
}

/** Ajoute ou retire une course de la présélection (sur cet appareil uniquement). */
function setShort(card, on, { silent = false } = {}) {
  const r = RACES.find(x => x.id === card.dataset.race);
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const key = addedKey(r.id, edition.year);
  if (added.has(key)) return false;
  if (on) shortlist.add(key);
  else shortlist.delete(key);
  saveShortlist();
  if (!silent) {
    refreshCard(card, r);
    toast(on ? `${r.name} présélectionnée` : 'Retirée de la présélection', { type: 'info' });
  }
  return true;
}

function refreshCard(card, r) {
  if (!card.isConnected) return;
  if (view.onlyPicked && !isPicked(r, r.editions[view.yearIdx] || r.editions[0])) renderRaces();
  else {
    card.outerHTML = raceCard(r);
    renderAround();
  }
  updateBar();
}

/** Marque/démarque manuellement une course comme « déjà dans Cadence », sans l'envoyer. */
function toggleMark(card) {
  const id = card.dataset.race;
  const r = RACES.find(x => x.id === id);
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const key = addedKey(id, edition.year);
  const now = !added.has(key);
  if (now) {
    added.add(key);
    shortlist.delete(key);
    saveShortlist();
  } else added.delete(key);
  saveAdded();
  if (view.onlyPicked && !now) renderRaces();
  else {
    card.outerHTML = raceCard(r);
    renderAround();
  }
  updateBar();
  toast(now ? 'Marquée comme déjà dans Cadence' : 'Marque retirée', { type: 'info' });
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

/** Envoie une course validée au planning de Cadence. */
async function sendOne(card, { silent = false } = {}) {
  const id = card.dataset.race;
  const r = RACES.find(x => x.id === id);
  const edition = r.editions[view.yearIdx] || r.editions[0];
  const date = card.querySelector('[data-race-date]').value;
  if (!date) {
    toast(`Indiquez une date pour ${r.name}.`, { error: true });
    return false;
  }
  try {
    // Cadence attend un nombre de km pour « distance » (plusieurs parcours possibles ici) : laissé vide, à préciser dans Cadence.
    const outcome = await addRaceToCadence({ name: r.name, sport: 'Cyclisme', date, location: r.location });
    const key = addedKey(id, edition.year);
    added.add(key);
    shortlist.delete(key);
    saveAdded();
    saveShortlist();
    refreshCard(card, r);
    if (!silent) toast(outcome === 'exists' ? `${r.name} était déjà dans Cadence` : `${r.name} envoyée à Cadence`);
    return true;
  } catch (error) {
    if (!silent || error.code === 'no-account') toast(error.code === 'no-account' ? error.message : `Cadence injoignable : ${error.message}`, { error: true });
    if (error.code === 'no-account') throw error;
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
    const btn = e.target.closest('[data-race-action]');
    if (btn) {
      const card = btn.closest('[data-race]');
      if (btn.dataset.raceAction === 'short') return setShort(card, true);
      if (btn.dataset.raceAction === 'unshort') return setShort(card, false);
      if (btn.dataset.raceAction === 'send') return sendOne(card).catch(() => {});
    }
    const markBtn = e.target.closest('[data-race-mark]');
    if (markBtn) toggleMark(markBtn.closest('[data-race]'));
  });
  $('#racesList').addEventListener('change', e => {
    if (e.target.matches('[data-race-check]')) updateBar();
  });
  const checkedCards = () => $$('#racesList [data-race-check]:checked').map(cb => cb.closest('[data-race]'));
  $('#racesBarShort').addEventListener('click', () => {
    const cards = checkedCards();
    const n = cards.filter(card => setShort(card, true, { silent: true })).length;
    renderRaces();
    if (n) toast(`${n} course${n > 1 ? 's' : ''} présélectionnée${n > 1 ? 's' : ''}`);
  });
  $('#racesBarSend').addEventListener('click', async () => {
    const cards = checkedCards();
    if (!cards.length) return;
    let ok = 0;
    try {
      for (const card of cards) {
        // eslint-disable-next-line no-await-in-loop
        if (await sendOne(card, { silent: true })) ok++;
      }
    } catch {
      return; // pas de compte : message déjà affiché
    }
    updateBar();
    if (ok) toast(`${ok} course${ok > 1 ? 's' : ''} envoyée${ok > 1 ? 's' : ''} à Cadence`);
    if (ok < cards.length) toast(`${cards.length - ok} course(s) n'ont pas pu être envoyées.`, { error: true });
  });
}
