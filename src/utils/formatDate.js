export function formatDate(date, options = {}) {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const defaults = { month: "short", day: "numeric", year: "numeric" };
  try {
    return new Intl.DateTimeFormat("en-US", { ...defaults, ...options }).format(d);
  } catch {
    return d.toDateString();
  }
}

export function formatTime(date, options = {}) {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";

  const defaults = { hour: "numeric", minute: "2-digit" };
  try {
    return new Intl.DateTimeFormat("en-US", { ...defaults, ...options }).format(d);
  } catch {
    return d.toTimeString().slice(0, 5);
  }
}

export function formatDateTime(date, options = {}) {
  return `${formatDate(date, options)} · ${formatTime(date, options)}`;
}

export function relativeTime(date, now = Date.now()) {
  if (!date) return "";
  const then = typeof date === "string" || typeof date === "number" ? new Date(date).getTime() : date.getTime();
  const diff = Math.max(0, now - then);

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return formatDate(then);
}

export function isToday(date) {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function isPast(date) {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toISODate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
