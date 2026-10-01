import test from 'node:test';
import assert from 'node:assert/strict';
import { readBackup } from '../js/services/store.js';

const backup = data => JSON.stringify({ app: 'echappee', version: 1, exportedAt: '2026-10-01T20:00:00.000Z', data });

test('readBackup résume une sauvegarde valide', () => {
  const { data, summary } = readBackup(backup({
    pv_profile: JSON.stringify({ ftp: 280, weight: 70, bike: 8, cda: 0.32 }),
    pv_saved: JSON.stringify([{ id: 'a', coords: [[1, 2], [3, 4]] }]),
    pv_cols_done: JSON.stringify({ galibier: 1, izoard: 2 }),
    pv_theme: 'light',
    autre_cle: 'ignorée'
  }));
  assert.deepEqual(Object.keys(data).sort(), ['pv_cols_done', 'pv_profile', 'pv_saved', 'pv_theme']);
  assert.deepEqual(summary, { favoris: 1, cols: 2, profil: true, exportedAt: '2026-10-01T20:00:00.000Z' });
});

test('readBackup refuse les fichiers étrangers, vides ou endommagés', () => {
  assert.throws(() => readBackup('pas du json'), /pas une sauvegarde/);
  assert.throws(() => readBackup(JSON.stringify({ app: 'autre', data: {} })), /pas une sauvegarde/);
  assert.throws(() => readBackup(backup({})), /vide/);
  assert.throws(() => readBackup(backup({ pv_profile: '{cassé' })), /endommagée/);
});
