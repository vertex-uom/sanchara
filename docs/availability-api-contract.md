# Availability & Date Blocks: API contract

What the NestJS back end must provide for the Back Office page **Availability & Date
Blocks** (`/p/{propertyId}/availability`). The front end is built against an in-memory
mock of exactly this contract (`frontend/src/features/availability/api/`), so matching it
means the UI works unchanged when the mock is swapped for the real client.

Follows [backend-architecture.md](backend-architecture.md): REST under `/v1`, one error
shape, tenant-scoped repositories, capability-checked writes, audited block changes.

## Endpoints at a glance

| # | Method and path | Purpose | Capability |
|---|---|---|---|
| 1 | `GET /v1/properties/{propertyId}/availability` | Search availability for a stay | any staff with access to the property |
| 2 | `GET /v1/properties/{propertyId}/blocks` | List date blocks | `blocks.manage` |
| 3 | `POST /v1/properties/{propertyId}/blocks/conflicts` | Check a block for conflicts (no write) | `blocks.manage` |
| 4 | `POST /v1/properties/{propertyId}/blocks` | Create a block on one or more units | `blocks.manage` |
| 5 | `DELETE /v1/properties/{propertyId}/blocks/{blockId}` | Delete a block | `blocks.manage` |

The page also needs every unit of the property for the "Select units" step. See
[Also needed: list units](#also-needed-list-units).

## Conventions

- **Dates** are date-only strings `"YYYY-MM-DD"` in the property's calendar (Asia/Colombo).
  **Instants** (`heldUntil`, `createdAt`) are ISO 8601 with an offset, e.g.
  `"2026-10-21T14:30:00+05:30"`.
- **Stays and reservations are half-open:** `[arrival, departure)`. The departure /
  check-out day is free for the next guest.
- **Blocks include their end date:** a block from `2026-10-28` to `2026-10-30` blocks the
  nights of the 28th, 29th and 30th (`BLOCK_END_DATE_INCLUSIVE = true`, to confirm with the team).
- **Expired holds are ignored** everywhere: in search, conflicts and the database rule.
- **Tenant scope:** `propertyId` must belong to the caller's company. Otherwise answer
  `404 property_not_found`, never `403`, so other companies' ids aren't revealed.
- **Messages are user-facing English.** The UI shows `message` and `fieldErrors` as-is.
- **Audit:** create and delete write an audit entry (who, what, when).

### Error shape

Every error uses the shared shape:

```json
{
  "status": 409,
  "code": "unit_taken",
  "message": "Room 5 was just booked by someone else. Review the conflicts and try again.",
  "fieldErrors": {}
}
```

`fieldErrors` maps a request field name to its message (`{ "endDate": "End date can't be
before the start date." }`). It is `{}` when no single field is at fault.

Errors common to all endpoints:

| Status | `code` | When |
|---|---|---|
| 401 | `unauthenticated` | No valid staff session |
| 403 | `forbidden` | Session lacks the capability in the table above |
| 404 | `property_not_found` | Property doesn't exist or belongs to another company |
| 422 | `validation_failed` | Request fails validation; see `fieldErrors` |

## Shared shapes

```jsonc
// Unit
{ "id": "room-2", "name": "Room 2", "roomTypeId": "deluxe", "maxGuests": 3, "photoUrl": "https://…" } // photoUrl optional

// RoomType
{ "id": "deluxe", "name": "Deluxe" } // the UI shows "Deluxe Rooms"

// DateBlock
{
  "id": "block-1",
  "unitId": "room-4",
  "unitName": "Room 4",
  "startDate": "2026-10-19",
  "endDate": "2026-10-25",
  "reason": "maintenance",        // "maintenance" | "closure" | "other"
  "note": "Bathroom retiling",    // optional, at most 200 characters
  "createdByName": "Nisal Rathnaka",
  "createdAt": "2026-10-15T10:24:00+05:30"
}

// CreateBlockInput (request body of endpoints 3 and 4)
{
  "unitIds": ["room-2", "room-6"],  // at least one, all in this property
  "startDate": "2026-10-28",
  "endDate": "2026-10-30",          // on or after startDate
  "reason": "maintenance",
  "note": "Repainting"              // optional, at most 200 characters
}
```

## 1. Search availability

`GET /v1/properties/{propertyId}/availability?arrival=2026-10-21&departure=2026-10-24&guests=2&roomTypeId=all`

| Query | Rules |
|---|---|
| `arrival` | Date, today or later in Colombo time |
| `departure` | Date, after `arrival` |
| `guests` | Integer 1–20 |
| `roomTypeId` | A room type id of this property, or `all` |

**200 OK:** `AvailabilityResult`

```json
{
  "params": { "arrival": "2026-10-21", "departure": "2026-10-24", "guests": 2, "roomTypeId": "all" },
  "roomTypes": [
    { "id": "deluxe", "name": "Deluxe" },
    { "id": "standard", "name": "Standard" }
  ],
  "units": [
    { "unit": { "id": "room-1", "name": "Room 1", "roomTypeId": "deluxe", "maxGuests": 3 }, "status": "available" },
    { "unit": { "id": "room-2", "name": "Room 2", "roomTypeId": "deluxe", "maxGuests": 3 }, "status": "held",
      "heldUntil": "2026-10-21T14:30:00+05:30", "holdKind": "enquiry" },
    { "unit": { "id": "room-3", "name": "Room 3", "roomTypeId": "deluxe", "maxGuests": 3 }, "status": "booked",
      "bookedFrom": "2026-10-21", "bookedTo": "2026-10-24" },
    { "unit": { "id": "room-4", "name": "Room 4", "roomTypeId": "deluxe", "maxGuests": 3 }, "status": "blocked",
      "blockReason": "maintenance" },
    { "unit": { "id": "room-7", "name": "Room 7", "roomTypeId": "standard", "maxGuests": 2 }, "status": "capacity_too_small",
      "requestedGuests": 3 }
  ]
}
```

- `roomTypes` lists **every** room type of the property in display order, even when
  `roomTypeId` filters `units`. It drives the room type pills and group headings.
- `units` holds one entry per unit of the requested room type(s), in display order.
- **Status:** collect every rule that applies to the unit for the stay, then the first
  match in this order wins (`STATUS_PRECEDENCE`, to confirm with the team):

  | Order | `status` | Applies when | Extra fields |
  |---|---|---|---|
  | 1 | `blocked` | A date block overlaps the stay | `blockReason` |
  | 2 | `booked` | A confirmed reservation overlaps the stay | `bookedFrom`, `bookedTo` (that reservation's stay) |
  | 3 | `held` | An unexpired hold overlaps the stay | `heldUntil`, `holdKind` (`enquiry` or `pending_payment`) |
  | 4 | `capacity_too_small` | `guests` > the unit's `maxGuests` | `requestedGuests` |
  | 5 | `available` | None of the above | — |

### Error case: restriction violated

A stay that breaks a property rule is **not an error status**. Return `200` with
`restrictionViolation`, and the UI shows a banner instead of the units:

```json
{
  "params": { "arrival": "2026-10-26", "departure": "2026-10-27", "guests": 2, "roomTypeId": "all" },
  "roomTypes": [ … ],
  "units": [ … ],
  "restrictionViolation": {
    "rule": "min_stay",
    "message": "Stays on these dates are at least 2 nights."
  }
}
```

| `rule` | Shown as |
|---|---|
| `min_stay` | Minimum stay |
| `max_stay` | Maximum stay |
| `max_guests` | Maximum guests |
| `booking_window` | Booking window |

`message` should tell staff what would work. `units` may still be returned; the UI
ignores them while a violation is present.

Other errors: `422 validation_failed` with `fieldErrors` keyed `arrival`, `departure`,
`guests` or `roomTypeId`.

## 2. List date blocks

`GET /v1/properties/{propertyId}/blocks`

**200 OK:** `DateBlock[]`, sorted by `startDate` ascending. `[]` when there are none
(the UI shows "No date blocks yet").

```json
[
  {
    "id": "block-1", "unitId": "room-4", "unitName": "Room 4",
    "startDate": "2026-10-19", "endDate": "2026-10-25",
    "reason": "maintenance", "note": "Bathroom retiling",
    "createdByName": "Nisal Rathnaka", "createdAt": "2026-10-15T10:24:00+05:30"
  }
]
```

Includes past blocks. Whether to page or hide old blocks is open.

## 3. Check block conflicts

`POST /v1/properties/{propertyId}/blocks/conflicts`, body `CreateBlockInput`

Read-only. The UI calls it 300 ms after the units or dates change, so it must be cheap.

**200 OK:** `BlockConflict[]`, `[]` when the block is clear.

```json
[
  {
    "id": "res-3",
    "kind": "reservation",
    "unitId": "room-2",
    "unitName": "Room 2",
    "guestName": "Emily Carter",
    "status": "confirmed",
    "from": "2026-10-28",
    "to": "2026-10-31"
  }
]
```

| Field | Notes |
|---|---|
| `id` | Id of the conflicting reservation, hold or block |
| `kind` | `reservation`, `hold` or `block` |
| `status` | `confirmed` (reservation), `enquiry` or `pending_payment` (hold), `blocked` (block) |
| `guestName` | Present for reservations and holds; absent for blocks |
| `from`, `to` | Reservations and holds: stay, check-out exclusive. Blocks: `startDate` and `endDate`, inclusive |

Return every reservation, unexpired hold and block on the selected units that overlaps
`[startDate, endDate]`.

Errors: `422 validation_failed` (same rules as create).

## 4. Create block

`POST /v1/properties/{propertyId}/blocks`, body `CreateBlockInput`

Creates **one block per unit** with the same dates, reason and note. It is all or
nothing: if any unit fails, no block is created.

**201 Created:** `DateBlock[]` in the order of `unitIds`. The UI shows "Block created for
N units" from the array length. `createdByName` and `createdAt` come from the session and
the server clock.

| Status | `code` | When |
|---|---|---|
| 422 | `validation_failed` | `fieldErrors` keyed `unitIds` ("Select at least one unit."), `startDate`, `endDate` ("End date can't be before the start date."), `reason` or `note` ("Keep the note to 200 characters.") |
| 409 | `block_conflict` | The block overlaps a reservation, unexpired hold or block that existed when the request started (`BLOCK_CONFLICT_BEHAVIOUR = "prevent"`) |
| 409 | `unit_taken` | A unit was booked, held or blocked by someone else **while this request ran**, caught by the database rule below |

### Error case: unit just taken

Staff check conflicts, see none, and click Save. Meanwhile a guest books one of the units.
The application-level conflict check may pass, but the insert must then hit the database
rule and fail. Answer:

```json
{
  "status": 409,
  "code": "unit_taken",
  "message": "Room 5 was just booked by someone else. Review the conflicts and try again.",
  "fieldErrors": {}
}
```

Name the unit in `message`. The UI shows it inline above Save block, then calls endpoint 3
again so the new conflict appears.

If the team switches `BLOCK_CONFLICT_BEHAVIOUR` to `"warn"`, `block_conflict` is no longer
returned for existing overlaps with **reservations and holds**. Overlaps with other
**blocks** stay forbidden either way, because the database rule rejects them.

## 5. Delete block

`DELETE /v1/properties/{propertyId}/blocks/{blockId}`

**204 No Content.** The unit becomes bookable for those dates again. The UI then re-runs
the last availability search.

| Status | `code` | When |
|---|---|---|
| 404 | `block_not_found` | No such block in this property, or it was already deleted ("This block was already removed.") |

## Also needed: list units

`GET /v1/properties/{propertyId}/units` (capability `blocks.manage`)

The block form lists every unit of the property, independent of the current search
filter. If an existing units endpoint already returns this, reuse it.

**200 OK:**

```json
{
  "roomTypes": [ { "id": "deluxe", "name": "Deluxe" }, { "id": "standard", "name": "Standard" } ],
  "units": [ { "id": "room-1", "name": "Room 1", "roomTypeId": "deluxe", "maxGuests": 3 } ]
}
```

## The database must reject overlaps

Application checks are not enough: two requests can pass the conflict check at the same
moment. As in principle 2 of the backend architecture, the **database** must refuse any
two of the following that cover the same unit on an overlapping date range:

- confirmed reservations
- unexpired holds (enquiry and pending payment)
- date blocks

Requirements:

- The rule covers all three kinds together. A block may not overlap a booking, a booking
  may not overlap a block, and two blocks may not overlap. One way to get this is a single
  allocations table per unit with a date-range exclusion constraint. The design choice is
  the back end's.
- Ranges use the same boundaries as the API: stays end on check-out (exclusive), blocks
  include their end date.
- Expired holds must stop counting, so a lapsed hold never blocks a real booking.
- A violation surfaces as `409 unit_taken` (create block) or the booking flow's own
  equivalent. It is never a 500.
- Creating a multi-unit block runs in one transaction.

## Open decisions (confirm with the team)

| Setting | Current value | Effect |
|---|---|---|
| `BLOCK_CONFLICT_BEHAVIOUR` | `"prevent"` | Refuse a block that overlaps reservations or holds |
| `BLOCK_END_DATE_INCLUSIVE` | `true` | A block's end date is a blocked night |
| `STATUS_PRECEDENCE` | blocked, booked, held, capacity too small, available | Which status wins when several apply |
| `blocks.manage` holders | Owner, Manager | Front Desk sees blocked units read-only |

These values live in `frontend/src/features/availability/constants.ts` and
`frontend/src/lib/auth/permissions.ts`. The back end owns the real rules; keep both sides
in step.
