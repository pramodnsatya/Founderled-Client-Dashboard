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

function ensureDB(): DB {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    const initial: DB = { users: [], clients: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

export function getDB(): DB {
  return ensureDB();
}

export function saveDB(db: DB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
