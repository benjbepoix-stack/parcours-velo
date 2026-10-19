/*
 * Liaison avec l'app Cadence : envoi des courses validées (et donc dans le planning de Carnet, qui
 * partage le même nœud) et lecture des dernières valeurs de FTP et de poids.
 *
 * Cadence range ses courses dans users/<uid>/carnet/races du projet Firebase commun
 * (même compte e-mail / mot de passe que Mon Garage, Ma Maison, Carnet, Cadence et Mon budget).
 * - La session Firebase est partagée par toutes les apps servies à la même adresse
 *   (benjbepoix-stack.github.io) : déjà connecté dans Cadence = connecté ici. Une app installée
 *   sur l'écran d'accueil de l'iPhone a son propre stockage : une connexion, une seule fois.
 * - L'ajout passe par une transaction sur la seule tranche `races` : les autres données
 *   de Cadence et de Carnet ne sont jamais réécrites, et une course déjà présente (même nom,
 *   même date) n'est pas dupliquée.
 * - Tant que le nœud du compte n'a pas été migré par Cadence ou Carnet (marqueur `migrated`),
 *   rien n'est écrit : on risquerait d'empêcher la reprise des anciennes courses.
 * Le SDK est chargé à la demande : sans réseau, le reste de l'app fonctionne normalement.
 */
const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
/* Valeurs publiques par conception (comme dans Cadence) : les données sont protégées par le compte. */
const CONFIG = {
  apiKey: 'AIzaSyAdtuzUxcc7JIxtYDXh3dPmrXMP3HePBT4',
  authDomain: 'test-e27e9.firebaseapp.com',
  databaseURL: 'https://test-e27e9-default-rtdb.europe-west1.firebasedatabase.app/',
  projectId: 'test-e27e9',
  storageBucket: 'test-e27e9.firebasestorage.app',
  messagingSenderId: '435431704932',
  appId: '1:435431704932:web:abc6928490d225a1021271'
};

let loading = null;

/** Charge le SDK et attend la première réponse du service de connexion (session déjà ouverte ou non). */
function load() {
  if (!loading) {
    loading = (async () => {
      const [appMod, authMod, dbMod] = await Promise.all([
        import(`${SDK}/firebase-app.js`),
        import(`${SDK}/firebase-auth.js`),
        import(`${SDK}/firebase-database.js`)
      ]).catch(() => {
        throw new Error('hors ligne ? Réessayez avec du réseau.');
      });
      // Application « par défaut », comme Cadence : la session enregistrée par Cadence est reprise telle quelle.
      const app = appMod.getApps()[0] || appMod.initializeApp(CONFIG);
      const auth = authMod.getAuth(app);
      await authMod.setPersistence(auth, authMod.browserLocalPersistence).catch(() => {});
      await auth.authStateReady();
      return { authMod, dbMod, auth, db: dbMod.getDatabase(app) };
    })();
    loading.catch(() => {
      loading = null;
    });
  }
  return loading;
}

/** @returns {Promise<string|null>} e-mail du compte connecté, ou null */
export async function cadenceAccount() {
  const { auth } = await load();
  return auth.currentUser ? auth.currentUser.email || 'Compte connecté' : null;
}

export async function signInCadence(email, password) {
  const { authMod, auth } = await load();
  try {
    await authMod.signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function signOutCadence() {
  const { authMod, auth } = await load();
  await authMod.signOut(auth);
}

function authMessage(error) {
  const code = String(error?.code || '');
  if (/invalid-credential|wrong-password|user-not-found|invalid-email/.test(code)) return 'E-mail ou mot de passe incorrect.';
  if (/too-many-requests/.test(code)) return 'Trop d’essais : réessayez dans quelques minutes.';
  if (/network/.test(code)) return 'Connexion impossible : vérifiez le réseau.';
  return error?.message || 'Connexion impossible.';
}

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const toList = v => (Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : []).filter(Boolean);
const same = (a, b) => String(a.name || '').trim().toLowerCase() === String(b.name || '').trim().toLowerCase() && a.date === b.date;

/**
 * Ajoute une course au planning de Cadence.
 * @param {{name:string, sport?:string, date:string, location?:string}} race
 * @returns {Promise<'added'|'exists'>}
 */
export async function addRaceToCadence(race) {
  const { dbMod, auth, db } = await load();
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('Connectez-vous à votre compte Cadence (Profil).'), { code: 'no-account' });
  const root = `users/${user.uid}/carnet`;
  const migrated = await dbMod.get(dbMod.ref(db, `${root}/migrated`));
  if (!migrated.exists()) throw new Error('Ouvrez Cadence une fois pour préparer votre compte, puis réessayez.');
  const payload = {
    id: makeId(),
    name: String(race.name || '').slice(0, 100),
    sport: race.sport || 'Cyclisme',
    date: race.date,
    time: '',
    location: String(race.location || '').slice(0, 100),
    distance: '',
    elevation: '',
    price: '',
    target: '',
    notes: '',
    resultTime: '',
    resultRank: '',
    resultDistance: ''
  };
  let outcome = 'added';
  await dbMod.runTransaction(dbMod.ref(db, `${root}/races`), current => {
    const list = toList(current);
    if (list.some(r => same(r, payload))) {
      outcome = 'exists';
      return list;
    }
    outcome = 'added';
    return [...list, payload];
  });
  return outcome;
}

/** Champs que l'on remplit soi-même dans Cadence : une course qui en a ne doit pas disparaître. */
const USER_FIELDS = ['time', 'distance', 'elevation', 'price', 'target', 'notes', 'resultTime', 'resultRank', 'resultDistance'];

/**
 * Retire une course du planning de Cadence (même nom, une des dates données).
 * Une course complétée dans Cadence (objectif, notes, résultat…) est laissée en place.
 * @param {{name:string, dates:string[]}} race
 * @returns {Promise<'removed'|'kept'|'missing'>}
 */
export async function removeRaceFromCadence(race) {
  const { dbMod, auth, db } = await load();
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('Connectez-vous à votre compte Cadence (Profil).'), { code: 'no-account' });
  const dates = new Set(race.dates.filter(Boolean));
  const match = r => dates.has(r.date) && same(r, { name: race.name, date: r.date });
  let outcome = 'missing';
  await dbMod.runTransaction(dbMod.ref(db, `users/${user.uid}/carnet/races`), current => {
    const list = toList(current);
    const found = list.filter(match);
    if (!found.length) {
      outcome = 'missing';
      return list;
    }
    const removable = found.filter(r => !USER_FIELDS.some(k => String(r[k] ?? '').trim()));
    outcome = removable.length ? 'removed' : 'kept';
    return list.filter(r => !removable.includes(r));
  });
  return outcome;
}

/** Dernier relevé valide d'une série de mesures de Cadence ({date, value}). */
function lastValue(list) {
  const rows = toList(list)
    .map(r => ({ date: r.date, value: Number(String(r.value ?? '').replace(',', '.')) }))
    .filter(r => typeof r.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.value) && r.value > 0);
  if (!rows.length) return null;
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows[rows.length - 1];
}

/**
 * Lecture seule des dernières valeurs de FTP et de poids enregistrées dans Cadence (onglet Suivi).
 * @returns {Promise<{weight: {value:number, date:string}|null, ftp: {value:number, date:string}|null}>}
 * @throws code 'no-account' sans compte connecté, ou si Cadence est injoignable
 */
export async function fetchCadenceMetrics() {
  const { dbMod, auth, db } = await load();
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('Connectez-vous à votre compte Cadence ci-dessous.'), { code: 'no-account' });
  const snap = await dbMod.get(dbMod.ref(db, `users/${user.uid}/carnet/bodyMetrics`));
  const m = snap.exists() ? snap.val() || {} : {};
  return { weight: lastValue(m.weight), ftp: lastValue(m.ftp) };
}
