// Simple file-based database for user/client management
// In production, replace with Postgres/Supabase

import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface Client {
  id: string;
  name: string;
  slug: string;
  emailBisonKey: string;
  emailBisonDomain: string; // e.g., "send.founderled.io"
  heyreachKey: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'client';
  clientId?: string; // only for client users
  name: string;
  createdAt: string;
}

export interface DB {
  users: User[];
  clients: Client[];
}

// Pre-seeded admin + all Founderled clients - auto-created on first boot
// Password hash = "FounderLed2026!" (change via Admin panel after first login)
const SEED_CLIENTS: Client[] = [
  {
    id: "adaptional",
    name: "Adaptional",
    slug: "adaptional",
    emailBisonKey: "81|wV2V42VWB2RryO8GXu0ySMhbpoxkLFSF3bqX3yE3dc7cbd40",
    emailBisonDomain: "send.founderled.io",
    heyreachKey: "v3yzUdxWhBklrqQG8+JsFaV7OOYBETWGbLB8wJCQavc=",
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

const SEED_DATA: DB = {
  users: [
    {
      id: "admin-seed-001",
      email: "admin@founderled.io",
      passwordHash: "$2b$12$ODDVnnDjO7NMXkYXo3JQL.yBWswMlmc35UOKfVKFspMv2uXPxbAA2",
      role: "admin",
      name: "Admin",
      createdAt: "2026-03-10T00:00:00Z",
    }
  ],
  clients: SEED_CLIENTS,
};

function ensureDB(): DB {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    // First boot - write full seed so admin and all clients exist immediately
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DATA, null, 2));
    return SEED_DATA;
  }
  const db: DB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  // Ensure seed admin always exists (in case file was wiped)
  if (!db.users || db.users.length === 0) {
    db.users = SEED_DATA.users;
  }

  // Ensure every seed client exists (upsert by id, preserving any extra fields)
  if (!db.clients) db.clients = [];
  let changed = false;
  for (const seedClient of SEED_CLIENTS) {
    const existing = db.clients.find((c: Client) => c.id === seedClient.id);
    if (!existing) {
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
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
