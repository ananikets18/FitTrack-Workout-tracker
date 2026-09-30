// Sleep helpers — single source of truth for bedtime/wake → duration.
// Times are "HH:MM" or "HH:MM:SS" (24h). Overnight spans roll +24h.

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

export const isValidTimeInput = (value) => {
  if (value === null || value === undefined) return false;
  return TIME_RE.test(String(value).trim());
};

export const timeToMinutes = (value) => {
  const trimmed = String(value).trim();
  const match = trimmed.match(TIME_RE);
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[4] ? Number(match[4]) : 0;
  return hours * 60 + minutes + seconds / 60;
};

export const toTimeInputValue = (value) => {
  if (!value) return '';
  return String(value).slice(0, 5);
};

// Returns { hours, minutes, totalMinutes, totalHours, overnight } or null if inputs invalid/empty.
export const computeSleepDuration = (bedtime, wakeTime) => {
  if (!bedtime || !wakeTime) return null;
  if (!isValidTimeInput(bedtime) || !isValidTimeInput(wakeTime)) return null;
  const bedMins = timeToMinutes(bedtime);
  const wakeMins = timeToMinutes(wakeTime);
  if (!Number.isFinite(bedMins) || !Number.isFinite(wakeMins)) return null;

  let diff = wakeMins - bedMins;
  let overnight = false;
  if (diff < 0) {
    diff += 24 * 60;
    overnight = true;
  }
  // diff === 0 means ambiguous (0h or 24h) — treat as invalid so user picks times.
  if (diff === 0) return null;

  const totalMinutes = Math.round(diff);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    hours,
    minutes,
    totalMinutes,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    overnight,
  };
};

export const formatSleepDuration = (duration) => {
  if (!duration) return '—';
  const { hours, minutes } = duration;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// Timezone-safe: "2026-09-30" parsed as UTC midnight shifts day in US TZs.
// Anchor at noon local so toLocaleDateString stays on the right date.
export const formatSleepDate = (dateStr, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', opts);
};
