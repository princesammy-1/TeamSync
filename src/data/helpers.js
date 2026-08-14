export function daysFromNow(days, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function minutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

export function hoursAgo(hours) {
  return minutesAgo(hours * 60);
}

export function daysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString();
}
