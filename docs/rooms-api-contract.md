# Rooms & Units: API contract

What the NestJS back end must provide for the Back Office page **Rooms & Units**
(`/p/{propertyId}/config/room-types`, also served at `/config/units`). The front end is
built against an in-memory mock of exactly this contract
(`frontend/src/features/rooms/api/`), so matching it means the UI works unchanged when
the mock is swapped for the real client.

Follows [backend-architecture.md](backend-architecture.md): REST under `/v1`, one error
shape, tenant-scoped repositories, capability-checked writes, audited changes.

## Endpoints at a glance

| # | Method and path | Purpose | Capability |
|---|---|---|---|
| 1 | `GET /v1/properties/{propertyId}/room-types` | List room types | any staff with access to the property |
| 2 | `GET /v1/properties/{propertyId}/units` | List units | any staff with access to the property |
| 3 | `POST /v1/properties/{propertyId}/units` | Create a unit | `rooms.manage` |
| 4 | `PUT /v1/properties/{propertyId}/units/{unitId}` | Update a unit | `rooms.manage` |
| 5 | `POST /v1/properties/{propertyId}/room-types` | Create a room type | `rooms.manage` |
| 6 | `PUT /v1/properties/{propertyId}/room-types/{roomTypeId}` | Update a room type | `rooms.manage` |

The UI loads 1 and 2 together when the page opens and computes the header counts (room
types, units, active units) itself. Updates use `PUT` because the form always sends every
editable field.

## Scope every query to the company and the property

This is the most important rule in this contract.

- Every read and write is filtered by the caller's **company** (from the tenant context)
  **and** the `propertyId` in the path. No repository call runs without both.
- `unitId` and `roomTypeId` in the path must belong to that property. If one doesn't
  exist, or belongs to another property or company, answer `404` (`unit_not_found` or
  `room_type_not_found`).
- A `propertyId` outside the caller's company answers `404 property_not_found`. Never
  answer `403` for this, so other companies' ids aren't revealed.
- `roomTypeId` in a unit's request body must be a room type **of the same property**.
  Otherwise answer `422` with `fieldErrors.roomTypeId`. A unit can never point at another
  property's room type.
- Uniqueness checks ("name already used") only look inside the same property.

## Conventions

- **Messages are user-facing English.** The UI shows `message` and `fieldErrors` as-is,
  under the matching field.
- **Names are trimmed** before they are stored and compared.
- **Audit:** every create and update writes an audit entry (who, what, when; principle 7).
- **Read-only fields** in responses (`id`, `hasFutureReservations`, `photoUrl`) are ignored
  if a client sends them.

### Error shape

Every error uses the shared shape:

```json
{
  "status": 422,
  "code": "validation_failed",
  "message": "Check the unit details.",
  "fieldErrors": { "name": "Another unit in this property already has this name." }
}
```

`fieldErrors` maps a request field name to its message. It is `{}` when no single field is
at fault.

Errors common to all endpoints:

| Status | `code` | When |
|---|---|---|
| 401 | `unauthenticated` | No valid staff session |
| 403 | `forbidden` | Write without `rooms.manage` |
| 404 | `property_not_found` | Property doesn't exist or belongs to another company |
| 422 | `validation_failed` | Request fails validation; see `fieldErrors` |

## Shared shapes

```jsonc
// RoomType
{
  "id": "deluxe",
  "name": "Deluxe",                                        // the UI shows "Deluxe" and groups units under it
  "description": "Spacious rooms with a comfortable setup" // optional
}

// RoomUnit
{
  "id": "room-2",
  "name": "Room 2",               // what guests book; unique within the property
  "roomTypeId": "deluxe",
  "maxGuests": 3,
  "isActive": true,
  "photoUrl": "https://…",        // optional, read-only here
  "hasFutureReservations": true   // read-only, computed by the server
}

// UpdateUnitInput (request body of endpoints 3 and 4)
{
  "name": "Room 2",
  "roomTypeId": "deluxe",
  "maxGuests": 3,
  "isActive": true
}

// RoomTypeInput (request body of endpoints 5 and 6)
{
  "name": "Deluxe",
  "description": "Spacious rooms with a comfortable setup" // optional; "" or omitted means none
}
```

`hasFutureReservations` is `true` when the unit has at least one **confirmed reservation**
whose departure date is after today in the property's time zone (Asia/Colombo). It drives
the deactivation rule below.

## Validation rules

### Unit (endpoints 3 and 4)

| Field | Rule | `fieldErrors` message |
|---|---|---|
| `name` | Required after trimming | "Enter a unit name." |
| `name` | At most 50 characters | "Keep the name to 50 characters." |
| `name` | **Unique within the property**, ignoring case and surrounding spaces. On update, the unit's own current name doesn't count ("room 2" may be saved for Room 2). | "Another unit in this property already has this name." |
| `roomTypeId` | A room type of this property | "Choose a room type." |
| `maxGuests` | Whole number from **1 to 20** (`MAX_GUESTS_MIN`, `MAX_GUESTS_MAX`) | "Enter a whole number from 1 to 20." |
| `isActive` | Boolean; see the deactivation rule | — |

A new unit starts with `hasFutureReservations: false`.

### Room type (endpoints 5 and 6)

| Field | Rule | `fieldErrors` message |
|---|---|---|
| `name` | Required after trimming, at most 50 characters | "Enter a room type name." / "Keep the name to 50 characters." |
| `name` | **Unique within the property**, ignoring case and surrounding spaces; its own current name doesn't count | "This property already has a room type with this name." |
| `description` | Optional, at most 120 characters after trimming | "Keep the description to 120 characters." |

### Uniqueness must hold in the database too

The UI checks names before saving, but two people can save at the same moment. The
database must enforce both rules with unique constraints on (property, normalised name):
one for units and one for room types, where the normalised name is trimmed and lower-case.
A violation is answered as the same `422 validation_failed` with the `name` message above,
never as a 500. The UI shows it under the name field and reloads the list, so the other
person's unit appears.

## Deactivation rule (future reservations)

Active/inactive is a proposal pending team approval. Its behaviour is set by
`INACTIVE_UNIT_WITH_RESERVATIONS`, currently `"prevent"`.

When an update changes an **active** unit to `isActive: false` and the unit has future
reservations:

| Setting | Server behaviour |
|---|---|
| `"prevent"` (current) | Refuse the whole update: `409 unit_has_reservations`, message `"Room 2 has upcoming reservations, so it can't be made inactive. Move or cancel them first."`, `fieldErrors: { "isActive": "This unit has upcoming reservations." }`. Nothing is saved, including other changed fields. |
| `"warn_and_allow"` | Save it. The existing reservations stay booked and are not moved or cancelled. |

In both cases:

- Making a unit **active** again is always allowed.
- Updating an already **inactive** unit isn't affected.
- The check uses the server's data at save time, not the `hasFutureReservations` the
  client last saw.

An **inactive** unit:

- is still returned by endpoint 2 and counted in "Units", but not in "Active units"
- is not offered in availability search or guest booking
- keeps its name, so no other unit may take that name

## 1. List room types

`GET /v1/properties/{propertyId}/room-types`

**200 OK:** `RoomType[]` in display order (creation order unless a sort order is added
later). `[]` for a new property; the UI then shows "Add your first room type to get
started".

```json
[
  { "id": "deluxe", "name": "Deluxe", "description": "Spacious rooms with a comfortable setup" },
  { "id": "standard", "name": "Standard", "description": "Comfortable and budget-friendly rooms" }
]
```

## 2. List units

`GET /v1/properties/{propertyId}/units`

**200 OK:** `RoomUnit[]` with every unit of the property, active and inactive. Any order;
the UI sorts names naturally ("Room 2" before "Room 10") and groups them by room type.

```json
[
  { "id": "room-2", "name": "Room 2", "roomTypeId": "deluxe", "maxGuests": 3, "isActive": true,
    "photoUrl": "https://…", "hasFutureReservations": true },
  { "id": "room-8", "name": "Room 8", "roomTypeId": "standard", "maxGuests": 2, "isActive": false,
    "hasFutureReservations": false }
]
```

## 3. Create unit

`POST /v1/properties/{propertyId}/units`, body `UpdateUnitInput`

**201 Created:** the new `RoomUnit`. The UI shows "Unit added" and opens the new unit for
editing.

Errors: `422 validation_failed` (see the unit rules above).

## 4. Update unit

`PUT /v1/properties/{propertyId}/units/{unitId}`, body `UpdateUnitInput`

**200 OK:** the updated `RoomUnit`. The UI shows "Unit updated" and refreshes the cards and
counts from it.

| Status | `code` | When |
|---|---|---|
| 404 | `unit_not_found` | No such unit in this property |
| 409 | `unit_has_reservations` | Deactivation refused (see the deactivation rule) |
| 422 | `validation_failed` | See the unit rules above |

## 5. Create room type

`POST /v1/properties/{propertyId}/room-types`, body `RoomTypeInput`

**201 Created:** the new `RoomType`. The UI shows "Room type added" and opens it for
editing. A new room type has no units until one is added.

Errors: `422 validation_failed` (see the room type rules above).

## 6. Update room type

`PUT /v1/properties/{propertyId}/room-types/{roomTypeId}`, body `RoomTypeInput`

**200 OK:** the updated `RoomType`. The UI shows "Room type updated". Renaming a room type
doesn't change its units.

| Status | `code` | When |
|---|---|---|
| 404 | `room_type_not_found` | No such room type in this property |
| 422 | `validation_failed` | See the room type rules above |

## Not in this contract

- Deleting room types or units
- Uploading unit photos (`photoUrl` is read-only here)
- Ordering room types by hand
- Prices, rates and taxes (Rates & Seasons)

## Open decisions (confirm with the team)

| Setting | Current value | Effect |
|---|---|---|
| Active/inactive units | Proposed | Whether units can be made inactive at all |
| `INACTIVE_UNIT_WITH_RESERVATIONS` | `"prevent"` | Refuse, or warn and allow, deactivating a unit with future reservations |
| What counts as a future reservation | Confirmed reservations departing after today | Whether active holds or pending payments also count |
| `MAX_GUESTS_MIN` / `MAX_GUESTS_MAX` | 1 / 20 | Allowed range for a unit's maximum guests |
| `rooms.manage` holders | Owner, Manager | Front Desk sees the page read-only |

These values live in `frontend/src/features/rooms/constants.ts` and
`frontend/src/lib/auth/permissions.ts`. The back end owns the real rules; keep both sides
in step.
