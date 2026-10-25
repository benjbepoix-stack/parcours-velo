/* Calculs de l'Atelier : transmission (développement, vitesse) et pression des pneus. */

export const CHAINRINGS = [
  { id: '53-39', label: '53 / 39', teeth: [53, 39] },
  { id: '52-36', label: '52 / 36', teeth: [52, 36] },
  { id: '50-34', label: '50 / 34', teeth: [50, 34] },
  { id: '48-35', label: '48 / 35', teeth: [48, 35] },
  { id: '46-33', label: '46 / 33', teeth: [46, 33] },
  { id: '42', label: '42 (mono)', teeth: [42] },
  { id: '40', label: '40 (mono)', teeth: [40] }
];

export const CASSETTES = [
  { id: '11-28', label: '11-28 · 11 v', teeth: [11, 12, 13, 14, 15, 17, 19, 21, 23, 25, 28] },
  { id: '11-32', label: '11-32 · 11 v', teeth: [11, 12, 13, 14, 16, 18, 20, 22, 25, 28, 32] },
  { id: '11-30', label: '11-30 · 12 v', teeth: [11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30] },
  { id: '11-34', label: '11-34 · 12 v', teeth: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34] },
  { id: '10-33', label: '10-33 · 12 v', teeth: [10, 11, 12, 13, 14, 15, 17, 19, 21, 24, 28, 33] },
  { id: '10-36', label: '10-36 · 12 v', teeth: [10, 11, 12, 13, 15, 17, 19, 21, 24, 28, 32, 36] },
  { id: '10-44', label: '10-44 · 12 v', teeth: [10, 11, 13, 15, 17, 19, 21, 24, 28, 32, 38, 44] }
];

/** Circonférence de roue (mm) selon le pneu. */
export const WHEELS = [
  { id: '25', label: '700 × 25', mm: 2105 },
  { id: '28', label: '700 × 28', mm: 2136 },
  { id: '32', label: '700 × 32', mm: 2155 },
  { id: '35', label: '700 × 35', mm: 2168 },
  { id: '40', label: '700 × 40', mm: 2200 }
];

/** Mètres parcourus par tour de pédale. */
export const development = (ring, cog, wheelMm) => (ring / cog) * (wheelMm / 1000);

/** Vitesse (km/h) pour un développement (m) et une cadence (tr/min). */
export const speedKmh = (dev, cadence) => dev * cadence * 0.06;

/**
 * Croisement de chaîne à éviter (double plateau) : petit plateau sur les deux plus petits pignons,
 * grand plateau sur les deux plus grands. `cogs` va du plus petit au plus grand.
 */
export const isCrossChain = (ringIndex, cogIndex, ringCount, cogCount) =>
  ringCount > 1 && ((ringIndex === ringCount - 1 && cogIndex < 2) || (ringIndex === 0 && cogIndex > cogCount - 3));

/** Tableau complet : une ligne par pignon, une colonne par plateau (rings du plus grand au plus petit). */
export function gearTable(rings, cogs, wheelMm, cadence) {
  return cogs.map((cog, ci) =>
    rings.map((ring, ri) => {
      const dev = development(ring, cog, wheelMm);
      return { ring, cog, dev, ratio: ring / cog, speed: speedKmh(dev, cadence), cross: isCrossChain(ri, ci, rings.length, cogs.length) };
    })
  );
}

export const SURFACES = [
  { id: 'road', label: 'Route lisse', factor: 1 },
  { id: 'rough', label: 'Route abîmée', factor: 0.93 },
  { id: 'gravel', label: 'Gravel roulant', factor: 0.85 },
  { id: 'chunky', label: 'Gravel cassant', factor: 0.77 }
];

export const PSI_PER_BAR = 14.5038;
export const HOOKLESS_MAX_BAR = 5;

/**
 * Pression de départ, avant et arrière (bar).
 * Base : règle publique de Frank Berto (le pneu s'écrase de 15 %), environ 95 psi pour 45 kg
 * sur un 23 mm, proportionnelle à la charge et à largeur^-1,5. Le facteur 0,9 rapproche cette
 * règle des pressions plus basses conseillées aujourd'hui. Charge : 45 % avant, 55 % arrière.
 * Corrections : terrain, tubeless (−5 %), plafond de 5 bar pour une jante hookless.
 * Ce n'est pas le modèle de Silca : une estimation ouverte, à affiner au ressenti.
 */
export function tirePressure({ mass, width, surface = 'road', tubeless = false, hookless = false }) {
  if (!(mass > 0) || !(width > 0)) return null;
  const factor = (SURFACES.find(s => s.id === surface) || SURFACES[0]).factor * (tubeless ? 0.95 : 1);
  const psi = kg => 95 * (kg / 45.4) * Math.pow(23 / width, 1.5) * 0.9 * factor;
  let front = psi(mass * 0.45) / PSI_PER_BAR;
  let rear = psi(mass * 0.55) / PSI_PER_BAR;
  const capped = hookless && rear > HOOKLESS_MAX_BAR;
  if (hookless) {
    front = Math.min(front, HOOKLESS_MAX_BAR);
    rear = Math.min(rear, HOOKLESS_MAX_BAR);
  }
  return { front, rear, frontPsi: front * PSI_PER_BAR, rearPsi: rear * PSI_PER_BAR, capped };
}
