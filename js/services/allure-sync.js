/*
 * Envoi d'une course vers l'app Allure (et donc le planning de Carnet, qui partage le même nœud).
 *
 * Allure range ses courses dans users/<uid>/carnet/races du projet Firebase commun
 * (même compte e-mail / mot de passe que Mon Garage, Ma Maison, Carnet, Allure et Mon budget).
 * - La session Firebase est partagée par toutes les apps servies à la même adresse
 *   (benjbepoix-stack.github.io) : déjà connecté dans Allure = connecté ici. Une app installée
 *   sur l'écran d'accueil de l'iPhone a son propre stockage : une connexion, une seule fois.
 * - L'ajout passe par une transaction sur la seule tranche `races` : les autres données
 *   d'Allure et de Carnet ne sont jamais réécrites, et une course déjà présente (même nom,
 *   même date) n'est pas dupliquée.
 * - Tant que le nœud du compte n'a pas été migré par Allure ou Carnet (marqueur `migrated`),
 *   rien n'est écrit : on risquerait d'empêcher la reprise des anciennes courses.
 * Le SDK est chargé à la demande : sans réseau, le reste de l'app fonctionne normalement.
 */
const SDK = 'https://www.gstatic.com/firebasejs/12.19.0';
/* Valeurs publiques par conception (comme dans Allure) : les données sont protégées par le compte. */
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
      // Application « par défaut », comme Allure : la session enregistrée par Allure est reprise telle quelle.
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
export async function allureAccount() {
  const { auth } = await load();
  return auth.currentUser ? auth.currentUser.email || 'Compte connecté' : null;
}

export async function signInAllure(email, password) {
  const { authMod, auth } = await load();
  try {
    await authMod.signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(authMessage(error));
  }
}

export async function signOutAllure() {
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
 * Ajoute une course au planning d'Allure.
 * @param {{name:string, sport?:string, date:string, location?:string}} race
 * @returns {Promise<'added'|'exists'>}
 */
export async function addRaceToAllure(race) {
  const { dbMod, auth, db } = await load();
  const user = auth.currentUser;
  if (!user) throw Object.assign(new Error('Connectez-vous à votre compte Allure (Profil).'), { code: 'no-account' });
  const root = `users/${user.uid}/carnet`;
  const migrated = await dbMod.get(dbMod.ref(db, `${root}/migrated`));
  if (!migrated.exists()) throw new Error('Ouvrez Allure une fois pour préparer votre compte, puis réessayez.');
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
