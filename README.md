# FitForge AI

**Live app: [fitforge-ai-blond.vercel.app](https://fitforge-ai-blond.vercel.app)**

An AI-powered personal fitness app built with Next.js, Claude API, Supabase, and Google OAuth. FitForge AI generates personalized weekly workout plans, tracks nutrition with AI-assisted macro calculation, and provides a personal AI coach that knows your goals and progress.

---

## Features

- **AI Workout Planner** — Describe your schedule, equipment, and restrictions in plain English. Claude generates a personalized 7-day workout plan. Plans are saved per week and can be edited or regenerated at any time.
- **Live Workout Sessions** — Start any workout, check off exercises as you go, and track elapsed time. Completed workouts are automatically logged to your history.
- **Nutrition Tracker** — Log meals manually or describe what you ate in plain English and let AI calculate the calories, protein, carbs, and fat. Set custom macro goals and track daily progress.
- **Monthly Calendar** — Visual overview of completed workouts, upcoming sessions, missed days, and streaks with color-coded day cells.
- **Home Dashboard** — Daily overview showing today's workout, stats (streak, weekly progress, calories, protein), the full week plan, and an AI coach chatbox.
- **AI Coach** — A persistent chat interface that knows your workout plan, nutrition data, and goals. Ask anything — form tips, post-workout meals, exercise tutorials, motivation, or general fitness advice.
- **Responsive Design** — Full desktop layout with sidebar navigation and a mobile layout with bottom tab bar. Works as a web app and is designed for Capacitor iOS wrapping.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Auth | Custom Google OAuth + JWT sessions |
| Database | Supabase (PostgreSQL) |
| Styling | Inline styles (no Tailwind) |
| Deployment | Vercel |

---

## Project Structure

```
fitforge-ai/
├── middleware.ts                    # Route protection (auth redirects)
├── lib/
│   ├── auth.ts                      # JWT session helpers
│   └── supabase.ts                  # Supabase client + all DB functions
├── hooks/
│   └── useSession.tsx               # Session context + signIn/signOut helpers
├── app/
│   ├── layout.tsx                   # Root layout with SessionProvider
│   ├── page.tsx                     # Landing page (non-logged-in visitors)
│   ├── providers.tsx                # SessionProvider wrapper
│   ├── app/
│   │   └── page.tsx                 # Main app shell at /app route
│   ├── signin/
│   │   └── page.tsx                 # Google sign-in page
│   ├── components/
│   │   ├── HomeTab.tsx              # Home dashboard
│   │   ├── WorkoutTab.tsx           # Workout planner + session tracker
│   │   ├── CalendarTab.tsx          # Monthly calendar
│   │   └── NutritionTab.tsx         # Nutrition tracker
│   └── api/
│       ├── oauth/
│       │   ├── start/route.ts       # Initiates Google OAuth flow
│       │   ├── callback/google/
│       │   │   └── route.ts         # Google OAuth callback + session cookie
│       │   ├── session/route.ts     # Returns current session user
│       │   └── signout/route.ts     # Clears session cookie
│       ├── generate-plan/
│       │   └── route.js             # AI workout plan generator
│       ├── chat/
│       │   └── route.js             # AI trainer chat (workout adjustments)
│       ├── meal-calc/
│       │   └── route.js             # AI nutrition calculator
│       └── coach/
│           └── route.js             # AI home coach
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- A Google Cloud project with OAuth 2.0 credentials
- An Anthropic API key

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/fitforge-ai.git
cd fitforge-ai
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

AUTH_SECRET=your_random_secret
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Set up Supabase

Run the following SQL in your Supabase SQL Editor:

```sql
-- Workout plans (one per user per week)
create table workout_plans (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  week_key text not null,
  plan jsonb not null,
  created_at timestamp with time zone default now(),
  unique(user_id, week_key)
);

-- Workout logs (one per user per day)
create table workout_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  log_date text not null,
  day_name text,
  duration text,
  exercise_count integer,
  time_elapsed integer,
  created_at timestamp with time zone default now(),
  unique(user_id, log_date)
);

-- Nutrition logs (one per user per day)
create table nutrition_logs (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  log_date text not null,
  meals jsonb not null,
  created_at timestamp with time zone default now(),
  unique(user_id, log_date)
);

-- Nutrition goals (one per user)
create table nutrition_goals (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  calories integer,
  protein integer,
  carbs integer,
  fat integer,
  unique(user_id)
);

-- Disable RLS and grant permissions
alter table workout_plans disable row level security;
alter table workout_logs disable row level security;
alter table nutrition_logs disable row level security;
alter table nutrition_goals disable row level security;

grant all on workout_plans to anon, authenticated;
grant all on workout_logs to anon, authenticated;
grant all on nutrition_logs to anon, authenticated;
grant all on nutrition_goals to anon, authenticated;
grant usage on schema public to anon, authenticated;
```

### 4. Set up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID
4. Set Authorized redirect URIs to:
   - `http://localhost:3000/api/oauth/callback/google` (development)
   - `https://your-vercel-url.vercel.app/api/oauth/callback/google` (production)

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Routing

| Route | Description |
|---|---|
| `/` | Landing page — redirects to `/app` if logged in |
| `/signin` | Google sign-in page |
| `/app` | Main app (requires auth, redirects to `/signin` if not) |

---


```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init FitForge com.yourname.fitforge
npx cap add ios
npx cap sync ios
npx cap open ios
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | Random secret for JWT session signing |
| `NEXTAUTH_URL` | Your app's base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

---

## License

MIT