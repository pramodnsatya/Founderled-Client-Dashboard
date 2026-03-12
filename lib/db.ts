// File-based database - persists to Railway Volume at /mnt/data (or ./data locally)
// Railway Volume: attach a volume at /mnt/data in your Railway service settings

import fs from 'fs';
import path from 'path';

// Use Railway Volume if available, otherwise fall back to local ./data
const DATA_DIR = fs.existsSync('/mnt/data') ? '/mnt/data' : path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

export interface Client {
  id: string;
  name: string;
  slug: string;
  emailBisonKey: string;
  emailBisonDomain: string;
  heyreachKey: string;
  ordinalKey?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'client';
  clientId?: string;
  name: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  clients: Client[];
}

// ─── Seed Users ────────────────────────────────────────────────────────────────
// All users listed here are auto-restored on every boot if missing.
// To add a new permanent user: add their entry here, then redeploy.
// Password hashes generated with bcrypt cost=12.
// Admin hash = "FounderLed2026!"
const SEED_USERS: User[] = [
  {
    id: "admin-seed-001",
    email: "admin@founderled.io",
    passwordHash: "$2b$12$ODDVnnDjO7NMXkYXo3JQL.yBWswMlmc35UOKfVKFspMv2uXPxbAA2",
    role: "admin",
    name: "Admin",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "client-adaptional-001",
    email: "suril@adaptional.ai",
    passwordHash: "$2b$12$zQsZy4TO2Yb98qtAJt.DqOAMGFQNRtQPC9TTJu3on2IWvg3kCnx/W",
    role: "client",
    clientId: "adaptional",
    name: "Suril (Adaptional)",
    createdAt: "2026-03-10T00:00:00Z",
  },
];

// ─── Seed Clients ──────────────────────────────────────────────────────────────
// All clients listed here are auto-restored on every boot if missing.
// Edits made via the Admin UI are preserved (UI edits win over seed values).
const SEED_CLIENTS: Client[] = [
  {
    id: "adaptional",
    name: "Adaptional",
    slug: "adaptional",
    emailBisonKey: "81|wV2V42VWB2RryO8GXu0ySMhbpoxkLFSF3bqX3yE3dc7cbd40",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "v3yzUdxWhBklrqQG8+JsFaV7OOYBETWGbLB8wJCQavc=",
    ordinalKey: "ord_J8Dj3KJqtFjGijp6LSQ9BJ",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "epsilon3",
    name: "Epsilon3",
    slug: "epsilon3",
    emailBisonKey: "82|jWrdCp4r6AD5vXiUGpTfQLtyOUt7781RKGvojT7E00b16abf",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "RRbbJpsVtokdVsY8ptg95AENw20GBxKVklDXVjcb80Q=",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "arist",
    name: "Arist",
    slug: "arist",
    emailBisonKey: "83|hw9C81XhxAVE6T64zC02d0HFpIwda8GW0uMlCY7b5a22752d",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "S7t15Hg1q8h20sosCEkaZeUdzOds+1uTFfsm20UCzv8=",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "dagster-labs",
    name: "Dagster Labs",
    slug: "dagster-labs",
    emailBisonKey: "84|sc4acM0JhmW8W9IdQymnvNZNuRGL6bNlnQS8bqvk8da3c92d",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "IzCzyFUDlEFUsfzC5pGNOj4Z2N0IrdQ6+/4q/VwCzJQ=",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "kastle-ai",
    name: "Kastle AI",
    slug: "kastle-ai",
    emailBisonKey: "85|PLIbnHy2jxKa5HPRhd8hoKPDXKvFxZtVLByTgKwO1e18ba03",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "nR6cH/4VRGtggjx7F10IePQLHeyjRFvIG/gclvX/8cg=",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "soona",
    name: "Soona",
    slug: "soona",
    emailBisonKey: "86|8D4ERS7KJmQbmEU69t8aiAJr43VOEy2QepfoiCU4f898d2a3",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "sunset",
    name: "Sunset",
    slug: "sunset",
    emailBisonKey: "87|kcdnk0TaaPkTQMhhtoUxHKzlIJu2FMRbFiED0zAb75611237",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "445ML8JOC0uhN802Q2p5FvaQWegCB3qLzmzGocfYSdE=",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "upwind",
    name: "Upwind",
    slug: "upwind",
    emailBisonKey: "88|SfBXqTJJaZWqXeExr5t81dC7gvih0VgYjj7PEgu36d566ece",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "",
    createdAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "wisprflow",
    name: "WisprFlow",
    slug: "wisprflow",
    emailBisonKey: "89|5vPH5Ajl2JDsYRUpRPuujBFdBOKwQ9ZrNJxMs3k0fdb35df3",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "",
    createdAt: "2026-03-10T00:00:00Z",
  },
];

// ─── Merge logic ───────────────────────────────────────────────────────────────
// Seeds are ADDITIVE only - they never overwrite data that exists in the file.
// This means UI edits (e.g. adding a HeyReach key) are always preserved.
function ensureDB(): DB {
  const dir = DATA_DIR;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  let db: DB = { users: [], clients: [] };

  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      console.error('[db] Failed to parse db.json, starting fresh');
      db = { users: [], clients: [] };
    }
  }

  if (!db.users) db.users = [];
  if (!db.clients) db.clients = [];

  let changed = false;

  // Merge seed users - only add if email not already present
  for (const seedUser of SEED_USERS) {
    const exists = db.users.find((u: User) => u.email === seedUser.email);
    if (!exists) {
      db.users.push(seedUser);
      changed = true;
    }
  }

  // Merge seed clients - only add if id not already present
  // Does NOT overwrite existing entries so UI edits (e.g. HeyReach keys) survive
  for (const seedClient of SEED_CLIENTS) {
    const exists = db.clients.find((c: Client) => c.id === seedClient.id);
    if (!exists) {
      db.clients.push(seedClient);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }

  return db;
}

export function getDB(): DB {
  return ensureDB();
}

export function saveDB(db: DB): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Utility: export current db path for diagnostics
export function getDBPath(): string {
  return DB_PATH;
}
