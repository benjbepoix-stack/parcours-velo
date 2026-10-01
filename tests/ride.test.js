import test from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../js/core/ride.js';

const START = [47.2378, 6.0241];
const kmh = v => v * 3.6;

test('destination / haversine / bearing sont cohérents', () => {
  const p = R.destination(START, 90, 10000);
  assert.ok(Math.abs(R.haversine(START, p) - 10000) < 1);
  assert.ok(Math.abs(R.bearing(START, p) - 90) < 0.2);
});

test('la boucle part dans le cap demandé et revient au départ', () => {
  const wps = R.loopWaypoints(START, 315, 80);
  assert.deepEqual(wps[0], START);
  assert.deepEqual(wps[wps.length - 1], START);
  // Le point le plus éloigné est dans la direction du cap (±45°).
  const far = wps.reduce((a, b) => (R.haversine(START, b) > R.haversine(START, a) ? b : a));
  const diff = Math.abs(((R.bearing(START, far) - 315 + 540) % 360) - 180);
  assert.ok(diff < 45, `écart de cap ${diff}`);
});

test('modèle de vitesse : ordres de grandeur réalistes', () => {
  const flat = kmh(R.speedFor(200, 0, 0, 81));
  assert.ok(flat > 29 && flat < 36, `plat ${flat}`);
  assert.ok(kmh(R.speedFor(200, 0, 20 / 3.6, 81)) < flat - 5, 'le vent de face ralentit');
  assert.ok(kmh(R.speedFor(200, 0, -20 / 3.6, 81)) > flat + 5, 'le vent de dos accélère');
  const climb = kmh(R.speedFor(250, 0.08, 0, 80));
  assert.ok(climb > 9 && climb < 14, `montée 8 % ${climb}`);
  assert.ok(kmh(R.speedFor(200, -0.1, 0, 81)) <= 50.5, 'descente plafonnée');
  assert.ok(R.speedFor(200, 0, 0, 81, 0.32) > R.speedFor(200, 0, 0, 81, 0.4), 'position plus aéro = plus rapide');
});

test('windAt interpole la direction par le chemin le plus court', () => {
  const w = R.windAt([{ t: 0, speed: 10, dir: 350, gust: 0 }, { t: 10, speed: 20, dir: 10, gust: 0 }], 5);
  assert.equal(Math.round(w.speed), 15);
  assert.ok(w.dir < 1 || w.dir > 359);
});

function outAndBack(headingOut) {
  const coords = [];
  for (let i = 0; i <= 100; i++) coords.push([...R.destination(START, headingOut, i * 200), 300]);
  const side = R.destination(START, headingOut + 90, 400);
  for (let i = 100; i >= 0; i--) coords.push([...R.destination(side, headingOut, i * 200), 300]);
  return coords;
}
const T0 = Date.UTC(2026, 9, 1, 8);
const WIND_N = [{ t: T0 - 3600e3, speed: 25, dir: 0, gust: 35 }, { t: T0 + 8 * 3600e3, speed: 25, dir: 0, gust: 35 }];

test('simulation : aller face au vent, retour vent dans le dos', () => {
  const sim = R.simulate(outAndBack(0), { power: 200, mass: 81, startTime: T0, wind: WIND_N });
  const half = R.splitHeadwind(sim);
  assert.ok(half.first > 10 && half.second < -10, JSON.stringify(half));
  assert.ok(sim.seconds > sim.secondsNoWind, 'un aller-retour venté est plus lent');
  const shares = R.windShares(sim);
  assert.ok(Math.abs(shares.head - 0.5) < 0.05 && Math.abs(shares.tail - 0.5) < 0.05);
});

test('le score préfère partir face au vent', () => {
  const evaluate = heading => {
    const coords = outAndBack(heading);
    const sim = R.simulate(coords, { power: 200, mass: 81, startTime: T0, wind: WIND_N });
    const r = { meters: sim.meters, ascent: 0, sim, overlap: 0, mix: { major: 0, medium: 0, unpaved: 0 } };
    return R.scoreRoute(r, { km: sim.meters / 1000, ascent: null }).total;
  };
  assert.ok(evaluate(0) < evaluate(180), 'partir au nord (face au vent du nord) doit mieux noter');
});

test('overlapRatio détecte un vrai aller-retour sur la même route', () => {
  const coords = [];
  for (let i = 0; i <= 100; i++) coords.push(R.destination(START, 45, i * 200));
  for (let i = 100; i >= 0; i--) coords.push(R.destination(START, 45, i * 200));
  assert.ok(R.overlapRatio(coords) > 0.35);
});

test('roadMix lit les tags BRouter', () => {
  const head = ['Longitude', 'Latitude', 'Elevation', 'Distance', 'CostPerKm', 'ElevCost', 'TurnCost', 'NodeCost', 'InitialCost', 'WayTags', 'NodeTags', 'Time', 'Energy'];
  const row = (d, tags) => ['0', '0', '0', String(d), '', '', '', '', '', tags, '', '', ''];
  const mix = R.roadMix([head, row(1000, 'highway=tertiary surface=asphalt route_bicycle_rcn=yes'), row(500, 'highway=primary'), row(500, 'highway=track tracktype=grade2')]);
  assert.equal(mix.quiet, 0.5);
  assert.equal(mix.major, 0.25);
  assert.equal(mix.unpaved, 0.25);
  assert.equal(mix.cycleRoute, 0.5);
});

test('compareStarts trouve le créneau où le vent est favorable', () => {
  // Vent du nord le matin, du sud l'après-midi : partir au nord est mieux le matin.
  const wind = [
    { t: T0 - 3600e3, speed: 25, dir: 0, gust: 30 },
    { t: T0 + 2 * 3600e3, speed: 25, dir: 0, gust: 30 },
    { t: T0 + 5 * 3600e3, speed: 25, dir: 180, gust: 30 },
    { t: T0 + 12 * 3600e3, speed: 25, dir: 180, gust: 30 }
  ];
  const coords = outAndBack(0);
  const [morning, afternoon] = R.compareStarts(coords, { power: 200, mass: 81, wind }, [T0, T0 + 6 * 3600e3]);
  assert.ok(Number.isFinite(morning.seconds) && Number.isFinite(afternoon.seconds));
  assert.ok(morning.half.first > 0 && afternoon.half.first < 0);
});

test('simplify réduit le tracé en gardant les extrémités', () => {
  const coords = outAndBack(30);
  const s = R.simplify(coords, 10);
  assert.ok(s.length < coords.length / 10);
  assert.deepEqual(s[0], coords[0]);
  assert.deepEqual(s[s.length - 1], coords[coords.length - 1]);
});

test('toGPX produit un XML échappé avec altitude', () => {
  const gpx = R.toGPX('Boucle <test> & co', [[47, 6, 250.4], [47.001, 6.001, null]]);
  assert.match(gpx, /<name>Boucle &lt;test&gt; &amp; co<\/name>/);
  assert.match(gpx, /<ele>250.4<\/ele>/);
  assert.equal((gpx.match(/<trkpt /g) || []).length, 2);
});

/* ---------- Nettoyage des allers-retours ---------- */
function squareLoop(sideM, step = 50) {
  const pts = [];
  let p = START;
  for (const h of [0, 90, 180, 270]) {
    for (let k = 0; k < sideM / step; k++) {
      pts.push([...p, 300]);
      p = R.destination(p, h, step);
    }
  }
  pts.push([...START, 300]);
  return pts;
}

test('removeSpurs supprime une impasse aller-retour au milieu de la boucle', () => {
  const loop = squareLoop(5000);
  const k = Math.floor(loop.length * 0.4); // milieu du 2e côté
  const base = loop[k];
  const spur = [];
  for (let d = 50; d <= 1200; d += 50) spur.push([...R.destination(base, 0, d), 300]); // vers le nord (côté gauche)
  const back = spur.slice(0, -1).reverse().map(([a, b]) => [a + 0.00002, b + 0.00002, 300]);
  const withSpur = [...loop.slice(0, k + 1), ...spur, ...back, ...loop.slice(k)];
  const before = R.cumulative(withSpur).at(-1);
  const { coords, spurs, removed } = R.removeSpurs(withSpur);
  assert.equal(spurs, 1);
  assert.ok(Math.abs(removed - 2400) < 200, `retiré ${removed}`);
  const after = R.cumulative(coords).at(-1);
  assert.ok(Math.abs(after - 20000) < 300, `longueur ${after} (avant ${before})`);
});

test('removeSpurs supprime une petite boucle « sucette »', () => {
  const loop = squareLoop(5000);
  const k = Math.floor(loop.length * 0.6);
  const base = loop[k];
  const lolly = [];
  let p = base;
  for (const h of [200, 290, 20, 110]) for (let s = 0; s < 10; s++) { p = R.destination(p, h, 50); lolly.push([...p, 300]); }
  lolly[lolly.length - 1] = [...base];
  const { spurs } = R.removeSpurs([...loop.slice(0, k + 1), ...lolly, ...loop.slice(k + 1)]);
  assert.equal(spurs, 1);
});

test('removeSpurs garde une boucle propre et des lacets', () => {
  assert.equal(R.removeSpurs(squareLoop(5000)).spurs, 0);
  // Lacets : allers-retours décalés de 60 m qui montent (le tracé continue).
  const zig = [];
  let p = START;
  for (let leg = 0; leg < 8; leg++) {
    for (let s = 0; s < 8; s++) { zig.push([...p, 300 + leg * 20]); p = R.destination(p, leg % 2 ? 270 : 90, 50); }
    for (let s = 0; s < 2; s++) { zig.push([...p, 300 + leg * 20]); p = R.destination(p, 0, 30); }
  }
  assert.equal(R.removeSpurs(zig).spurs, 0);
});

test('cleanRoute recalcule distance et messages', () => {
  const loop = squareLoop(3000);
  const k = 30;
  const base = loop[k];
  const spur = [1, 2, 3, 4, 5, 6].map(i => [...R.destination(base, 270, i * 100), 300]);
  const coords = [...loop.slice(0, k + 1), ...spur, ...spur.slice(0, -1).reverse(), ...loop.slice(k)];
  const head = ['Longitude', 'Latitude', 'Elevation', 'Distance', 'CostPerKm', 'ElevCost', 'TurnCost', 'NodeCost', 'InitialCost', 'WayTags', 'NodeTags', 'Time', 'Energy'];
  const tip = spur.at(-1);
  const messages = [head, [String(Math.round(tip[1] * 1e6)), String(Math.round(tip[0] * 1e6)), '0', '600', '', '', '', '', '', 'highway=track', '', '', ''], ['0', '0', '0', '12000', '', '', '', '', '', 'highway=tertiary', '', '', '']];
  const res = R.cleanRoute({ coords, meters: 13200, ascent: 0, messages });
  assert.equal(res.spurs, 1);
  assert.ok(Math.abs(res.meters - 12000) < 200);
  assert.equal(res.messages.length, 2, 'le tronçon de piste est retiré');
});

/* ---------- Boucles par points de passage ---------- */
test('detourPoint allonge une étape de la longueur voulue', () => {
  const a = START;
  const b = R.destination(START, 90, 10000);
  for (const side of [90, -90]) {
    const p = R.detourPoint(a, b, 6000, side);
    const added = R.haversine(a, p) + R.haversine(p, b) - R.haversine(a, b);
    assert.ok(Math.abs(added - 6000) < 60, `ajout ${added}`);
    // côté droit d'une étape vers l'est = sud
    assert.equal(p[0] < START[0], side === 90);
  }
});

test('signedArea distingue les deux sens de rotation', () => {
  const pts = [START, R.destination(START, 0, 3000), R.destination(START, 45, 4000), R.destination(START, 90, 3000), START];
  assert.ok(R.signedArea(pts) < 0, 'nord puis est = sens des aiguilles');
  assert.ok(R.signedArea([...pts].reverse()) > 0);
});

test('scoreRoute en aller simple : pas de bonus tactique ni de cible de distance', () => {
  const coords = outAndBack(0).slice(0, 101);
  const sim = R.simulate(coords, { power: 200, mass: 81, startTime: T0, wind: WIND_N });
  const r = { meters: sim.meters, ascent: 0, sim, overlap: 0, mix: { major: 0, medium: 0, unpaved: 0 } };
  const s = R.scoreRoute(r, { km: null, ascent: null }, { loop: false });
  assert.equal(s.parts.tactic, 0);
  assert.equal(s.parts.distance, 0);
});
