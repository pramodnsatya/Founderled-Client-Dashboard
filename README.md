# Founder.Led Campaign Dashboard

Multi-tenant campaign intelligence for Founder.Led.
Live metrics from **Email Bison** + **HeyReach** per client.

## Quick Start
```bash
npm install
node scripts/seed-admin.js
npm run dev   # localhost:3000
```
Admin login: `admin@founderleddash.com` / `admin123`

## Deploy to Vercel
1. Push to GitHub
2. Import at vercel.com
3. Add env var: `JWT_SECRET=<random_string>`
4. Deploy

## Note on Persistence
Vercel's filesystem is ephemeral. For production, replace `lib/db.ts` with:
- Vercel KV (Redis) — free tier available
- Supabase Postgres — free tier available
- Or deploy to Railway which persists the filesystem

## Adding Clients
Admin → Clients → Add Client (paste Email Bison + HeyReach API keys)
Admin → Users → Add User (role: client, assign to client)
