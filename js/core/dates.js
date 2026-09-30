/* Dates en heure locale (clés ISO AAAA-MM-JJ). */
const pad = n => String(n).padStart(2, '0');

export const dateKey = date => {
  const d = new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** Date + heure locales -> Date, ou null si invalide. */
export function combine(day, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null;
  const d = new Date(`${day}T${time}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const hhmm = date => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const hLabel = date => `${date.getHours()} h ${pad(date.getMinutes())}`;
export const dayLabel = date => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
