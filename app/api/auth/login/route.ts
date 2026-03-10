import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const db = getDB();
    const user = db.users.find(u => u.email === email.toLowerCase());
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    const token = signToken({ userId: user.id, email: user.email, role: user.role, clientId: user.clientId, name: user.name });
    const res = NextResponse.json({ token, user: { id: user.id, email: user.email, role: user.role, clientId: user.clientId, name: user.name } });
    res.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 604800 });
    return res;
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
