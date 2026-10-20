// "Nisal Rathnaka" → "NR" (first two words).
export function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
