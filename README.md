# Qahwa (قهوة)

> An Arabic-first social coffee diary for Saudi specialty coffee enthusiasts.

Track the coffees you try, earn badges for exploration, and share your taste with
friends — all in a beautifully Arabic-first mobile experience.

## Status

Early development. The foundation is in place; the user-facing features are being
built. What works today:

- Boots on iOS and Android via [Expo Go](https://expo.dev/go)
- Connects to Supabase (auth + database client wired up)
- Renders the brand mark and a database connectivity smoke test

## Tech stack

- [Expo](https://expo.dev) SDK 54 — React Native 0.81, React 19
- [Expo Router](https://docs.expo.dev/router/introduction/) 6 — file-based routing
- TypeScript (strict)
- [NativeWind](https://www.nativewind.dev/) 4 + Tailwind v3 — utility styling
- [Supabase](https://supabase.com) — auth, Postgres, Row-Level Security

## Local development

### Prerequisites

- Node 20+ (tested with 24)
- A Supabase project with a `badges` table seeded
- (Optional) [Expo Go](https://expo.dev/go) on your phone for quick previews

### Setup

```bash
# 1. Clone
git clone https://github.com/aalrehan/QahwaApp.git qahwa
cd qahwa

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Then edit .env with your Supabase URL and anon key

# 4. Start the dev server
npx expo start
```

Scan the QR code with Expo Go on your phone (same Wi-Fi as your dev machine).

> After editing `.env`, fully restart Expo (`Ctrl+C`, then `npx expo start --clear`).
> `EXPO_PUBLIC_*` vars are baked into the bundle at build time, not hot-reloaded.

## Project structure

```
qahwa/
├── app/                 # Screens (Expo Router file-based routing)
│   ├── _layout.tsx      # Root Stack layout, loads global.css
│   └── index.tsx        # Home screen — brand mark + DB smoke test
├── lib/
│   ├── supabase.ts      # Supabase singleton (AsyncStorage adapter)
│   └── theme.ts         # Design tokens (colors + font names)
├── assets/              # Images (and fonts, eventually)
├── global.css           # Tailwind directives
├── tailwind.config.js   # NativeWind v4 + Tailwind v3 config
└── ...                  # Standard Expo + Babel + Metro config
```

For the full session log, see [SESSION_NOTES_2026-05-03.txt](./SESSION_NOTES_2026-05-03.txt).

## Roadmap

- [ ] Custom Arabic typography (IBM Plex Sans Arabic, Tajawal, Amiri, Cormorant Garamond)
- [ ] RTL layout via `I18nManager` + `expo-localization`
- [ ] Auth screens (Supabase magic links)
- [ ] Coffee diary entry flow
- [ ] Badge / achievement display
- [ ] Social feed
