import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const key = 'ord_J8Dj3KJqtFjGijp6LSQ9BJ';

  const bases = [
    'https://api.tryordinal.com',
    'https://app.tryordinal.com',
  ];
  const paths = ['/v1/posts', '/v1/analytics/posts', '/posts', '/v1/me', '/me', '/v1/accounts', '/v1/profiles'];
  const authStyles = [
    { header: 'Authorization', value: `Bearer ${key}` },
    { header: 'Authorization', value: `Token ${key}` },
    { header: 'X-API-Key',     value: key },
    { header: 'x-api-key',     value: key },
  ];

  const results: Record<string, unknown>[] = [];

  for (const base of bases) {
    for (const path of paths) {
      for (const auth of authStyles) {
        try {
          const res = await fetch(`${base}${path}`, {
            headers: { [auth.header]: auth.value, 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(5000),
          });
          const text = await res.text().catch(() => '');
          let body: unknown = text;
          try { body = JSON.parse(text); } catch {}
          results.push({ url: `${base}${path}`, auth: `${auth.header}: ${auth.value.slice(0,20)}…`, status: res.status, body });
          // Stop trying auth styles if we get a non-401/403
          if (res.status !== 401 && res.status !== 403) break;
        } catch (e) {
          results.push({ url: `${base}${path}`, auth: auth.header, status: 'ERROR', body: String(e) });
          break;
        }
      }
    }
  }

  return NextResponse.json(results);
}
