/* Petites phrases affichées pendant le calcul des boucles, à côté de l'étape réelle.
   Purement décoratives (masquées aux lecteurs d'écran : l'étape réelle est annoncée). */
import { replay } from './motion.js';

export const QUIPS = [
  'Gonflage des pneus…',
  'On demande le sens du vent aux éoliennes…',
  'On évite les nationales et les camions…',
  'Recherche d’une boulangerie à mi-parcours…',
  'On négocie avec le vent de face…',
  'Le dérailleur cherche le bon pignon…',
  'On repère les cols pour la photo…',
  'Les mollets chauffent…',
  'Chasse aux petites routes tranquilles…',
  'On s’abrite dans les roues…',
  'Pas de pavés, promis…',
  'On garde le vent dans le dos pour le retour…',
  'Remplissage des bidons…',
  'Le peloton est prévenu…'
];

const EVERY = 2600;
let timer = null;

/** Mélange une copie de la liste (Fisher-Yates). */
function shuffled(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Fait défiler les phrases dans `el` jusqu'à `stopQuips()`. */
export function startQuips(el) {
  stopQuips();
  if (!el) return;
  const order = shuffled(QUIPS);
  let i = 0;
  const show = () => {
    el.textContent = order[i++ % order.length];
    replay(el, 'is-quip', 400);
  };
  show();
  timer = setInterval(show, EVERY);
}

export function stopQuips() {
  clearInterval(timer);
  timer = null;
}
