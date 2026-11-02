/* Petits outils d'animation, sans bibliothèque : rejouer une entrée CSS, faire défiler un
   chiffre, faire sortir un élément. Tout respecte « réduire les animations » du système. */

const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
export const reducedMotion = () => reduceMQ.matches;

const timers = new WeakMap();

/**
 * Pose une classe d'entrée (définie en CSS) puis la retire, pour qu'un rendu suivant
 * du même bloc (sélection, enregistrement) ne rejoue pas l'animation.
 */
export function replay(el, cls, ms = 800) {
  if (!el) return;
  clearTimeout(timers.get(el));
  el.classList.remove(cls);
  void el.offsetWidth; // relance l'animation si la classe était déjà là
  el.classList.add(cls);
  timers.set(el, setTimeout(() => el.classList.remove(cls), ms));
}

/** Fait défiler un nombre de `from` à `to` (ease-out), affiché par `format`. */
export function countUp(el, from, to, format, duration = 450) {
  if (!el) return;
  if (reducedMotion() || !Number.isFinite(from) || from === to) {
    el.textContent = format(to);
    return;
  }
  const t0 = performance.now();
  const tick = now => {
    if (!el.isConnected) return;
    const p = Math.min(1, (now - t0) / duration);
    const k = 1 - (1 - p) ** 4;
    el.textContent = format(p === 1 ? to : from + (to - from) * k);
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = format(from);
  requestAnimationFrame(tick);
}

/** Sortie courte (fondu + léger rétrécissement) ; la promesse se résout à la fin. */
export function leave(el, duration = 180) {
  if (!el?.animate) return Promise.resolve();
  const to = reducedMotion() ? { opacity: 0 } : { opacity: 0, transform: 'scale(.96)' };
  return el
    .animate([{ opacity: 1, transform: 'none' }, to], { duration, easing: 'cubic-bezier(.23, 1, .32, 1)', fill: 'forwards' })
    .finished.catch(() => {});
}

/** Lance `update` dans une transition de vue (fondu enchaîné) si le navigateur la connaît. */
export function withViewTransition(update) {
  if (!document.startViewTransition) return update();
  document.startViewTransition(update);
}
