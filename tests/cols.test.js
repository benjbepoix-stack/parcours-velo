import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, SECTORS, TOP10, difficulty, category } from '../js/data/cols.js';

// Emprise approximative de chaque secteur [latMin, latMax, lonMin, lonMax]
const BOX = {
  'alpes-nord': [44.8, 46.5, 5.2, 7.2],
  'alpes-sud': [43.6, 45.1, 5.0, 7.6],
  suisse: [45.8, 47.1, 6.8, 10.5],
  italie: [44.2, 46.8, 6.8, 13.2],
  jura: [45.6, 47.4, 5.6, 7.7],
  vosges: [47.6, 48.6, 6.5, 7.5],
  pyrenees: [42.4, 43.2, -1.0, 2.5]
};

test('chaque col est complet et cohérent', () => {
  const ids = new Set();
  for (const c of COLS) {
    assert.ok(!ids.has(c.id), `id en double : ${c.id}`);
    ids.add(c.id);
    assert.ok(SECTORS.some(s => s.id === c.sector), `${c.id} : secteur inconnu`);
    assert.ok(c.alt > 400 && c.alt < 2900, `${c.id} : altitude ${c.alt}`);
    assert.ok(c.km > 3 && c.km < 50, `${c.id} : longueur ${c.km}`);
    assert.ok(c.avg > 2.5 && c.avg < 13, `${c.id} : pente moyenne ${c.avg}`);
    assert.ok(c.max >= c.avg, `${c.id} : pente maxi < moyenne`);
    assert.ok(c.gain < c.alt, `${c.id} : dénivelé ${c.gain} > altitude ${c.alt}`);
    const [a, b, c1, d] = BOX[c.sector];
    assert.ok(c.lat >= a && c.lat <= b && c.lon >= c1 && c.lon <= d, `${c.id} : coordonnées hors secteur (${c.lat}, ${c.lon})`);
    assert.ok(c.from && c.area && c.name, `${c.id} : champs manquants`);
  }
  assert.ok(COLS.length >= 140, `${COLS.length} cols`);
});

test('chaque secteur a des cols', () => {
  for (const s of SECTORS) assert.ok(COLS.filter(c => c.sector === s.id).length >= 5, s.id);
});

test('top 10 : dix cols distincts et existants, plusieurs secteurs', () => {
  assert.equal(TOP10.length, 10);
  assert.ok(TOP10.every(t => t.col && t.why), 'col introuvable dans le top 10');
  assert.equal(new Set(TOP10.map(t => t.col.id)).size, 10);
  assert.ok(new Set(TOP10.map(t => t.col.sector)).size >= 5);
});

test('catégories : ordre de grandeur attendu', () => {
  const by = id => COLS.find(c => c.id === id);
  assert.equal(category(by('ventoux-bedoin')), 'HC');
  assert.equal(category(by('mortirolo')), 'HC');
  assert.equal(category(by('eze')), '4');
  assert.ok(difficulty(by('alpe-huez')) > difficulty(by('ballon-alsace')));
});
