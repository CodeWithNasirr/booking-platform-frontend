// utils/time.js
export function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = +h % 12 || 12;
  return `${hour}:${m} ${+h >= 12 ? "PM" : "AM"}`;
}
