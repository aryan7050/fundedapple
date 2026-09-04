export function generateOtp(): string {
  // 6-digit numeric code, e.g. "482913"
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getOtpExpiry(minutes = 10): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
