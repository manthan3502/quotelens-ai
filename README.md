# QuoteLens AI

QuoteLens AI is a quotation comparison workspace for turning inconsistent vendor documents into reviewable structured data and deterministic cost comparisons. The app includes Supabase authentication, private PDF/image quotation uploads, short-lived signed file access, server-side Gemini extraction validated with Zod, mandatory human verification, and minor-unit financial calculations.

## Local setup

1. Create a Supabase project.
2. Run the SQL files in `supabase/migrations` in filename order using the Supabase SQL editor or CLI.
3. Copy `.env.example` to `.env.local` and add the Supabase URL and anon key. Keep the service-role and Gemini keys server-side.
4. Add `http://localhost:3000/auth/callback` to the Supabase authentication redirect URLs.
5. Run `npm install` and `npm run dev`.

The full milestone sequence and current scope are in `docs/BUILD_PLAN.md`.

Day 2 adds `supabase/migrations/202609240001_secure_quotation_uploads.sql`. Apply it after the Day 1 migration before testing quotation uploads.

Day 3 adds `supabase/migrations/202609240002_extraction_status_details.sql`. Apply it before extraction, then set `GEMINI_API_KEY` and optionally override `GEMINI_MODEL` in `.env.local`. Automated tests use a mocked generator and never call Gemini.

Day 4 adds `supabase/migrations/202609240003_verified_quotation_metadata.sql`. Apply it before saving reviewed quotation data.
