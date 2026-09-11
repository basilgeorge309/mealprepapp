# Portion

An iOS-first Expo meal planner centered on macros, budget, and real-life adjustments.

## Run locally

```bash
npm install
npm start
```

Use `i` for the iOS simulator or `w` for a web preview. The app works in sample mode without cloud credentials. Copy `.env.example` to `.env.local` and add Supabase values to enable sign-in, cloud persistence, and server-side AI interpretation.

## Supabase

1. Create a Supabase project and run `supabase/migrations/001_initial.sql`.
2. Deploy `supabase/functions/api/index.ts` as the `api` function.
3. Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` as Supabase secrets. Never expose them as `EXPO_PUBLIC_*` variables.

The API uses optimistic version checks so concurrent edits cannot silently overwrite a plan. Structured Outputs validate AI meal interpretation; all nutrition and grocery totals remain deterministic and catalog-backed.

## Checks

```bash
npm run typecheck
npm test
```

This repository contains the Portion macro meal planner app.
