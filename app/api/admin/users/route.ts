import { NextRequest, NextResponse } from 'next/server';
import { getDB, saveDB, User } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';
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
  const users = db.users.map(u => ({ ...u, passwordHash: undefined }));
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { email, password, role, clientId, name } = await req.json();
  if (!email || !password || !role || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const db = getDB();
  if (db.users.find(u => u.email === email.toLowerCase())) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }
  const newUser: User = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role,
    clientId: role === 'client' ? clientId : undefined,
    name,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDB(db);
  const { passwordHash: _, ...safe } = newUser;
  return NextResponse.json(safe, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const db = getDB();
  db.users = db.users.filter(u => u.id !== id);
  saveDB(db);
  return NextResponse.json({ success: true });
}
