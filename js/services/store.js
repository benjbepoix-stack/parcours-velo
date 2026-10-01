/* Persistance locale : profil, préférences, favoris. Tolère un stockage indisponible. */
const KEYS = { profile: 'pv_profile', prefs: 'pv_prefs', saved: 'pv_saved', theme: 'pv_theme' };

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_PROFILE = { ftp: 230, weight: 72, bike: 9, cda: 0.36 };

export function loadProfile() {
  const p = { ...DEFAULT_PROFILE, ...read(KEYS.profile, {}) };
  const ok = (v, lo, hi) => Number.isFinite(v) && v >= lo && v <= hi;
  if (!ok(p.ftp, 60, 600)) p.ftp = DEFAULT_PROFILE.ftp;
  if (!ok(p.weight, 30, 200)) p.weight = DEFAULT_PROFILE.weight;
  if (!ok(p.bike, 4, 30)) p.bike = DEFAULT_PROFILE.bike;
  if (!ok(p.cda, 0.2, 0.6)) p.cda = DEFAULT_PROFILE.cda;
  p.custom = !!read(KEYS.profile, null);
  return p;
}
export const saveProfile = p => write(KEYS.profile, { ftp: p.ftp, weight: p.weight, bike: p.bike, cda: p.cda });

export const loadPrefs = defaults => ({ ...defaults, ...read(KEYS.prefs, {}) });
export const savePrefs = prefs => write(KEYS.prefs, prefs);

export const loadSaved = () => {
  const list = read(KEYS.saved, []);
  return Array.isArray(list) ? list.filter(r => r && Array.isArray(r.coords) && r.coords.length > 1) : [];
};
export const storeSaved = list => write(KEYS.saved, list);

export const loadTheme = () => {
  try {
    return localStorage.getItem(KEYS.theme);
  } catch {
    return null;
  }
};
export const saveTheme = t => write(KEYS.theme, t);

/* Cols gravis : { idDuCol: horodatage } */
export const loadDone = () => {
  const done = read('pv_cols_done', {});
  return done && typeof done === 'object' && !Array.isArray(done) ? done : {};
};
export const saveDone = done => write('pv_cols_done', done);
