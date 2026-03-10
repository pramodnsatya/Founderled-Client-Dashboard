import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

async function fetchEmailBison(domain: string, apiKey: string, endpoint: string) {
  const url = `https://${domain}/api${endpoint}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    next: { revalidate: 300 }
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchHeyReach(apiKey: string, endpoint: string, method = 'GET', body?: object) {
  const url = `https://api.heyreach.io/api/public${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: 300 }
  });
  if (!res.ok) return null;
  return res.json();
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
    if (requestedClientId && requestedClientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (!clientId) return NextResponse.json({ error: 'Client ID required' }, { status: 400 });

  const db = getDB();
  const client = db.clients.find(c => c.id === clientId);
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  // Fetch data in parallel
  const [
    bisonCampaigns,
    bisonAnalytics,
    heyreachCampaigns,
    heyreachStats,
  ] = await Promise.allSettled([
    fetchEmailBison(client.emailBisonDomain, client.emailBisonKey, '/campaigns?limit=50'),
    fetchEmailBison(client.emailBisonDomain, client.emailBisonKey, '/campaigns/analytics?limit=50'),
    fetchHeyReach(client.heyreachKey, '/campaign/GetAll', 'POST', { limit: 100, offset: 0 }),
    fetchHeyReach(client.heyreachKey, '/campaign/GetOverallStats', 'POST', { accountIds: [], campaignIds: [] }),
  ]);

  // Process Email Bison campaigns
  const emailCampaigns = bisonCampaigns.status === 'fulfilled' ? bisonCampaigns.value : null;
  const emailAnalytics = bisonAnalytics.status === 'fulfilled' ? bisonAnalytics.value : null;
  const linkedinCampaigns = heyreachCampaigns.status === 'fulfilled' ? heyreachCampaigns.value : null;
  const linkedinStats = heyreachStats.status === 'fulfilled' ? heyreachStats.value : null;

  // Compute email aggregate stats
  let emailAgg = {
    totalSent: 0, totalReplies: 0, totalBounces: 0, totalOpens: 0, totalClicks: 0,
    replyRate: 0, bounceRate: 0, openRate: 0, clickRate: 0,
    activeCampaigns: 0, totalCampaigns: 0,
  };

  const processedEmailCampaigns: object[] = [];
  if (emailCampaigns?.data || emailCampaigns?.campaigns || Array.isArray(emailCampaigns)) {
    const campaigns = emailCampaigns?.data || emailCampaigns?.campaigns || emailCampaigns;
    if (Array.isArray(campaigns)) {
      emailAgg.totalCampaigns = campaigns.length;
      for (const c of campaigns) {
        const s = c.stats || c.analytics || {};
        const sent = s.emails_sent || s.sent || 0;
        const replies = s.replies || s.unique_replies || 0;
        const bounces = s.bounces || 0;
        const opens = s.opens || s.unique_opens || 0;
        const clicks = s.clicks || 0;
        emailAgg.totalSent += sent;
        emailAgg.totalReplies += replies;
        emailAgg.totalBounces += bounces;
        emailAgg.totalOpens += opens;
        emailAgg.totalClicks += clicks;
        const isActive = ['active', 'running', 'in_progress'].includes(c.status?.toLowerCase() || '');
        if (isActive) emailAgg.activeCampaigns++;
        processedEmailCampaigns.push({
          id: c.id,
          name: c.name,
          status: c.status,
          sent, replies, bounces, opens, clicks,
          replyRate: sent > 0 ? ((replies / sent) * 100).toFixed(1) : '0',
          bounceRate: sent > 0 ? ((bounces / sent) * 100).toFixed(1) : '0',
          openRate: sent > 0 ? ((opens / sent) * 100).toFixed(1) : '0',
          startedAt: c.created_at || c.started_at,
        });
      }
      if (emailAgg.totalSent > 0) {
        emailAgg.replyRate = parseFloat(((emailAgg.totalReplies / emailAgg.totalSent) * 100).toFixed(1));
        emailAgg.bounceRate = parseFloat(((emailAgg.totalBounces / emailAgg.totalSent) * 100).toFixed(1));
        emailAgg.openRate = parseFloat(((emailAgg.totalOpens / emailAgg.totalSent) * 100).toFixed(1));
        emailAgg.clickRate = parseFloat(((emailAgg.totalClicks / emailAgg.totalSent) * 100).toFixed(1));
      }
    }
  }

  // Process HeyReach data
  let linkedinAgg = {
    totalConnectionsSent: 0, totalConnectionsAccepted: 0, totalMessagesSent: 0,
    totalReplies: 0, acceptanceRate: 0, replyRate: 0,
    activeCampaigns: 0, totalCampaigns: 0,
  };
  const processedLinkedinCampaigns: object[] = [];

  if (linkedinCampaigns?.items && Array.isArray(linkedinCampaigns.items)) {
    linkedinAgg.totalCampaigns = linkedinCampaigns.totalCount || linkedinCampaigns.items.length;
    for (const c of linkedinCampaigns.items) {
      const ps = c.progressStats || {};
      const total = ps.totalUsers || 0;
      const inProgress = ps.totalUsersInProgress || 0;
      const finished = ps.totalUsersFinished || 0;
      const failed = ps.totalUsersFailed || 0;
      const isActive = c.status === 'IN_PROGRESS' || c.status === 'STARTING';
      if (isActive) linkedinAgg.activeCampaigns++;
      processedLinkedinCampaigns.push({
        id: c.id,
        name: c.name,
        status: c.status,
        total, inProgress, finished, failed,
        listName: c.linkedInUserListName,
        startedAt: c.startedAt,
        createdAt: c.creationTime,
      });
    }
  }

  if (linkedinStats?.overallStats) {
    const os = linkedinStats.overallStats;
    linkedinAgg.totalConnectionsSent = os.connectionsSent || 0;
    linkedinAgg.totalConnectionsAccepted = os.connectionsAccepted || 0;
    linkedinAgg.totalMessagesSent = os.messagesSent || 0;
    linkedinAgg.totalReplies = os.totalMessageReplies || 0;
    linkedinAgg.acceptanceRate = parseFloat(((os.connectionAcceptanceRate || 0) * 100).toFixed(1));
    linkedinAgg.replyRate = parseFloat(((os.messageReplyRate || 0) * 100).toFixed(1));
  }

  // Build time series for LinkedIn
  const linkedinTimeSeries = linkedinStats?.byDayStats
    ? Object.entries(linkedinStats.byDayStats)
        .map(([date, stats]) => {
          const s = stats as Record<string, number>;
          return {
            date: date.split('T')[0],
            connectionsSent: s.connectionsSent || 0,
            connectionsAccepted: s.connectionsAccepted || 0,
            messages: s.messagesSent || 0,
            replies: s.totalMessageReplies || 0,
          };
        })
        .filter(d => d.connectionsSent > 0 || d.connectionsAccepted > 0 || d.messages > 0)
        .slice(-30)
    : [];

  return NextResponse.json({
    client: { id: client.id, name: client.name },
    email: {
      aggregate: emailAgg,
      campaigns: processedEmailCampaigns,
      raw: emailAnalytics,
    },
    linkedin: {
      aggregate: linkedinAgg,
      campaigns: processedLinkedinCampaigns,
      timeSeries: linkedinTimeSeries,
    },
  });
}
