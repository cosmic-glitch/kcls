const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday",
  "thursday", "friday", "saturday",
];

export function getTodayHours(
  hours: Record<string, string>,
  now: Date = new Date()
): string | null {
  const day = DAY_NAMES[now.getDay()];
  return hours[day] ?? null;
}

function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export function isOpenNow(
  hours: Record<string, string>,
  now: Date = new Date()
): boolean {
  const todayHours = getTodayHours(hours, now);
  if (!todayHours) return false;

  const parts = todayHours.split(" - ");
  if (parts.length !== 2) return false;

  const open = parseTime(parts[0]);
  const close = parseTime(parts[1]);
  if (!open || !close) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = open.hours * 60 + open.minutes;
  const closeMinutes = close.hours * 60 + close.minutes;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getCurrentBusyness(
  popularTimes: Record<string, number[]>,
  now: Date = new Date()
): number | null {
  const day = DAY_NAMES[now.getDay()];
  const dayData = popularTimes[day];
  if (!dayData) return null;
  const hour = now.getHours();
  return dayData[hour] ?? null;
}
