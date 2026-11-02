/* Petites phrases affichées pendant le calcul des boucles, à côté de l'étape réelle.
   Purement décoratives (masquées aux lecteurs d'écran : l'étape réelle est annoncée). */
import { replay, reducedMotion } from './motion.js';

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

/* ---------- Profil qui grimpe ----------
   Illustration seulement : un profil inventé (plus ou moins bosselé selon le relief demandé)
   se dessine au rythme réel du calcul. Entre deux étapes, le point avance encore un peu
   pour ne jamais paraître figé, sans jamais dépasser 97 %. */

const NS = 'http://www.w3.org/2000/svg';
const PEAKS = { flat: [1, 8, 12], any: [2, 24, 34], hilly: [3, 28, 38] };
let scene = null;
const CREEP = 0.12 / 9000; // fraction de jauge par milliseconde

/** Profil aléatoire : quelques cols répartis sur la droite (la gauche garde les compteurs). */
export function makeProfile(width, height, relief = 'any', rand = Math.random) {
  const [count, minH, maxH] = PEAKS[relief] || PEAKS.any;
  const base = height - 10;
  const span = (0.5 * width) / count;
  const peaks = Array.from({ length: count }, (_, k) => ({
    x: width * 0.42 + span * (k + 0.5) + (rand() - 0.5) * span * 0.3,
    h: minH + rand() * (maxH - minH),
    w: span * (0.28 + rand() * 0.08)
  }));
  const phase = rand() * 6;
  const pts = [];
  for (let x = 0; x <= width; x += 3) {
    // Le plus haut des cols l'emporte (pas de somme) : les sommets restent nets et séparés.
    const bump = Math.max(...peaks.map(p => p.h * Math.exp(-(((x - p.x) / p.w) ** 2))));
    pts.push([x, Math.max(28, base - 3 - 3 * Math.sin(x / 23 + phase) - bump)]);
  }
  const flags = peaks.map(p => pts[Math.min(pts.length - 1, Math.round(p.x / 3))]);
  let climb = 0;
  const climbs = pts.map((q, k) => (climb += k ? Math.max(0, pts[k - 1][1] - q[1]) : 0));
  return { pts, flags, climbs, total: climb || 1, base: height };
}

/** Démarre le profil dans `root` (.climb). `target` : km et D+ visés (null = compteurs masqués). */
export function startClimb(root, { relief = 'any', km = null, ascent = null } = {}) {
  stopClimb();
  const svg = root?.querySelector('svg');
  if (!svg) return;
  const width = Math.max(200, Math.round(root.clientWidth || 320));
  const height = Math.round(root.clientHeight || 84);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  const prof = makeProfile(width, height, relief);
  const d = prof.pts.map((p, k) => `${k ? 'L' : 'M'}${p[0]} ${p[1].toFixed(1)}`).join('');
  svg.querySelector('.climb__line').setAttribute('d', d);
  svg.querySelector('.climb__ghost').setAttribute('d', d);
  svg.querySelector('.climb__area').setAttribute('d', `${d}L${width} ${height}L0 ${height}Z`);
  const flagsEl = svg.querySelector('.climb__flags');
  flagsEl.replaceChildren(
    ...prof.flags.map(([x, y], k) => {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'climb__flag');
      g.innerHTML = `<line x1="${x}" y1="${y - 5}" x2="${x}" y2="${y - 21}"/><path d="M${x} ${y - 21}h10l-2.6 3.6 2.6 3.6h-10z"/>${x > width - 52 ? `<text x="${x - 4}" y="${y - 14}" text-anchor="end">` : `<text x="${x + 12}" y="${y - 14}">`}Col ${k + 1}</text>`;
      return g;
    })
  );
  const counters = root.querySelector('.climb__counters');
  counters.hidden = !km;
  scene = {
    root, svg, prof, km, ascent: ascent ?? 0, width,
    mask: svg.querySelector('.climb__mask'), rider: svg.querySelector('.climb__rider'),
    flags: [...flagsEl.children], kmEl: root.querySelector('.climb__km'), dEl: root.querySelector('.climb__dplus'),
    target: 0, shown: 0, last: performance.now(), raf: 0
  };
  draw(scene, 0);
  scene.raf = requestAnimationFrame(tick);
}

/** Nouvelle étape réelle du calcul (0 à 1). */
export function setClimb(value) {
  if (!scene) return;
  scene.target = Math.max(scene.target, Math.min(1, value));
  if (reducedMotion()) draw(scene, (scene.shown = scene.target));
}

export function stopClimb() {
  if (scene) cancelAnimationFrame(scene.raf);
  scene = null;
}

function tick(now) {
  const s = scene;
  if (!s || !s.root.isConnected) return;
  const dt = Math.max(0, Math.min(100, now - s.last));
  s.last = now;
  if (!reducedMotion()) {
    if (s.shown < s.target) {
      // Rattrape la vraie valeur en douceur.
      s.shown += (s.target - s.shown) * (1 - Math.exp(-dt / 220));
    } else {
      // En attendant l'étape suivante : avance lente (≈ 1,3 %/s), plafonnée.
      const cap = Math.max(s.shown, Math.min(0.97, s.target + 0.12));
      s.shown = Math.min(cap, s.shown + dt * CREEP);
    }
    draw(s, s.shown);
  }
  s.raf = requestAnimationFrame(tick);
}

function draw(s, p) {
  const x = p * s.width;
  const { pts, climbs, total } = s.prof;
  const k = Math.min(pts.length - 1, Math.max(0, Math.round(x / 3)));
  s.mask.setAttribute('width', x.toFixed(1));
  s.rider.setAttribute('transform', `translate(${x.toFixed(1)} ${pts[k][1].toFixed(1)})`);
  s.flags.forEach((f, i) => f.classList.toggle('is-up', x >= s.prof.flags[i][0]));
  if (s.km) {
    s.kmEl.textContent = Math.round(p * s.km);
    s.dEl.textContent = Math.round((climbs[k] / total) * s.ascent);
  }
}
