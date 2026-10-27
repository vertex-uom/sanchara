# Directory: API contract

What the NestJS back end provides for the central site's **Discover** page
(`/properties`): the property cards, the featured stays and the type filter. Public: no
sign-in. The front end currently uses a fixture (`frontend/src/features/directory/server/`);
swapping it for these calls is the next step.

Follows [backend-architecture.md](backend-architecture.md): REST under `/v1`, one error
shape `{ status, code, message, fieldErrors }`.

## Endpoints at a glance

| # | Method and path | Purpose |
|---|---|---|
| 1 | `GET /v1/directory/properties` | One page of property cards, with the total and per-type counts |
| 2 | `GET /v1/directory/featured` | Featured placements, in rank order |
| 3 | `GET /v1/directory/property-types` | Active property types, for the filter and chips |

## Rules

- Only **listed** properties (`properties.is_listed`) of **ACTIVE** companies appear.
  Pending-setup and suspended companies are hidden.
- **Property types come from the database** (`property_types`). Clients send the `code`
  (e.g. `GUEST_HOUSE`) and show the `name`. The front end must not hard-code its own list.
- `rating` is the average of **published** reviews, rounded to one decimal, or `null` when
  there are none. A trigger on `reviews` keeps it current. `reviewCount` counts the same reviews.
- `minRating` compares against the rounded rating, so a card showing 4.8 passes `4.8`.
- `websiteHost` is the company site, `{subdomain}.PLATFORM_DOMAIN`.
- `imageUrl` is the cover photo: a site-relative path served by the web app's `public`
  folder (e.g. `/Properties/Sunrise%20Villa.jpg`) or an https URL. It is `null` when there is no cover.

## 1. Search

`GET /v1/directory/properties`

| Parameter | Required | Rule |
|---|---|---|
| `location` | no | At most 80 characters. Exact town or district, ignoring case and spacing. |
| `name` | no | At most 80 characters. Case-insensitive part of the name (`%` and `_` are literal). |
| `type` | no | Repeatable (`?type=VILLA&type=COTTAGE`). Active type codes only. An unknown code returns 400. |
| `minRating` | no | `4`, `4.5` or `4.8` |
| `sort` | no | `recommended` (default), `rating` or `reviews` |
| `page` | no | Integer 1–50, default 1. A page past the end returns the last page. |
| `pageSize` | no | Integer 1–48, default 9 |

Empty values (blank form fields) are treated as left out. Unknown parameters are refused.

| `sort` | Order |
|---|---|
| `recommended` | featured first by rank, then rating, then review count |
| `rating` | rating descending (no rating last), then review count |
| `reviews` | review count descending, then rating |

Every order ends in the property id, so pages never overlap or skip.

```jsonc
{
  "items": [
    {
      "slug": "sunrise-villa",
      "name": "Sunrise Villa",
      "town": "Pinnawala",
      "district": "Matale",
      "type": { "code": "VILLA", "name": "Villa" },
      "rating": 4.8,              // null: no reviews yet
      "reviewCount": 128,
      "featured": true,
      "websiteHost": "sunrisevilla.sanchara.lk",
      "imageUrl": "/Properties/Sunrise%20Villa.jpg"  // null: no cover photo
    }
  ],
  "page": 1,                       // the page shown (clamped)
  "pageSize": 9,
  "total": 67,                     // matches across all pages
  "pageCount": 8,                  // at least 1
  "typeCounts": [                  // every active type, catalogue order; ignores the type filter
    { "code": "GUEST_HOUSE", "name": "Guest House", "count": 11 }
  ]
}
```

## 2. Featured

`GET /v1/directory/featured?limit=8`. `limit` is 1–24, default 8. It returns an array of the same
card shape, ordered by featured rank.

## 3. Property types

`GET /v1/directory/property-types` returns `[{ "code": "GUEST_HOUSE", "name": "Guest House" }, …]`
in catalogue order.

## Errors

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | A parameter is invalid or a type code is unknown; see `fieldErrors` |

## Data

| Table | Owner | Holds |
|---|---|---|
| `properties` | properties | Card fields, plus `is_listed`, `is_featured`/`featured_rank` and the trigger-kept `rating_avg`/`review_count` |
| `property_images` | properties | Photos per property; one `is_cover` per property (partial unique index) |
| `reviews` | reviews | One row per review: `rating` 1–5, optional `comment`, `status` `PUBLISHED`/`HIDDEN` |

Development data: `make seed` adds 67 listed demo properties (each with its own demo
company), cover photos from `frontend/public/Properties`, 60 demo guests and about 7,700 reviews.

## Open decisions

- Reviews are not yet linked to a reservation. [reviews-api-contract.md](reviews-api-contract.md)
  requires one review per stayed reservation. That link (`reservation_id`, unique) is added
  when reservations exist.
- Who may set `is_listed` and `is_featured` (Back Office or Platform Admin) is not decided.
  Today only the dev seed sets them.
