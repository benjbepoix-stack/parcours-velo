/* Carte Leaflet : fonds, point de départ déplaçable, boucles candidates et tracé coloré selon le vent. */
import { windClass } from './charts.js';

let L = null;
let map = null;
let startMarker = null;
let layer = null;
let onPick = null;

const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** @param {{start:[number,number], onStart:(latlng)=>void, onPickRoute:(i)=>void}} opts */
export function initMap(host, { start, onStart, onPickRoute }) {
  L = window.L;
  if (!L) {
    host.innerHTML = '<p class="hint" style="padding:16px">Carte indisponible.</p>';
    return false;
  }
  onPick = onPickRoute;
  map = L.map(host, { zoomControl: true, attributionControl: true }).setView(start, 11);
  const cyclosm = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', {
    maxZoom: 19,
    subdomains: 'abc',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://www.cyclosm.org">CyclOSM</a>'
  });
  const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' });
  const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, subdomains: 'abc', attribution: '© OpenStreetMap · <a href="https://opentopomap.org">OpenTopoMap</a>' });
  const cycling = L.tileLayer('https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', { maxZoom: 18, opacity: 0.75, attribution: '<a href="https://cycling.waymarkedtrails.org">Waymarked Trails</a>' });
  cyclosm.addTo(map);
  L.control.layers({ 'Vélo (CyclOSM)': cyclosm, 'Standard': osm, 'Relief': topo }, { 'Itinéraires cyclables balisés': cycling }, { position: 'topright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'topleft' }).addTo(map);

  startMarker = L.marker(start, {
    draggable: true,
    title: 'Point de départ',
    icon: L.divIcon({ className: '', html: '<div class="start-pin"></div>', iconSize: [20, 20], iconAnchor: [10, 10] })
  }).addTo(map);
  startMarker.on('dragend', () => {
    const p = startMarker.getLatLng();
    onStart([p.lat, p.lng]);
  });
  map.on('click', e => onStart([e.latlng.lat, e.latlng.lng]));
  layer = L.layerGroup().addTo(map);
  // Le conteneur change de taille avec la mise en page (rotation, panneau).
  new ResizeObserver(() => map.invalidateSize()).observe(host);
  return true;
}

export function setStart(latlng, { pan = false } = {}) {
  if (!map) return;
  startMarker.setLatLng(latlng);
  if (pan) map.setView(latlng, Math.max(map.getZoom(), 11));
}

/**
 * Dessine les boucles : les autres en gris (cliquables), la sélection colorée selon le vent.
 * @param {Array} routes
 * @param {number} selected
 */
export function drawRoutes(routes, selected, { fit = true } = {}) {
  if (!map) return;
  layer.clearLayers();
  const colors = { head: cssVar('--head'), cross: cssVar('--cross'), tail: cssVar('--tail'), casing: cssVar('--casing'), muted: cssVar('--text-3') };
  routes.forEach((r, i) => {
    if (i === selected) return;
    const line = L.polyline(r.coords.map(c => [c[0], c[1]]), { color: colors.muted, weight: 4, opacity: 0.55 });
    line.on('click', e => {
      L.DomEvent.stopPropagation(e);
      onPick?.(i);
    });
    line.bindTooltip(`Boucle ${i + 1}`, { sticky: true });
    line.addTo(layer);
  });
  const r = routes[selected];
  if (!r) return;
  const latlngs = r.coords.map(c => [c[0], c[1]]);
  L.polyline(latlngs, { color: colors.casing, weight: 9, opacity: 0.6, interactive: false }).addTo(layer);
  if (r.sim) {
    let cls = null;
    let run = [];
    const flush = () => run.length > 1 && L.polyline(run, { color: colors[cls], weight: 5.5, opacity: 1, interactive: false }).addTo(layer);
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
    // Flèches de sens régulières
    const step = Math.max(4000, r.meters / 9);
    let next = step;
    for (const s of r.sim.segs) {
      if (s.d1 < next) continue;
      next += step;
      L.marker(latlngs[s.i], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: 'dir-arrow',
          html: `<svg width="16" height="16" viewBox="0 0 16 16" style="transform:rotate(${s.heading}deg)"><path d="M8 1.5 13.5 14 8 10.5 2.5 14z" fill="currentColor" stroke="#000" stroke-opacity=".6" stroke-width="1"/></svg>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        })
      }).addTo(layer);
    }
  } else {
    L.polyline(latlngs, { color: cssVar('--accent'), weight: 5.5, interactive: false }).addTo(layer);
  }
  if (fit) map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28] });
}

export function clearRoutes() {
  layer?.clearLayers();
}
