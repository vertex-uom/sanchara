# Notifications: API contract

System (in-app) notifications for company staff, shown by the bell in the Back Office.
**Never email or WhatsApp.** Today the only source is platform announcements
([announcements-api-contract.md](announcements-api-contract.md)); other modules (bookings,
payments, holds…) can add notifications later without changing the tables.

Follows [backend-architecture.md](backend-architecture.md): REST under `/v1`, one error
shape `{ status, code, message, fieldErrors }`.

## How it works

- **One row per notification, with a recipient rule.** Who sees it: active staff with one
  of its `roles`, in a company whose status is in `company_statuses`, and only company
  `company_id` when set. An "all staff" announcement is one row, not one per person.
- **Per-person state is a receipt**, created only when a staff member reads or dismisses
  a notification.
- **Live** = started, not ended, not withdrawn. Ended and withdrawn notifications
  disappear from every feed.
- **Announcements** (module `notifications`, `AnnouncementNotificationsListener`):
  - `announcement.published` → creates or refreshes the notification for that announcement
    (unique per announcement, so repeated events are harmless);
  - `announcement.withdrawn` → marks it withdrawn;
  - on start-up it catches up with `AnnouncementsService.liveAnnouncements()` in case
    events were missed;
  - recipients: the announcement's roles, in **active and suspended** companies (not
    companies still in setup);
  - severity follows the announcement type, as in the admin console: feature → success,
    maintenance → info, policy → info, reminder → warning, urgent → critical. Category is
    always `system`.

## Staff API

All routes need a staff session (`Authorization: Bearer <staff token>`; 401 otherwise).

| Method and path | Result |
|---|---|
| `GET /v1/notifications` | `200 { items, unreadCount }`: the newest 30 live notifications for this staff member (dismissed ones left out), newest first, and the total unread |
| `POST /v1/notifications/{id}/read` | `204`. Repeating it changes nothing. |
| `POST /v1/notifications/{id}/dismiss` | `204`; also marks it read. `409 NOT_DISMISSIBLE` when it must stay until it ends. |
| `POST /v1/notifications/read-all` | `204`: every live unread notification of this staff member (up to 500) |

`404 NOT_FOUND` when the notification doesn't exist, isn't addressed to this staff member,
isn't live, or was dismissed by them.

Feed item (matches the bell's `NotificationItemData`, plus `dismissible`):

```json
{
  "id": "01a185dd-…",
  "type": "system",
  "severity": "critical",
  "dashboard": "backoffice",
  "title": "Urgent: change your password if you reused it elsewhere",
  "message": "…",
  "createdAt": "2026-10-29T03:30:00.000Z",
  "read": false,
  "dismissible": false
}
```

`actionLabel` and `href` are included only when the notification has a link (none for
announcements). `createdAt` is when the notification went live.

## Adding another source

Another module raises a domain event; the notifications module listens and calls
`NotificationsRepository.upsertFromSource()` with its own `source_type` (e.g.
`reservation`), a category the bell knows (`booking`, `payment`, `hold`, `no_show`,
`review`, `subscription`, `company`, `website`, `system`), the roles and company statuses,
and `company_id` for company-specific notifications. Listeners must be idempotent.

## Database

Migration `backend/prisma/migrations/20261030090000_notifications`.

```sql
CREATE TYPE notification_severity AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'CRITICAL');

CREATE TABLE notifications (
  id               uuid PRIMARY KEY,             -- UUIDv7
  source_type      varchar(40) NOT NULL,         -- 'announcement'
  source_id        uuid NOT NULL,                -- UNIQUE (source_type, source_id)
  category         varchar(20) NOT NULL,         -- the bell's NotificationType
  severity         notification_severity NOT NULL,
  title            varchar(80)  NOT NULL,        -- plain text; CHECK 1..80 after trim
  message          varchar(400) NOT NULL,        -- plain text; CHECK 1..400 after trim
  action_label     varchar(40),                  -- CHECK both or neither with action_href
  action_href      varchar(300),
  roles            staff_role[],                 -- CHECK at least one
  company_statuses company_status[],             -- CHECK at least one
  company_id       uuid REFERENCES companies(id) ON DELETE CASCADE,  -- null = every company
  dismissible      boolean NOT NULL,
  starts_at        timestamptz(3) NOT NULL,
  ends_at          timestamptz(3),               -- CHECK ends_at > starts_at; null = until withdrawn
  withdrawn_at     timestamptz(3),
  created_at       timestamptz(3) NOT NULL DEFAULT now(),
  updated_at       timestamptz(3) NOT NULL
);
CREATE INDEX notifications_live_idx ON notifications (starts_at DESC) WHERE withdrawn_at IS NULL;

CREATE TABLE notification_receipts (
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  staff_id        uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  read_at         timestamptz(3),
  dismissed_at    timestamptz(3),                -- CHECK read_at or dismissed_at set
  PRIMARY KEY (notification_id, staff_id)
);
```

## Frontend

- **Back Office bell:** `features/notifications` (`BackofficeNotifications`). Server Actions
  call this API with the staff token from the `__Host-sanchara_staff` cookie
  (`lib/auth/staff-session.ts`). It loads on mount and when the panel opens; marking as
  read updates at once.
- **Staff sign-in on the frontend isn't built yet**, so there is no staff cookie and the
  bell shows "Sign in to see your notifications." until it is.
- The Platform Admin and traveller bells still use mock data.
