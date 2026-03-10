import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function fetchEmailBison(domain: string, apiKey: string, endpoint: string) {
  const url = `https://${domain}/api${endpoint}`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' },
      cache: 'no-store',
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`[EmailBison] ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
      return { _error: res.status, _body: text.slice(0, 300) };
    }
    try { return JSON.parse(text); }
    catch { return { _error: 'parse', _body: text.slice(0, 300) }; }
  } catch (e) {
    console.error(`[EmailBison] fetch error:`, e);
    return { _error: 'network' };
  }
}

async function fetchHeyReach(apiKey: string, endpoint: string, method = 'GET', body?: object) {
  const url = `https://api.heyreach.io/api/public${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    });
    if (!res.ok) { console.error(`[HeyReach] ${endpoint} → ${res.status}`); return null; }
    return res.json();
  } catch (e) {
    console.error(`[HeyReach] fetch error:`, e);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const requestedClientId = searchParams.get('clientId');
  let clientId = requestedClientId;
  if (payload.role === 'client') {
    clientId = payload.clientId || null;
    if (requestedClientId && requestedClientId !== clientId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 });

  const db = getDB();
  const client = db.clients.find(c => c.id === clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const [bisonCampaignsRaw, heyreachCampaignsRaw, heyreachStatsRaw] = await Promise.allSettled([
    fetchEmailBison(client.emailBisonDomain, client.emailBisonKey, '/campaigns?limit=100'),
    fetchHeyReach(client.heyreachKey, '/campaign/GetAll', 'POST', { limit: 100, offset: 0 }),
    fetchHeyReach(client.heyreachKey, '/campaign/GetOverallStats', 'POST', { accountIds: [], campaignIds: [] }),
  ]);

  const bisonRaw = bisonCampaignsRaw.status === 'fulfilled' ? bisonCampaignsRaw.value : null;
  const linkedinCampaigns = heyreachCampaignsRaw.status === 'fulfilled' ? heyreachCampaignsRaw.value : null;
  // HeyReach GetOverallStats returns { overallStats: {...}, byDayStats: {...} } at root level
  const linkedinStatsRaw = heyreachStatsRaw.status === 'fulfilled' ? heyreachStatsRaw.value : null;

  // ── EMAIL BISON ────────────────────────────────────────────────────────────
  let emailAgg = {
    totalSent: 0, totalReplies: 0, totalBounces: 0, totalOpens: 0, totalClicks: 0,
    replyRate: 0, bounceRate: 0, openRate: 0, clickRate: 0,
    activeCampaigns: 0, totalCampaigns: 0,
  };
  const processedEmailCampaigns: object[] = [];

  let emailArr: Record<string, unknown>[] | null = null;
  if (Array.isArray(bisonRaw)) {
    emailArr = bisonRaw;
  } else if (bisonRaw && !(bisonRaw as Record<string, unknown>)._error) {
    for (const key of ['data', 'campaigns', 'items', 'results', 'records']) {
      const val = (bisonRaw as Record<string, unknown>)[key];
      if (Array.isArray(val)) { emailArr = val as Record<string, unknown>[]; break; }
    }
  }

  if (emailArr && emailArr.length > 0) {
    emailAgg.totalCampaigns = emailArr.length;
    for (const campaign of emailArr) {
      // EmailBison stats can live directly on campaign OR under campaign.stats
      const statsObj = (campaign.stats || campaign.analytics || campaign.email_stats || {}) as Record<string, number>;
      // Try both flat (on campaign) and nested (in stats)
      const get = (flat: string, nested: string) =>
        (campaign[flat] as number) ?? (statsObj[flat] as number) ?? (statsObj[nested] as number) ?? 0;

      const sent    = get('emails_sent', 'sent') || (campaign.total_sent as number) || 0;
      const replies = get('unique_replies', 'replies') || (campaign.replies as number) || 0;
      const bounces = get('bounced', 'bounces') || (campaign.bounces as number) || 0;
      const opens   = get('unique_opens', 'opens') || (campaign.opens as number) || 0;
      const clicks  = get('clicked', 'clicks') || (campaign.clicks as number) || 0;

      emailAgg.totalSent    += sent;
      emailAgg.totalReplies += replies;
      emailAgg.totalBounces += bounces;
      emailAgg.totalOpens   += opens;
      emailAgg.totalClicks  += clicks;

      const statusRaw = ((campaign.status as string) || '').toLowerCase();
      if (['active', 'running', 'in_progress', 'sending', 'scheduled'].includes(statusRaw)) emailAgg.activeCampaigns++;

      processedEmailCampaigns.push({
        id: campaign.id, name: campaign.name, status: campaign.status,
        sent, replies, bounces, opens, clicks,
        replyRate:  sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0',
        bounceRate: sent > 0 ? ((bounces / sent) * 100).toFixed(1) : '0',
        openRate:   sent > 0 ? ((opens   / sent) * 100).toFixed(1) : '0',
        clickRate:  sent > 0 ? ((clicks  / sent) * 100).toFixed(1) : '0',
        startedAt: campaign.created_at || campaign.started_at,
      });
    }
    const d = emailAgg.totalSent;
    if (d > 0) {
      emailAgg.replyRate  = parseFloat(((emailAgg.totalReplies / d) * 100).toFixed(1));
      emailAgg.bounceRate = parseFloat(((emailAgg.totalBounces / d) * 100).toFixed(1));
      emailAgg.openRate   = parseFloat(((emailAgg.totalOpens   / d) * 100).toFixed(1));
      emailAgg.clickRate  = parseFloat(((emailAgg.totalClicks  / d) * 100).toFixed(1));
    }
  }

  // ── HEYREACH ───────────────────────────────────────────────────────────────
  // Real response shape from GetOverallStats:
  // { overallStats: { connectionsSent, connectionsAccepted, messagesSent, totalMessageReplies,
  //                   messageReplyRate (0-1 ratio), connectionAcceptanceRate (0-1 ratio), ... },
  //   byDayStats: { "2025-03-18T00:00:00Z": { connectionsSent, connectionsAccepted, ... } } }

  let linkedinAgg = {
    totalConnectionsSent: 0, totalConnectionsAccepted: 0,
    totalMessagesSent: 0, totalReplies: 0,
    acceptanceRate: 0, replyRate: 0,
    activeCampaigns: 0, totalCampaigns: 0,
  };
  const processedLinkedinCampaigns: object[] = [];

  // Parse overall stats — they live at root level under "overallStats" key
  const os = linkedinStatsRaw?.overallStats;
  if (os) {
    linkedinAgg.totalConnectionsSent     = os.connectionsSent     || 0;
    linkedinAgg.totalConnectionsAccepted = os.connectionsAccepted || 0;
    linkedinAgg.totalMessagesSent        = os.messagesSent        || 0;
    linkedinAgg.totalReplies             = os.totalMessageReplies || 0;
    // These are already 0-1 ratios — multiply by 100 for percentage display
    linkedinAgg.acceptanceRate = parseFloat(((os.connectionAcceptanceRate || 0) * 100).toFixed(1));
    linkedinAgg.replyRate      = parseFloat(((os.messageReplyRate         || 0) * 100).toFixed(1));
  }

  if (linkedinCampaigns?.items && Array.isArray(linkedinCampaigns.items)) {
    linkedinAgg.totalCampaigns = linkedinCampaigns.totalCount || linkedinCampaigns.items.length;
    for (const c of linkedinCampaigns.items) {
      const ps = c.progressStats || {};
      if (c.status === 'IN_PROGRESS' || c.status === 'STARTING') linkedinAgg.activeCampaigns++;
      processedLinkedinCampaigns.push({
        id: c.id, name: c.name, status: c.status,
        total:      ps.totalUsers           || 0,
        inProgress: ps.totalUsersInProgress || 0,
        finished:   ps.totalUsersFinished   || 0,
        failed:     ps.totalUsersFailed     || 0,
        listName: c.linkedInUserListName,
        startedAt: c.startedAt,
        createdAt: c.creationTime,
      });
    }
  }

  // byDayStats: sum last 30 active days
  const byDay = linkedinStatsRaw?.byDayStats;
  const linkedinTimeSeries = byDay
    ? Object.entries(byDay)
        .map(([date, s]) => {
          const stats = s as Record<string, number>;
          return {
            date: date.split('T')[0],
            connectionsSent:     stats.connectionsSent     || 0,
            connectionsAccepted: stats.connectionsAccepted || 0,
            messages:            stats.messagesSent        || 0,
            replies:             stats.totalMessageReplies || 0,
          };
        })
        .filter(d => d.connectionsSent > 0 || d.connectionsAccepted > 0)
        .slice(-30)
    : [];

  return NextResponse.json({
    client: { id: client.id, name: client.name },
    email: {
      aggregate: emailAgg,
      campaigns: processedEmailCampaigns,
      _debug: {
        rawKeys: bisonRaw ? Object.keys(bisonRaw as object) : null,
        error: (bisonRaw as Record<string, unknown>)?._error || null,
        firstCampaignKeys: emailArr?.[0] ? Object.keys(emailArr[0]) : null,
      },
    },
    linkedin: {
      aggregate: linkedinAgg,
      campaigns: processedLinkedinCampaigns,
      timeSeries: linkedinTimeSeries,
    },
  });
}
