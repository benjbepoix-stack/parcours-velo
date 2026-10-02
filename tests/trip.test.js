import test from 'node:test';
import assert from 'node:assert/strict';
import { splitStages, clampDays, MIN_DAYS, MAX_DAYS } from '../js/core/trip.js';

/** Piste synthétique rectiligne de `km` km avec une élévation en dents de scie. */
function straightTrack(km, points = 400) {
  const coords = [];
  for (let i = 0; i <= points; i++) {
    const lat = 47 + (i / points) * (km / 111); // ~111 km par degré de latitude
    const ele = 200 + (i % 20) * 15; // montées/descentes répétées
    coords.push([lat, 6, ele]);
  }
  return coords;
}

test('clampDays reste dans les bornes', () => {
  assert.equal(clampDays(0), MIN_DAYS);
  assert.equal(clampDays(1), MIN_DAYS);
  assert.equal(clampDays(1000), MAX_DAYS);
  assert.equal(clampDays(4.4), 4);
  assert.equal(clampDays(NaN), MIN_DAYS);
});

test('splitStages découpe en étapes contiguës de distance égale', () => {
  const coords = straightTrack(300);
  const stages = splitStages(coords, 3);
  assert.equal(stages.length, 3);
  const total = stages.reduce((s, d) => s + d.meters, 0);
  assert.ok(Math.abs(total - 300000) < 1000, `distance totale ${total}`);
  // Chaque étape doit être proche de 100 km (± 5 % sur une trace rectiligne).
  stages.forEach(s => assert.ok(Math.abs(s.meters - 100000) / 100000 < 0.05, `étape ${s.meters}`));
  // Les étapes s'enchaînent : la fin d'une étape est le début de la suivante.
  for (let i = 1; i < stages.length; i++) {
    assert.deepEqual(stages[i].coords[0], stages[i - 1].coords[stages[i - 1].coords.length - 1]);
  }
});

test('splitStages calcule un dénivelé positif par étape', () => {
  const coords = straightTrack(150);
  const stages = splitStages(coords, 2);
  stages.forEach(s => assert.ok(s.ascent > 0, `dénivelé étape ${s.ascent}`));
});

test('splitStages respecte le nombre de jours demandé, bornes incluses', () => {
  const coords = straightTrack(500);
  assert.equal(splitStages(coords, 1).length, MIN_DAYS);
  assert.equal(splitStages(coords, 20).length, MAX_DAYS);
  assert.equal(splitStages(coords, 5).length, 5);
});
