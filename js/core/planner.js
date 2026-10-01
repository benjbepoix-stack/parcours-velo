/* Planification : boucle libre, boucle par des points de passage, ou aller simple A → B.
   Les candidats sont routés par BRouter, nettoyés (allers-retours), simulés avec le vent
   puis classés (distance, dénivelé, vent, trafic, chemins). */
import {
  loopWaypoints, simulate, overlapRatio, roadMix, scoreRoute, windShares, cleanRoute,
  haversine, bearing, compassLong, signedArea, detourPoint, ROAD_FACTOR
} from './ride.js';
import { route } from '../services/routing.js';
import { fetchWind } from '../services/wind.js';

const DIRECTIONS = 8;
const REFINE = 3;
const CONCURRENCY = 3;
const MAX_RESULTS = 5;

const aborted = () => new DOMException('Annulé', 'AbortError');

/** Exécute des tâches asynchrones avec un parallélisme limité (serveur public). */
async function pool(tasks, limit) {
  const results = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      results[i] = await tasks[i]().catch(error => ({ error }));
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

const okOnly = list => list.filter(r => r && !r.error);

function failIfEmpty(list, all) {
  if (list.length) return;
  const error = all.find(r => r?.error)?.error;
  if (error?.name === 'AbortError') throw error;
  throw new Error(`Calcul impossible : ${error?.message || 'aucun itinéraire trouvé'}`);
}

/** Longueur à vol d'oiseau d'une suite de points. */
const polyLength = pts => pts.reduce((s, p, i) => (i ? s + haversine(pts[i - 1], p) : 0), 0);

const orientation = coords => (signedArea(coords) > 0 ? 'Sens inverse des aiguilles d’une montre' : 'Sens des aiguilles d’une montre');

/**
 * Point d'entrée unique.
 * @param {object} p
 * @param {'loop'|'oneway'} p.mode
 * @param {[number,number]} p.start
 * @param {[number,number]|null} p.end arrivée (aller simple)
 * @param {Array<[number,number]>} p.vias points de passage, dans l'ordre
 * @param {number|null} p.km distance visée (boucle)
 * @param {number|null} p.ascent dénivelé visé
 * @param {string} p.quiet niveau de trafic
 * @param {Date} p.startTime
 * @param {number} p.power  @param {number} p.mass  @param {number} [p.cda]
 * @param {(done:number,total:number,label:string)=>void} [p.onProgress]
 * @param {AbortSignal} [p.signal]
 */
export async function planRoute(p) {
  p.onProgress?.(0, 1, 'Prévisions de vent…');
  const wind = await fetchWind(p.start[0], p.start[1], p.startTime);
  const t0 = p.startTime.getTime();
  const windNow = wind.reduce((best, h) => (Math.abs(h.t - t0) < Math.abs(best.t - t0) ? h : best), wind[0]);
  const ctx = { ...p, wind, t0, windNow };
  let out;
  if (p.mode === 'oneway') out = await planOneWay(ctx);
  else if (p.vias?.length) out = await planViaLoop(ctx);
  else out = await planFreeLoop(ctx);
  p.onProgress?.(1, 1, 'Terminé');
  return { ...out, wind, windNow };
}

/** Simule et note un itinéraire routé. */
function evaluator({ power, mass, cda, t0, wind }, target, { loop = true } = {}) {
  return (res, extra = {}) => {
    const sim = simulate(res.coords, { power, mass, cda, startTime: t0, wind });
    const r = { ...res, ...extra, sim, overlap: loop ? overlapRatio(res.coords) : 0, mix: roadMix(res.messages), shares: windShares(sim) };
    r.score = scoreRoute(r, target, { loop });
    return r;
  };
}

/** Route + nettoyage des allers-retours. */
async function routed(waypoints, ctx, alt = 0) {
  if (ctx.signal?.aborted) throw aborted();
  const res = cleanRoute(await route(waypoints, ctx.quiet, { signal: ctx.signal, alt }));
  return { ...res, waypoints };
}

function progress(ctx, total) {
  let done = 0;
  return label => ctx.onProgress?.(Math.min(++done, total), total, label);
}

/* ---------- Boucle libre : 8 directions ---------- */
async function planFreeLoop(ctx) {
  const { start, km, ascent, windNow } = ctx;
  const target = { km, ascent };
  const evaluate = evaluator(ctx, target);
  const tick = progress(ctx, DIRECTIONS + REFINE);

  const attempt = (heading, factor) => async () => {
    try {
      // Un point de passage loin de toute route fait échouer BRouter : autre forme de boucle.
      let lastError = null;
      for (const stretch of [1.25, 1, 1.6]) {
        try {
          const res = await routed(loopWaypoints(start, heading, km, { factor, stretch }), ctx);
          return evaluate(res, { heading, factor, name: `Boucle ${compassLong(heading)}` });
        } catch (error) {
          if (ctx.signal?.aborted) throw error;
          lastError = error;
        }
      }
      throw lastError;
    } finally {
      tick('Calcul des boucles…');
    }
  };

  const headings = Array.from({ length: DIRECTIONS }, (_, k) => (windNow.dir + (k * 360) / DIRECTIONS) % 360);
  const first = await pool(headings.map(h => attempt(h, ROAD_FACTOR)), CONCURRENCY);
  if (ctx.signal?.aborted) throw aborted();
  const ok = okOnly(first);
  failIfEmpty(ok, first);

  // Recalage de la distance sur les meilleures : la sinuosité observée corrige la taille.
  ok.sort((a, b) => a.score.total - b.score.total);
  const refine = ok.slice(0, REFINE).filter(r => Math.abs(r.meters / 1000 - km) / km > 0.04);
  const second = await pool(refine.map(r => attempt(r.heading, Math.min(2.2, Math.max(0.8, r.factor * (r.meters / 1000 / km))))), CONCURRENCY);
  const all = [...ok, ...okOnly(second)].sort((a, b) => a.score.total - b.score.total);
  const seen = new Set();
  const routes = all.filter(r => {
    const key = Math.round(r.heading);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { routes: routes.slice(0, MAX_RESULTS), target, loop: true };
}

/* ---------- Boucle par des points de passage ---------- */
async function planViaLoop(ctx) {
  const { start, vias, km, ascent } = ctx;
  const forward = [start, ...vias, start];
  const backward = [start, ...[...vias].reverse(), start];
  const evaluate = evaluator(ctx, { km: km || null, ascent });
  const wantsDetour = () => km && km * 1000 > baseMeters * 1.08;
  let baseMeters = 0;
  const tick = progress(ctx, km ? 14 : 2);

  const job = (waypoints, extra) => async () => {
    try {
      return evaluate(await routed(waypoints, ctx), extra);
    } finally {
      tick('Calcul des boucles…');
    }
  };

  // 1) Le tour imposé, dans les deux sens (le vent ne donne pas le même résultat).
  const base = await pool([job(forward, { variant: 'direct' }), job(backward, { variant: 'direct' })], CONCURRENCY);
  if (ctx.signal?.aborted) throw aborted();
  const baseOk = okOnly(base);
  failIfEmpty(baseOk, base);
  baseMeters = Math.min(...baseOk.map(r => r.meters));
  let candidates = [...baseOk];
  let note = null;

  // 2) Distance visée plus longue que le tour imposé : un détour sur l'une des étapes.
  if (wantsDetour()) {
    const sinuosity = Math.max(1.05, baseMeters / Math.max(1, polyLength(forward)));
    const extra = (km * 1000 - baseMeters) / sinuosity;
    const legs = [];
    for (const order of [forward, backward]) {
      for (let i = 0; i < order.length - 1; i++) {
        for (const side of [90, -90]) legs.push({ order, i, side, len: haversine(order[i], order[i + 1]) });
      }
    }
    // Étapes les plus longues d'abord ; 8 essais au maximum.
    legs.sort((a, b) => b.len - a.len);
    const build = (leg, add) => {
      const wps = [...leg.order];
      wps.splice(leg.i + 1, 0, detourPoint(leg.order[leg.i], leg.order[leg.i + 1], add, leg.side));
      return wps;
    };
    const detours = await pool(legs.slice(0, 8).map(leg => job(build(leg, extra), { variant: 'detour', leg, add: extra })), CONCURRENCY);
    if (ctx.signal?.aborted) throw aborted();
    const detourOk = okOnly(detours).sort((a, b) => a.score.total - b.score.total);
    // Recalage de la longueur du détour sur les meilleurs.
    const refine = detourOk.slice(0, 4).filter(r => Math.abs(r.meters / 1000 - km) / km > 0.05);
    const refined = await pool(
      refine.map(r => {
        const gained = Math.max(500, r.meters - baseMeters);
        const add = Math.max(500, r.add * ((km * 1000 - baseMeters) / gained));
        return job(build(r.leg, add), { variant: 'detour', leg: r.leg, add });
      }),
      CONCURRENCY
    );
    candidates = [...candidates, ...detourOk, ...okOnly(refined)];
  } else if (km && km * 1000 < baseMeters * 0.92) {
    note = `Vos points de passage imposent déjà ${Math.round(baseMeters / 1000)} km : plus que les ${km} km visés.`;
  }

  candidates.sort((a, b) => a.score.total - b.score.total);
  const routes = [];
  for (const r of candidates) {
    const turn = Math.sign(signedArea(r.coords));
    if (routes.some(o => Math.abs(o.meters - r.meters) < 400 && Math.sign(signedArea(o.coords)) === turn)) continue;
    r.name = r.variant === 'detour' ? `Détour ${compassLong(bearing(start, r.waypoints[r.leg.i + 1]))}` : 'Par vos points';
    r.subtitle = orientation(r.coords);
    r.heading = bearing(start, r.waypoints[1]);
    routes.push(r);
    if (routes.length >= MAX_RESULTS) break;
  }
  return { routes, target: { km: km || null, ascent }, loop: true, note };
}

/* ---------- Aller simple A → B ---------- */
async function planOneWay(ctx) {
  const { start, end, vias, ascent } = ctx;
  const waypoints = [start, ...(vias || []), end];
  const tick = progress(ctx, 3);
  const results = await pool(
    [0, 1, 2].map(alt => async () => {
      try {
        return { ...(await routed(waypoints, ctx, alt)), alt };
      } finally {
        tick('Calcul des itinéraires…');
      }
    }),
    CONCURRENCY
  );
  if (ctx.signal?.aborted) throw aborted();
  const ok = okOnly(results);
  failIfEmpty(ok, results);
  const shortest = Math.min(...ok.map(r => r.meters));
  const target = { km: shortest / 1000, ascent };
  const evaluate = evaluator(ctx, target, { loop: false });
  const evaluated = ok.map(r => evaluate(r)).sort((a, b) => a.score.total - b.score.total);
  // BRouter peut renvoyer deux fois le même tracé : on garde les itinéraires distincts.
  const routes = [];
  let variant = 0;
  for (const r of evaluated) {
    if (routes.some(o => Math.abs(o.meters - r.meters) < 150 && Math.abs(o.ascent - r.ascent) < 15)) continue;
    r.name = r.meters === shortest ? 'Le plus direct' : `Variante ${++variant}`;
    r.heading = bearing(start, end);
    routes.push(r);
  }
  return { routes, target, loop: false };
}
