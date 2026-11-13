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

For a hosted Supabase project, apply the migrations in order, then seed and validate the recipe catalog using `DATABASE_URL` and `npm run db:seed` / `npm run db:validate`. Never put the database password in browser `VITE_` variables.

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

Email/password accounts and planner sync use Supabase Auth and Postgres. The application stores each account's complete planner state (profile, preferences, ingredient quantities, favorites, comparisons, recent recipes, and shopping list) in a single `public.user_data` JSONB row keyed by the authenticated user ID. That matches the existing app model; it does not create separate profile, recipe, shopping-list, or preference tables. The recipe and ingredient catalog is shared, read-only data in separate tables.

### Create and configure a hosted Supabase project

1. Create a project in the Supabase dashboard and wait for its database to finish provisioning.
2. In **Project Settings → API** (or **API Keys**, depending on the dashboard version), copy the **Project URL** and a **publishable** (`sb_publishable_...`) or legacy **anon/public** key. Never use the `service_role` or secret key in this frontend.
3. In the project's **SQL Editor**, run the contents of these existing migrations in timestamp order:
   - [`supabase/migrations/20261112000000_create_user_data.sql`](./supabase/migrations/20261112000000_create_user_data.sql) creates the account-data table and owner-only RLS policies.
   - [`supabase/migrations/20261112010000_create_recipe_catalog.sql`](./supabase/migrations/20261112010000_create_recipe_catalog.sql) creates the public read-only recipe catalog and nutrition view.
4. Seed the catalog from a trusted development machine. Use the project's **Session pooler** connection string (not a browser variable) as `DATABASE_URL`, then run `npm run db:seed` and `npm run db:validate`. Do not paste the connection string or its password into source control, `.env`, or chat. The seed command is an upsert for catalog rows; it does not create user data.
5. In **Authentication → URL Configuration**, set the Site URL to `http://localhost:5173`. Add these redirect URLs to the allow list: `http://localhost:5173/**`, `http://127.0.0.1:5173/**`, and `khaanakya://auth/callback`.
6. In **Authentication → Providers**, enable Email. Configure SMTP before inviting real users; Supabase's default email service is restricted and rate-limited.

Create a local `.env` or `.env.local` in the project root (both are ignored by git). The public anon key and publishable key are alternatives; configure one:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
# Or, instead of VITE_SUPABASE_ANON_KEY:
# VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
# Leave unset to use the current web origin or Electron's khaanakya://auth/callback link:
# VITE_SUPABASE_REDIRECT_URL=
```

Restart Vite/Electron after changing environment variables. `VITE_` values are shipped to the renderer; use only the public key. The SQL migrations can be applied manually as above, or with the Supabase CLI after linking it to your own project (`npx supabase link --project-ref YOUR_PROJECT_REF`, then `npm run db:push:remote`). The script does not reset a hosted database.

Sign-up, login, logout, session restoration, password reset and email verification use Supabase Auth. The first successful account sign-in copies existing guest planner state into that account without deleting the device's guest copy. Later account changes are synced to `user_data` and cached locally. Electron uses a registered `khaanakya://auth/callback` deep link for confirmation and password-reset links; the project must allow that redirect URL. Build/reinstall the desktop app after changing its protocol configuration.

Guest planner data remains on the device. Without a configured Supabase project (or a local Supabase stack created with `npm run db:setup`), account features and the remote recipe/ingredient catalog are unavailable; guest-only data remains local, but recipe browsing requires the catalog connection.

## Integrations

- **Recipes and recommendations:** 120 Indian-first recipes and 410 ingredients are loaded from the normalized Supabase catalog. Matching is deterministic and explainable, with dietary and allergen filters, cuisine and goal preferences, availability, estimated budget and preparation time.
- **Ingredient prices and nutrition:** seed nutrition uses rounded representative estimates guided by IFCT 2017 (ICMR-NIN) and USDA FoodData Central, with illustrative INR prices. These are not direct IFCT table transcriptions, live/local market prices, lab analyses, or medical advice. Recipe nutrition is calculated from ingredient quantities and servings in the `recipe_nutrition` SQL view.
- **Persistence:** guest profile, preferences, ingredient quantities, favorites, comparisons and shopping items use browser/Electron local storage. Signed-in web and Electron accounts sync those planner details to Supabase.
- **Photography and typography:** Unsplash and Google Fonts are requested over the network. The app still has system-font fallbacks, but remote images and fonts need internet access.
- **Not connected:** live price or nutrition sources, analytics, inventory, and a support inbox. No grocery ordering or payment flow is included.

Existing data can be cleared by removing this app's local storage from the browser or Electron profile.
