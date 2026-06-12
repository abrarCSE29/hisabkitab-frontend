# HisabKitab (হিসাবকিতাব) — Frontend

Mobile-first Next.js app for the HisabKitab family expense tracker. Talks to
the FastAPI backend in `../hisabkitab-backend`.

## Stack

- **Next.js (App Router) + React 19**, TypeScript, **TailwindCSS 4**
- **Zustand** for session/workspace state and dashboard caches
- **Supabase JS** for Google/email auth and receipt storage
- **browser-image-compression** for client-side receipt compression (FR-5)

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000 (backend must run on :8000)
```

### Without Supabase (local dev)

If `NEXT_PUBLIC_SUPABASE_URL` is unset, the login page accepts a pasted JWT
("dev token") signed with the backend's `SUPABASE_JWT_SECRET`. Mint one from
the backend repo and paste it in.

### With Supabase

Copy `.env.example` → `.env.local` and set the Supabase URL + anon key. Then:

1. Enable Google (and/or email) auth in the Supabase dashboard.
2. Create a **public storage bucket** for receipt photos (default name
   `hisabkitab-voucher`, override with `NEXT_PUBLIC_RECEIPTS_BUCKET`).
3. Make sure the backend's `SUPABASE_JWT_SECRET`/`SUPABASE_URL` match the same project.

## Screens

| Route | Purpose |
|---|---|
| `/` | Public landing page with sign-in CTA (switches to "Open app" when a session exists) |
| `/login` | Google OAuth / email+password (Supabase), or dev-token login |
| `/dashboard` | Workspace switcher (Personal ↔ families), month spent/earned, voucher feed |
| `/add` | New entry: expense/income toggle, quick amount or itemized rows, bilingual category chips, receipt photo (compress → Supabase upload) and ✨ OCR autofill |
| `/family` | Create a family, invite by email (admin), join with an emailed code |

The active workspace (solo vs a family) is persisted in `localStorage` and
scopes both the dashboard feed and where new vouchers are logged — matching
the backend's visibility rules.
