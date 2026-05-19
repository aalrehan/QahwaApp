# قهوة — Qahwa

> An Arabic-first social coffee diary for Saudi specialty coffee enthusiasts.

Track the coffees you try, discover cafés, earn badges for exploration, and share
your taste with friends — all in a beautifully crafted Arabic-first mobile
experience built with Expo and Supabase.

---

## Features

- **Multi-step coffee log** — a guided 6-step form: café search → brew method → origin → aroma → visual notes → flavor notes & ratings
- **Social feed** — realtime feed of community coffee logs powered by Supabase Realtime, with likes
- **Café discovery** — browse the top 10 cafés, search by name, and view café details
- **Personal diary** — your own chronological log of every coffee you've recorded
- **Shareable coffee cards** — generate beautiful PNG cards from any log entry to share on social media
- **Profile system** — username, avatar, bio, stats, and a badge/achievement system
- **Email OTP authentication** — passwordless sign-in via Supabase Auth (email one-time password)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81.5, React 19 |
| Routing | Expo Router 6 (file-based) |
| Language | TypeScript (strict mode) |
| Styling | NativeWind 4 + Tailwind CSS |
| Backend | Supabase — Auth, Postgres, Row-Level Security, Realtime |
| Fonts | IBM Plex Sans Arabic, Tajawal, Amiri, Cormorant Garamond |

## Project Structure

```
qahwa/
├── app/                          # Expo Router file-based routes
│   ├── _layout.tsx               # Root layout — loads fonts, global CSS, auth context
│   ├── index.tsx                 # Entry redirect
│   ├── (auth)/
│   │   ├── _layout.tsx           # Auth group layout
│   │   └── login.tsx             # Email OTP login screen
│   └── (app)/
│       ├── _layout.tsx           # Authenticated app layout
│       ├── profile-setup.tsx     # First-time profile creation
│       ├── edit-profile.tsx      # Edit profile screen
│       ├── user/[username].tsx   # Public user profile
│       ├── log/
│       │   ├── new.tsx           # New coffee log (6-step form)
│       │   └── [id].tsx          # Single log detail view
│       └── (tabs)/
│           ├── _layout.tsx       # Tab bar layout
│           ├── index.tsx         # Social feed (home)
│           ├── discover.tsx      # Café discovery
│           ├── log.tsx           # Quick-log entry point
│           ├── diary.tsx         # Personal coffee diary
│           └── profile.tsx       # Your profile
├── components/
│   ├── CoffeeLogCard.tsx         # Card component for feed/diary entries
│   ├── ShareableCoffeeLogCard.tsx# Render-to-PNG shareable card
│   ├── EmptyState.tsx            # Empty state placeholder
│   ├── SkeletonCard.tsx          # Loading skeleton
│   ├── ui/                       # Shared UI primitives
│   └── log-form/                 # 6-step log form components
│       ├── Step1Setup.tsx        # Café search & brew method
│       ├── Step2Cup.tsx          # Cup details & origin
│       ├── Step3Aroma.tsx        # Aroma profile
│       ├── Step4Visual.tsx       # Visual notes
│       ├── Step5Flavors.tsx      # Flavor notes & tags
│       ├── Step6Final.tsx        # Final ratings & submit
│       ├── StepHeader.tsx        # Step indicator header
│       └── StepFooter.tsx        # Navigation footer (back/next)
├── lib/
│   ├── supabase.ts               # Supabase client singleton (AsyncStorage adapter)
│   ├── auth.ts                   # Auth helpers (OTP send/verify, session)
│   ├── types.ts                  # Shared TypeScript types
│   ├── theme.ts                  # Design tokens (colors, font names)
│   ├── constants.ts              # App-wide constants
│   ├── feed.ts                   # Social feed queries + realtime subscriptions
│   ├── discover.ts               # Café discovery queries (top 10, search)
│   ├── profile.ts                # Profile CRUD operations
│   ├── profile-stats.ts          # Profile statistics (log count, badges, etc.)
│   ├── flavor-notes.ts           # Flavor note catalog
│   ├── log-form-context.tsx      # React Context for multi-step log form state
│   └── share-log.ts              # Shareable card generation (render to PNG)
├── assets/                       # Icons, images, splash screen
├── global.css                    # Tailwind directives
├── tailwind.config.js            # NativeWind v4 + Tailwind config
├── app.json                      # Expo config
└── tsconfig.json
```

## Database Schema (Supabase)

| Table | Purpose |
|---|---|
| `profiles` | User profiles (username, display name, avatar, bio) |
| `coffee_logs` | Individual coffee log entries (café, brew method, ratings, notes) |
| `cafes` | Café directory (name, location, metadata) |
| `flavor_notes` | Master list of flavor descriptors |
| `log_flavor_notes` | Many-to-many: links logs to their flavor notes |
| `likes` | Social likes on coffee logs |
| `badges` | Achievement/badge definitions |
| `user_badges` | Many-to-many: badges earned by users |

All tables are protected with Supabase Row-Level Security policies.

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- A [Supabase](https://supabase.com) project with the tables above provisioned
- (Optional) [Expo Go](https://expo.dev/go) on your phone for device previews

### Installation

```bash
# Clone the repository
git clone https://github.com/aalrehan/QahwaApp.git qahwa
cd qahwa

# Install dependencies
npm install

# Copy the environment template and fill in your Supabase credentials
cp .env.example .env
```

### Environment Variables

Edit `.env` with your Supabase project credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

> **Note:** `EXPO_PUBLIC_*` variables are embedded at build time. After changing
> `.env`, fully restart the dev server: `Ctrl+C` then `npx expo start --clear`.

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go (phone and dev machine must be on the same Wi-Fi network).

## Build Configuration

| Setting | Value |
|---|---|
| App slug | `qahwa` |
| iOS bundle ID | `com.qahwa.app` |
| Android package | `com.qahwa.app` |
| Orientation | Portrait only |
| Platforms | iOS + Android |
| New Architecture | Enabled |
| Edge-to-edge (Android) | Enabled |

## Typography

The app uses four Arabic-optimized font families:

- **IBM Plex Sans Arabic** — primary body text
- **Tajawal** — UI labels and secondary text
- **Amiri** — decorative/headline Arabic calligraphy
- **Cormorant Garamond** — Latin accent text

## License

Private — all rights reserved.
