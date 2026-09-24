# QuoteLens AI

QuoteLens AI is a quotation comparison workspace for turning inconsistent vendor documents into reviewable structured data and deterministic cost comparisons. This repository currently contains the Day 1 foundation: Supabase authentication, the protected dashboard, and persistent empty comparisons.

## Local setup

1. Create a Supabase project.
2. Run `supabase/migrations/202609230001_day_one_foundation.sql` in the Supabase SQL editor or with the Supabase CLI.
3. Copy `.env.example` to `.env.local` and add the Supabase URL and anon key. Keep the service-role and Gemini keys server-side.
4. Add `http://localhost:3000/auth/callback` to the Supabase authentication redirect URLs.
5. Run `npm install` and `npm run dev`.

The full milestone sequence and current scope are in `docs/BUILD_PLAN.md`.
