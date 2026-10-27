-- Data only: an "added" audit entry for every platform admin created before
-- src/create-admin.ts started recording one. Safe to re-run.
INSERT INTO "audit_entries" ("id", "occurred_at", "actor_type", "actor_id", "company_id", "action", "entity_type", "entity_id", "details")
SELECT gen_random_uuid(), a."created_at", 'SYSTEM', NULL, NULL, 'platform_admin.created', 'platform_admin', a."id", '{"via": "backfill"}'::jsonb
FROM "platform_admins" a
WHERE NOT EXISTS (
  SELECT 1 FROM "audit_entries" e
  WHERE e."entity_type" = 'platform_admin' AND e."entity_id" = a."id" AND e."action" = 'platform_admin.created'
);
