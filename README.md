# CyberSentry India

The official national portal for cyber fraud awareness and prevention in India. CyberSentry is a Next.js web platform designed to report, track, and alert citizens against regional digital threats and organized cyber fraud.

## Architecture & Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS & shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Geodata**: React Simple Maps & D3

## Environment
To run the local development server, you must have a `.env.local` containing your Supabase project keys:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Running the Application

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Administrator Capabilities
- View an interactive heatmap of regional cyber fraud alerts.
- Approve/Revoke publisher credentials dynamically from the Security Dashboard (`/harsh`).
- Read trace histories of all intelligence published across the portal.
- Only vetted publishers can create system-wide cyber fraud advisories.

## Security Policies
Data access is strictly moderated by Row Level Security (RLS) within PostgREST. 
- General Public: Can report fraud metrics internally and read published news globally.
- Publishers: Have write access strictly limited to their own intel (`auth.uid()`).
- Administrators: Retain global view rights generated via strict non-recursive role evaluations bypassing standard RLS checks through security definers.
