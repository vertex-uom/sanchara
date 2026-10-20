import { PASSWORD_MIN } from "./schema";

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string };

// A hint only; the API enforces 8–128 characters. Length counts most, then how
// many kinds of character are used (lower, upper, digit, symbol).
export function passwordStrength(password: string, email = ""): Strength {
  if (password.length === 0) return { score: 0, label: "" };
  if (password.length < PASSWORD_MIN) return { score: 0, label: "Too short" };

  const sameAsEmail = email !== "" && password.trim().toLowerCase() === email.trim().toLowerCase();
  if (sameAsEmail || /^(.)\1*$/.test(password)) return { score: 1, label: "Weak" };

  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password)).length;
  if (password.length >= 16 || (password.length >= 12 && kinds >= 3)) return { score: 4, label: "Strong" };
  if (password.length >= 12 || kinds >= 3) return { score: 3, label: "Good" };
  return { score: 2, label: "Fair" };
}
