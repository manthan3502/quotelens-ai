# QuoteLens AI build plan

This plan follows the seven-day sequence in the product brief. Work advances only after the current milestone is verified.

## Day 1 — Foundation (complete)

- Initialize a Next.js App Router project with TypeScript, Tailwind CSS, and linting.
- Add the minimum Supabase browser/server clients and environment-variable contract.
- Create PostgreSQL migrations for profiles, comparisons, quotations, private quotation storage, and row-level security.
- Add email/password authentication, session-aware middleware, and sign-out.
- Build the dashboard shell with recent comparisons.
- Build the new-comparison form and an empty comparison workspace that can be reopened.
- Verify with type checking, linting, tests where applicable, and a production build.

Definition of done: a configured user can sign in, create an empty comparison, see it on the dashboard, and reopen it.

## Day 2 — Secure uploads (complete)

Add validated PDF/JPG/JPEG/PNG uploads for 2–5 files, private storage paths, quotation records, and signed document access.

## Day 3 — Gemini extraction (complete)

Add the Zod quotation schema, server-only `@google/genai` extraction service, structured prompt, validation, status handling, and manual retry.

## Day 4 — Review and deterministic pricing (complete)

Add editable human verification, verified JSON persistence, minor-unit pricing calculations with unit tests, and the first comparison table.

## Day 5 — Comparison experience (complete)

Add factual warnings and labels, source-versus-computed mismatch handling, terms comparison, persistence polish, and responsive states.

## Day 6 — Engineering quality (complete)

Add broader tests, GitHub Actions, sample quotations, printable reporting, security documentation, architecture documentation, and a complete README.

## Day 7 — Release (complete)

Validated the sample demo, added a screenshot, fixed release issues, reviewed keyboard labels and mobile overflow, documented deployment, and prepared `v1.0.0`. A live deployment remains an operator step because project credentials and hosting access are intentionally outside the repository.

## Scope boundaries

- Gemini extracts facts; deterministic TypeScript will calculate money.
- Human verification is required before comparison calculations.
- Missing values remain missing and visible.
- No optional P2/P3 features begin before the MVP is complete.
- Secrets stay in local environment files and never enter Git.
