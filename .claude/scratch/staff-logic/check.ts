// Scratch checks for the staff rules. Run: node check.ts
import assert from "node:assert/strict";
import { assignableRoles, can, canManageStaff } from "./lib/auth/permissions.ts";
import { parseStaffParams, safeStaffFilters, staffHref } from "./features/staff/staff-params.ts";
import { validateNewStaff } from "./features/staff/validation.ts";
import {
  changeStaffRole,
  createStaff,
  deactivateStaff,
  getStaffMember,
  listStaff,
  previewDeactivation,
  reactivateStaff,
} from "./features/staff/server/staff.ts";

const owner = { id: "staff_owner_1", role: "owner" } as const;
const manager = { id: "staff_2", role: "manager" } as const;
const frontDesk = { id: "staff_3", role: "front-desk" } as const;

// Permissions
assert.ok(can(owner, "staff.read") && can(manager, "staff.read") && !can(frontDesk, "staff.read"));
assert.deepEqual(assignableRoles(manager), ["front-desk"]);
assert.ok(canManageStaff(owner, { id: "staff_1", role: "owner" }));
assert.ok(!canManageStaff(manager, { id: "staff_1", role: "owner" }), "manager can't manage owner");
assert.ok(canManageStaff(manager, { id: "staff_3", role: "front-desk" }));
assert.ok(!canManageStaff(manager, manager), "nobody manages themselves");

// URL params
assert.deepEqual(parseStaffParams({}), { role: null, inactive: false, q: "", panel: null, staffId: null, error: null });
assert.equal(parseStaffParams({ role: "admin" }).role, null);
assert.equal(parseStaffParams({ panel: "delete" }).panel, null);
assert.equal(parseStaffParams({ staff: "../x" }).staffId, null);
assert.equal(parseStaffParams({ error: "toString" }).error, null);
assert.equal(parseStaffParams({ error: "LAST_OWNER" }).error, "LAST_OWNER");
assert.equal(parseStaffParams({ q: "  anji " }).q, "anji");
assert.equal(staffHref({ role: "front-desk", inactive: false, q: "a b" }, { panel: "role", staffId: "staff_3" }), "/company/staff?role=front-desk&q=a+b&panel=role&staff=staff_3");
assert.deepEqual(safeStaffFilters("https://evil.example/company/staff?role=owner"), { role: null, inactive: false, q: "" });
assert.deepEqual(safeStaffFilters("//evil.example/company/staff"), { role: null, inactive: false, q: "" });
assert.deepEqual(safeStaffFilters("/company/staff?status=inactive&panel=add"), { role: null, inactive: true, q: "" });

// Validation
const v = (fullName: string, email: string, role: string, roles = assignableRoles(owner)) => validateNewStaff({ fullName, email, role }, roles);
assert.ok(v("Kasun Perera", "kasun@example.com", "manager").ok);
assert.deepEqual(Object.keys((v("", "nope", "manager") as { fieldErrors: object }).fieldErrors), ["fullName", "email"]);
assert.ok(!v("A", "a@b", "manager").ok, "email needs a dot domain");
const managerTriesOwner = v("A", "a@example.com", "owner", assignableRoles(manager));
assert.ok(!managerTriesOwner.ok && "role" in managerTriesOwner.fieldErrors);

// Store: list, filters, seats
let list = await listStaff({ role: null, inactive: false, q: "" });
assert.equal(list.members.length, 4);
assert.deepEqual(list.seats, { used: 4, limit: 5 });
assert.equal((await listStaff({ role: "front-desk", inactive: false, q: "" })).members.length, 2);
assert.equal((await listStaff({ role: null, inactive: true, q: "" })).members[0].fullName, "Randula Thilakarathne");
assert.equal((await listStaff({ role: null, inactive: false, q: "ANJI@" })).members.length, 1);
assert.ok(list.members[0].lastActiveOwner);

// Last owner protection
assert.equal((await deactivateStaff("staff_1"))?.code, "LAST_OWNER");
assert.equal((await changeStaffRole("staff_1", "manager"))?.code, "LAST_OWNER");

// Front-desk handover counts ACTIVE accounts only (Randula is inactive)
assert.deepEqual(await previewDeactivation("staff_3"), { frontDeskMovesTo: "manager" });
assert.deepEqual(await previewDeactivation("staff_2"), { frontDeskMovesTo: null });

// Create: duplicate (case-insensitive), then limit
assert.equal((await createStaff({ fullName: "X", email: "ANJI@example.com", role: "front-desk" }))?.code, "EMAIL_TAKEN");
assert.equal(await createStaff({ fullName: "Kasun Perera", email: "kasun@example.com", role: "owner" }), null);
assert.equal((await createStaff({ fullName: "Sixth", email: "six@example.com", role: "front-desk" }))?.code, "LIMIT_REACHED");

// Two owners now: the first can be demoted, then the second is the last
assert.equal(await changeStaffRole("staff_1", "manager"), null);
assert.ok((await getStaffMember("staff_5"))?.lastActiveOwner);

// Deactivate last Front Desk, then the Manager: front-desk moves to Manager, then Owner
assert.equal(await deactivateStaff("staff_3"), null);
assert.deepEqual(await previewDeactivation("staff_2"), { frontDeskMovesTo: null }, "staff_1 is now also a manager");
assert.equal(await reactivateStaff("staff_4"), null);
assert.equal((await getStaffMember("staff_4"))?.status, "active");
assert.equal((await getStaffMember("nope")), null);
assert.equal((await reactivateStaff("nope"))?.code, "NOT_FOUND");
console.log("all checks passed");
