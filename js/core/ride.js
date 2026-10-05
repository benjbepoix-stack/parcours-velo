/* Calculs « parcours vélo » : géométrie, génération de boucles, modèle physique,
   effet du vent, analyse des routes empruntées, score et export GPX.
   Module pur (aucun accès DOM ni réseau) : testable isolément. */

const R_EARTH = 6371000;
const toRad = d => (d * Math.PI) / 180;
const toDeg = r => (r * 180) / Math.PI;

/* ---------- Géométrie ---------- */

/** Distance orthodromique en mètres entre deux points [lat, lon]. */
export function haversine([lat1, lon1], [lat2, lon2]) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Cap (0 = nord, 90 = est) pour aller de a vers b, en degrés. */
export function bearing([lat1, lon1], [lat2, lon2]) {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Point atteint depuis [lat, lon] en suivant un cap sur une distance (m). */
export function destination([lat, lon], headingDeg, meters) {
  const δ = meters / R_EARTH;
  const θ = toRad(headingDeg);
  const φ1 = toRad(lat);
  const λ1 = toRad(lon);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [toDeg(φ2), ((toDeg(λ2) + 540) % 360) - 180];
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
const COMPASS_LONG = ['nord', 'nord-est', 'est', 'sud-est', 'sud', 'sud-ouest', 'ouest', 'nord-ouest'];
export const compass = deg => COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
export const compassLong = deg => COMPASS_LONG[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/* ---------- Séances ---------- */

/**
 * Types de séance : intensité moyenne (fraction de FTP), dénivelé visé (m/km)
 * et distance suggérée. « Libre » laisse le dénivelé au choix de l'utilisateur.
 */
export const SESSIONS = {
  endurance: { label: 'Endurance', ftp: 0.68, climb: 9, km: 80, hint: 'Zone 2 régulière, peu de relances : un relief modéré.' },
  recovery: { label: 'Récupération', ftp: 0.52, climb: 4, km: 40, hint: 'Terrain plat et abrité, vent doux : on tourne les jambes.' },
  intervals: { label: 'Intervalles', ftp: 0.75, climb: 5, km: 60, hint: 'Routes roulantes et régulières pour tenir les blocs sans coupure.' },
  climbing: { label: 'Côtes', ftp: 0.72, climb: 18, km: 70, hint: 'Maximum de dénivelé : travail de force et de seuil en montée.' },
  long: { label: 'Sortie longue', ftp: 0.63, climb: 10, km: 120, hint: 'Volume : gérer le vent pour rentrer avec le vent dans le dos.' },
  free: { label: 'Libre', ftp: 0.68, climb: null, km: 70, hint: 'Distance et dénivelé à votre main.' }
};

/**
 * Préférence de dénivelé (comme Strava) : « N'importe », « Plat » (éviter les
 * côtes) ou « Vallonné » (en ajouter). « Libre » = dénivelé chiffré saisi à la main.
 * `climb` : m de D+ par km utilisé pour l'indication « environ … m ».
 */
export const RELIEF = {
  any: { label: 'N’importe', hint: 'Utilisez les itinéraires les plus populaires, quel que soit le dénivelé positif.', climb: null },
  flat: { label: 'Plat', hint: 'Évitez les côtes lorsque c’est possible.', climb: 4 },
  hilly: { label: 'Vallonné', hint: 'Ajoutez du dénivelé positif lorsque c’est possible.', climb: 16 }
};
/** Intensité de roulage pour la simulation (sortie d'endurance), en part de la FTP. */
export const RIDE_FTP = 0.68;

/** Profils BRouter : du plus direct au plus tranquille. */
export const QUIET_LEVELS = {
  normal: { label: 'Standard', short: 'Standard', traffic: 0, fallback: 'fastbike' },
  quiet: { label: 'Peu de trafic', short: 'Calme', traffic: 1, fallback: 'fastbike-lowtraffic' },
  veryQuiet: { label: 'Très peu de trafic', short: 'Très calme', traffic: 2.5, fallback: 'fastbike-verylowtraffic' }
};

/* ---------- Génération de boucles ---------- */

/** Rapport moyen distance routée / périmètre géométrique (routes sinueuses). */
export const ROAD_FACTOR = 1.28;

/**
 * Points de passage d'une boucle partant de `start` vers le cap `heading`.
 * La boucle est une ellipse dont le grand axe suit le cap : l'aller et le
 * retour empruntent des routes différentes, dans des directions opposées.
 * @param {[number,number]} start [lat, lon]
 * @param {number} heading cap de l'aller (degrés)
 * @param {number} km distance routée visée
 * @param {{factor?:number, stretch?:number, points?:number}} options
 * @returns {Array<[number,number]>} départ, points intermédiaires, arrivée (= départ)
 */
export function loopWaypoints(start, heading, km, { factor = ROAD_FACTOR, stretch = 1.25, points = 4 } = {}) {
  // Périmètre de Ramanujan pour une ellipse (a = demi-grand axe, b = a / stretch).
  const perimeter = (km * 1000) / factor;
  const ratio = 1 / stretch;
  const h = ((1 - ratio) / (1 + ratio)) ** 2;
  const unit = Math.PI * (1 + ratio) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  const a = perimeter / unit;
  const b = a * ratio;
  const center = destination(start, heading, a);
  const out = [start];
  // Paramètre t : le départ est à t = π (côté opposé du centre sur le grand axe).
  for (let k = 1; k <= points; k++) {
    const t = Math.PI + (k * 2 * Math.PI) / (points + 1);
    const along = a * Math.cos(t); // selon le cap
    const across = b * Math.sin(t); // perpendiculaire (sens horaire)
    const dist = Math.hypot(along, across);
    const angle = heading + toDeg(Math.atan2(across, along));
    out.push(destination(center, angle, dist));
  }
  out.push(start);
  return out;
}

/* ---------- Modèle physique ---------- */

const G = 9.81;
const RHO = 1.2;
export const CDA = 0.36; // mains aux cocottes, tenue d'entraînement
const CRR = 0.0055; // pneus route, bitume de campagne
const VMAX_DESCENT = 14; // 50 km/h : plafond de sécurité en descente
/** Virages, carrefours, relances : temps réel un peu supérieur au modèle. */
const ROAD_OVERHEAD = 1.05;
/** Le vent est mesuré à 10 m : au niveau du cycliste il est plus faible. */
export const WIND_HEIGHT_FACTOR = 0.65;

/**
 * Vitesse (m/s) à puissance constante.
 * @param {number} power W
 * @param {number} grade pente (0.05 = 5 %)
 * @param {number} headwind composante de face (m/s, négative = vent dans le dos)
 * @param {number} mass cycliste + vélo (kg)
 */
export function speedFor(power, grade, headwind, mass, cda = CDA) {
  const cos = 1 / Math.sqrt(1 + grade * grade);
  const sin = grade * cos;
  const resist = mass * G * (CRR * cos + sin);
  const f = v => {
    const air = v + headwind;
    return v * resist + 0.5 * RHO * cda * air * Math.abs(air) * v - power;
  };
  let lo = 0.3;
  let hi = 30;
  if (f(hi) < 0) return VMAX_DESCENT;
  if (f(lo) > 0) return lo; // mur : on ne descend pas sous ~1 km/h
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return Math.min(VMAX_DESCENT, (lo + hi) / 2);
}

/**
 * Vent au moment du passage : interpolation linéaire des prévisions horaires.
 * @param {Array<{t:number, speed:number, dir:number, gust:number}>} hours  (speed km/h, dir = d'où vient le vent)
 */
export function windAt(hours, time) {
  if (!hours?.length) return { speed: 0, dir: 0, gust: 0 };
  if (time <= hours[0].t) return hours[0];
  const last = hours[hours.length - 1];
  if (time >= last.t) return last;
  const i = hours.findIndex(h => h.t > time);
  const a = hours[i - 1];
  const b = hours[i];
  const k = (time - a.t) / (b.t - a.t);
  // Interpolation vectorielle de la direction (évite le saut 359° → 0°).
  const ax = Math.sin(toRad(a.dir));
  const ay = Math.cos(toRad(a.dir));
  const bx = Math.sin(toRad(b.dir));
  const by = Math.cos(toRad(b.dir));
  const dir = (toDeg(Math.atan2(ax + (bx - ax) * k, ay + (by - ay) * k)) + 360) % 360;
  return { t: time, speed: a.speed + (b.speed - a.speed) * k, gust: a.gust + (b.gust - a.gust) * k, dir };
}

/** Composante de face (km/h) d'un vent venant de `windDir` pour un cycliste au cap `heading`. */
export const headwindComponent = (windSpeed, windDir, heading) => windSpeed * Math.cos(toRad(windDir - heading));

/**
 * Simule la sortie point par point.
 * @param {Array<[number,number,number?]>} coords [lat, lon, ele]
 * @param {{power:number, mass:number, startTime:number, wind:Array, cda?:number}} rider
 * @returns segments [{ d0, d1, heading, grade, head, time, noWindTime }] + totaux
 */
export function simulate(coords, { power, mass, startTime, wind, cda = CDA }) {
  const segs = [];
  let clock = startTime;
  let dist = 0;
  let total = 0;
  let totalNoWind = 0;
  // Pente lissée sur ~200 m pour gommer le bruit du modèle d'altitude.
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  const eleAt = i => coords[i][2] ?? null;
  let j0 = 0;
  let j1 = 0;
  for (let i = 1; i < coords.length; i++) {
    const len = cum[i] - cum[i - 1];
    if (len < 0.5) continue;
    const mid = (cum[i] + cum[i - 1]) / 2;
    while (cum[j0] < mid - 100 && j0 < i - 1) j0++;
    while (j1 < coords.length - 1 && cum[j1] < mid + 100) j1++;
    const span = cum[j1] - cum[j0];
    const grade = span > 20 && eleAt(j0) !== null && eleAt(j1) !== null ? Math.max(-0.25, Math.min(0.25, (eleAt(j1) - eleAt(j0)) / span)) : 0;
    const heading = bearing(coords[i - 1], coords[i]);
    const w = windAt(wind, clock);
    const head = headwindComponent(w.speed * WIND_HEIGHT_FACTOR, w.dir, heading);
    const v = speedFor(power, grade, head / 3.6, mass, cda);
    const v0 = speedFor(power, grade, 0, mass, cda);
    const dt = (len / v) * ROAD_OVERHEAD;
    segs.push({ i, d0: dist, d1: dist + len, heading, grade, head, time: clock, speed: v * 3.6 });
    clock += dt * 1000;
    total += dt;
    totalNoWind += (len / v0) * ROAD_OVERHEAD;
    dist += len;
  }
  return { segs, seconds: total, secondsNoWind: totalNoWind, meters: dist };
}

/* ---------- Nettoyage du tracé ---------- */

/** Distances cumulées (m). */
export function cumulative(coords) {
  const cum = new Float64Array(coords.length);
  for (let i = 1; i < coords.length; i++) cum[i] = cum[i - 1] + haversine(coords[i - 1], coords[i]);
  return cum;
}

/** Point situé à la distance cumulée `d` (interpolation). */
function pointAt(coords, cum, d) {
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const span = cum[hi] - cum[lo] || 1;
  const k = Math.min(1, Math.max(0, (d - cum[lo]) / span));
  return [coords[lo][0] + (coords[hi][0] - coords[lo][0]) * k, coords[lo][1] + (coords[hi][1] - coords[lo][1]) * k];
}

/**
 * Cherche le plus grand détour « en cul-de-sac » : le tracé quitte un point puis y revient.
 *  - aller-retour sur la même route (impasse, chemin vers un point de passage) ;
 *  - petite boucle « sucette » de plus de 1,5 km qui revient au même carrefour.
 * Les lacets de montagne (points proches mais tracé qui continue) ne sont pas concernés.
 */
function findSpur(coords, cum, maxSpur) {
  const CELL_LAT = 0.0003;
  const CELL_LON = 0.00045;
  const RADIUS = 25;
  const grid = new Map();
  const key = (a, b) => `${a}:${b}`;
  let best = null;
  for (let j = 0; j < coords.length; j++) {
    const cy = Math.floor(coords[j][0] / CELL_LAT);
    const cx = Math.floor(coords[j][1] / CELL_LON);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const list = grid.get(key(cy + dy, cx + dx));
        if (!list) continue;
        for (const i of list) {
          const len = cum[j] - cum[i];
          if (len < 60 || len > maxSpur) continue;
          if (best && len <= best.len) continue;
          if (haversine(coords[i], coords[j]) > RADIUS) continue;
          // Aller-retour : les points symétriques du détour se superposent.
          const retrace = [0.15, 0.3, 0.45].every(f => haversine(pointAt(coords, cum, cum[i] + f * len), pointAt(coords, cum, cum[j] - f * len)) < 40);
          if (retrace || len >= 1500) best = { i, j, len };
        }
      }
    }
    const k = key(cy, cx);
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(j);
  }
  return best;
}

/**
 * Supprime les allers-retours et petites boucles parasites du tracé.
 * @returns {{coords:Array, removed:number, spurs:number, removedPoints:Set<string>}}
 */
export function removeSpurs(coords, { maxSpur = 8000, maxShare = 0.22 } = {}) {
  let out = coords;
  let removed = 0;
  let spurs = 0;
  const removedPoints = new Set();
  for (let pass = 0; pass < 12; pass++) {
    const cum = cumulative(out);
    const total = cum[cum.length - 1];
    const spur = findSpur(out, cum, Math.min(maxSpur, total * maxShare));
    if (!spur) break;
    for (let k = spur.i + 1; k <= spur.j; k++) removedPoints.add(pointKey(out[k]));
    out = [...out.slice(0, spur.i + 1), ...out.slice(spur.j + 1)];
    removed += spur.len;
    spurs++;
  }
  return { coords: out, removed, spurs, removedPoints };
}

export const pointKey = ([lat, lon]) => `${lat.toFixed(5)},${lon.toFixed(5)}`;

/** Retire des messages BRouter les tronçons supprimés (pour l'analyse des routes). */
export function filterMessages(messages, removedPoints) {
  if (!removedPoints.size || !Array.isArray(messages) || messages.length < 2) return messages;
  const head = messages[0];
  const iLon = head.indexOf('Longitude');
  const iLat = head.indexOf('Latitude');
  if (iLon < 0 || iLat < 0) return messages;
  return [head, ...messages.slice(1).filter(row => !removedPoints.has(pointKey([Number(row[iLat]) / 1e6, Number(row[iLon]) / 1e6])))];
}

/** Dénivelé positif avec hystérésis (gomme le bruit du modèle d'altitude). */
export function ascentOf(coords, threshold = 8) {
  let up = 0;
  let ref = null;
  for (const c of coords) {
    const e = c[2];
    if (!Number.isFinite(e)) continue;
    if (ref === null) ref = e;
    else if (e > ref + threshold) {
      up += e - ref;
      ref = e;
    } else if (e < ref - threshold) ref = e;
  }
  return up;
}

/**
 * Nettoie un itinéraire BRouter : supprime les allers-retours et recalcule distance,
 * dénivelé et messages en conséquence.
 */
export function cleanRoute(res) {
  const { coords, removed, spurs, removedPoints } = removeSpurs(res.coords);
  if (!spurs) return { ...res, spurs: 0 };
  const cum = cumulative(coords);
  const ratio = res.ascent && res.coords.length ? res.ascent / Math.max(1, ascentOf(res.coords)) : 1;
  return {
    ...res,
    coords,
    meters: cum[cum.length - 1],
    ascent: Math.round(ascentOf(coords) * Math.min(1.3, Math.max(0.7, ratio))),
    messages: filterMessages(res.messages, removedPoints),
    spurs,
    removedMeters: removed
  };
}

/* ---------- Analyse du tracé ---------- */

/** Part du parcours passant plusieurs fois sur la même route (hors 1er / dernier km). */
export function overlapRatio(coords) {
  const cell = ([lat, lon]) => `${Math.round(lat / 0.0006)}:${Math.round(lon / 0.0009)}`;
  const seen = new Map();
  let dist = 0;
  let total = 0;
  let overlap = 0;
  for (let i = 0; i < coords.length; i++) {
    const len = i ? haversine(coords[i - 1], coords[i]) : 0;
    dist += len;
    total += len;
    const key = cell(coords[i]);
    const first = seen.get(key);
    if (first === undefined) seen.set(key, dist);
    else if (dist - first > 1500) overlap += len;
  }
  // La zone de départ/arrivée est forcément partagée : on la retire.
  return total ? Math.max(0, overlap - 2000) / total : 0;
}

const MAJOR = new Set(['trunk', 'trunk_link', 'primary', 'primary_link', 'motorway']);
const MEDIUM = new Set(['secondary', 'secondary_link']);
const QUIET = new Set(['tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'service', 'cycleway', 'road']);
const PAVED = new Set(['asphalt', 'paved', 'concrete', 'concrete:plates', 'paving_stones']);

/**
 * Répartition des routes à partir des messages BRouter (tags OSM par tronçon).
 * @param {Array<Array<string>>} messages tableau BRouter (ligne 0 = en-têtes)
 * @returns {{major:number, medium:number, quiet:number, unpaved:number, cycleRoute:number}} parts (0-1)
 */
export function roadMix(messages) {
  const out = { major: 0, medium: 0, quiet: 0, other: 0, unpaved: 0, cycleRoute: 0 };
  if (!Array.isArray(messages) || messages.length < 2) return out;
  const head = messages[0];
  const iDist = head.indexOf('Distance');
  const iTags = head.indexOf('WayTags');
  if (iDist < 0 || iTags < 0) return out;
  let total = 0;
  for (const row of messages.slice(1)) {
    const d = Number(row[iDist]) || 0;
    const tags = Object.fromEntries(
      String(row[iTags] || '')
        .split(' ')
        .filter(Boolean)
        .map(t => {
          const at = t.indexOf('=');
          return [t.slice(0, at), t.slice(at + 1)];
        })
    );
    total += d;
    const hw = tags.highway || '';
    if (MAJOR.has(hw)) out.major += d;
    else if (MEDIUM.has(hw)) out.medium += d;
    else if (QUIET.has(hw)) out.quiet += d;
    else out.other += d;
    const surface = tags.surface;
    const unpavedHighway = hw === 'track' || hw === 'path' || hw === 'bridleway';
    if ((surface && !PAVED.has(surface)) || (!surface && unpavedHighway)) out.unpaved += d;
    if (Object.keys(tags).some(k => k.startsWith('route_bicycle_'))) out.cycleRoute += d;
  }
  if (total) for (const k of Object.keys(out)) out[k] /= total;
  return out;
}

/* ---------- Score ---------- */

/**
 * Évalue une boucle (plus bas = meilleur).
 * @param {{meters:number, ascent:number, sim:object, overlap:number, mix:object}} r
 * @param {{km:number|null, ascent:number|null}} target
 * @param {{loop?:boolean}} [opts] aller simple : pas de bonus « retour vent dans le dos »
 */
export function scoreRoute(r, target, { loop = true } = {}) {
  const km = r.meters / 1000;
  const distErr = target.km ? Math.abs(km - target.km) / target.km : 0;
  const elevErr = target.ascent === null || target.ascent === undefined ? 0 : Math.abs(r.ascent - target.ascent) / Math.max(target.ascent, 250);
  // Préférence de relief : « Plat » pénalise chaque mètre de montée par km, « Vallonné » le récompense.
  const climbRate = km ? r.ascent / km : 0;
  const relief = target.relief === 'flat' ? (Math.min(climbRate, 30) / 10) * 1.2 : target.relief === 'hilly' ? Math.max(0, 1 - climbRate / 20) * 1.6 : 0;
  const windCost = r.sim.secondsNoWind ? r.sim.seconds / r.sim.secondsNoWind - 1 : 0;
  const half = splitHeadwind(r.sim);
  // Tactique : vent de face à l'aller, dans le dos au retour (bonus), l'inverse est pénalisé.
  const tactic = loop ? (half.second - half.first) / 12 : 0;
  const mix = r.mix || { major: 0, medium: 0, unpaved: 0 }; // GPX importé : routes inconnues
  const traffic = mix.major * 1.5 + mix.medium * 0.4;
  const parts = {
    distance: distErr * 3,
    elevation: elevErr * 1.6 + relief,
    wind: Math.max(0, windCost) * 4,
    tactic,
    overlap: r.overlap * 2,
    traffic,
    unpaved: mix.unpaved * 12
  };
  return { total: Object.values(parts).reduce((s, v) => s + v, 0), parts, half, windCost };
}

/** Vent de face moyen (km/h, pondéré par la distance) sur chaque moitié. */
export function splitHeadwind(sim) {
  const mid = sim.meters / 2;
  let a = 0;
  let da = 0;
  let b = 0;
  let db = 0;
  for (const s of sim.segs) {
    const len = s.d1 - s.d0;
    if (s.d1 <= mid) {
      a += s.head * len;
      da += len;
    } else {
      b += s.head * len;
      db += len;
    }
  }
  return { first: da ? a / da : 0, second: db ? b / db : 0 };
}

/** Parts de distance avec vent de face / de côté / dans le dos. */
export function windShares(sim) {
  const out = { head: 0, cross: 0, tail: 0 };
  for (const s of sim.segs) {
    const len = s.d1 - s.d0;
    if (s.head > 4) out.head += len;
    else if (s.head < -4) out.tail += len;
    else out.cross += len;
  }
  const total = sim.meters || 1;
  return { head: out.head / total, cross: out.cross / total, tail: out.tail / total };
}

/* ---------- Orientation ---------- */

/** Sens de rotation d'une boucle : > 0 = sens inverse des aiguilles d'une montre. */
export function signedArea(coords) {
  let a = 0;
  for (let i = 1; i < coords.length; i++) a += coords[i - 1][1] * coords[i][0] - coords[i][1] * coords[i - 1][0];
  return a / 2;
}

/** Point situé au milieu (à vol d'oiseau) de deux points. */
export const midpoint = (a, b) => destination(a, bearing(a, b), haversine(a, b) / 2);

/**
 * Point de détour à insérer sur l'étape a→b pour l'allonger d'environ `extra` mètres
 * (triangle isocèle, côté `side` = +90 droite / -90 gauche).
 */
export function detourPoint(a, b, extra, side) {
  const L = haversine(a, b);
  const h = Math.sqrt(Math.max(0, ((L + extra) / 2) ** 2 - (L / 2) ** 2));
  return destination(midpoint(a, b), bearing(a, b) + side, h);
}

/* ---------- Créneau de départ ---------- */

/**
 * Durée de la même boucle selon l'heure de départ (le vent évolue dans la journée).
 * @param {Array} coords tracé
 * @param {object} rider { power, mass, cda, wind }
 * @param {number[]} starts heures de départ (timestamps)
 * @returns {Array<{t:number, seconds:number, secondsNoWind:number}>}
 */
export function compareStarts(coords, rider, starts) {
  return starts.map(t => {
    const sim = simulate(coords, { ...rider, startTime: t });
    return { t, seconds: sim.seconds, secondsNoWind: sim.secondsNoWind, half: splitHeadwind(sim) };
  });
}

/* ---------- Simplification (stockage des favoris) ---------- */

/** Douglas-Peucker en mètres (approximation plane locale). */
export function simplify(coords, tolerance = 12) {
  if (coords.length < 3) return coords.slice();
  const lat0 = toRad(coords[0][0]);
  const xy = coords.map(([lat, lon]) => [toRad(lon) * Math.cos(lat0) * R_EARTH, toRad(lat) * R_EARTH]);
  const keep = new Uint8Array(coords.length);
  keep[0] = keep[coords.length - 1] = 1;
  const stack = [[0, coords.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = xy[a];
    const [bx, by] = xy[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let max = 0;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * xy[i][0] - dx * xy[i][1] + bx * ay - by * ax) / len;
      if (d > max) {
        max = d;
        idx = i;
      }
    }
    if (max > tolerance && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return coords.filter((_, i) => keep[i]);
}

/* ---------- Import GPX ---------- */

/**
 * Lit un fichier GPX (traces, routes ou à défaut points de passage).
 * Analyse textuelle tolérante, sans dépendance au DOM (testable sous Node).
 * @returns {{name:string|null, coords:Array<[number,number,number|null]>}}
 */
export function parseGPX(text) {
  const src = String(text || '');
  if (!/<gpx[\s>]/i.test(src)) throw new Error('Ce fichier n’est pas un GPX.');
  const attr = (attrs, key) => {
    const m = attrs.match(new RegExp(`\\b${key}\\s*=\\s*["']([^"']+)["']`, 'i'));
    return m ? Number(m[1]) : NaN;
  };
  const read = tag => {
    const out = [];
    const re = new RegExp(`<${tag}\\b([^>]*?)(?:/>|>([\\s\\S]*?)</${tag}>)`, 'gi');
    let m;
    while ((m = re.exec(src))) {
      const lat = attr(m[1], 'lat');
      const lon = attr(m[1], 'lon');
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
      const ele = m[2] ? Number((m[2].match(/<ele>\s*([-\d.]+)\s*<\/ele>/i) || [])[1]) : NaN;
      out.push([lat, lon, Number.isFinite(ele) ? ele : null]);
    }
    return out;
  };
  let coords = read('trkpt');
  if (coords.length < 2) coords = read('rtept');
  if (coords.length < 2) coords = read('wpt');
  if (coords.length < 2) throw new Error('Aucune trace trouvée dans ce fichier GPX.');
  // Points trop proches (< 5 m) retirés : traces enregistrées à la seconde.
  const thin = [coords[0]];
  for (const c of coords.slice(1)) if (haversine(thin[thin.length - 1], c) >= 5) thin.push(c);
  if (thin[thin.length - 1] !== coords[coords.length - 1]) thin.push(coords[coords.length - 1]);
  const nameMatch = src.match(/<(?:trk|rte|metadata)>[\s\S]*?<name>([\s\S]*?)<\/name>/i);
  const name = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/&(amp|lt|gt|quot|apos);/g, (_, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[e]).trim().slice(0, 80) || null : null;
  return { name, coords: thin };
}

/* ---------- Export ---------- */

const xml = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]);

/** Fichier GPX (trace) importable dans Garmin Connect, Wahoo, Komoot, Strava… */
export function toGPX(name, coords) {
  const pts = coords
    .map(([lat, lon, ele]) => `<trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}">${Number.isFinite(ele) ? `<ele>${ele.toFixed(1)}</ele>` : ''}</trkpt>`)
    .join('\n      ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Mon Dashboard" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${xml(name)}</name></metadata>
  <trk>
    <name>${xml(name)}</name>
    <type>cycling</type>
    <trkseg>
      ${pts}
    </trkseg>
  </trk>
</gpx>
`;
}
