import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

const ORDINAL_BASE = 'https://app.tryordinal.com/api/v1';

export interface OrdinalPost {
  id: string;
  title: string;
  content: string;       // linkedIn.copy
  status: string;        // Posted | ToDo | Finalized | etc.
  publishDate: string;   // YYYY-MM-DD
  publishAt: string | null;
  author: string;        // linkedIn.profile.name
  url: string;           // ordinal post URL
  channels: string[];
  hasAssets: boolean;
}

export interface OrdinalTotals {
  totalPosts: number;
  posted: number;
  scheduled: number;
  drafts: number;
}

async function fetchAllPosts(key: string): Promise<OrdinalPost[]> {
  const posts: OrdinalPost[] = [];
  let cursor: string | null = null;
  let page = 0;

  while (page < 20) { // safety cap at 20 pages
    const url = cursor
      ? `${ORDINAL_BASE}/posts?limit=50&cursor=${cursor}`
      : `${ORDINAL_BASE}/posts?limit=50`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Ordinal /posts returned ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json() as {
      posts: RawPost[];
      nextCursor: string | null;
      hasMore: boolean;
    };

    for (const p of data.posts) {
      posts.push({
        id:          p.id,
        title:       p.title || '',
        content:     p.linkedIn?.copy || '',
        status:      p.status || '',
        publishDate: p.publishDate || '',
        publishAt:   p.publishAt || null,
        author:      p.linkedIn?.profile?.name || '',
        url:         p.url || '',
        channels:    p.channels || [],
        hasAssets:   (p.linkedIn?.assets?.length ?? 0) > 0,
      });
    }

    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
    page++;
  }

  return posts;
}

interface RawPost {
  id: string;
  title?: string;
  url?: string;
  status?: string;
  publishDate?: string;
  publishAt?: string | null;
  channels?: string[];
  linkedIn?: {
    copy?: string;
    profile?: { name?: string; detail?: string };
    assets?: unknown[];
  };
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = req.nextUrl.searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const db = getDB();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.ordinalKey) return NextResponse.json({ error: 'No Ordinal API key configured for this client' }, { status: 404 });

  if (payload.role !== 'admin' && payload.clientId !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const posts = await fetchAllPosts(client.ordinalKey);

    // Sort newest publishDate first
    posts.sort((a, b) => {
      const da = a.publishDate || a.publishAt || '';
      const db2 = b.publishDate || b.publishAt || '';
      return db2.localeCompare(da);
    });

    const totals: OrdinalTotals = {
      totalPosts: posts.length,
      posted:     posts.filter(p => p.status === 'Posted').length,
      scheduled:  posts.filter(p => p.status === 'Scheduled' || (p.publishAt && p.status !== 'Posted')).length,
      drafts:     posts.filter(p => p.status === 'ToDo' || p.status === 'Finalized').length,
    };

    return NextResponse.json({ posts, totals });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, posts: [], totals: null });
  }
}
