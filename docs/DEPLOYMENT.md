# Deployment and release checklist

QuoteLens AI v1 is designed for Vercel with a hosted Supabase project. Deployment requires project-owner credentials, so the repository prepares the release without storing or applying secrets.

## 1. Prepare Supabase

1. Create or select the production Supabase project.
2. Run every file in `supabase/migrations` in filename order with the Supabase SQL editor or CLI.
3. Confirm the `quotations` Storage bucket exists and is private.
4. Confirm Row Level Security is enabled on `profiles`, `comparisons`, `quotations`, and `storage.objects` policies restrict paths to the signed-in user.
5. In Authentication URL Configuration, set the deployed site URL and allow `https://<your-domain>/auth/callback`.
6. Keep email confirmation enabled or disabled according to the intended signup flow, then test that choice before launch.

## 2. Configure Vercel

Import the GitHub repository and set these variables for Production and Preview as appropriate:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anonymous key protected by RLS |
| `GEMINI_API_KEY` | Yes for extraction | Server-only Gemini API key |
| `GEMINI_MODEL` | No | Defaults to `gemini-3.8-flash` |

`SUPABASE_SERVICE_ROLE_KEY` is not used by the v1 application and should be omitted. Never prefix Gemini or service-role credentials with `NEXT_PUBLIC_`.

Use Node.js 22 and the default build command, `npm run build`.

## 3. Release smoke test

After deployment:

1. Open `/demo` on desktop and a narrow mobile viewport.
2. Sign up or sign in, then create and reopen a comparison.
3. Upload two fictional source files from `examples/quotations` and reject an invalid file.
4. Preview and download a source file, then delete and re-upload it.
5. Extract both quotations, including one retry, and verify no API key appears in browser requests or rendered HTML.
6. Review and confirm every extracted quotation.
7. Check computed totals, source-total differences, terms, missing data, and currency warnings.
8. Refresh and reopen the comparison, then print or export its report.
9. Sign out and confirm protected pages and file routes return to `/login`.

Check Vercel function logs for `quotation_extraction_completed` and `quotation_extraction_failed`. Each extraction event includes a request ID, comparison ID, quotation ID, user ID, model, and duration.

## 4. Release

Deploy the commit tagged `v1.0.0`. Create the GitHub release from that tag with the matching entry from `CHANGELOG.md` after the production smoke test passes.
