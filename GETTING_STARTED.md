# KhaanaKya?

KhaanaKya? is an Electron desktop prototype for finding meals from ingredients already at home. It is not a food ordering or delivery app.

## Run locally

```sh
npm install
npm run electron:dev
```

The Electron window connects to the Vite development server. To run the renderer in a browser instead, use `npm run dev`.

## Build

```sh
npm run lint
npm test
npm run build
npm run electron:build
```

Electron Builder writes a platform-specific package to `release/`. The macOS package is unsigned; macOS may require confirmation before opening it.

## Prototype integrations

- **Recipes and recommendations:** 30 local sample recipes are ranked by ingredient match, food preference, goals, budget, cuisine and preparation time. Set `VITE_API_BASE_URL` in a local `.env` file to post the recommendation payload to `{base URL}/recommendations`. API errors are surfaced instead of silently switching back to mock results.
- **Ingredient prices and nutrition:** illustrative local data only. It is not live, location-specific or medical advice.
- **Persistence:** profile, preferences, ingredient quantities, favorites, comparisons and shopping items use browser/Electron local storage.
- **Photography and typography:** Unsplash and Google Fonts are requested over the network. The app still has system-font fallbacks, but remote images and fonts need internet access.
- **Not connected:** FastAPI and SQLite, live price or nutrition sources, analytics, store locations, map data, inventory, account sync and a support inbox. No grocery ordering or payment flow is included.

Existing data can be cleared by removing this app's local storage from the browser or Electron profile.
