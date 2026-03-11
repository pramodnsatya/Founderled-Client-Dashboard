import { NextRequest, NextResponse } from 'next/server';
import { getDB, getDBPath } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = getDB();
  return NextResponse.json({
    dbPath: getDBPath(),
    userCount: db.users.length,
    clientCount: db.clients.length,
    users: db.users.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, clientId: u.clientId })),
    clients: db.clients.map(c => ({ id: c.id, name: c.name, hasEBKey: !!c.emailBisonKey, hasHRKey: !!c.heyreachKey })),
  });
}
