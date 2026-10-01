/* Graphiques SVG : profil altimétrique (avec bande de vent) et durée selon l'heure de départ. */
import { haversine } from '../core/ride.js';

export const windClass = head => (head > 4 ? 'head' : head < -4 ? 'tail' : 'cross');

/** Profil altimétrique ; la bande du bas colore le vent rencontré. */
export function elevationChart(r, width) {
  const pts = [];
  let d = 0;
  r.coords.forEach((c, i) => {
    if (i) d += haversine(r.coords[i - 1], c);
    if (Number.isFinite(c[2])) pts.push([d, c[2]]);
  });
  if (pts.length < 2 || !d) return '<p class="hint">Altitude indisponible pour ce tracé.</p>';
  const W = Math.max(280, Math.round(width));
  const H = 150;
  const L = 44;
  const R = 6;
  const T = 8;
  const B = 22;
  const e = pts.map(p => p[1]);
  const lo = Math.floor(Math.min(...e) / 50) * 50;
  const hi = Math.max(lo + 100, Math.ceil(Math.max(...e) / 50) * 50);
  const x = v => L + (v / d) * (W - L - R);
  const y = v => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const step = Math.max(1, Math.floor(pts.length / 500));
  const sample = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  const line = sample.map((p, i) => `${i ? 'L' : 'M'}${x(p[0]).toFixed(1)},${y(p[1]).toFixed(1)}`).join('');
  const area = `${line}L${x(d).toFixed(1)},${H - B}L${L},${H - B}Z`;
  const km = d / 1000;
  const kmStep = [5, 10, 20, 25, 50].find(s => (s / km) * (W - L - R) >= 44) || 50;
  let ticks = '';
  for (let k = kmStep; k < km - kmStep * 0.4; k += kmStep) ticks += `<text class="axis" x="${x(k * 1000).toFixed(1)}" y="${H - 4}" text-anchor="middle">${k}</text>`;
  ticks += `<text class="axis" x="${W - R}" y="${H - 4}" text-anchor="end">km</text>`;
  const band = r.sim
    ? r.sim.segs
        .filter((_, i) => i % 2 === 0)
        .map(s => `<rect x="${x(s.d0).toFixed(1)}" y="${H - B + 3}" width="${Math.max(0.8, x(Math.min(d, s.d1 + (s.d1 - s.d0))) - x(s.d0)).toFixed(1)}" height="4" fill="var(--${windClass(s.head)})"/>`)
        .join('')
    : '';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Profil altimétrique, de ${lo} à ${hi} mètres sur ${km.toFixed(0)} kilomètres">
    <defs><linearGradient id="elevFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <line x1="${L}" x2="${W - R}" y1="${y(hi)}" y2="${y(hi)}" stroke="var(--line)"/>
    <line x1="${L}" x2="${W - R}" y1="${y(lo)}" y2="${y(lo)}" stroke="var(--line)"/>
    <text class="axis" x="${L - 6}" y="${y(hi) + 4}" text-anchor="end">${hi} m</text>
    <text class="axis" x="${L - 6}" y="${y(lo) + 4}" text-anchor="end">${lo} m</text>
    <path d="${area}" fill="url(#elevFill)"/><path d="${line}" fill="none" stroke="var(--accent-text)" stroke-width="1.8" stroke-linejoin="round"/>
    ${band}${ticks}
  </svg>`;
}

/**
 * Durée estimée selon l'heure de départ. Chaque barre est cliquable (data-start).
 * @param {Array<{t:number, seconds:number, rain:number|null}>} slots
 */
export function startsChart(slots, currentT, width) {
  if (!slots.length) return '';
  const W = Math.max(280, Math.round(width));
  const H = 132;
  const T = 18;
  const B = 20;
  const best = slots.reduce((a, b) => (b.seconds < a.seconds ? b : a));
  const min = Math.min(...slots.map(s => s.seconds));
  const max = Math.max(...slots.map(s => s.seconds));
  const span = Math.max(max - min, 300);
  const bw = W / slots.length;
  const h = s => 16 + ((s.seconds - min) / span) * (H - T - B - 16);
  const bars = slots
    .map((s, i) => {
      const hour = new Date(s.t).getHours();
      const isBest = s === best;
      const isCur = Math.abs(s.t - currentT) < 30 * 60000;
      const fill = isBest ? 'var(--accent)' : isCur ? 'var(--sky)' : 'var(--line-2)';
      const bh = h(s);
      const delta = Math.round((s.seconds - best.seconds) / 60);
      const label = `Départ ${hour} h : ${isBest ? 'le plus rapide' : `+${delta} min`}${s.rain !== null ? `, pluie ${s.rain} %` : ''}`;
      return `<g class="slot" data-start="${s.t}" tabindex="0" role="button" aria-label="${label}">
        <rect class="bg" x="${(i * bw).toFixed(1)}" y="0" width="${bw.toFixed(1)}" height="${H}" rx="6"/>
        <rect x="${(i * bw + bw * 0.18).toFixed(1)}" y="${(H - B - bh).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${bh.toFixed(1)}" rx="3" fill="${fill}"/>
        ${isBest || isCur ? `<text class="axis" x="${(i * bw + bw / 2).toFixed(1)}" y="${(H - B - bh - 5).toFixed(1)}" text-anchor="middle" style="fill:${isBest ? 'var(--accent-text)' : 'var(--sky)'};font-weight:800">${isBest ? 'top' : delta > 0 ? `+${delta}′` : '='}</text>` : ''}
        ${s.rain !== null && s.rain >= 40 ? `<circle cx="${(i * bw + bw / 2).toFixed(1)}" cy="6" r="3" fill="var(--sky)"><title>Pluie ${s.rain} %</title></circle>` : ''}
        ${hour % 2 === 0 || slots.length <= 8 ? `<text class="axis" x="${(i * bw + bw / 2).toFixed(1)}" y="${H - 4}" text-anchor="middle">${hour}h</text>` : ''}
      </g>`;
    })
    .join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="Durée estimée selon l’heure de départ">${bars}</svg>`;
}
