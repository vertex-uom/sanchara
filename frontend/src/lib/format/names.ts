// "Nisal Rathnaka" → "NR" (first two words).
export function initials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}
