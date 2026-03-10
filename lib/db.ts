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
  emailBisonDomain: string; // e.g., "dedi.emailbison.com"
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

// Pre-seeded admin and Adaptional client — auto-created on first boot
// Password hash = "FounderLed2026!" (change via Admin panel after first login)
const SEED_DATA: DB = {
  users: [
    {
      id: "admin-seed-001",
      email: "admin@founderled.io",
      passwordHash: "$2b$12$ODDVnnDjO7NMXkYXo3JQL.yBWswMlmc35UOKfVKFspMv2uXPxbAA2",
      role: "admin",
      name: "Pramod",
      createdAt: "2026-03-10T00:00:00Z",
    }
  ],
  clients: [
    {
      id: "adaptional",
      name: "Adaptional",
      slug: "adaptional",
      emailBisonKey: "81|wV2V42VWB2RryO8GXu0ySMhbpoxkLFSF3bqX3yE3dc7cbd40",
      emailBisonDomain: "dedi.emailbison.com",
      heyreachKey: "v3yzUdxWhBklrqQG8+JsFaV7OOYBETWGbLB8wJCQavc=",
      createdAt: "2026-03-10T00:00:00Z",
    }
  ]
};

function ensureDB(): DB {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    // First boot — write seed data so admin can log in immediately
    fs.writeFileSync(DB_PATH, JSON.stringify(SEED_DATA, null, 2));
    return SEED_DATA;
  }
  const db: DB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  // Ensure seed admin always exists (in case file was wiped)
  if (!db.users || db.users.length === 0) {
    db.users = SEED_DATA.users;
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
  // Ensure Adaptional client always exists
  if (!db.clients) db.clients = [];
  if (!db.clients.find((c: Client) => c.id === 'adaptional')) {
    db.clients.push(SEED_DATA.clients[0]);
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
