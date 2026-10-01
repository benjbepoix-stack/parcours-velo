/* Carte Leaflet : fond épuré qui suit le thème, point de départ déplaçable,
   tracé coloré selon le vent avec sens de parcours et bornes kilométriques. */
import { windClass } from './charts.js';

let L = null;
let map = null;
let startMarker = null;
let layer = null;
let planLight = null;
let planDark = null;
let planActive = true;
let lastDraw = null;

const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const CARTO = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>';

/** @param {{start:[number,number], dark:boolean, onStart:(latlng)=>void}} opts */
export function initMap(host, { start, dark, onStart }) {
  L = window.L;
  if (!L) {
    host.innerHTML = '<p class="hint" style="padding:16px">Carte indisponible.</p>';
    return false;
  }
  map = L.map(host, { zoomControl: true, attributionControl: true, zoomSnap: 0.5 }).setView(start, 12);
  // Fond « Plan » : CARTO Voyager (clair) ou Dark Matter (sombre) — lisible, peu chargé.
  planLight = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: CARTO });
  planDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20, subdomains: 'abcd', attribution: CARTO });
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
  L.control.layers({ Plan: plan, 'Vélo (CyclOSM)': cyclosm, Relief: topo }, { 'Itinéraires cyclables balisés': cycling }, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'topleft' }).addTo(map);
  map.on('baselayerchange', e => {
    planActive = e.layer === plan;
    host.classList.toggle('is-plan', planActive);
  });
  host.classList.add('is-plan');
  map._planGroup = plan;

  startMarker = L.marker(start, {
    draggable: true,
    title: 'Point de départ',
    zIndexOffset: 1000,
    icon: L.divIcon({ className: '', html: '<div class="start-pin" aria-hidden="true"></div>', iconSize: [22, 22], iconAnchor: [11, 11] })
  }).addTo(map);
  startMarker.on('dragend', () => {
    const p = startMarker.getLatLng();
    onStart([p.lat, p.lng]);
  });
  map.on('click', e => onStart([e.latlng.lat, e.latlng.lng]));
  layer = L.layerGroup().addTo(map);
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

export function setStart(latlng, { pan = false } = {}) {
  if (!map) return;
  startMarker.setLatLng(latlng);
  if (pan) map.setView(latlng, Math.max(map.getZoom(), 12));
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
