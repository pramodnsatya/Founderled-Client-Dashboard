import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Try multiple likely endpoint patterns for the Ordinal API
const ORDINAL_BASE_CANDIDATES = [
  'https://api.tryordinal.com',
  'https://api.ordinalai.com',
  'https://app.tryordinal.com/api',
];

const POST_PATH_CANDIDATES = [
  '/v1/posts',
  '/v1/analytics/posts',
  '/posts',
  '/analytics',
  '/v1/content',
  '/content/posts',
];

async function ordinalFetch(key: string, path: string, base: string) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    // 8s timeout
    signal: AbortSignal.timeout(8000),
  });
  return res;
}

async function discoverAndFetch(key: string): Promise<{ posts: OrdinalPost[]; source: string; raw?: unknown }> {
  for (const base of ORDINAL_BASE_CANDIDATES) {
    for (const path of POST_PATH_CANDIDATES) {
      try {
        const res = await ordinalFetch(key, path, base);
        if (res.ok) {
          const data = await res.json();
          const posts = normalizeResponse(data);
          if (posts) return { posts, source: `${base}${path}`, raw: data };
        }
      } catch {
        // continue trying
      }
    }
  }
  throw new Error('Could not reach Ordinal API — all endpoint candidates failed');
}

interface OrdinalPost {
  id: string;
  content: string;
  publishedAt: string;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  engagementRate: number;
  url?: string;
  type?: string;
  account?: string;
}

function normalizeResponse(data: unknown): OrdinalPost[] | null {
  if (!data || typeof data !== 'object') return null;

  // Handle array directly
  if (Array.isArray(data)) {
    return data.map(normalizePost).filter(Boolean) as OrdinalPost[];
  }

  const obj = data as Record<string, unknown>;

  // Handle { posts: [...] } or { data: [...] } or { items: [...] } or { results: [...] }
  for (const key of ['posts', 'data', 'items', 'results', 'content', 'analytics']) {
    if (Array.isArray(obj[key])) {
      return (obj[key] as unknown[]).map(normalizePost).filter(Boolean) as OrdinalPost[];
    }
  }

  return null;
}

function normalizePost(raw: unknown): OrdinalPost | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;

  // Extract ID
  const id = String(p.id || p.postId || p.post_id || p.urn || Math.random());

  // Extract content/text
  const content = String(
    p.content || p.text || p.body || p.postText || p.post_content || p.message || ''
  );

  // Extract date
  const publishedAt = String(
    p.publishedAt || p.published_at || p.createdAt || p.created_at ||
    p.postedAt || p.posted_at || p.date || p.timestamp || ''
  );

  // Extract metrics — handle both flat and nested (e.g. { stats: { impressions: 100 } })
  const stats = (typeof p.stats === 'object' && p.stats ? p.stats : 
                 typeof p.analytics === 'object' && p.analytics ? p.analytics :
                 typeof p.metrics === 'object' && p.metrics ? p.metrics : p) as Record<string, unknown>;

  const num = (keys: string[]): number => {
    for (const k of keys) {
      const v = stats[k] ?? p[k];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && !isNaN(Number(v))) return Number(v);
    }
    return 0;
  };

  const impressions   = num(['impressions', 'impressionCount', 'impression_count', 'views', 'reach']);
  const likes         = num(['likes', 'likeCount', 'like_count', 'reactions', 'reactionCount']);
  const comments      = num(['comments', 'commentCount', 'comment_count', 'replies', 'replyCount']);
  const shares        = num(['shares', 'shareCount', 'share_count', 'reposts', 'repostCount']);
  const clicks        = num(['clicks', 'clickCount', 'click_count', 'linkClicks', 'link_clicks']);

  const rawRate = stats['engagementRate'] ?? stats['engagement_rate'] ?? stats['engagement'] ??
                  p['engagementRate'] ?? p['engagement_rate'] ?? p['engagement'];
  let engagementRate = 0;
  if (typeof rawRate === 'number') {
    engagementRate = rawRate > 1 ? rawRate : rawRate * 100; // normalise 0.05 → 5.0
  }

  const url  = String(p.url || p.postUrl || p.post_url || p.link || p.permalink || '');
  const type = String(p.type || p.postType || p.post_type || p.mediaType || 'text');
  const account = String(p.account || p.accountName || p.profile || p.author || p.authorName || '');

  return { id, content, publishedAt, impressions, likes, comments, shares, clicks, engagementRate, url, type, account };
}

export async function GET(req: NextRequest) {
  // Auth check
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const db = getDB();
  const client = db.clients.find((c: import('@/lib/db').Client) => c.id === clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  if (!client.ordinalKey) return NextResponse.json({ error: 'No Ordinal API key configured for this client' }, { status: 404 });

  // Non-admin users can only see their own client
  if (payload.role !== 'admin' && payload.clientId !== clientId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { posts, source } = await discoverAndFetch(client.ordinalKey);

    // Aggregate totals
    const totals = posts.reduce((acc, p) => ({
      impressions:    acc.impressions    + p.impressions,
      likes:          acc.likes          + p.likes,
      comments:       acc.comments       + p.comments,
      shares:         acc.shares         + p.shares,
      clicks:         acc.clicks         + p.clicks,
    }), { impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 });

    const avgEngagement = posts.length > 0
      ? posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length
      : 0;

    // Sort posts newest first
    const sorted = [...posts].sort((a, b) => {
      const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const db2 = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return db2 - da;
    });

    return NextResponse.json({
      posts: sorted,
      totals: { ...totals, avgEngagement: parseFloat(avgEngagement.toFixed(2)), totalPosts: posts.length },
      _source: source,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg, posts: [], totals: null }, { status: 200 });
  }
}
