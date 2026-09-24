# Contributing

Keep changes small, explainable, and within the current product scope.

1. Create a focused branch.
2. Never add credentials or private quotation files.
3. Add a migration for every database change.
4. Keep Gemini behind the extraction boundary and money logic deterministic.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` before opening a pull request.
6. Run `npm run test:e2e` when changing the landing page, demo, or final comparison UI.

Commit messages should describe a coherent feature, fix, test, documentation update, or CI change.
