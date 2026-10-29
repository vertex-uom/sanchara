// Helpers shared by the TEMPORARY platform-admin fixtures. Deleted together
// with the fixtures once the API exists.

// Small seeded PRNG so every request renders the same data.
export function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const pick = <T>(rng: () => number, list: readonly T[]) => list[Math.floor(rng() * list.length)];

export const FIRST_NAMES = ["Nimal", "Kamala", "Ruwan", "Sanduni", "Kasun", "Dilani", "Tharindu", "Chamari", "Lakmal", "Nadeesha", "Harsha", "Anjali", "Fathima", "Priya", "Malith", "Shanika", "Roshan", "Ishara", "Buddhi", "Sahana", "Dinesh", "Thilini", "Suresh", "Amaya", "Gayan", "Nilusha", "Pradeep", "Hiruni", "Janaka", "Madhavi"];
export const LAST_NAMES = ["Perera", "Silva", "Fernando", "Jayasuriya", "Bandara", "Herath", "de Silva", "Fonseka", "Rizwan", "Selvarajah", "Gunasekara", "Wickramasinghe", "Mendis", "Rathnayake", "Dissanayake", "Weerasinghe", "Peiris", "Senanayake", "Abeysekera", "Kumari", "Jayawardena", "Liyanage", "Samaraweera", "Ekanayake", "Karunaratne"];

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
