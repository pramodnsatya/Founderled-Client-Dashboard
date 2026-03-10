'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

interface User { id: string; email: string; role: 'admin' | 'client'; clientId?: string; name: string; }
interface Client { id: string; name: string; slug: string; emailBisonKey: string; heyreachKey: string; emailBisonDomain: string; createdAt: string; }
interface DashboardUser { id: string; email: string; role: string; clientId?: string; name: string; }

const ACCENT = '#e8ff47';
const LINKEDIN = '#47c4ff';
const S = {
  page: { minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" } as React.CSSProperties,
  sidebar: { width: '220px', minHeight: '100vh', background: '#111118', borderRight: '1px solid #1e1e28', position: 'fixed' as const, left: 0, top: 0, bottom: 0, overflowY: 'auto' as const, zIndex: 10 },
  main: { marginLeft: '220px', padding: '28px 32px', minHeight: '100vh' },
  card: { background: '#111118', border: '1px solid #1e1e28', borderRadius: '12px', padding: '20px' },
  statCard: (color: string) => ({ background: '#111118', border: `1px solid #1e1e28`, borderRadius: '12px', padding: '20px', borderTop: `2px solid ${color}` }),
  badge: (color: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '20px', background: `${color}18`, color, fontSize: '11px', fontWeight: 600 }),
  btn: { padding: '8px 16px', background: ACCENT, color: '#0a0a0f', border: 'none', borderRadius: '7px', cursor: 'pointer', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: '12px' },
  btnGhost: { padding: '8px 16px', background: 'transparent', color: '#9090a8', border: '1px solid #1e1e28', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' },
  input: { width: '100%', padding: '10px 12px', background: '#18181f', border: '1px solid #1e1e28', borderRadius: '7px', color: '#f0f0f5', fontSize: '13px', outline: 'none' },
  label: { display: 'block', color: '#9090a8', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '6px' },
};

function StatusBadge({ status }: { status: string }) {
  const s = status?.toUpperCase();
  const color = s === 'IN_PROGRESS' || s === 'ACTIVE' || s === 'RUNNING' ? '#4ade80'
    : s === 'PAUSED' ? '#fbbf24'
    : s === 'FINISHED' || s === 'COMPLETED' ? '#47c4ff'
    : s === 'FAILED' || s === 'CANCELED' ? '#f87171'
    : '#9090a8';
  const label = s === 'IN_PROGRESS' ? 'Active' : s === 'FINISHED' ? 'Finished' : s || 'Unknown';
  return <span style={S.badge(color)}><span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />{label}</span>;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub?: string; color: string; icon: string }) {
  return (
    <div style={S.statCard(color)} className="animate-fade-in animate-stagger-1">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        {sub && <span style={{ color: '#6b6b80', fontSize: '11px' }}>{sub}</span>}
      </div>
      <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '28px', fontWeight: 700, color: '#f0f0f5', lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#6b6b80', fontSize: '12px', marginTop: '6px' }}>{label}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#18181f', border: '1px solid #1e1e28', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
      <div style={{ color: '#9090a8', marginBottom: '6px' }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ color: p.color, marginBottom: '2px' }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [dashLoading, setDashLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'email' | 'linkedin' | 'admin'>('overview');
  const [adminTab, setAdminTab] = useState<'users' | 'clients'>('users');
  const [adminUsers, setAdminUsers] = useState<DashboardUser[]>([]);
  const [adminClients, setAdminClients] = useState<Client[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'client', clientId: '' });
  const [newClient, setNewClient] = useState({ name: '', emailBisonKey: '', emailBisonDomain: 'dedi.emailbison.com', heyreachKey: '' });
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.error) { router.push('/login'); return; }
      setUser(data);
      if (data.role === 'client' && data.clientId) {
        setSelectedClientId(data.clientId);
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      fetch('/api/admin/clients').then(r => r.json()).then(data => {
        if (Array.isArray(data)) {
          setClients(data);
          if (data.length > 0 && !selectedClientId) setSelectedClientId(data[0].id);
        }
      });
    }
    setLoading(false);
  }, [user, selectedClientId]);

  const loadDashboard = useCallback(async (clientId: string) => {
    if (!clientId) return;
    setDashLoading(true);
    try {
      const res = await fetch(`/api/dashboard?clientId=${clientId}`);
      const data = await res.json();
      setDashboard(data);
    } catch { /* ignore */ }
    setDashLoading(false);
  }, []);

  useEffect(() => {
    if (selectedClientId) loadDashboard(selectedClientId);
  }, [selectedClientId, loadDashboard]);

  const loadAdminData = useCallback(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => Array.isArray(d) && setAdminUsers(d));
    fetch('/api/admin/clients').then(r => r.json()).then(d => Array.isArray(d) && setAdminClients(d));
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') loadAdminData();
  }, [activeTab, loadAdminData]);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const createUser = async () => {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    if (res.ok) { setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'client', clientId: '' }); loadAdminData(); }
  };

  const createClient = async () => {
    const res = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) });
    if (res.ok) { setShowAddClient(false); setNewClient({ name: '', emailBisonKey: '', emailBisonDomain: 'dedi.emailbison.com', heyreachKey: '' }); loadAdminData(); fetch('/api/admin/clients').then(r => r.json()).then(d => Array.isArray(d) && setClients(d)); }
  };

  const deleteUser = async (id: string) => {
    if (confirm('Delete this user?')) { await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' }); loadAdminData(); }
  };

  if (loading) return (
    <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b6b80', fontSize: '14px' }}>Loading...</div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const email = (dashboard as any)?.email;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const linkedin = (dashboard as any)?.linkedin;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientInfo = (dashboard as any)?.client;
  const emailAgg = email?.aggregate || {};
  const linkedinAgg = linkedin?.aggregate || {};
  const emailCampaigns = email?.campaigns || [];
  const linkedinCampaigns = linkedin?.campaigns || [];
  const linkedinTimeSeries = linkedin?.timeSeries || [];
  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || clientInfo?.name || 'Client';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '◈' },
    { id: 'email', label: 'Email Campaigns', icon: '✉' },
    { id: 'linkedin', label: 'LinkedIn', icon: '⬡' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙' }] : []),
  ];

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #1e1e28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', background: ACCENT, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 11L7 2L12 11H2Z" fill="#0a0a0f" /></svg>
            </div>
            <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: '16px', color: '#f0f0f5' }}>
              Founder<span style={{ color: ACCENT }}>.Led</span>
            </span>
          </div>
        </div>

        {/* Client selector (admin only) */}
        {user?.role === 'admin' && clients.length > 0 && (
          <div style={{ padding: '16px 16px 8px' }}>
            <div style={{ ...S.label, marginBottom: '8px' }}>Client</div>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              style={{ ...S.input, padding: '8px 10px', fontSize: '13px', cursor: 'pointer' }}
            >
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Navigation */}
        <nav style={{ padding: '8px 12px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as 'overview' | 'email' | 'linkedin' | 'admin')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: activeTab === item.id ? 'rgba(232,255,71,0.1)' : 'transparent',
                color: activeTab === item.id ? ACCENT : '#9090a8',
                fontSize: '13px', textAlign: 'left', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                transition: 'all 0.15s', marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '14px', width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px', borderTop: '1px solid #1e1e28' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e1e28', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: ACCENT, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ color: '#f0f0f5', fontSize: '12px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#6b6b80', fontSize: '11px' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ ...S.btnGhost, width: '100%', textAlign: 'center' }}>Sign out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={S.main}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontSize: '24px', fontWeight: 800, color: '#f0f0f5', lineHeight: 1.2 }}>
              {activeTab === 'admin' ? 'Admin Panel' : selectedClientName}
            </h1>
            <p style={{ color: '#6b6b80', fontSize: '13px', marginTop: '4px' }}>
              {activeTab === 'overview' && 'All-channel performance overview'}
              {activeTab === 'email' && 'Email Bison campaign metrics'}
              {activeTab === 'linkedin' && 'HeyReach LinkedIn campaign metrics'}
              {activeTab === 'admin' && 'Manage users, clients, and API keys'}
            </p>
          </div>
          {activeTab !== 'admin' && (
            <button onClick={() => loadDashboard(selectedClientId)} style={S.btn} disabled={dashLoading}>
              {dashLoading ? '↻ Refreshing...' : '↻ Refresh'}
            </button>
          )}
        </div>

        {dashLoading && activeTab !== 'admin' && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#6b6b80' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>◌</div>
            Fetching live data from Email Bison & HeyReach...
          </div>
        )}

        {!dashLoading && (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div>
                {/* Section: Email */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '3px', height: '20px', background: ACCENT, borderRadius: '2px' }} />
                  <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: '15px', color: '#f0f0f5' }}>Email Performance</span>
                  <span style={{ ...S.badge(ACCENT), fontSize: '10px' }}>{emailAgg.totalCampaigns || 0} campaigns</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                  <StatCard label="Emails Sent" value={(emailAgg.totalSent || 0).toLocaleString()} color={ACCENT} icon="✉" />
                  <StatCard label="Total Replies" value={(emailAgg.totalReplies || 0).toLocaleString()} sub={`${emailAgg.replyRate || 0}% rate`} color={ACCENT} icon="↩" />
                  <StatCard label="Bounces" value={(emailAgg.totalBounces || 0).toLocaleString()} sub={`${emailAgg.bounceRate || 0}% rate`} color="#f87171" icon="⊗" />
                  <StatCard label="Opens" value={(emailAgg.totalOpens || 0).toLocaleString()} sub={`${emailAgg.openRate || 0}% rate`} color={ACCENT} icon="◉" />
                  <StatCard label="Clicks" value={(emailAgg.totalClicks || 0).toLocaleString()} sub={`${emailAgg.clickRate || 0}% rate`} color={ACCENT} icon="⊕" />
                  <StatCard label="Active Campaigns" value={emailAgg.activeCampaigns || 0} color={ACCENT} icon="▶" />
                </div>

                {/* Section: LinkedIn */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '3px', height: '20px', background: LINKEDIN, borderRadius: '2px' }} />
                  <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: '15px', color: '#f0f0f5' }}>LinkedIn Performance</span>
                  <span style={{ ...S.badge(LINKEDIN), fontSize: '10px' }}>{linkedinAgg.totalCampaigns || 0} campaigns</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                  <StatCard label="Connections Sent" value={(linkedinAgg.totalConnectionsSent || 0).toLocaleString()} color={LINKEDIN} icon="⊞" />
                  <StatCard label="Connections Accepted" value={(linkedinAgg.totalConnectionsAccepted || 0).toLocaleString()} sub={`${linkedinAgg.acceptanceRate || 0}% rate`} color={LINKEDIN} icon="✓" />
                  <StatCard label="Messages Sent" value={(linkedinAgg.totalMessagesSent || 0).toLocaleString()} color={LINKEDIN} icon="▤" />
                  <StatCard label="Message Replies" value={(linkedinAgg.totalReplies || 0).toLocaleString()} sub={`${linkedinAgg.replyRate || 0}% rate`} color={LINKEDIN} icon="↩" />
                  <StatCard label="Active Campaigns" value={linkedinAgg.activeCampaigns || 0} color={LINKEDIN} icon="▶" />
                </div>

                {/* LinkedIn chart */}
                {linkedinTimeSeries.length > 0 && (
                  <div style={{ ...S.card, marginBottom: '28px' }}>
                    <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: '14px', marginBottom: '20px', color: '#f0f0f5' }}>
                      LinkedIn Activity (Last 30 Active Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={linkedinTimeSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                        <XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#9090a8' }} />
                        <Line type="monotone" dataKey="connectionsSent" name="Conn. Sent" stroke={LINKEDIN} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="connectionsAccepted" name="Conn. Accepted" stroke="#4ade80" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* EMAIL TAB */}
            {activeTab === 'email' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                  <StatCard label="Total Sent" value={(emailAgg.totalSent || 0).toLocaleString()} color={ACCENT} icon="✉" />
                  <StatCard label="Reply Rate" value={`${emailAgg.replyRate || 0}%`} sub={`${(emailAgg.totalReplies || 0).toLocaleString()} replies`} color={ACCENT} icon="↩" />
                  <StatCard label="Bounce Rate" value={`${emailAgg.bounceRate || 0}%`} sub={`${(emailAgg.totalBounces || 0).toLocaleString()} bounces`} color="#f87171" icon="⊗" />
                  <StatCard label="Open Rate" value={`${emailAgg.openRate || 0}%`} color={ACCENT} icon="◉" />
                  <StatCard label="Click Rate" value={`${emailAgg.clickRate || 0}%`} color={ACCENT} icon="⊕" />
                </div>

                {emailCampaigns.length > 0 ? (
                  <div style={S.card}>
                    <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: '#f0f0f5' }}>
                      Email Campaigns ({emailCampaigns.length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e1e28' }}>
                            {['Campaign', 'Status', 'Sent', 'Replies', 'Reply %', 'Bounces', 'Bounce %', 'Opens', 'Open %'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b6b80', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {emailCampaigns.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #1e1e2844', transition: 'background 0.15s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#18181f')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                              <td style={{ padding: '11px 12px' }}><StatusBadge status={c.status} /></td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{(c.sent || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{(c.replies || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: ACCENT, fontWeight: 600 }}>{c.replyRate}%</td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{(c.bounces || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: c.bounceRate > 5 ? '#f87171' : '#f0f0f5' }}>{c.bounceRate}%</td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{(c.opens || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{c.openRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#6b6b80' }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✉</div>
                    <div>No email campaign data available</div>
                    <div style={{ fontSize: '12px', marginTop: '8px', color: '#4a4a5a' }}>Email Bison campaigns will appear here once the API responds</div>
                  </div>
                )}
              </div>
            )}

            {/* LINKEDIN TAB */}
            {activeTab === 'linkedin' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                  <StatCard label="Connections Sent" value={(linkedinAgg.totalConnectionsSent || 0).toLocaleString()} color={LINKEDIN} icon="⊞" />
                  <StatCard label="Acceptance Rate" value={`${linkedinAgg.acceptanceRate || 0}%`} sub={`${(linkedinAgg.totalConnectionsAccepted || 0).toLocaleString()} accepted`} color={LINKEDIN} icon="✓" />
                  <StatCard label="Messages Sent" value={(linkedinAgg.totalMessagesSent || 0).toLocaleString()} color={LINKEDIN} icon="▤" />
                  <StatCard label="Message Reply Rate" value={`${linkedinAgg.replyRate || 0}%`} sub={`${(linkedinAgg.totalReplies || 0).toLocaleString()} replies`} color={LINKEDIN} icon="↩" />
                  <StatCard label="Total Campaigns" value={linkedinAgg.totalCampaigns || 0} color={LINKEDIN} icon="◎" />
                  <StatCard label="Active Campaigns" value={linkedinAgg.activeCampaigns || 0} color={linkedinAgg.activeCampaigns > 0 ? '#4ade80' : LINKEDIN} icon="▶" />
                </div>

                {linkedinTimeSeries.length > 0 && (
                  <div style={{ ...S.card, marginBottom: '24px' }}>
                    <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: '14px', marginBottom: '20px', color: '#f0f0f5' }}>
                      Daily Activity Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={linkedinTimeSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e28" />
                        <XAxis dataKey="date" tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#6b6b80', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#9090a8' }} />
                        <Bar dataKey="connectionsSent" name="Sent" fill={LINKEDIN} opacity={0.8} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="connectionsAccepted" name="Accepted" fill="#4ade80" opacity={0.8} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {linkedinCampaigns.length > 0 && (
                  <div style={S.card}>
                    <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: '#f0f0f5' }}>
                      LinkedIn Campaigns ({linkedinCampaigns.length})
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e1e28' }}>
                            {['Campaign', 'Status', 'Total Leads', 'In Progress', 'Finished', 'Failed', 'Lead List', 'Started'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b6b80', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {linkedinCampaigns.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #1e1e2844' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#18181f')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                              <td style={{ padding: '11px 12px' }}><StatusBadge status={c.status} /></td>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5' }}>{(c.total || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: LINKEDIN }}>{(c.inProgress || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: '#4ade80' }}>{(c.finished || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: c.failed > 0 ? '#f87171' : '#6b6b80' }}>{(c.failed || 0).toLocaleString()}</td>
                              <td style={{ padding: '11px 12px', color: '#9090a8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.listName || '—'}</td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '12px' }}>{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ADMIN TAB */}
            {activeTab === 'admin' && user?.role === 'admin' && (
              <div>
                {/* Admin sub-tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                  {(['users', 'clients'] as const).map(t => (
                    <button key={t} onClick={() => setAdminTab(t)} style={{
                      padding: '8px 18px', borderRadius: '8px', border: '1px solid',
                      borderColor: adminTab === t ? ACCENT : '#1e1e28',
                      background: adminTab === t ? 'rgba(232,255,71,0.1)' : 'transparent',
                      color: adminTab === t ? ACCENT : '#9090a8',
                      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}>{t}</button>
                  ))}
                </div>

                {/* Users */}
                {adminTab === 'users' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ color: '#9090a8', fontSize: '13px' }}>{adminUsers.length} users</span>
                      <button style={S.btn} onClick={() => setShowAddUser(!showAddUser)}>+ Add User</button>
                    </div>
                    {showAddUser && (
                      <div style={{ ...S.card, marginBottom: '20px', borderColor: ACCENT + '40' }}>
                        <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: '14px', marginBottom: '18px', color: '#f0f0f5' }}>New User</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          <div><label style={S.label}>Name</label><input style={S.input} value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" /></div>
                          <div><label style={S.label}>Email</label><input style={S.input} type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" /></div>
                          <div><label style={S.label}>Password</label><input style={S.input} type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min. 8 chars" /></div>
                          <div><label style={S.label}>Role</label>
                            <select style={S.input} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                              <option value="admin">Admin</option>
                              <option value="client">Client</option>
                            </select>
                          </div>
                          {newUser.role === 'client' && (
                            <div><label style={S.label}>Client Account</label>
                              <select style={S.input} value={newUser.clientId} onChange={e => setNewUser({ ...newUser, clientId: e.target.value })}>
                                <option value="">Select client...</option>
                                {adminClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button style={S.btn} onClick={createUser}>Create User</button>
                          <button style={S.btnGhost} onClick={() => setShowAddUser(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={S.card}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e1e28' }}>
                            {['Name', 'Email', 'Role', 'Client', 'Created', ''].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b6b80', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((u: DashboardUser) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #1e1e2844' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#18181f')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5', fontWeight: 500 }}>{u.name}</td>
                              <td style={{ padding: '11px 12px', color: '#9090a8' }}>{u.email}</td>
                              <td style={{ padding: '11px 12px' }}><span style={S.badge(u.role === 'admin' ? ACCENT : LINKEDIN)}>{u.role}</span></td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '12px' }}>{u.clientId ? adminClients.find(c => c.id === u.clientId)?.name || u.clientId : '—'}</td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '12px' }}>—</td>
                              <td style={{ padding: '11px 12px' }}>
                                <button onClick={() => deleteUser(u.id)} style={{ ...S.btnGhost, padding: '4px 10px', color: '#f87171', borderColor: '#f8717130' }}>Delete</button>
                              </td>
                            </tr>
                          ))}
                          {adminUsers.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6b6b80' }}>No users yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Clients */}
                {adminTab === 'clients' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <span style={{ color: '#9090a8', fontSize: '13px' }}>{adminClients.length} clients</span>
                      <button style={S.btn} onClick={() => setShowAddClient(!showAddClient)}>+ Add Client</button>
                    </div>
                    {showAddClient && (
                      <div style={{ ...S.card, marginBottom: '20px', borderColor: ACCENT + '40' }}>
                        <h3 style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700, fontSize: '14px', marginBottom: '18px', color: '#f0f0f5' }}>New Client</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                          <div><label style={S.label}>Client Name</label><input style={S.input} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="e.g. Epsilon" /></div>
                          <div><label style={S.label}>Email Bison Domain</label><input style={S.input} value={newClient.emailBisonDomain} onChange={e => setNewClient({ ...newClient, emailBisonDomain: e.target.value })} placeholder="dedi.emailbison.com" /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Email Bison API Key</label><input style={S.input} value={newClient.emailBisonKey} onChange={e => setNewClient({ ...newClient, emailBisonKey: e.target.value })} placeholder="81|xxxx..." /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={S.label}>HeyReach API Key</label><input style={S.input} value={newClient.heyreachKey} onChange={e => setNewClient({ ...newClient, heyreachKey: e.target.value })} placeholder="v3xyz..." /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button style={S.btn} onClick={createClient}>Create Client</button>
                          <button style={S.btnGhost} onClick={() => setShowAddClient(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={S.card}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #1e1e28' }}>
                            {['Name', 'Email Bison Domain', 'Email Bison Key', 'HeyReach Key', 'Added'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b6b80', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminClients.map((c: Client) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #1e1e2844' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#18181f')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '11px 12px', color: '#f0f0f5', fontWeight: 600 }}>{c.name}</td>
                              <td style={{ padding: '11px 12px', color: '#9090a8', fontSize: '12px' }}>{c.emailBisonDomain}</td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '11px', fontFamily: 'monospace' }}>{c.emailBisonKey ? c.emailBisonKey.slice(0, 12) + '...' : '—'}</td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '11px', fontFamily: 'monospace' }}>{c.heyreachKey ? c.heyreachKey.slice(0, 12) + '...' : '—'}</td>
                              <td style={{ padding: '11px 12px', color: '#6b6b80', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {adminClients.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#6b6b80' }}>No clients yet</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
