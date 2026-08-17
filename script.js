function formatTime12(time) {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const h = Number(hours);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;

  return `${hour12}:${minutes} ${suffix}`;
}// Reserved for future website features.
