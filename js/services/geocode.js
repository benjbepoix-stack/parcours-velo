/* Recherche de lieux : Photon (Komoot, données OpenStreetMap), prévu pour la saisie
   au fil de la frappe ; recherche inverse pour nommer un point posé sur la carte. */
const HOST = 'https://photon.komoot.io';

function label(props) {
  const main = props.name || [props.street, props.housenumber].filter(Boolean).join(' ') || props.city || 'Lieu';
  const where = [props.city !== main ? props.city : null, props.county || props.state].filter(Boolean)[0];
  return { name: main, detail: [where, props.postcode].filter(Boolean).join(' · ') };
}

async function get(url, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 8000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

/**
 * Suggestions pour une saisie (5 au plus), favorisant les lieux proches de `near`.
 * @returns {Promise<Array<{lat:number, lon:number, name:string, detail:string}>>}
 */
export async function suggest(query, near, signal) {
  const url = new URL(`${HOST}/api/`);
  url.searchParams.set('q', query);
  url.searchParams.set('lang', 'fr');
  url.searchParams.set('limit', '5');
  if (near) {
    url.searchParams.set('lat', near[0].toFixed(3));
    url.searchParams.set('lon', near[1].toFixed(3));
  }
  const json = await get(url, signal);
  return (json.features || []).map(f => ({ lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], ...label(f.properties || {}) }));
}

/** Nom lisible d'un point (commune, rue…) ; null si inconnu. */
export async function reverse(lat, lon, signal) {
  const url = new URL(`${HOST}/reverse`);
  url.searchParams.set('lat', lat.toFixed(5));
  url.searchParams.set('lon', lon.toFixed(5));
  url.searchParams.set('lang', 'fr');
  const json = await get(url, signal);
  const f = json.features?.[0];
  if (!f) return null;
  const p = f.properties || {};
  return p.city || p.name || p.street || null;
}
