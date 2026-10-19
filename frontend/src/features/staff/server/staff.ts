import { apiError, type ApiError } from "@/lib/api-client/errors";
import type { StaffRole } from "@/lib/auth/staff";
import type { StaffFilters } from "../staff-params";
import type { DeactivationPreview, StaffList, StaffMember } from "../types";
import type { NewStaff } from "../validation";

type StoredMember = Omit<StaffMember, "lastActiveOwner">;
type Store = { members: StoredMember[]; seatLimit: number; nextId: number };

// TEMPORARY in-memory dev store so the page works end to end before the
// staff API exists. Replace this file with API calls; the signatures stay.
// Kept on globalThis so hot reload doesn't reset it; a server restart does.
const holder = globalThis as typeof globalThis & { sancharaStaffStore?: Store };

function store(): Store {
  holder.sancharaStaffStore ??= {
    members: [
      { id: "staff_1", fullName: "Minduli Kumaranayaka", email: "mindu@example.com", role: "owner", status: "active" },
      { id: "staff_2", fullName: "Nisal Perera", email: "nisal@example.com", role: "manager", status: "active" },
      { id: "staff_3", fullName: "Anji Silva", email: "anji@example.com", role: "front-desk", status: "active" },
      { id: "staff_4", fullName: "Randula Thilakarathne", email: "randula@example.com", role: "front-desk", status: "inactive" },
    ],
    seatLimit: 5,
    nextId: 5,
  };
  return holder.sancharaStaffStore;
}

const activeOnly = (members: StoredMember[]) => members.filter((member) => member.status === "active");

function isLastActiveOwner(member: StoredMember, members: StoredMember[]) {
  return (
    member.role === "owner" &&
    member.status === "active" &&
    activeOnly(members).filter((other) => other.role === "owner").length === 1
  );
}

// Who does front-desk work, from the ACTIVE accounts only (see the staffing
// table in docs/frontend-architecture.md).
function frontDeskHolder(members: StoredMember[]): StaffRole {
  const roles = new Set(activeOnly(members).map((member) => member.role));
  return roles.has("front-desk") ? "front-desk" : roles.has("manager") ? "manager" : "owner";
}

const notFound = () => apiError(404, "NOT_FOUND", "That staff account no longer exists.");
const lastOwner = () => apiError(409, "LAST_OWNER", "The last active Owner can't be deactivated or given another role.");

export async function listStaff({ role, inactive, q }: StaffFilters): Promise<StaffList> {
  const { members, seatLimit } = store();
  const query = q.toLowerCase();
  return {
    members: members
      .filter(
        (member) =>
          (!role || member.role === role) &&
          (!inactive || member.status === "inactive") &&
          (!query || member.fullName.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)),
      )
      .map((member) => ({ ...member, lastActiveOwner: isLastActiveOwner(member, members) })),
    // TODO(confirm): v8 has not decided whether inactive accounts use a seat; the design counts them.
    seats: { used: members.length, limit: seatLimit },
  };
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const { members } = store();
  const member = members.find((item) => item.id === id);
  return member ? { ...member, lastActiveOwner: isLastActiveOwner(member, members) } : null;
}

export async function previewDeactivation(id: string): Promise<DeactivationPreview> {
  const { members } = store();
  const before = frontDeskHolder(members);
  const after = frontDeskHolder(members.filter((member) => member.id !== id));
  return { frontDeskMovesTo: before === after ? null : after };
}

// TODO(confirm): v8 has not defined invitations; accounts are created active
// and password setup (accept-invite) comes later.
export async function createStaff(input: NewStaff): Promise<ApiError | null> {
  const data = store();
  if (data.members.length >= data.seatLimit) {
    return apiError(409, "LIMIT_REACHED", "Your plan's staff limit is reached. Upgrade the plan to add more staff.");
  }
  const email = input.email.toLowerCase();
  if (data.members.some((member) => member.email.toLowerCase() === email)) {
    return apiError(409, "EMAIL_TAKEN", "This email already has a staff account.", {
      email: "This email already has a staff account.",
    });
  }
  data.members.push({ id: `staff_${data.nextId++}`, ...input, status: "active" });
  return null;
}

export async function changeStaffRole(id: string, role: StaffRole): Promise<ApiError | null> {
  const { members } = store();
  const member = members.find((item) => item.id === id);
  if (!member) return notFound();
  if (role !== "owner" && isLastActiveOwner(member, members)) return lastOwner();
  member.role = role;
  return null;
}

export async function deactivateStaff(id: string): Promise<ApiError | null> {
  const { members } = store();
  const member = members.find((item) => item.id === id);
  if (!member) return notFound();
  if (isLastActiveOwner(member, members)) return lastOwner();
  member.status = "inactive";
  return null;
}

export async function reactivateStaff(id: string): Promise<ApiError | null> {
  const member = store().members.find((item) => item.id === id);
  if (!member) return notFound();
  member.status = "active";
  return null;
}
