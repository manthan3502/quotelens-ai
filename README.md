# QuoteLens AI

QuoteLens AI is a quotation comparison workspace for turning inconsistent vendor documents into reviewable structured data and deterministic cost comparisons. The current foundation includes Supabase authentication, persistent comparisons, and private PDF/image quotation uploads with short-lived signed file access.

## Local setup

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in filename order using the Supabase SQL editor or CLI.
3. Copy `.env.example` to `.env.local` and add the Supabase URL and anon key. Keep the service-role and Gemini keys server-side.
4. Add `http://localhost:3000/auth/callback` to the Supabase authentication redirect URLs.
5. Run `npm install` and `npm run dev`.

The full milestone sequence and current scope are in `docs/BUILD_PLAN.md`.

Day 2 adds `supabase/migrations/202609240001_secure_quotation_uploads.sql`. Apply it after the Day 1 migration before testing quotation uploads.
