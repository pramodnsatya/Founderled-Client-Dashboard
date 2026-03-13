import { NextRequest, NextResponse } from 'next/server';

// Admin-only debug endpoint — probes the Ordinal API and returns raw responses
// Visit: /api/ordinal/probe?key=ord_xxxx  (must be logged in as admin)
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'key param required' }, { status: 400 });

  const BASE = 'https://app.tryordinal.com/api/v1';
  const paths = [
    '/workspace',
    '/posts',
    '/posts?limit=3',
    '/posts?page=1&limit=3',
    '/analytics',
    '/analytics/posts',
    '/profiles',
  ];

  const results: Record<string, unknown> = {};

  for (const path of paths) {
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      let body: unknown;
      try { body = JSON.parse(text); } catch { body = text; }
      results[path] = { status: res.status, body };
    } catch (e) {
      results[path] = { error: e instanceof Error ? e.message : String(e) };
    }
  }

  return NextResponse.json(results, {
    headers: { 'Content-Type': 'application/json' }
  });
}
