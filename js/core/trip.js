/* Planification multi-jours : un itinéraire point à point A → B (avec
   points de passage éventuels) est routé une seule fois, puis découpé en
   étapes de distance à peu près égale pour couvrir le trajet sur plusieurs
   jours. Contrairement aux modes boucle / aller simple, ce mode ne simule
   pas le vent : il privilégie la distance, le dénivelé et la qualité de
   route par étape. */
import { route } from '../services/routing.js';
import { cumulative, ascentOf, cleanRoute, toGPX } from './ride.js';

export const MIN_DAYS = 2;
export const MAX_DAYS = 10;

export function clampDays(n) {
  const v = Math.round(Number(n));
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, Number.isFinite(v) ? v : MIN_DAYS));
}

/** Découpe une trace [lat, lon, ele] en `days` étapes de distance égale. */
export function splitStages(coords, days) {
  const n = clampDays(days);
  const cum = cumulative(coords);
  const total = cum[cum.length - 1];
  const stages = [];
  let startIdx = 0;
  for (let i = 1; i <= n; i++) {
    const targetDist = (total * i) / n;
    let endIdx = startIdx;
    while (endIdx < cum.length - 1 && cum[endIdx] < targetDist) endIdx++;
    if (i === n) endIdx = cum.length - 1;
    if (endIdx <= startIdx) endIdx = Math.min(startIdx + 1, cum.length - 1);
    const slice = coords.slice(startIdx, endIdx + 1);
    stages.push({ coords: slice, meters: cum[endIdx] - cum[startIdx], ascent: ascentOf(slice) });
    startIdx = endIdx;
  }
  return stages;
}

/**
 * Point d'entrée : route un aller simple A → B puis le découpe en étapes.
 * @param {object} p
 * @param {[number,number]} p.start  @param {[number,number]} p.end
 * @param {Array<[number,number]>} [p.vias]
 * @param {string} p.quiet  @param {number} p.days
 * @param {(done:number,total:number,label:string)=>void} [p.onProgress]
 * @param {AbortSignal} [p.signal]
 */
export async function planMultiDay({ start, end, vias = [], quiet, days, onProgress, signal }) {
  onProgress?.(0, 1, 'Calcul de l’itinéraire…');
  const waypoints = [start, ...vias, end];
  const routed = await route(waypoints, quiet, { signal });
  const cleaned = cleanRoute(routed);
  onProgress?.(1, 1, 'Terminé');
  const stageList = splitStages(cleaned.coords, days);
  return {
    coords: cleaned.coords,
    meters: cleaned.meters,
    ascent: cleaned.ascent,
    roadProfile: cleaned.roadProfile,
    messages: cleaned.messages,
    days: stageList
  };
}

/** GPX d'une étape (même format que l'export d'itinéraire habituel). */
export function stageGPX(trip, index, tripName = 'Itinéraire') {
  const s = trip.days[index];
  return toGPX(`${tripName} · étape ${index + 1}`, s.coords);
}
