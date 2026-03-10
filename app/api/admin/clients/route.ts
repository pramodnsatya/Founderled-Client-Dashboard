import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, Client } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomUUID } from 'crypto';

function isAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const db = getDB();
  return NextResponse.json(db.clients);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { name, emailBisonKey, emailBisonDomain, heyreachKey } = body;
  if (!name || !emailBisonKey || !heyreachKey) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const db = getDB();
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const newClient: Client = {
    id: randomUUID(),
    name,
    slug,
    emailBisonKey,
    emailBisonDomain: emailBisonDomain || 'dedi.emailbison.com',
    heyreachKey,
    createdAt: new Date().toISOString(),
  };
  db.clients.push(newClient);
  saveDB(db);
  return NextResponse.json(newClient, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const { id, ...updates } = body;
  const db = getDB();
  const idx = db.clients.findIndex(c => c.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  db.clients[idx] = { ...db.clients[idx], ...updates };
  saveDB(db);
  return NextResponse.json(db.clients[idx]);
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = getDB();
  db.clients = db.clients.filter(c => c.id !== id);
  saveDB(db);
  return NextResponse.json({ success: true });
}
