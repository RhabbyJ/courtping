export function formatTime(time: string) {
  const [rawHours, rawMinutes] = time.split(":").map(Number);
  const suffix = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;
  const minutes = rawMinutes.toString().padStart(2, "0");

  return `${hours}:${minutes} ${suffix}`;
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
