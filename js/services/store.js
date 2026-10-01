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

/* ---------- Sauvegarde / restauration (fichier JSON) ---------- */
const BACKUP_KEYS = ['pv_profile', 'pv_prefs', 'pv_saved', 'pv_cols_done', 'pv_theme'];

/** Toutes les données de l'app, telles qu'enregistrées (texte brut par clé). */
export function exportBackup() {
  const data = {};
  for (const key of BACKUP_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) data[key] = raw;
    } catch {
      /* stockage indisponible : clé ignorée */
    }
  }
  return { app: 'echappee', version: 1, exportedAt: new Date().toISOString(), data };
}

/**
 * Vérifie un fichier de sauvegarde et résume son contenu.
 * @returns {{data:Record<string,string>, summary:{favoris:number, cols:number, profil:boolean, exportedAt:string|null}}}
 */
export function readBackup(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Ce fichier n’est pas une sauvegarde Échappée.');
  }
  if (!json || json.app !== 'echappee' || typeof json.data !== 'object' || !json.data) throw new Error('Ce fichier n’est pas une sauvegarde Échappée.');
  const data = {};
  for (const key of BACKUP_KEYS) {
    const raw = json.data[key];
    if (typeof raw !== 'string') continue;
    if (key !== 'pv_theme') {
      try {
        JSON.parse(raw);
      } catch {
        throw new Error('Sauvegarde endommagée : restauration annulée.');
      }
    }
    data[key] = raw;
  }
  if (!Object.keys(data).length) throw new Error('Cette sauvegarde est vide.');
  const parse = (k, d) => {
    try {
      return data[k] ? JSON.parse(data[k]) : d;
    } catch {
      return d;
    }
  };
  const saved = parse('pv_saved', []);
  const done = parse('pv_cols_done', {});
  return {
    data,
    summary: {
      favoris: Array.isArray(saved) ? saved.length : 0,
      cols: done && typeof done === 'object' ? Object.keys(done).length : 0,
      profil: !!data.pv_profile,
      exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : null
    }
  };
}

/** Remplace les données actuelles par celles de la sauvegarde. */
export function applyBackup(data) {
  for (const key of BACKUP_KEYS) {
    if (!(key in data)) continue;
    if (!write(key, data[key])) return false;
  }
  return true;
}
