/*
 * Onglet Atelier : calculateur de transmission (vitesse et développement de chaque combinaison)
 * et estimation de la pression des pneus à partir du poids du Profil. Tout est calculé ici,
 * sans service externe ; le lien Silca ouvre seulement leur site pour affiner.
 */
import * as store from '../services/store.js';
import { CHAINRINGS, CASSETTES, WHEELS, SURFACES, gearTable, development, speedKmh, tirePressure } from '../core/tools.js';

const $ = sel => document.querySelector(sel);
const fr = (n, d = 1) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

const DEFAULTS = { tool: 'gears', rings: '50-34', cassette: '11-34', wheel: '28', cadence: 90, sel: null, width: 28, surface: 'road', tubeless: true, hookless: false };
let s = { ...DEFAULTS, ...store.loadAtelier() };
let getProfile = () => ({ weight: 72, bike: 9 });
const save = () => store.saveAtelier(s);

const byId = (list, id) => list.find(x => x.id === id) || list[0];
const options = (list, current) => list.map(x => `<option value="${x.id}"${x.id === current ? ' selected' : ''}>${x.label}</option>`).join('');
const check = (group, attr, value) => group.querySelectorAll(`[${attr}]`).forEach(b => b.setAttribute('aria-checked', String(b.getAttribute(attr) === String(value))));

function renderTool() {
  check($('#atelierTabs'), 'data-tool', s.tool);
  $('#toolGears').hidden = s.tool !== 'gears';
  $('#toolTires').hidden = s.tool !== 'tires';
}

function renderGears() {
  const rings = byId(CHAINRINGS, s.rings).teeth;
  const cogs = byId(CASSETTES, s.cassette).teeth;
  const wheel = byId(WHEELS, s.wheel).mm;
  const cad = s.cadence;
  $('#g-cadenceOut').textContent = `${cad} tr/min`;
  if (!s.sel || !rings.includes(s.sel[0]) || !cogs.includes(s.sel[1])) s.sel = [rings[0], cogs[Math.floor(cogs.length / 2)]];
  const table = gearTable(rings, cogs, wheel, cad);
  $('#g-table').innerHTML =
    `<thead><tr><th scope="col">Pignon</th>${rings.map(r => `<th scope="col">${r} dents</th>`).join('')}</tr></thead><tbody>` +
    table
      .map(
        row =>
          `<tr><th scope="row">${row[0].cog}</th>${row
            .map(
              g =>
                `<td><button type="button" data-ring="${g.ring}" data-cog="${g.cog}" class="${g.cross ? 'is-cross' : ''}" aria-pressed="${s.sel[0] === g.ring && s.sel[1] === g.cog}" aria-label="${g.ring} × ${g.cog} : ${fr(g.speed)} km/h">${fr(g.speed)}</button></td>`
            )
            .join('')}</tr>`
      )
      .join('') +
    '</tbody>';
  const [ring, cog] = s.sel;
  const dev = development(ring, cog, wheel);
  $('#g-speed').innerHTML = `${fr(speedKmh(dev, cad))}<small>km/h</small>`;
  $('#g-speedLabel').textContent = `En ${ring} × ${cog} à ${cad} tr/min`;
  $('#g-dev').innerHTML = `${fr(dev, 2)}<small>m</small>`;
  $('#g-devLabel').textContent = `Développement · ratio ${fr(ring / cog, 2)}`;
  const lo = development(Math.min(...rings), Math.max(...cogs), wheel);
  const hi = development(Math.max(...rings), Math.min(...cogs), wheel);
  $('#g-range').textContent = `Plus petit braquet : ${fr(lo, 2)} m (${fr(speedKmh(lo, cad))} km/h). Plus grand : ${fr(hi, 2)} m (${fr(speedKmh(hi, cad))} km/h).`;
}

function renderTires() {
  const p = getProfile();
  const mass = p.weight + p.bike;
  $('#t-mass').innerHTML = `<span><strong>${fr(mass, 0)} kg</strong> au total · ${fr(p.weight, p.weight % 1 ? 1 : 0)} kg + ${fr(p.bike, p.bike % 1 ? 1 : 0)} kg de vélo</span><button type="button" class="link" data-go="profile">Modifier dans le Profil</button>`;
  $('#t-widthOut').textContent = `${s.width} mm`;
  check($('#t-surface'), 'data-surface', s.surface);
  check($('#t-mount'), 'data-tubeless', s.tubeless ? 1 : 0);
  $('#t-hookless').setAttribute('aria-checked', String(s.hookless));
  const r = tirePressure({ mass, width: s.width, surface: s.surface, tubeless: s.tubeless, hookless: s.hookless });
  if (!r) return;
  $('#t-front').innerHTML = `${fr(r.front)}<small>bar</small>`;
  $('#t-rear').innerHTML = `${fr(r.rear)}<small>bar</small>`;
  $('#t-psi').textContent = `Soit ${Math.round(r.frontPsi)} psi à l’avant et ${Math.round(r.rearPsi)} psi à l’arrière.`;
  const offroad = s.surface === 'gravel' || s.surface === 'chunky';
  const warn = r.capped ? 'Plafonné à 5 bar, la limite des jantes hookless : un pneu plus large serait plus adapté.' : offroad && s.width < 32 ? 'Pneu étroit pour du gravel : visez plutôt 35 mm ou plus.' : '';
  $('#t-warn').hidden = !warn;
  $('#t-warn').textContent = warn;
}

export function renderAtelier() {
  renderTool();
  if (s.tool === 'gears') renderGears();
  else renderTires();
}

/** @param {{getProfile:()=>{weight:number,bike:number}}} opts */
export function initAtelier(opts) {
  getProfile = opts.getProfile;
  $('#g-rings').innerHTML = options(CHAINRINGS, s.rings);
  $('#g-cassette').innerHTML = options(CASSETTES, s.cassette);
  $('#g-wheel').innerHTML = options(WHEELS, s.wheel);
  $('#g-cadence').value = s.cadence;
  $('#t-width').value = s.width;
  $('#t-surface').innerHTML = SURFACES.map(x => `<button type="button" class="chip" role="radio" data-surface="${x.id}">${x.label}</button>`).join('');

  const update = patch => {
    Object.assign(s, patch);
    save();
    renderAtelier();
  };
  $('#atelierTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tool]');
    if (b) update({ tool: b.dataset.tool });
  });
  $('#g-rings').addEventListener('change', e => update({ rings: e.target.value }));
  $('#g-cassette').addEventListener('change', e => update({ cassette: e.target.value }));
  $('#g-wheel').addEventListener('change', e => update({ wheel: e.target.value }));
  $('#g-cadence').addEventListener('input', e => update({ cadence: Number(e.target.value) }));
  $('#g-table').addEventListener('click', e => {
    const b = e.target.closest('[data-ring]');
    if (b) update({ sel: [Number(b.dataset.ring), Number(b.dataset.cog)] });
  });
  $('#t-width').addEventListener('input', e => update({ width: Number(e.target.value) }));
  $('#t-surface').addEventListener('click', e => {
    const b = e.target.closest('[data-surface]');
    if (b) update({ surface: b.dataset.surface });
  });
  $('#t-mount').addEventListener('click', e => {
    const b = e.target.closest('[data-tubeless]');
    if (b) update({ tubeless: b.dataset.tubeless === '1' });
  });
  $('#t-hookless').addEventListener('click', () => update({ hookless: !s.hookless }));
  renderAtelier();
}
