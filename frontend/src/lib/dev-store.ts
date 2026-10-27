import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

// TEMPORARY: lets the in-memory fixture stores survive a dev-server restart
// until the API exists. Data lives in frontend/.dev-data/<name>.json (git-ignored);
// delete the file to start again from the seed. Server-only.
const DIR = path.join(process.cwd(), ".dev-data");

const file = (name: string) => path.join(DIR, `${name}.json`);

export function loadDevStore<T>(name: string, seed: () => T): T {
  try {
    return JSON.parse(readFileSync(file(name), "utf8")) as T;
  } catch {
    return seed();
  }
}

// Written to a temp file first so a crash mid-write can't leave broken JSON.
export function saveDevStore<T>(name: string, data: T) {
  mkdirSync(DIR, { recursive: true });
  const temp = `${file(name)}.tmp`;
  writeFileSync(temp, JSON.stringify(data));
  renameSync(temp, file(name));
}
