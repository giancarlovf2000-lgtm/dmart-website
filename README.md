# D'Mart Institute — Website

Production website for D'Mart Institute, a vocational school in Puerto Rico with campuses in Barranquitas and Vega Alta.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database & Auth:** Supabase
- **Deployment:** Vercel

## Prerequisites

- Node.js 18.17 or later
- A Supabase project
- npm or yarn

## Local Development Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd dmart-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase project under **Settings > API**.

### 4. Set up Supabase database

Run the migration file against your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or manually: copy the contents of supabase/migrations/001_initial_schema.sql
# and run it in the Supabase SQL editor
```

Then seed the database:

```bash
# Copy contents of supabase/seed.sql and run in Supabase SQL editor
# Or via CLI:
supabase db reset --db-url your-db-url < supabase/seed.sql
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript compiler check |

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/
    layout/         # Navbar, Footer
    sections/       # Page section components (Hero, CTABanner, etc.)
    ui/             # Reusable UI primitives (Button, Card, Badge, etc.)
    forms/          # Form components
  lib/
    supabase/       # Supabase client (browser + server)
    types.ts        # TypeScript interfaces
    utils.ts        # Utility functions
supabase/
  migrations/       # SQL migration files
  seed.sql          # Initial data seed
```

## Vercel Deployment

### Option A — Vercel Dashboard (Recommended)

1. Push your code to a GitHub/GitLab repository.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Next.js.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

Follow the prompts and set environment variables when asked.

## Supabase Row Level Security

The migrations enable RLS on all tables. Public read access is granted on `campuses`, `categories`, `programs`, and `program_campuses`. The `leads` table is insert-only for anonymous users (no read-back).

## Leads / CRM

All form submissions land in the `leads` table in Supabase. You can view them in the Supabase Table Editor or connect a tool like Retool/Metabase for a CRM view.

## Content Updates

- **Programs & Campuses:** Update via Supabase Table Editor or SQL.
- **Site settings:** The `site_settings` table holds key/value pairs for easy content updates without code changes.
- **Documents/Catalog:** Upload PDFs to Supabase Storage and add rows to the `documents` table.
