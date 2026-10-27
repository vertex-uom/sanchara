# Reviews: API contract

What the NestJS back end must provide for the Back Office page **Reviews**
(`/p/{propertyId}/reviews`). The front end is built against an in-memory mock of exactly
this contract (`frontend/src/features/reviews/api/`), so matching it means the UI works
unchanged when the mock is swapped for the real client.

Follows [backend-architecture.md](backend-architecture.md): REST under `/v1`, one error
shape, tenant-scoped repositories.

## Endpoints at a glance

| # | Method and path | Purpose | Who |
|---|---|---|---|
| 1 | `GET /v1/properties/{propertyId}/reviews/summary` | Average, total and count per star rating | any staff with access to the property |
| 2 | `GET /v1/properties/{propertyId}/reviews` | One page of reviews, filtered, sorted and searched | any staff with access to the property |

These are the only reviews endpoints for staff. Both are read-only.

## Rules

### Reviews exist only for verified stays

- A review is created by the **guest**, through the guest-facing booking flow, never in
  the Back Office.
- It can only be created for a **reservation of this property that has been stayed**:
  confirmed, checked out, and not cancelled or a no-show. The server checks this when the
  review is created; the client's word is not enough.
- The review is linked to that reservation. Its stay dates (`stayFrom`, `stayTo`) and room
  (`unitName`) come from the reservation, not from what the guest types.
- `verifiedStay` is therefore always `true`. A review without a verified stay cannot exist.

### One review per stay

- A reservation has at most one review. The database enforces this with a unique
  constraint on the review's reservation, not only a code check.
- A guest who stays twice can review each stay once.

### No edit, reply, hide or delete for staff

- There are **no** staff endpoints that create, edit, reply to, hide, delete or report a
  review, and none should be added under this API.
- Every review is public. The Back Office page says so: "Reviews are public. Staff cannot
  reply to or hide reviews."
- Removing abusive content, if it is ever needed, would be a separate Platform Admin
  process. It is outside this contract and is listed under open decisions.

### Scope every query to the company and the property

- Every query is filtered by the caller's **company** (from the tenant context) **and**
  the `propertyId` in the path. No repository call runs without both.
- A `propertyId` outside the caller's company answers `404 property_not_found`. Never
  answer `403` for this, so other companies' ids aren't revealed.
- A review belongs to the property of its reservation. Reviews of other properties of the
  same company never appear.
- The summary and the list read the same set of reviews, so their numbers agree.

### The average is computed on the server

- The server counts reviews per star rating (`distribution`). It derives `total` as the
  sum of those counts, and `average` as the weighted mean rounded to **one decimal**
  (half up). With no reviews, `average` is `0`.
- The average is **never stored** as its own value, and the client never computes it. If
  a cached copy is kept for speed, it is rebuilt from the distribution, never edited
  directly.
- Example: 92 × 5, 24 × 4, 8 × 3, 3 × 2 and 1 × 1 → total 128, average 587 / 128 = 4.586
  → **4.6**.

### Guest privacy

- `guestName` is the guest's **first name and last-name initial** ("James P."), built by
  the server. The UI shows the first name and uses the initials for the avatar.
- No email, phone number, full surname, address or booking reference is ever returned by
  these endpoints.

## Conventions

- **Dates:** `stayFrom` and `stayTo` are date-only `"YYYY-MM-DD"` (check-in and check-out
  days). `createdAt` is an ISO 8601 instant with an offset, e.g.
  `"2026-10-12T11:20:00+05:30"`. The UI shows dates in Asia/Colombo time.
- **Messages are user-facing English.** The UI shows `message` as-is.

### Error shape

Every error uses the shared shape:

```json
{
  "status": 422,
  "code": "validation_failed",
  "message": "Check the review filters.",
  "fieldErrors": { "rating": "Choose a rating from 1 to 5." }
}
```

| Status | `code` | When |
|---|---|---|
| 401 | `unauthenticated` | No valid staff session |
| 404 | `property_not_found` | Property doesn't exist or belongs to another company |
| 422 | `validation_failed` | A query parameter is invalid; see `fieldErrors` |
| 422 | `invalid_cursor` | The cursor is malformed or no longer valid; the UI reloads the first page |

## Shared shapes

```jsonc
// ReviewSummary (endpoint 1)
{
  "average": 4.6,          // computed, one decimal
  "total": 128,            // sum of the distribution
  "distribution": { "1": 1, "2": 3, "3": 8, "4": 24, "5": 92 }
}

// Review
{
  "id": "rev-1",
  "guestName": "James P.",  // first name + last-name initial
  "rating": 5,              // 1–5
  "comment": "Amazing stay! The room was spotless and the staff were very helpful.", // optional
  "createdAt": "2026-10-12T11:20:00+05:30",
  "stayFrom": "2026-10-10",
  "stayTo": "2026-10-12",
  "unitName": "Room 3",
  "verifiedStay": true      // always true
}

// ReviewPage (endpoint 2)
{
  "reviews": [ /* Review, at most one page */ ],
  "nextCursor": "eyJrIjoiMjAyNi0wOS0yOCIsImlkIjoicmV2LTUifQ", // null on the last page
  "total": 128              // reviews matching rating + query, across all pages
}
```

`comment` is left out (not an empty string) when the guest gave stars only. Every
`distribution` key 1–5 is always present, using `0` for none.

## 1. Get review summary

`GET /v1/properties/{propertyId}/reviews/summary`

**200 OK:** `ReviewSummary` for **all** reviews of the property. It ignores the list's
filters, so the bars always describe the whole property.

```json
{ "average": 4.6, "total": 128, "distribution": { "1": 1, "2": 3, "3": 8, "4": 24, "5": 92 } }
```

A property with no reviews:

```json
{ "average": 0, "total": 0, "distribution": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } }
```

The UI shows "No ratings yet" and "No reviews yet. Guests can review after a verified
stay." for this.

## 2. List reviews

`GET /v1/properties/{propertyId}/reviews?rating=4&sort=newest&query=breakfast&cursor=…`

| Parameter | Required | Rules |
|---|---|---|
| `rating` | no | Integer 1–5. Only reviews with exactly this rating. Left out for all ratings. |
| `sort` | no | `newest` (default), `oldest`, `highest` or `lowest` |
| `query` | no | Trimmed, at most 100 characters. Case-insensitive match in the guest's display name and the comment. An empty value is the same as leaving it out. |
| `cursor` | no | The `nextCursor` from the previous page, unchanged. Left out for the first page. |

**Sort order**, with ties always broken the same way so pages never repeat or skip a
review:

| `sort` | Order |
|---|---|
| `newest` | `createdAt` descending, then `id` |
| `oldest` | `createdAt` ascending, then `id` |
| `highest` | `rating` descending, then `createdAt` descending, then `id` |
| `lowest` | `rating` ascending, then `createdAt` descending, then `id` |

**Paging:**

- The page size is **5**, set by the server; there is no `limit` parameter.
- `nextCursor` is opaque to the client. It should encode the position in the sort order
  (keyset), not a row offset, so that reviews arriving between requests don't shift the
  pages. The mock uses a plain offset only for simplicity.
- A cursor only makes sense with the same `rating`, `sort` and `query` it was issued for.
  The UI always starts again from the first page when any of them changes. A cursor used
  with different filters, or one that can't be read, answers `422 invalid_cursor`.

**200 OK:** `ReviewPage`.

```json
{
  "reviews": [
    {
      "id": "rev-1", "guestName": "James P.", "rating": 5,
      "comment": "Amazing stay! The room was spotless and the staff were very helpful.",
      "createdAt": "2026-10-12T11:20:00+05:30", "stayFrom": "2026-10-10", "stayTo": "2026-10-12",
      "unitName": "Room 3", "verifiedStay": true
    }
  ],
  "nextCursor": "eyJrIjoiMjAyNi0xMC0xMiIsImlkIjoicmV2LTEifQ",
  "total": 128
}
```

With no matching reviews: `{ "reviews": [], "nextCursor": null, "total": 0 }`. The UI then
shows "No reviews match your filters", or "No reviews yet" when the summary total is also
0.

`fieldErrors` keys for `422 validation_failed`: `rating` ("Choose a rating from 1 to 5."),
`sort` ("Choose a valid sort order."), `query` ("Keep the search to 100 characters.").

## Not in this contract

- Creating a review (guest-facing booking flow), and when the guest is invited to write one
- Any staff action on a review: reply, edit, hide, delete, report
- Showing reviews on the public property website
- Ratings for individual aspects such as cleanliness or location

## Open decisions (confirm with the team)

| Topic | Current assumption |
|---|---|
| How long after check-out a guest may review | Not limited yet |
| Removing abusive content | Not possible; would be a Platform Admin process outside this API |
| Page size | 5 |
| What search covers | Guest display name and comment (not room) |
| Rounding of the average | One decimal, half up |
