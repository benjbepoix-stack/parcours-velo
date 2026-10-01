/* Itinéraires vélo via BRouter (serveur public brouter.de, gratuit, sans clé).
   Un profil « vélo de route » (pistes et chemins évités, trafic pénalisé) est envoyé au
   serveur ; en cas d'échec, repli sur les profils intégrés de BRouter. */
import { QUIET_LEVELS } from '../core/ride.js';
import { roadProfile } from './road-profile.js';

const HOST = 'https://brouter.de';
const TIMEOUT = 25000;
const PROFILE_TTL = 45 * 60 * 1000; // le serveur purge les profils personnalisés
const uploaded = new Map(); // niveau -> { promise, at }

class RouteError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function withTimeout(signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timer = setTimeout(abort, TIMEOUT);
  return { signal: controller.signal, done: () => (clearTimeout(timer), signal?.removeEventListener('abort', abort)) };
}

/** Envoie le profil vélo de route (une seule fois, même si plusieurs calculs démarrent ensemble). */
function uploadProfile(quiet, signal) {
  const hit = uploaded.get(quiet);
  if (hit && Date.now() - hit.at < PROFILE_TTL) return hit.promise;
  const promise = (async () => {
    const t = withTimeout(signal);
    try {
      const response = await fetch(`${HOST}/brouter/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: roadProfile({ traffic: QUIET_LEVELS[quiet]?.traffic ?? 1 }),
        signal: t.signal
      });
      const json = await response.json();
      if (!response.ok || json.error || !json.profileid) throw new RouteError(json.error || 'Profil refusé', response.status);
      return json.profileid;
    } finally {
      t.done();
    }
  })();
  uploaded.set(quiet, { promise, at: Date.now() });
  promise.catch(() => uploaded.get(quiet)?.promise === promise && uploaded.delete(quiet));
  return promise;
}

async function call(waypoints, profile, signal) {
  const url = new URL(`${HOST}/brouter`);
  url.searchParams.set('lonlats', waypoints.map(([lat, lon]) => `${lon.toFixed(6)},${lat.toFixed(6)}`).join('|'));
  url.searchParams.set('profile', profile);
  url.searchParams.set('alternativeidx', '0');
  url.searchParams.set('format', 'geojson');
  const t = withTimeout(signal);
  try {
    const response = await fetch(url, { signal: t.signal });
    const text = await response.text();
    if (!response.ok) throw new RouteError(text.trim().slice(0, 160) || `Erreur serveur ${response.status}`, response.status);
    const feature = JSON.parse(text).features?.[0];
    if (!feature?.geometry?.coordinates?.length) throw new RouteError('Itinéraire vide', response.status);
    const p = feature.properties || {};
    return {
      coords: feature.geometry.coordinates.map(([lon, lat, ele]) => [lat, lon, Number.isFinite(ele) ? ele : null]),
      meters: Number(p['track-length']) || 0,
      ascent: Number(p['filtered ascend']) || 0,
      messages: p.messages || [],
      profile
    };
  } finally {
    t.done();
  }
}

/** Erreur liée aux données (point hors carte, aucun chemin) : changer de profil n'y changera rien. */
const isDataError = e => /not mapped|no track|position|datafile/i.test(e.message);

/**
 * Itinéraire passant par les points donnés.
 * @param {Array<[number,number]>} waypoints [lat, lon]
 * @param {keyof QUIET_LEVELS} quiet
 */
export async function route(waypoints, quiet = 'quiet', { signal } = {}) {
  const level = QUIET_LEVELS[quiet] || QUIET_LEVELS.quiet;
  // 1) Profil vélo de route personnalisé (renvoyé une fois s'il a expiré sur le serveur).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const id = await uploadProfile(quiet, signal);
      return { ...(await call(waypoints, id, signal)), roadProfile: true };
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError') throw error;
      if (isDataError(error)) throw error;
      uploaded.delete(quiet);
    }
  }
  // 2) Repli : profils intégrés de BRouter.
  for (const profile of [level.fallback, 'fastbike']) {
    try {
      return { ...(await call(waypoints, profile, signal)), roadProfile: false };
    } catch (error) {
      if (signal?.aborted || error.name === 'AbortError' || isDataError(error) || profile === 'fastbike') throw error;
    }
  }
  throw new RouteError('Calcul d’itinéraire indisponible');
}

/** Lien vers BRouter-web pour retoucher l'itinéraire à la main. */
export function brouterWebLink(waypoints, quiet) {
  const profile = QUIET_LEVELS[quiet]?.fallback || 'fastbike';
  const [lat, lon] = waypoints[0];
  const lonlats = waypoints.map(([a, b]) => `${b.toFixed(5)},${a.toFixed(5)}`).join(';');
  return `https://brouter.de/brouter-web/#map=11/${lat.toFixed(4)}/${lon.toFixed(4)}/standard&lonlats=${lonlats}&profile=${profile}`;
}
