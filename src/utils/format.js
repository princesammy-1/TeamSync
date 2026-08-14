export function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

export function truncate(str = "", length = 60) {
  if (str.length <= length) return str;
  return `${str.slice(0, length).trimEnd()}…`;
}

export function titleCase(str = "") {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}
