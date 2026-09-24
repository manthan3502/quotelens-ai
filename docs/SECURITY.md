# Security model

## Authentication and authorization

- Supabase Auth manages accounts and sessions.
- Protected layouts and every mutating server action verify the current user.
- PostgreSQL Row Level Security restricts comparisons and quotations to their owner.
- Quotation policies derive ownership through the parent comparison.

## Document storage

- The `quotations` bucket is private.
- Storage paths begin with the authenticated user ID and comparison ID.
- Storage RLS prevents users from reading or changing another user’s objects.
- Preview and download routes first query the quotation under RLS, then issue a signed URL valid for 60 seconds.
- Uploads accept PDF, PNG, and JPEG only, with a 10 MB per-file limit and a maximum of five files per comparison.
- Validation checks extension, declared MIME type, and file signature. Generated object names use random UUIDs rather than source filenames.
- Failed multi-file operations attempt to remove objects already uploaded in that batch.

## Secrets

- `.env.local` and all `.env*` files except `.env.example` are ignored by Git.
- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only.
- The v1 application does not use the service-role key in user flows.
- Logs exclude API keys, full documents, and extracted document contents.

## AI boundary

Only private document bytes and the extraction instructions are sent to Gemini. Secret configuration is never included in the prompt. Gemini output is untrusted until it passes Zod and a user confirms it.

## Financial integrity

- Calculations convert money to integer minor units.
- Missing essential fields produce an incomplete result instead of a misleading zero.
- Currency mismatches prevent comparison.
- Source and computed totals remain separate, with mismatches displayed.

## Deployment checklist

1. Apply all versioned migrations.
2. Keep the storage bucket private and verify RLS remains enabled.
3. Configure only the anon key as browser-visible.
4. Add exact local and production auth callback URLs.
5. Use HTTPS in production.
6. Review platform request-size limits against the app’s 10 MB per-file rule.
7. Rotate any key immediately if it appears in logs or Git history.
