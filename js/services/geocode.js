/* Recherche d'un lieu (Nominatim / OpenStreetMap). */
export async function geocode(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  Object.entries({ q: query, format: 'jsonv2', limit: '1', 'accept-language': 'fr' }).forEach(([k, v]) => url.searchParams.set(k, v));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const [hit] = await response.json();
    if (!hit) return null;
    return { lat: Number(hit.lat), lon: Number(hit.lon), name: hit.name || String(hit.display_name).split(',')[0] };
  } finally {
    clearTimeout(timer);
  }
}
