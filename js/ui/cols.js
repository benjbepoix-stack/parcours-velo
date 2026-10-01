/* Onglet Cols : top 10, catalogue filtrable, cols gravis (cochés), lien vers la carte et la sortie. */
import { COLS, SECTORS, TOP10 } from '../data/cols.js';
import { haversine } from '../core/ride.js';
import * as store from '../services/store.js';
import { icon } from './icons.js';
import * as mapUi from './map.js';

const $ = sel => document.querySelector(sel);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fr = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');
const sectorOf = id => SECTORS.find(s => s.id === id);

let done = store.loadDone();
const view = { tab: 'top', sector: 'all', status: 'all', sort: 'score', query: '' };
let hooks = { getStart: () => null, onRide: () => {} };
let active = false;

/** Distance à vol d'oiseau depuis le départ choisi dans « Sortie ». */
function distanceFrom(col) {
  const start = hooks.getStart();
  return start ? haversine(start, [col.lat, col.lon]) / 1000 : null;
}

function filtered() {
  const q = view.query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  let list = COLS.filter(c => {
    if (view.sector !== 'all' && c.sector !== view.sector) return false;
    if (view.status === 'todo' && done[c.id]) return false;
    if (view.status === 'done' && !done[c.id]) return false;
    if (!q) return true;
    const hay = `${c.name} ${c.from} ${c.area}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return hay.includes(q);
  });
  const by = {
    score: (a, b) => b.score - a.score,
    alt: (a, b) => b.alt - a.alt,
    near: (a, b) => (distanceFrom(a) ?? 1e9) - (distanceFrom(b) ?? 1e9),
    name: (a, b) => a.name.localeCompare(b.name, 'fr')
  };
  return list.sort(by[view.sort] || by.score);
}

function statsLine(c) {
  return `<dl class="col__stats">
    <div><dt>Sommet</dt><dd>${c.alt.toLocaleString('fr-FR')} m</dd></div>
    <div><dt>Longueur</dt><dd>${fr(c.km)} km</dd></div>
    <div><dt>Moyenne</dt><dd>${fr(c.avg)} %</dd></div>
    <div><dt>Maxi</dt><dd>${fr(c.max, c.max % 1 ? 1 : 0)} %</dd></div>
    <div><dt>Dénivelé</dt><dd>${c.gain.toLocaleString('fr-FR')} m</dd></div>
  </dl>`;
}

function colCard(c, { rank = null, why = null } = {}) {
  const isDone = !!done[c.id];
  const km = distanceFrom(c);
  const s = sectorOf(c.sector);
  return `<article class="col${isDone ? ' is-done' : ''}" data-col="${c.id}">
    <header class="col__head">
      ${rank ? `<span class="col__rank" aria-label="Numéro ${rank}">${rank}</span>` : ''}
      <div class="col__titles">
        <h3 class="col__name">${esc(c.name)}</h3>
        <p class="col__meta">depuis ${esc(c.from)} · ${esc(s.short)} · ${esc(c.area)}${km !== null ? ` · à ${Math.round(km)} km` : ''}</p>
      </div>
      <span class="cat cat--${c.cat}" title="Catégorie estimée (indice ${fr(c.score)})">${c.cat === 'HC' ? 'HC' : `${c.cat}<sup>e</sup>`}</span>
    </header>
    ${why ? `<p class="col__why">${esc(why)}</p>` : ''}
    ${statsLine(c)}
    ${c.note ? `<p class="col__note">${esc(c.note)}</p>` : ''}
    <div class="col__actions">
      <button type="button" class="done-toggle" data-col-action="done" aria-pressed="${isDone}">${icon('check', 16)}<span>${isDone ? `Gravi${done[c.id] > 1 ? ` le ${new Date(done[c.id]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}` : 'Je l’ai fait'}</span></button>
      <button type="button" class="btn btn--soft btn--sm" data-col-action="map">${icon('map', 16)}<span>Carte</span></button>
      <button type="button" class="btn btn--soft btn--sm" data-col-action="ride">${icon('route', 16)}<span>Y passer</span></button>
    </div>
  </article>`;
}

function renderSummary() {
  const doneCols = COLS.filter(c => done[c.id]);
  const gain = doneCols.reduce((s, c) => s + c.gain, 0);
  const pct = Math.round((doneCols.length / COLS.length) * 100);
  const bySector = SECTORS.map(s => {
    const all = COLS.filter(c => c.sector === s.id);
    const n = all.filter(c => done[c.id]).length;
    return `<li><span>${esc(s.short)}</span><span class="mini-track" aria-hidden="true"><span style="width:${Math.round((n / all.length) * 100)}%"></span></span><b>${n}/${all.length}</b></li>`;
  }).join('');
  $('#colsSummary').innerHTML = `
    <div class="cols-summary__head">
      <div><span class="cols-title">${doneCols.length} <small>/ ${COLS.length}</small></span><span class="cols-summary__label">cols gravis</span></div>
      <div><span class="cols-title">${gain.toLocaleString('fr-FR')} <small>m</small></span><span class="cols-summary__label">de dénivelé cumulé</span></div>
    </div>
    <div class="progress__track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="Cols gravis"><div class="progress__bar" style="--value:${pct}%"></div></div>
    <ul class="sector-progress">${bySector}</ul>`;
}

function renderFilters() {
  $('#colsSectors').innerHTML = [{ id: 'all', short: 'Tous' }, ...SECTORS]
    .map(s => `<button type="button" class="chip" role="radio" data-sector="${s.id}" aria-checked="${view.sector === s.id}">${esc(s.short)}</button>`)
    .join('');
  document.querySelectorAll('[data-cols-status]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.colsStatus === view.status)));
  $('#colsSort').value = view.sort;
}

export function renderCols({ fit = false } = {}) {
  renderSummary();
  document.querySelectorAll('[data-cols-tab]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.colsTab === view.tab)));
  $('#colsFilters').hidden = view.tab !== 'all';
  let list;
  if (view.tab === 'top') {
    $('#colsList').innerHTML =
      `<p class="hint">Dix cols à faire au moins une fois, choisis pour leur paysage, leur histoire et la variété des secteurs.</p>` +
      TOP10.map(t => colCard(t.col, { rank: t.rank, why: t.why })).join('');
    list = TOP10.map(t => t.col);
  } else {
    renderFilters();
    list = filtered();
    $('#colsList').innerHTML = list.length
      ? `<p class="hint">${list.length} col${list.length > 1 ? 's' : ''} · versant indiqué « depuis ».</p>` + list.map(c => colCard(c)).join('')
      : '<div class="empty">Aucun col ne correspond à ces filtres.</div>';
  }
  if (active) mapUi.setCols(list, done, { onSelect: id => focusCol(id), fit });
}

function toggleDone(id) {
  if (done[id]) delete done[id];
  else done[id] = Date.now();
  store.saveDone(done);
  renderCols();
}

function focusCol(id) {
  const card = document.querySelector(`[data-col="${id}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.add('is-flash');
  setTimeout(() => card.classList.remove('is-flash'), 1200);
}

/** L'onglet devient visible ou non : afficher ou retirer les repères de cols sur la carte. */
export function setColsActive(on) {
  active = on;
  if (on) renderCols({ fit: true });
  else mapUi.setCols([], done);
}

/**
 * @param {{getStart:()=>[number,number]|null, onRide:(col)=>void}} h
 */
export function initCols(h) {
  hooks = { ...hooks, ...h };
  $('#colsTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-cols-tab]');
    if (!b) return;
    view.tab = b.dataset.colsTab;
    renderCols({ fit: true });
  });
  $('#colsSectors').addEventListener('click', e => {
    const b = e.target.closest('[data-sector]');
    if (!b) return;
    view.sector = b.dataset.sector;
    renderCols({ fit: true });
  });
  $('#colsStatus').addEventListener('click', e => {
    const b = e.target.closest('[data-cols-status]');
    if (!b) return;
    view.status = b.dataset.colsStatus;
    renderCols({ fit: true });
  });
  $('#colsSort').addEventListener('change', e => {
    view.sort = e.target.value;
    renderCols({ fit: true });
  });
  let timer = null;
  $('#colsSearch').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      view.query = e.target.value.trim();
      renderCols({ fit: true });
    }, 150);
  });
  $('#colsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-col-action]');
    if (!btn) return;
    const id = btn.closest('[data-col]').dataset.col;
    const col = COLS.find(c => c.id === id);
    const action = btn.dataset.colAction;
    if (action === 'done') toggleDone(id);
    if (action === 'map') {
      mapUi.focusCol(col);
      if (matchMedia('(max-width: 959px)').matches) $('.map-wrap').scrollIntoView({ behavior: 'smooth' });
    }
    if (action === 'ride') hooks.onRide(col);
  });
}
