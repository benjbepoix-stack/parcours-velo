/*
 * Lecture seule des dernières valeurs de poids et de FTP enregistrées dans
 * l'app Carnet (Mon tableau de bord), onglet Mesures — via sa base Firebase
 * Realtime Database partagée, sans mot de passe (même choix assumé que les
 * autres liaisons entre ces apps : carnet-sync.js envoie les courses, ici on
 * ne fait que lire). Ne concerne que les personnes qui utilisent aussi
 * Carnet : la liaison reste un réglage local, désactivé par défaut, à
 * activer soi-même dans l'onglet Profil (voir #carnetSyncToggle dans app.js).
 */
const DB_URL = 'https://dashboard---projet-default-rtdb.europe-west1.firebasedatabase.app';

/** Carnet trie déjà chaque série par date croissante avant de l'enregistrer : le dernier élément est donc le plus récent. */
function lastValue(list) {
  const rows = Array.isArray(list) ? list : list && typeof list === 'object' ? Object.values(list) : [];
  const valid = rows.filter(r => r && typeof r.date === 'string' && Number.isFinite(r.value));
  if (!valid.length) return null;
  valid.sort((a, b) => a.date.localeCompare(b.date));
  return valid[valid.length - 1];
}

/**
 * @returns {Promise<{weight: {value:number, date:string}|null, ftp: {value:number, date:string}|null}>}
 * @throws si Carnet est injoignable (hors ligne, règles non déployées…)
 */
export async function fetchCarnetMetrics() {
  const [weightRes, ftpRes] = await Promise.all([fetch(`${DB_URL}/app/bodyMetrics/weight.json`), fetch(`${DB_URL}/app/bodyMetrics/ftp.json`)]);
  if (!weightRes.ok || !ftpRes.ok) throw new Error(`Carnet indisponible (${weightRes.status}/${ftpRes.status})`);
  const [weightData, ftpData] = await Promise.all([weightRes.json(), ftpRes.json()]);
  return { weight: lastValue(weightData), ftp: lastValue(ftpData) };
}
