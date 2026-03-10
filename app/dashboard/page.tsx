'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface User { id: string; email: string; role: 'admin' | 'client'; clientId?: string; name: string; }
interface Client { id: string; name: string; slug: string; emailBisonKey: string; heyreachKey: string; emailBisonDomain: string; createdAt: string; }
interface DashboardUser { id: string; email: string; role: string; clientId?: string; name: string; }

const ACCENT = '#2563eb';
const LINKEDIN = '#0a66c2';

const S = {
  page: { minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Inter', -apple-system, sans-serif" } as React.CSSProperties,
  sidebar: { width: '230px', minHeight: '100vh', background: '#ffffff', borderRight: '1px solid #e2e5ef', position: 'fixed' as const, left: 0, top: 0, bottom: 0, overflowY: 'auto' as const, zIndex: 10 },
  main: { marginLeft: '230px', padding: '28px 32px', minHeight: '100vh' },
  card: { background: '#ffffff', border: '1px solid #e2e5ef', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  statCard: (accent: string) => ({ background: '#ffffff', border: '1px solid #e2e5ef', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', borderLeft: `3px solid ${accent}` }),
  badge: (color: string, bg: string) => ({ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', background: bg, color, fontSize: '11px', fontWeight: 600 }),
  btn: { padding: '8px 16px', background: ACCENT, color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' },
  btnOutline: { padding: '8px 16px', background: 'transparent', color: '#64748b', border: '1px solid #e2e5ef', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' },
  input: { width: '100%', padding: '9px 12px', background: '#f8fafc', border: '1px solid #e2e5ef', borderRadius: '7px', color: '#0f1729', fontSize: '13px', outline: 'none' },
  label: { display: 'block', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.6px', marginBottom: '5px' },
};

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const map: Record<string, [string, string]> = {
    IN_PROGRESS: ['#16a34a', '#dcfce7'], ACTIVE: ['#16a34a', '#dcfce7'], RUNNING: ['#16a34a', '#dcfce7'],
    PAUSED: ['#d97706', '#fef3c7'], FINISHED: ['#0a66c2', '#dbeafe'], COMPLETED: ['#0a66c2', '#dbeafe'],
    FAILED: ['#dc2626', '#fee2e2'], CANCELED: ['#dc2626', '#fee2e2'], DRAFT: ['#64748b', '#f1f5f9'],
  };
  const [color, bg] = map[s] || ['#64748b', '#f1f5f9'];
  const label = s === 'IN_PROGRESS' ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase();
  return <span style={S.badge(color, bg)}><span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block' }} />{label}</span>;
}

function StatCard({ label, value, sub, accent, icon }: { label: string; value: string | number; sub?: string; accent: string; icon: string }) {
  return (
    <div style={S.statCard(accent)} className="animate-fade-in animate-stagger-1">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px' }}>{icon}</span>
        {sub && <span style={{ color: '#64748b', fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{sub}</span>}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, color: '#0f1729', lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      <div style={{ color: '#64748b', fontSize: '12px' }}>{label}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e5ef', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ color: '#64748b', marginBottom: '6px', fontWeight: 500 }}>{label}</div>
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
  const [newClient, setNewClient] = useState({ name: '', emailBisonKey: '', emailBisonDomain: 'send.founderled.io', heyreachKey: '' });
  const [emailPage, setEmailPage] = useState(1);
  const EMAIL_PAGE_SIZE = 15;
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(data => {
      if (data.error) { router.push('/login'); return; }
      setUser(data);
      if (data.role === 'client' && data.clientId) setSelectedClientId(data.clientId);
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
      setDashboard(await res.json());
    } catch { /* ignore */ }
    setDashLoading(false);
  }, []);

  useEffect(() => { if (selectedClientId) loadDashboard(selectedClientId); }, [selectedClientId, loadDashboard]);

  const loadAdminData = useCallback(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => Array.isArray(d) && setAdminUsers(d));
    fetch('/api/admin/clients').then(r => r.json()).then(d => Array.isArray(d) && setAdminClients(d));
  }, []);

  useEffect(() => { if (activeTab === 'admin') loadAdminData(); }, [activeTab, loadAdminData]);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };
  const createUser = async () => {
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    if (res.ok) { setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'client', clientId: '' }); loadAdminData(); }
  };
  const createClient = async () => {
    const res = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) });
    if (res.ok) { setShowAddClient(false); setNewClient({ name: '', emailBisonKey: '', emailBisonDomain: 'send.founderled.io', heyreachKey: '' }); loadAdminData(); fetch('/api/admin/clients').then(r => r.json()).then(d => Array.isArray(d) && setClients(d)); }
  };
  const deleteUser = async (id: string) => { if (confirm('Delete this user?')) { await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' }); loadAdminData(); } };

  if (loading) return <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: '#64748b' }}>Loading...</div></div>;

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
  const emailDebug = email?._debug || null;
  const linkedinDebug = linkedin?._debug || null;
  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || clientInfo?.name || 'Client';

  const navItems = [
    { id: 'overview', label: 'Overview', icon: '⊞' },
    { id: 'email', label: 'Email Campaigns', icon: '✉' },
    { id: 'linkedin', label: 'LinkedIn', icon: '⬡' },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙' }] : []),
  ];

  return (
    <div style={S.page}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{ padding: '16px 18px 14px', borderBottom: '1px solid #e2e5ef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: '#ffffff', borderRadius: '8px', padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Founderled.io" style={{ width: '120px', height: 'auto', display: 'block' }} />
            </div>
          </div>
        </div>

        {user?.role === 'admin' && clients.length > 0 && (
          <div style={{ padding: '14px 14px 8px' }}>
            <div style={S.label}>Client</div>
            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <nav style={{ padding: '8px 10px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as 'overview' | 'email' | 'linkedin' | 'admin')} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
              padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: activeTab === item.id ? '#eff4ff' : 'transparent',
              color: activeTab === item.id ? ACCENT : '#64748b',
              fontSize: '13px', textAlign: 'left', fontWeight: activeTab === item.id ? 600 : 400,
              transition: 'all 0.15s', marginBottom: '1px',
            }}>
              <span style={{ fontSize: '13px', width: '16px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px', borderTop: '1px solid #e2e5ef', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#eff4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: ACCENT, fontWeight: 700 }}>
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ color: '#0f1729', fontSize: '12px', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'capitalize' }}>{user?.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ ...S.btnOutline, width: '100%', textAlign: 'center' as const }}>Sign out</button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1729', lineHeight: 1.2, marginBottom: '3px' }}>
              {activeTab === 'admin' ? 'Admin Panel' : selectedClientName}
            </h1>
            <p style={{ color: '#64748b', fontSize: '13px' }}>
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

        {dashLoading && <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Fetching live data from Email Bison & HeyReach...</div>}

        {!dashLoading && (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '3px', height: '18px', background: ACCENT, borderRadius: '2px' }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f1729' }}>Email Performance</span>
                  <span style={S.badge(ACCENT, '#eff4ff')}>{emailAgg.totalCampaigns || 0} campaigns</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  <StatCard label="Emails Sent" value={(emailAgg.totalSent || 0).toLocaleString()} accent={ACCENT} icon="✉" />
                  <StatCard label="Replies" value={(emailAgg.totalReplies || 0).toLocaleString()} sub={`${emailAgg.replyRate || 0}% rate`} accent={ACCENT} icon="↩" />
                  <StatCard label="Bounces" value={(emailAgg.totalBounces || 0).toLocaleString()} sub={`${emailAgg.bounceRate || 0}% rate`} accent="#dc2626" icon="⊗" />
                  <StatCard label="Active Campaigns" value={emailAgg.activeCampaigns || 0} accent={ACCENT} icon="▶" />
                </div>

                {emailDebug?.error && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: '#713f12' }}>
                    <strong>Email Bison API note:</strong> Received error <code>{emailDebug.error}</code>. 
                    Check that your API key and domain are correct in Admin → Clients.
                    {emailDebug.rawKeys && <span> Response keys: {emailDebug.rawKeys.join(', ')}</span>}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '3px', height: '18px', background: LINKEDIN, borderRadius: '2px' }} />
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f1729' }}>LinkedIn Performance</span>
                  <span style={S.badge(LINKEDIN, '#dbeafe')}>{linkedinAgg.totalCampaigns || 0} campaigns</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  <StatCard label="Connections Sent" value={(linkedinAgg.totalConnectionsSent || 0).toLocaleString()} accent={LINKEDIN} icon="⊞" />
                  <StatCard label="Accepted" value={(linkedinAgg.totalConnectionsAccepted || 0).toLocaleString()} sub={`${linkedinAgg.acceptanceRate || 0}% rate`} accent={LINKEDIN} icon="✓" />
                  <StatCard label="Messages Sent" value={(linkedinAgg.totalMessagesSent || 0).toLocaleString()} accent={LINKEDIN} icon="▤" />
                  <StatCard label="Replies" value={(linkedinAgg.totalReplies || 0).toLocaleString()} sub={`${linkedinAgg.replyRate || 0}% rate`} accent={LINKEDIN} icon="↩" />
                  <StatCard label="Active Campaigns" value={linkedinAgg.activeCampaigns || 0} accent={linkedinAgg.activeCampaigns > 0 ? '#16a34a' : LINKEDIN} icon="▶" />
                </div>

                {linkedinTimeSeries.length > 0 && (
                  <div style={S.card}>
                    <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: '#0f1729' }}>LinkedIn Activity (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={linkedinTimeSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="connectionsSent" name="Sent" stroke={LINKEDIN} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="connectionsAccepted" name="Accepted" stroke="#16a34a" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* EMAIL TAB */}
            {activeTab === 'email' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <StatCard label="Total Sent" value={(emailAgg.totalSent || 0).toLocaleString()} accent={ACCENT} icon="✉" />
                  <StatCard label="Reply Rate" value={`${emailAgg.replyRate || 0}%`} sub={`${(emailAgg.totalReplies || 0).toLocaleString()} replies`} accent={ACCENT} icon="↩" />
                  <StatCard label="Bounce Rate" value={`${emailAgg.bounceRate || 0}%`} sub={`${(emailAgg.totalBounces || 0).toLocaleString()} bounces`} accent="#dc2626" icon="⊗" />
                </div>

                {emailDebug?.error && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#713f12' }}>
                    ⚠️ <strong>Email Bison API issue:</strong> Error code <code>{emailDebug.error}</code>. 
                    The API key may be incorrect or the domain may be wrong. Check Admin → Clients.
                    {emailDebug.rawKeys && <div style={{ marginTop: '4px' }}>Response had keys: <code>{emailDebug.rawKeys.join(', ')}</code></div>}
                  </div>
                )}

                {emailCampaigns.length > 0 ? (
                  <div style={S.card}>
                    {/* Header with pagination controls */}
                    {(() => {
                      const totalPages = Math.ceil(emailCampaigns.length / EMAIL_PAGE_SIZE);
                      const pagedCampaigns = emailCampaigns.slice((emailPage - 1) * EMAIL_PAGE_SIZE, emailPage * EMAIL_PAGE_SIZE);
                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontWeight: 600, fontSize: '14px', color: '#0f1729', margin: 0 }}>
                              Email Campaigns ({emailCampaigns.length})
                            </h3>
                            {totalPages > 1 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
                                <button
                                  onClick={() => setEmailPage(p => Math.max(1, p - 1))}
                                  disabled={emailPage === 1}
                                  style={{ background: 'none', border: '1px solid #e2e5ef', borderRadius: '6px', width: '28px', height: '28px', cursor: emailPage === 1 ? 'default' : 'pointer', color: emailPage === 1 ? '#cbd5e1' : '#0f1729', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  ‹
                                </button>
                                <span style={{ fontSize: '12px' }}>Page {emailPage} of {totalPages}</span>
                                <button
                                  onClick={() => setEmailPage(p => Math.min(totalPages, p + 1))}
                                  disabled={emailPage === totalPages}
                                  style={{ background: 'none', border: '1px solid #e2e5ef', borderRadius: '6px', width: '28px', height: '28px', cursor: emailPage === totalPages ? 'default' : 'pointer', color: emailPage === totalPages ? '#cbd5e1' : '#0f1729', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  ›
                                </button>
                              </div>
                            )}
                          </div>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                                  {['Campaign', 'Status', 'Sent', 'Replies', 'Reply %', 'Bounces', 'Bounce %'].map(h => (
                                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(pagedCampaigns as any[]).map((c: any) => (
                                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td style={{ padding: '10px 12px', color: '#0f1729', fontWeight: 500, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                    <td style={{ padding: '10px 12px' }}><StatusBadge status={c.status} /></td>
                                    <td style={{ padding: '10px 12px', color: '#0f1729' }}>{(c.sent || 0).toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', color: '#0f1729' }}>{(c.replies || 0).toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', color: ACCENT, fontWeight: 600 }}>{c.replyRate}%</td>
                                    <td style={{ padding: '10px 12px', color: '#0f1729' }}>{(c.bounces || 0).toLocaleString()}</td>
                                    <td style={{ padding: '10px 12px', color: parseFloat(c.bounceRate) > 5 ? '#dc2626' : '#0f1729' }}>{c.bounceRate}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div style={{ ...S.card, textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    <div style={{ fontSize: '28px', marginBottom: '10px' }}>✉</div>
                    <div style={{ fontWeight: 500 }}>No email campaigns found</div>
                    <div style={{ fontSize: '12px', marginTop: '6px', color: '#94a3b8' }}>
                      {emailDebug?.error ? 'API returned an error — check your Email Bison API key in Admin → Clients' : 'Email Bison campaigns will appear here once data is available'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LINKEDIN TAB */}
            {activeTab === 'linkedin' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  <StatCard label="Connections Sent" value={(linkedinAgg.totalConnectionsSent || 0).toLocaleString()} accent={LINKEDIN} icon="⊞" />
                  <StatCard label="Acceptance Rate" value={`${linkedinAgg.acceptanceRate || 0}%`} sub={`${(linkedinAgg.totalConnectionsAccepted || 0).toLocaleString()} accepted`} accent={LINKEDIN} icon="✓" />
                  <StatCard label="Messages Sent" value={(linkedinAgg.totalMessagesSent || 0).toLocaleString()} accent={LINKEDIN} icon="▤" />
                  <StatCard label="Reply Rate" value={`${linkedinAgg.replyRate || 0}%`} sub={`${(linkedinAgg.totalReplies || 0).toLocaleString()} replies`} accent={LINKEDIN} icon="↩" />
                  <StatCard label="Total Campaigns" value={linkedinAgg.totalCampaigns || 0} accent={LINKEDIN} icon="◎" />
                  <StatCard label="Active Campaigns" value={linkedinAgg.activeCampaigns || 0} accent={linkedinAgg.activeCampaigns > 0 ? '#16a34a' : LINKEDIN} icon="▶" />
                </div>

                {linkedinDebug && linkedinAgg.totalConnectionsSent === 0 && (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#713f12' }}>
                    ⚠️ <strong>HeyReach debug:</strong> stats={linkedinDebug.statsFulfilled}, campaigns={linkedinDebug.campaignsFulfilled}, 
                    hasOverallStats={String(linkedinDebug.hasOverallStats)}, rawKeys=[{(linkedinDebug.statsRawKeys || []).join(', ')}]
                    {linkedinDebug.overallStatsSample && <span>, sent={linkedinDebug.overallStatsSample.connectionsSent}</span>}
                  </div>
                )}

                {linkedinTimeSeries.length > 0 && (
                  <div style={{ ...S.card, marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '18px', color: '#0f1729' }}>Daily Activity</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={linkedinTimeSeries} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="connectionsSent" name="Sent" fill={LINKEDIN} opacity={0.85} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="connectionsAccepted" name="Accepted" fill="#16a34a" opacity={0.85} radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {linkedinCampaigns.length > 0 && (
                  <div style={S.card}>
                    <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '16px', color: '#0f1729' }}>LinkedIn Campaigns ({linkedinCampaigns.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            {['Campaign', 'Status', 'Total Leads', 'In Progress', 'Finished', 'Failed', 'Lead List', 'Started'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {linkedinCampaigns.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '10px 12px', color: '#0f1729', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                              <td style={{ padding: '10px 12px' }}><StatusBadge status={c.status} /></td>
                              <td style={{ padding: '10px 12px', color: '#0f1729' }}>{(c.total || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: LINKEDIN, fontWeight: 500 }}>{(c.inProgress || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: '#16a34a', fontWeight: 500 }}>{(c.finished || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: c.failed > 0 ? '#dc2626' : '#94a3b8' }}>{(c.failed || 0).toLocaleString()}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.listName || '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : '—'}</td>
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
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {(['users', 'clients'] as const).map(t => (
                    <button key={t} onClick={() => setAdminTab(t)} style={{
                      padding: '7px 16px', borderRadius: '7px', border: '1px solid',
                      borderColor: adminTab === t ? ACCENT : '#e2e5ef',
                      background: adminTab === t ? '#eff4ff' : '#fff',
                      color: adminTab === t ? ACCENT : '#64748b',
                      fontWeight: 600, fontSize: '13px', cursor: 'pointer', textTransform: 'capitalize',
                    }}>{t}</button>
                  ))}
                </div>

                {adminTab === 'users' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>{adminUsers.length} users</span>
                      <button style={S.btn} onClick={() => setShowAddUser(!showAddUser)}>+ Add User</button>
                    </div>
                    {showAddUser && (
                      <div style={{ ...S.card, marginBottom: '16px', borderColor: ACCENT + '40', borderLeftWidth: '3px', borderLeftColor: ACCENT }}>
                        <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '16px', color: '#0f1729' }}>New User</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
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
                            <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Client Account</label>
                              <select style={S.input} value={newUser.clientId} onChange={e => setNewUser({ ...newUser, clientId: e.target.value })}>
                                <option value="">Select client...</option>
                                {adminClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={S.btn} onClick={createUser}>Create User</button>
                          <button style={S.btnOutline} onClick={() => setShowAddUser(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={S.card}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            {['Name', 'Email', 'Role', 'Client', ''].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((u: DashboardUser) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '10px 12px', color: '#0f1729', fontWeight: 500 }}>{u.name}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b' }}>{u.email}</td>
                              <td style={{ padding: '10px 12px' }}><span style={S.badge(u.role === 'admin' ? ACCENT : LINKEDIN, u.role === 'admin' ? '#eff4ff' : '#dbeafe')}>{u.role}</span></td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{u.clientId ? adminClients.find(c => c.id === u.clientId)?.name || u.clientId : '—'}</td>
                              <td style={{ padding: '10px 12px' }}><button onClick={() => deleteUser(u.id)} style={{ ...S.btnOutline, padding: '4px 10px', color: '#dc2626', borderColor: '#fecaca', fontSize: '12px' }}>Delete</button></td>
                            </tr>
                          ))}
                          {adminUsers.length === 0 && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No users yet</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {adminTab === 'clients' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>{adminClients.length} clients</span>
                      <button style={S.btn} onClick={() => setShowAddClient(!showAddClient)}>+ Add Client</button>
                    </div>
                    {showAddClient && (
                      <div style={{ ...S.card, marginBottom: '16px', borderLeftWidth: '3px', borderLeftColor: ACCENT }}>
                        <h3 style={{ fontWeight: 600, fontSize: '14px', marginBottom: '16px', color: '#0f1729' }}>New Client</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          <div><label style={S.label}>Client Name</label><input style={S.input} value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="e.g. Epsilon" /></div>
                          <div><label style={S.label}>Email Bison Domain</label><input style={S.input} value={newClient.emailBisonDomain} onChange={e => setNewClient({ ...newClient, emailBisonDomain: e.target.value })} placeholder="send.founderled.io" /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={S.label}>Email Bison API Key</label><input style={S.input} value={newClient.emailBisonKey} onChange={e => setNewClient({ ...newClient, emailBisonKey: e.target.value })} placeholder="81|xxxx..." /></div>
                          <div style={{ gridColumn: '1/-1' }}><label style={S.label}>HeyReach API Key</label><input style={S.input} value={newClient.heyreachKey} onChange={e => setNewClient({ ...newClient, heyreachKey: e.target.value })} placeholder="v3xyz..." /></div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button style={S.btn} onClick={createClient}>Create Client</button>
                          <button style={S.btnOutline} onClick={() => setShowAddClient(false)}>Cancel</button>
                        </div>
                      </div>
                    )}
                    <div style={S.card}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                            {['Name', 'Email Bison Domain', 'EB Key', 'HeyReach Key', 'Added'].map(h => (
                              <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminClients.map((c: Client) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td style={{ padding: '10px 12px', color: '#0f1729', fontWeight: 600 }}>{c.name}</td>
                              <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{c.emailBisonDomain}</td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{c.emailBisonKey ? c.emailBisonKey.slice(0, 14) + '...' : '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{c.heyreachKey ? c.heyreachKey.slice(0, 14) + '...' : '—'}</td>
                              <td style={{ padding: '10px 12px', color: '#94a3b8', fontSize: '12px' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {adminClients.length === 0 && <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No clients yet</td></tr>}
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
