/* Carte Leaflet : fond épuré qui suit le thème, point de départ déplaçable,
   tracé coloré selon le vent avec sens de parcours et bornes kilométriques. */
import { windClass } from './charts.js';

let L = null;
let map = null;
let stopLayer = null;
let colLayer = null;
const colMarkers = new Map();
let stopMarkers = new Map();
let callbacks = {};
let layer = null;
let planLight = null;
let planDark = null;
let planActive = true;
let lastDraw = null;

const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const ESRI = 'Fond © <a href="https://www.esri.com">Esri</a>, HERE, Garmin, © OpenStreetMap';
const OSM = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const esri = name => `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/${name}/MapServer/tile/{z}/{y}/{x}`;
/** Fond « Plan » : gris clair ou foncé d'Esri (sans clé), noms des lieux en surimpression. */
const canvas = (base, labels) =>
  L.layerGroup([
    L.tileLayer(esri(base), { maxNativeZoom: 16, maxZoom: 19, attribution: ESRI }),
    L.tileLayer(esri(labels), { maxNativeZoom: 16, maxZoom: 19, pane: 'labels' })
  ]);

/**
 * @param {{center:[number,number], dark:boolean, onTap:(latlng)=>void, onMoveStop:(id, latlng)=>void}} opts
 */
export function initMap(host, { center, dark, onTap, onMoveStop }) {
  L = window.L;
  if (!L) {
    host.innerHTML = '<p class="hint" style="padding:16px">Carte indisponible.</p>';
    return false;
  }
  callbacks = { onTap, onMoveStop };
  map = L.map(host, { zoomControl: true, attributionControl: true, zoomSnap: 0.5 }).setView(center, 12);
  // Noms de lieux au-dessus du fond mais sous le tracé.
  const labels = map.createPane('labels');
  labels.style.zIndex = 350;
  labels.style.pointerEvents = 'none';
  planLight = canvas('World_Light_Gray_Base', 'World_Light_Gray_Reference');
  planDark = canvas('World_Dark_Gray_Base', 'World_Dark_Gray_Reference');
  const plan = L.layerGroup();
  const cyclosm = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.cyclosm.org">CyclOSM</a>'
  });
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, subdomains: 'abc', attribution: '© OpenStreetMap · <a href="https://opentopomap.org">OpenTopoMap</a>' });
  const cycling = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', { maxZoom: 18, opacity: 0.7, attribution: '<a href="https://cycling.waymarkedtrails.org">Waymarked Trails</a>' });
  plan.addTo(map);
  (dark ? planDark : planLight).addTo(plan);
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: OSM });
  L.control.layers({ Plan: plan, Standard: osm, 'Vélo (CyclOSM)': cyclosm, Relief: topo }, { 'Itinéraires cyclables balisés': cycling }, { position: 'topright' }).addTo(map);
  // Repli : si le fond « Plan » ne répond pas (tuiles en erreur), bascule sur OpenStreetMap.
  let tileErrors = 0;
  const watch = group => group.eachLayer(l => l.on('tileerror', () => {
    if (++tileErrors === 6 && map.hasLayer(plan)) {
      map.removeLayer(plan);
      osm.addTo(map);
    }
  }));
  watch(planLight);
  watch(planDark);
  L.control.scale({ imperial: false, position: 'topleft' }).addTo(map);
  map.on('baselayerchange', e => {
    planActive = e.layer === plan;
    host.classList.toggle('is-plan', planActive);
  });
  host.classList.add('is-plan');
  map._planGroup = plan;

  map.on('click', e => callbacks.onTap?.([e.latlng.lat, e.latlng.lng]));
  layer = L.layerGroup().addTo(map);
  stopLayer = L.layerGroup().addTo(map);
  colLayer = L.layerGroup().addTo(map);
  new ResizeObserver(() => map.invalidateSize()).observe(host);
  return true;
}

/** Bascule le fond « Plan » entre clair et sombre, et redessine le tracé avec les bonnes couleurs. */
export function setMapTheme(dark) {
  if (!map) return;
  const group = map._planGroup;
  group.clearLayers();
  (dark ? planDark : planLight).addTo(group);
  if (lastDraw) drawRoute(lastDraw.route, { fit: false });
}

/**
 * Affiche les étapes (départ A, passages numérotés, arrivée B), déplaçables au doigt.
 * @param {Array<{id:string, kind:'start'|'via'|'end', label:string, latlng:[number,number]}>} stops
 */
export function setStops(stops, { fit = false } = {}) {
  if (!map) return;
  stopLayer.clearLayers();
  stopMarkers = new Map();
  for (const s of stops) {
    const marker = L.marker(s.latlng, {
      draggable: true,
      title: s.title || s.label,
      zIndexOffset: s.kind === 'start' ? 1000 : 900,
      icon: L.divIcon({ className: '', html: `<div class="stop-pin stop-pin--${s.kind}">${s.label}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] })
    }).addTo(stopLayer);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      callbacks.onMoveStop?.(s.id, [p.lat, p.lng]);
    });
    stopMarkers.set(s.id, marker);
  }
  if (fit && stops.length > 1) map.fitBounds(L.latLngBounds(stops.map(s => s.latlng)), { padding: [48, 48], maxZoom: 13 });
  else if (fit && stops.length === 1) map.setView(stops[0].latlng, Math.max(map.getZoom(), 12));
}

export function panTo(latlng) {
  map?.setView(latlng, Math.max(map.getZoom(), 12));
}

/** Petit menu au point touché : « Départ ici », « Ajouter un passage »… */
export function showActions(latlng, actions) {
  if (!map) return;
  const box = document.createElement('div');
  box.className = 'map-actions';
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn--sm ${a.primary ? 'btn--primary' : 'btn--soft'}`;
    btn.textContent = a.label;
    btn.addEventListener('click', () => {
      map.closePopup();
      a.run();
    });
    box.appendChild(btn);
  }
  L.popup({ closeButton: false, className: 'map-popup', offset: [0, -4], autoPanPadding: [24, 24] }).setLatLng(latlng).setContent(box).openOn(map);
}

export function closeActions() {
  map?.closePopup();
}

const chevron = deg =>
  `<svg width="18" height="18" viewBox="0 0 18 18" style="transform:rotate(${deg}deg)" aria-hidden="true"><path d="M4.5 11.5 9 6l4.5 5.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/**
 * Dessine la boucle sélectionnée : liseré, couleurs du vent, chevrons de sens et bornes kilométriques.
 */
export function drawRoute(r, { fit = true } = {}) {
  if (!map) return;
  layer.clearLayers();
  lastDraw = r ? { route: r } : null;
  if (!r) return;
  const colors = { head: cssVar('--head'), cross: cssVar('--cross'), tail: cssVar('--tail'), casing: cssVar('--casing'), accent: cssVar('--accent') };
  const latlngs = r.coords.map(c => [c[0], c[1]]);
  L.polyline(latlngs, { color: colors.casing, weight: 11, opacity: 0.95, interactive: false, lineJoin: 'round' }).addTo(layer);
  if (r.sim) {
    let cls = null;
    let run = [];
    const flush = () => run.length > 1 && L.polyline(run, { color: colors[cls], weight: 6, opacity: 1, interactive: false, lineJoin: 'round', lineCap: 'round' }).addTo(layer);
    for (const s of r.sim.segs) {
      const c = windClass(s.head);
      if (c !== cls) {
        flush();
        cls = c;
        run = [latlngs[s.i - 1]];
      }
      run.push(latlngs[s.i]);
    }
    flush();
  } else {
    L.polyline(latlngs, { color: colors.accent, weight: 6, interactive: false, lineJoin: 'round' }).addTo(layer);
  }

  const segs = r.sim?.segs || [];
  const total = r.meters;
  // Chevrons de sens (environ tous les 7 km, au moins 6 sur la boucle).
  const arrowStep = Math.max(2500, Math.min(7000, total / 6));
  let next = arrowStep / 2;
  for (const s of segs) {
    if (s.d1 < next || s.d1 > total - 1500) continue;
    next += arrowStep;
    L.marker(latlngs[s.i], { interactive: false, keyboard: false, icon: L.divIcon({ className: 'dir-chevron', html: chevron(s.heading), iconSize: [18, 18], iconAnchor: [9, 9] }) }).addTo(layer);
  }
  // Bornes kilométriques
  const kmStep = total > 90000 ? 20000 : total > 35000 ? 10000 : 5000;
  let mark = kmStep;
  for (const s of segs) {
    if (s.d1 < mark) continue;
    if (total - s.d1 < kmStep * 0.4) break;
    L.marker(latlngs[s.i], {
      interactive: false,
      keyboard: false,
      icon: L.divIcon({ className: 'km-mark', html: `<span>${Math.round(mark / 1000)}</span>`, iconSize: [26, 20], iconAnchor: [13, 10] })
    }).addTo(layer);
    mark += kmStep;
  }
  if (fit) map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36] });
}

export function clearRoutes() {
  lastDraw = null;
  layer?.clearLayers();
}

/* ---------- Cols ---------- */
const fr = (n, d = 1) => Number(n).toFixed(d).replace('.', ',');
const escHtml = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Repères des cols (triangle de sommet ; coché = gravi).
 * Les versants d'un même col partagent le sommet : un seul repère par position.
 */
export function setCols(cols, done, { onSelect, fit = false } = {}) {
  if (!map) return;
  colLayer.clearLayers();
  colMarkers.clear();
  const seen = new Map();
  for (const c of cols) {
    const key = `${c.lat.toFixed(3)},${c.lon.toFixed(3)}`;
    if (seen.has(key)) {
      colMarkers.set(c.id, seen.get(key));
      continue;
    }
    const isDone = cols.some(o => `${o.lat.toFixed(3)},${o.lon.toFixed(3)}` === key && done[o.id]);
    const marker = L.marker([c.lat, c.lon], {
      title: c.name,
      icon: L.divIcon({ className: '', html: `<div class="col-pin${isDone ? ' is-done' : ''}" aria-hidden="true"><span>${isDone ? '✓' : c.cat}</span></div>`, iconSize: [30, 30], iconAnchor: [15, 26] })
    }).addTo(colLayer);
    const box = document.createElement('div');
    box.className = 'col-popup';
    box.innerHTML = `<strong>${escHtml(c.name)}</strong><span>${c.alt} m · ${fr(c.km)} km à ${fr(c.avg)} % · depuis ${escHtml(c.from)}</span>`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn--primary btn--sm';
    btn.textContent = 'Voir la fiche';
    btn.addEventListener('click', () => {
      map.closePopup();
      onSelect?.(c.id);
    });
    box.appendChild(btn);
    marker.bindPopup(box, { className: 'map-popup', closeButton: false, offset: [0, -20] });
    seen.set(key, marker);
    colMarkers.set(c.id, marker);
  }
  if (fit && cols.length) map.fitBounds(L.latLngBounds(cols.map(c => [c.lat, c.lon])), { padding: [40, 40], maxZoom: 11 });
}

export function focusCol(col) {
  if (!map) return;
  map.setView([col.lat, col.lon], 12);
  colMarkers.get(col.id)?.openPopup();
}
