import test from 'node:test';
import assert from 'node:assert/strict';
import { development, speedKmh, gearTable, tirePressure } from '../js/core/tools.js';

test('development et vitesse : 50×17 en 700×28 à 90 tr/min', () => {
  const dev = development(50, 17, 2136);
  assert.ok(Math.abs(dev - 6.282) < 0.01);
  assert.ok(Math.abs(speedKmh(dev, 90) - 33.9) < 0.1);
});

test('gearTable marque les croisements de chaîne en double plateau', () => {
  const cogs = [11, 13, 15, 17, 19, 21];
  const t = gearTable([50, 34], cogs, 2136, 90);
  assert.equal(t.length, cogs.length);
  assert.equal(t[0][1].cross, true); // 34×11
  assert.equal(t[5][0].cross, true); // 50×21
  assert.equal(t[2][0].cross, false);
  assert.equal(gearTable([42], cogs, 2136, 90)[0][0].cross, false);
});

test('tirePressure : plus large, plus lourd, gravel et tubeless vont dans le bon sens', () => {
  const road = tirePressure({ mass: 81, width: 28 });
  assert.ok(road.rear > road.front);
  assert.ok(road.rear > 5 && road.rear < 6);
  assert.ok(tirePressure({ mass: 81, width: 32 }).rear < road.rear);
  assert.ok(tirePressure({ mass: 95, width: 28 }).rear > road.rear);
  assert.ok(tirePressure({ mass: 81, width: 28, surface: 'gravel' }).rear < road.rear);
  assert.ok(tirePressure({ mass: 81, width: 28, tubeless: true }).rear < road.rear);
  assert.equal(tirePressure({ mass: 0, width: 28 }), null);
});

test('tirePressure reste proche des résultats publiés de Silca', () => {
  const road = tirePressure({ mass: 78, width: 30, surface: 'rough' });
  assert.ok(Math.abs(road.rearPsi - 70) < 3, `arrière ${road.rearPsi}`);
  assert.ok(Math.abs(road.frontPsi - 68) < 3, `avant ${road.frontPsi}`);
  const gravel = tirePressure({ mass: 72.6, width: 42, surface: 'gravel' });
  assert.ok(Math.abs(gravel.rearPsi - 40) < 4, `gravel ${gravel.rearPsi}`);
});

test('tirePressure plafonne à 5 bar sur jante hookless', () => {
  const p = tirePressure({ mass: 110, width: 25, hookless: true });
  assert.equal(p.rear, 5);
  assert.equal(p.capped, true);
});
