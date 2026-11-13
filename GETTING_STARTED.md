# KhaanaKya?

KhaanaKya? helps people find meals from ingredients already at home. It includes a web app and an optional Electron desktop wrapper. It is not a food ordering or delivery app.

## Run locally

```sh
npm install
npm run db:setup
npm run electron:dev
```

`db:setup` starts the local Supabase stack, applies migrations, seeds the food catalog, validates it, and creates `.env.local` using only the local public anon key. Docker Desktop must be running. To run the renderer in a browser instead, use `npm run dev`. For a hosted Supabase project, configure its URL and publishable/anon key in `.env.local`, then apply the migrations with the Supabase CLI.

`db:setup` resets the local database before setup; use it for initial setup or when you are comfortable replacing local database contents. To reseed the catalog without resetting or check it independently, run `npm run db:seed` or `npm run db:validate`.

For the hosted Supabase project, sign in the Supabase CLI and run `npm run db:push:remote`. This applies pending migrations without resetting the database; it creates the account-owned `user_data` table and the recipe catalog. Then seed and validate the catalog with `DATABASE_URL` set to the hosted Postgres connection string: `npm run db:seed` and `npm run db:validate`. Keep the database password out of committed files and browser `VITE_` variables.

## Build

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run electron:build
```

Electron Builder writes a platform-specific package to `release/`. The macOS package is unsigned; macOS may require confirmation before opening it.

## Accounts and cloud sync

Email/password accounts and planner sync use Supabase Auth and Postgres.

The local `npm run db:setup` flow applies the account and catalog migrations together. For a hosted deployment, configure `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, then use `npm run db:push:remote` to apply migrations non-destructively. If your network reports that IPv6 is unsupported, copy the actual Session Pooler URI from the project's Connect menu and run `npx supabase db push --remote="<full session pooler URI>" --yes`; replace the example text with the full URI, and never commit the URI or its database password. The browser key is public; never put a `service_role` key in a `VITE_` variable. In Supabase Auth URL Configuration, set the local Site URL to `http://localhost:5173` and allow your local and deployed web-app origins as redirect URLs. Keep email confirmation enabled and configure a production SMTP provider in the Supabase project's Auth settings before inviting real users; Supabase's built-in email service is restricted and rate-limited. `VITE_SUPABASE_REDIRECT_URL` can override the default current origin for a deployed site.

The first account created on a device imports that device's existing planner data after its first successful sign-in. Guest mode remains available and keeps data on the device. Authenticated planner data is stored in the account's Supabase row and cached separately on that device. The packaged Electron app remains usable in guest mode; email-link callbacks are configured for the web app.

## Integrations

- **Recipes and recommendations:** 120 Indian-first recipes and 410 ingredients are loaded from the normalized Supabase catalog. Matching is deterministic and explainable, with dietary and allergen filters, cuisine and goal preferences, availability, estimated budget and preparation time.
- **Ingredient prices and nutrition:** seed nutrition uses rounded representative estimates guided by IFCT 2017 (ICMR-NIN) and USDA FoodData Central, with illustrative INR prices. These are not direct IFCT table transcriptions, live/local market prices, lab analyses, or medical advice. Recipe nutrition is calculated from ingredient quantities and servings in the `recipe_nutrition` SQL view.
- **Persistence:** guest profile, preferences, ingredient quantities, favorites, comparisons and shopping items use browser/Electron local storage. Signed-in web accounts sync those planner details to Supabase.
- **Photography and typography:** Unsplash and Google Fonts are requested over the network. The app still has system-font fallbacks, but remote images and fonts need internet access.
- **Not connected:** live price or nutrition sources, analytics, inventory, and a support inbox. No grocery ordering or payment flow is included.

Existing data can be cleared by removing this app's local storage from the browser or Electron profile.
