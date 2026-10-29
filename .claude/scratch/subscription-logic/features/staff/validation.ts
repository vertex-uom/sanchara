import type { StaffRole } from "file:///D:/Nisal/software%20project/sanchara/.claude/scratch/subscription-logic/lib/auth/staff.ts";

export type NewStaffInput = { fullName: string; email: string; role: string };

export type NewStaff = { fullName: string; email: string; role: StaffRole };

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MAX_NAME = 100;
const MAX_EMAIL = 254;

// The one schema for "Add staff". Email uniqueness needs the data, so the
// store checks it.
export function validateNewStaff(
  input: NewStaffInput,
  assignable: readonly StaffRole[],
): { ok: true; value: NewStaff } | { ok: false; fieldErrors: Record<string, string> } {
  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const role = assignable.find((option) => option === input.role);
  const fieldErrors: Record<string, string> = {};

  if (!fullName) fieldErrors.fullName = "Enter the full name.";
  else if (fullName.length > MAX_NAME) fieldErrors.fullName = `Use ${MAX_NAME} characters or fewer.`;
  if (!EMAIL.test(email) || email.length > MAX_EMAIL) fieldErrors.email = "Enter a valid email address, like name@example.com.";
  if (!role) fieldErrors.role = "Choose a role you can assign.";

  if (!role || Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };
  return { ok: true, value: { fullName, email, role } };
}
