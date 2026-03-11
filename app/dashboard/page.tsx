'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart
} from 'recharts';

interface User { id: string; email: string; role: 'admin' | 'client'; clientId?: string; name: string; }
interface Client { id: string; name: string; slug: string; emailBisonKey: string; heyreachKey: string; emailBisonDomain: string; createdAt: string; }
interface DashboardUser { id: string; email: string; role: string; clientId?: string; name: string; }

const C = {
  bg:        '#080d18',
  bgCard:    '#0f1623',
  bgHover:   '#141d2e',
  border:    '#1c2840',
  borderHi:  '#263754',
  text:      '#e2eaf8',
  textMuted: '#5e7a9e',
  textDim:   '#2e4560',
  blue:      '#3b82f6',
  blueDim:   '#0f2043',
  blueGlow:  'rgba(59,130,246,0.12)',
  green:     '#10b981',
  greenDim:  '#0a2e21',
  red:       '#ef4444',
  amber:     '#f59e0b',
  linkedin:  '#0a84ff',
  linkedinBg:'#061830',
};

const G = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:${C.bg};color:${C.text};font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:4px;height:4px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px}
  select option{background:${C.bgCard};color:${C.text}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  .fu{animation:fadeUp 0.35s ease both}
  .d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.12s}
  .d4{animation-delay:.16s}.d5{animation-delay:.20s}.d6{animation-delay:.24s}
  .nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 11px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-family:'Sora',sans-serif;font-weight:400;text-align:left;transition:all .15s;color:${C.textMuted};background:transparent}
  .nav-btn:hover{color:${C.text};background:${C.bgHover}}
  .nav-btn.on{color:${C.blue};background:${C.blueGlow};font-weight:600}
  .stat{background:${C.bgCard};border:1px solid ${C.border};border-radius:12px;padding:20px;transition:all .2s;position:relative;overflow:hidden;cursor:default}
  .stat::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;opacity:0;transition:opacity .2s}
  .stat:hover{border-color:${C.borderHi};transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.4)}
  .stat:hover::after{opacity:1}
  .stat.blue::after{background:linear-gradient(90deg,${C.blue},transparent)}
  .stat.green::after{background:linear-gradient(90deg,${C.green},transparent)}
  .stat.linkedin::after{background:linear-gradient(90deg,${C.linkedin},transparent)}
  .stat.red::after{background:linear-gradient(90deg,${C.red},transparent)}
  .card{background:${C.bgCard};border:1px solid ${C.border};border-radius:14px;padding:24px}
  .trow:hover{background:${C.bgHover}!important}
  .pill{padding:5px 11px;border-radius:6px;border:1px solid ${C.border};background:transparent;color:${C.textMuted};font-size:11.5px;font-family:'Sora',sans-serif;cursor:pointer;transition:all .15s;font-weight:500}
  .pill:hover{border-color:${C.borderHi};color:${C.text}}
  .pill.on{border-color:${C.blue};background:${C.blueGlow};color:${C.blue}}
  .pill:disabled{opacity:.35;cursor:default}
  .btn-primary{padding:9px 20px;background:${C.blue};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'Sora',sans-serif;transition:all .15s;letter-spacing:.01em}
  .btn-primary:hover{background:#2563eb;box-shadow:0 0 24px rgba(59,130,246,.35)}
  .btn-primary:disabled{opacity:.45;cursor:default;box-shadow:none}
  .btn-ghost{padding:9px 20px;background:transparent;color:${C.textMuted};border:1px solid ${C.border};border-radius:8px;cursor:pointer;font-size:13.5px;font-family:'Sora',sans-serif;transition:all .15s}
  .btn-ghost:hover{border-color:${C.borderHi};color:${C.text}}
  .btn-danger{padding:5px 12px;background:transparent;color:${C.red};border:1px solid rgba(239,68,68,.25);border-radius:6px;cursor:pointer;font-size:12px;font-family:'Sora',sans-serif;transition:all .15s}
  .btn-danger:hover{background:rgba(239,68,68,.08);border-color:${C.red}}
  .inp{width:100%;padding:10px 13px;background:${C.bg};border:1px solid ${C.border};border-radius:8px;color:${C.text};font-size:13.5px;font-family:'Sora',sans-serif;outline:none;transition:border-color .15s}
  .inp:focus{border-color:${C.blue};box-shadow:0 0 0 3px ${C.blueGlow}}
  .inp::placeholder{color:${C.textDim}}
  .lbl{color:${C.textDim};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
  .shimmer{background:linear-gradient(90deg,transparent,rgba(59,130,246,.2),transparent);background-size:200% 100%;animation:shimmer 1.4s infinite}
`;

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const m: Record<string, [string, string]> = {
    IN_PROGRESS: [C.green, C.greenDim], ACTIVE: [C.green, C.greenDim], RUNNING: [C.green, C.greenDim],
    PAUSED: [C.amber, '#2d1f00'], FINISHED: [C.blue, C.blueDim], COMPLETED: [C.blue, C.blueDim],
    FAILED: [C.red, '#2d0a0a'], CANCELED: [C.red, '#2d0a0a'], DRAFT: [C.textMuted, C.bgHover],
  };
  const [color, bg] = m[s] || [C.textMuted, C.bgHover];
  const label = s === 'IN_PROGRESS' ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase();
  const live = ['IN_PROGRESS', 'ACTIVE', 'RUNNING'].includes(s);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600, letterSpacing: '.02em' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', animation: live ? 'pulseDot 2s infinite' : 'none' }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent, cls = '' }: { label: string; value: string | number; sub?: string; accent: 'blue' | 'green' | 'red' | 'linkedin'; cls?: string }) {
  const ac = { blue: C.blue, green: C.green, red: C.red, linkedin: C.linkedin }[accent];
  const ab = { blue: C.blueGlow, green: 'rgba(16,185,129,.08)', red: 'rgba(239,68,68,.08)', linkedin: 'rgba(10,132,255,.1)' }[accent];
  return (
    <div className={`stat ${accent} fu ${cls}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: ab, border: `1px solid ${ac}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ac, opacity: .75 }} />
        </div>
        {sub && <span style={{ color: C.textMuted, fontSize: 11, background: C.bgHover, padding: '2px 8px', borderRadius: 6, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: C.text, lineHeight: 1, marginBottom: 6, letterSpacing: '-.03em', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ color: C.textMuted, fontSize: 12.5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.bgCard, border: `1px solid ${C.borderHi}`, borderRadius: 10, padding: '11px 15px', fontSize: 12, boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}>
      <div style={{ color: C.textMuted, marginBottom: 8, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: C.textMuted }}>{p.name}:</span>
          <span style={{ color: C.text, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DateFilter({ v, set }: { v: 30 | 60 | 90 | 'all'; set: (x: 30 | 60 | 90 | 'all') => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {([30, 60, 90, 'all'] as (30 | 60 | 90 | 'all')[]).map(x => (
        <button key={x} className={`pill ${v === x ? 'on' : ''}`} onClick={() => set(x)}>
          {x === 'all' ? 'All' : `${x}D`}
        </button>
      ))}
    </div>
  );
}

function Sec({ title, color, count }: { title: string; color: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
      <span style={{ fontWeight: 700, fontSize: 14.5, color: C.text }}>{title}</span>
      {count !== undefined && <span style={{ background: `${color}1a`, color, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20, letterSpacing: '.04em' }}>{count} campaigns</span>}
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dashboard, setDashboard] = useState<Record<string, any> | null>(null);
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
  const PER_PAGE = 15;
  const [dateRange, setDateRange] = useState<30 | 60 | 90 | 'all'>(30);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.error) { router.push('/login'); return; }
      setUser(d);
      if (d.role === 'client' && d.clientId) setSelectedClientId(d.clientId);
    }).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin') {
      fetch('/api/admin/clients').then(r => r.json()).then(d => {
        if (Array.isArray(d)) { setClients(d); if (d.length > 0 && !selectedClientId) setSelectedClientId(d[0].id); }
      });
    }
    setLoading(false);
  }, [user, selectedClientId]);

  const loadDash = useCallback(async (id: string) => {
    if (!id) return;
    setDashLoading(true);
    try { const r = await fetch(`/api/dashboard?clientId=${id}`); setDashboard(await r.json()); }
    catch { /* ignore */ }
    setDashLoading(false);
  }, []);

  useEffect(() => { if (selectedClientId) loadDash(selectedClientId); }, [selectedClientId, loadDash]);

  const loadAdmin = useCallback(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => Array.isArray(d) && setAdminUsers(d));
    fetch('/api/admin/clients').then(r => r.json()).then(d => Array.isArray(d) && setAdminClients(d));
  }, []);

  useEffect(() => { if (activeTab === 'admin') loadAdmin(); }, [activeTab, loadAdmin]);

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login'); };

  const createUser = async () => {
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser) });
    if (r.ok) { setShowAddUser(false); setNewUser({ name: '', email: '', password: '', role: 'client', clientId: '' }); loadAdmin(); }
  };

  const createClient = async () => {
    const r = await fetch('/api/admin/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newClient) });
    if (r.ok) {
      setShowAddClient(false); setNewClient({ name: '', emailBisonKey: '', emailBisonDomain: 'send.founderled.io', heyreachKey: '' });
      loadAdmin(); fetch('/api/admin/clients').then(r2 => r2.json()).then(d => Array.isArray(d) && setClients(d));
    }
  };

  const delUser = async (id: string) => {
    if (confirm('Delete this user?')) { await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' }); loadAdmin(); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.blue}, #6366f1)`, margin: '0 auto 16px', opacity: .9 }} />
        <div style={{ color: C.textMuted, fontSize: 13 }}>Loading...</div>
      </div>
    </div>
  );

  const email = dashboard?.email;
  const linkedin = dashboard?.linkedin;
  const clientInfo = dashboard?.client;
  const ea = email?.aggregate || {};
  const la = linkedin?.aggregate || {};
  const eCamps = email?.campaigns || [];
  const lCamps = linkedin?.campaigns || [];
  const ts: { date: string; connectionsSent: number; connectionsAccepted: number; messagesSent: number; messagesStarted: number; replies: number }[] = linkedin?.timeSeries || [];
  const eDebug = email?._debug || null;
  const lDebug = linkedin?._debug || null;
  const clientName = clients.find(c => c.id === selectedClientId)?.name || clientInfo?.name || 'Client';

  const filteredTs = dateRange === 'all' ? ts : (() => {
    const cut = new Date(); cut.setDate(cut.getDate() - dateRange);
    const cs = cut.toISOString().split('T')[0];
    return ts.filter(d => d.date >= cs);
  })();

  const emailChart = [...eCamps]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b.sent || 0) - (a.sent || 0))
    .slice(0, 15)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({ name: (c.name || '').length > 24 ? c.name.slice(0, 24) + '…' : c.name, sent: c.sent || 0, replies: c.replies || 0 }));

  const totalPages = Math.ceil(eCamps.length / PER_PAGE);
  const paged = eCamps.slice((emailPage - 1) * PER_PAGE, emailPage * PER_PAGE);

  const navItems = [
    { id: 'overview', label: 'Overview',  icon: '▦' },
    { id: 'email',    label: 'Email',     icon: '✉' },
    { id: 'linkedin', label: 'LinkedIn',  icon: 'in', mono: true },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙' }] : []),
  ];

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: '10px 14px', textAlign: 'left', color: C.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', whiteSpace: 'nowrap', borderBottom: `1px solid ${C.border}` }}>{children}</th>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <aside style={{ width: 218, minHeight: '100vh', background: C.bgCard, borderRight: `1px solid ${C.border}`, position: 'fixed', left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${C.border}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Founderled" style={{ width: 126, height: 'auto', display: 'block', filter: 'brightness(1.15) saturate(1.1)' }} />
          </div>

          {user?.role === 'admin' && clients.length > 0 && (
            <div style={{ padding: '14px 14px 6px' }}>
              <div className="lbl">Client</div>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: "'Sora', sans-serif", cursor: 'pointer', outline: 'none' }}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          <nav style={{ padding: '10px 10px', flex: 1 }}>
            {navItems.map(item => (
              <button key={item.id} className={`nav-btn ${activeTab === item.id ? 'on' : ''}`}
                onClick={() => setActiveTab(item.id as typeof activeTab)}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: activeTab === item.id ? C.blueGlow : 'transparent',
                  border: `1px solid ${activeTab === item.id ? C.blue + '30' : 'transparent'}`,
                  fontSize: item.mono ? 10 : 12, fontWeight: 700, flexShrink: 0, transition: 'all .15s',
                  fontFamily: item.mono ? "'JetBrains Mono', monospace" : 'inherit',
                }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          <div style={{ padding: 14, borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${C.blue}, #6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ color: C.textDim, fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
            <button className="btn-ghost" onClick={logout} style={{ width: '100%', textAlign: 'center', fontSize: 12.5, padding: '7px 14px' }}>Sign out</button>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────────────── */}
        <main style={{ marginLeft: 218, padding: '36px 40px', minHeight: '100vh', flex: 1, maxWidth: 'calc(100vw - 218px)' }}>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
            <div>
              <div style={{ color: C.textDim, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.9px', marginBottom: 7 }}>
                {activeTab === 'admin' ? 'System Admin' : clientName}
              </div>
              <h1 style={{ fontSize: 27, fontWeight: 700, color: C.text, lineHeight: 1.15, letterSpacing: '-.025em' }}>
                {activeTab === 'overview' && 'Performance Overview'}
                {activeTab === 'email' && 'Email Campaigns'}
                {activeTab === 'linkedin' && 'LinkedIn Outreach'}
                {activeTab === 'admin' && 'Admin Panel'}
              </h1>
            </div>
            {activeTab !== 'admin' && (
              <button className="btn-primary" onClick={() => loadDash(selectedClientId)} disabled={dashLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                <span style={{ display: 'inline-block', animation: dashLoading ? 'spin .8s linear infinite' : 'none', fontSize: 14 }}>↻</span>
                {dashLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
          </div>

          {/* Loading */}
          {dashLoading && (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ width: 50, height: 3, background: C.border, borderRadius: 2, margin: '0 auto 18px', overflow: 'hidden' }}>
                <div className="shimmer" style={{ height: '100%', width: '55%' }} />
              </div>
              <div style={{ color: C.textMuted, fontSize: 13.5 }}>Fetching live data from Email Bison &amp; HeyReach...</div>
            </div>
          )}

          {!dashLoading && (
            <>

              {/* ══ OVERVIEW ══════════════════════════════════ */}
              {activeTab === 'overview' && (
                <div className="fu">
                  <Sec title="Email Performance" color={C.blue} count={ea.totalCampaigns} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 34 }}>
                    <StatCard label="Emails Sent"      value={(ea.totalSent || 0).toLocaleString()}     accent="blue"    cls="d1" />
                    <StatCard label="Replies"          value={(ea.totalReplies || 0).toLocaleString()}   sub={`${ea.replyRate || 0}% rate`}   accent="green"   cls="d2" />
                    <StatCard label="Bounces"          value={(ea.totalBounces || 0).toLocaleString()}   sub={`${ea.bounceRate || 0}% rate`}  accent="red"     cls="d3" />
                    <StatCard label="Active Campaigns" value={ea.activeCampaigns || 0}                   accent="blue"    cls="d4" />
                  </div>

                  {eDebug?.error && (
                    <div style={{ background: '#1a1200', border: '1px solid #3d2e00', borderRadius: 10, padding: '12px 16px', marginBottom: 28, fontSize: 13, color: C.amber }}>
                      <strong>Email Bison API notice</strong> — error <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{eDebug.error}</code>. Check your API key and domain in Admin Settings.
                    </div>
                  )}

                  <Sec title="LinkedIn Performance" color={C.linkedin} count={la.totalCampaigns} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 34 }}>
                    <StatCard label="Connections Sent" value={(la.totalConnectionsSent || 0).toLocaleString()}    accent="linkedin" cls="d1" />
                    <StatCard label="Accepted"         value={(la.totalConnectionsAccepted || 0).toLocaleString()} sub={`${la.acceptanceRate || 0}% rate`} accent="green" cls="d2" />
                    <StatCard label="Messages Sent"    value={(la.totalMessagesSent || 0).toLocaleString()}        accent="linkedin" cls="d3" />
                    <StatCard label="Replies"          value={(la.totalReplies || 0).toLocaleString()}             sub={`${la.replyRate || 0}% rate`} accent="green" cls="d4" />
                    <StatCard label="Active Campaigns" value={la.activeCampaigns || 0}                             accent={la.activeCampaigns > 0 ? 'green' : 'linkedin'} cls="d5" />
                  </div>

                  {filteredTs.length > 0 && (
                    <div className="card fu">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 3 }}>LinkedIn Activity</div>
                          <div style={{ color: C.textMuted, fontSize: 12 }}>{filteredTs.length} active days</div>
                        </div>
                        <DateFilter v={dateRange} set={setDateRange} />
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={filteredTs} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                          <defs>
                            <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.linkedin} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={C.linkedin} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={C.green} stopOpacity={0.25} />
                              <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                          <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: C.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<Tip />} />
                          <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                          <Area type="monotone" dataKey="connectionsSent" name="Sent" stroke={C.linkedin} fill="url(#gS)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="connectionsAccepted" name="Accepted" stroke={C.green} fill="url(#gA)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* ══ EMAIL ═══════════════════════════════════ */}
              {activeTab === 'email' && (
                <div className="fu">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 28 }}>
                    <StatCard label="Total Sent"       value={(ea.totalSent || 0).toLocaleString()}    accent="blue"    cls="d1" />
                    <StatCard label="Reply Rate"       value={`${ea.replyRate || 0}%`}                sub={`${(ea.totalReplies || 0).toLocaleString()} replies`}  accent="green" cls="d2" />
                    <StatCard label="Bounce Rate"      value={`${ea.bounceRate || 0}%`}               sub={`${(ea.totalBounces || 0).toLocaleString()} bounces`}  accent="red"   cls="d3" />
                    <StatCard label="Total Campaigns"  value={ea.totalCampaigns || 0}                  accent="blue"    cls="d4" />
                    <StatCard label="Active"           value={ea.activeCampaigns || 0}                 accent={ea.activeCampaigns > 0 ? 'green' : 'blue'} cls="d5" />
                  </div>

                  {eDebug?.error && (
                    <div style={{ background: '#1a1200', border: '1px solid #3d2e00', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.amber }}>
                      <strong>Email Bison API issue</strong> — error code <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{eDebug.error}</code>.
                      Check your API key and domain in Admin Settings.
                      {eDebug.rawKeys && <div style={{ marginTop: 4, color: C.textMuted }}>Response keys: {eDebug.rawKeys.join(', ')}</div>}
                    </div>
                  )}

                  {eCamps.length > 0 ? (
                    <>
                      {emailChart.length > 0 && (
                        <div className="card fu" style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 3 }}>Campaign Performance</div>
                              <div style={{ color: C.textMuted, fontSize: 12 }}>
                                {emailChart.length < eCamps.length ? `Top ${emailChart.length} of ${eCamps.length} campaigns` : `All ${eCamps.length} campaigns`}
                              </div>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={Math.max(200, emailChart.length * 31)}>
                            <BarChart data={emailChart} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                              <XAxis type="number" tick={{ fill: C.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fill: C.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} width={175} />
                              <Tooltip content={<Tip />} cursor={{ fill: C.blueGlow }} />
                              <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                              <Bar dataKey="sent" name="Sent" fill={C.blue} opacity={0.85} radius={[0, 4, 4, 0]} />
                              <Bar dataKey="replies" name="Replies" fill={C.green} opacity={0.85} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="card fu">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text }}>
                            All Campaigns <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 13 }}>({eCamps.length})</span>
                          </div>
                          {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button className="pill" onClick={() => setEmailPage(p => Math.max(1, p - 1))} disabled={emailPage === 1} style={{ padding: '4px 10px' }}>‹</button>
                              <span style={{ color: C.textMuted, fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace" }}>{emailPage} / {totalPages}</span>
                              <button className="pill" onClick={() => setEmailPage(p => Math.min(totalPages, p + 1))} disabled={emailPage === totalPages} style={{ padding: '4px 10px' }}>›</button>
                            </div>
                          )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead><tr>{['Campaign', 'Status', 'Sent', 'Replies', 'Reply %', 'Bounces', 'Bounce %'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                            <tbody>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(paged as any[]).map((c: any) => (
                                <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${C.border}` }}>
                                  <td style={{ padding: '12px 14px', color: C.text, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                  <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} /></td>
                                  <td style={{ padding: '12px 14px', color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(c.sent || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px', color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(c.replies || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ color: C.blue, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{c.replyRate}%</span></td>
                                  <td style={{ padding: '12px 14px', color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(c.bounces || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ color: parseFloat(c.bounceRate) > 5 ? C.red : C.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{c.bounceRate}%</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="card" style={{ textAlign: 'center', padding: '64px 40px' }}>
                      <div style={{ fontSize: 32, marginBottom: 12, opacity: .25 }}>✉</div>
                      <div style={{ fontWeight: 600, color: C.text, marginBottom: 6 }}>No email campaigns found</div>
                      <div style={{ fontSize: 13, color: C.textMuted }}>{eDebug?.error ? 'API returned an error — check your Email Bison API key' : 'Email Bison campaigns will appear here once data is available'}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ LINKEDIN ═══════════════════════════════ */}
              {activeTab === 'linkedin' && (
                <div className="fu">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 28 }}>
                    <StatCard label="Connections Sent" value={(la.totalConnectionsSent || 0).toLocaleString()}    accent="linkedin" cls="d1" />
                    <StatCard label="Acceptance Rate"  value={`${la.acceptanceRate || 0}%`}                     sub={`${(la.totalConnectionsAccepted || 0).toLocaleString()} accepted`} accent="green" cls="d2" />
                    <StatCard label="Messages Sent"    value={(la.totalMessagesSent || 0).toLocaleString()}       accent="linkedin" cls="d3" />
                    <StatCard label="Reply Rate"       value={`${la.replyRate || 0}%`}                          sub={`${(la.totalReplies || 0).toLocaleString()} replies`} accent="green" cls="d4" />
                    <StatCard label="Total Campaigns"  value={la.totalCampaigns || 0}                            accent="linkedin" cls="d5" />
                    <StatCard label="Active Campaigns" value={la.activeCampaigns || 0}                           accent={la.activeCampaigns > 0 ? 'green' : 'linkedin'} cls="d6" />
                  </div>

                  {lDebug && la.totalConnectionsSent === 0 && (
                    <div style={{ background: '#1a1200', border: '1px solid #3d2e00', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: C.amber }}>
                      HeyReach debug — stats: {lDebug.statsFulfilled ? 'OK' : 'failed'}, campaigns: {lDebug.campaignsFulfilled ? 'OK' : 'failed'}
                      {lDebug.statsRawKeys?.length > 0 && <span>, keys: [{lDebug.statsRawKeys.join(', ')}]</span>}
                    </div>
                  )}

                  {filteredTs.length > 0 && (
                    <div className="card fu" style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 3 }}>Daily Activity</div>
                          <div style={{ color: C.textMuted, fontSize: 12 }}>{filteredTs.length} active days</div>
                        </div>
                        <DateFilter v={dateRange} set={setDateRange} />
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={filteredTs} margin={{ top: 5, right: 8, bottom: 5, left: 0 }} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: C.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: C.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                          <Tooltip content={<Tip />} cursor={{ fill: C.blueGlow }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: C.textMuted }} />
                          <Bar dataKey="connectionsSent" name="Sent" fill={C.linkedin} opacity={0.9} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="connectionsAccepted" name="Accepted" fill={C.green} opacity={0.9} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {lCamps.length > 0 && (
                    <div className="card fu">
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 18 }}>
                        LinkedIn Campaigns <span style={{ color: C.textMuted, fontWeight: 400, fontSize: 13 }}>({lCamps.length})</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Campaign', 'Status', 'Total Leads', 'In Progress', 'Finished', 'Failed', 'Lead List', 'Started'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                          <tbody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {lCamps.map((c: any) => (
                              <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: '12px 14px', color: C.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} /></td>
                                <td style={{ padding: '12px 14px', color: C.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(c.total || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: C.linkedin, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>{(c.inProgress || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: C.green, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600 }}>{(c.finished || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: c.failed > 0 ? C.red : C.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{(c.failed || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: C.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{c.listName || '—'}</td>
                                <td style={{ padding: '12px 14px', color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ ADMIN ══════════════════════════════════ */}
              {activeTab === 'admin' && user?.role === 'admin' && (
                <div className="fu">
                  <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                    {(['users', 'clients'] as const).map(t => (
                      <button key={t} className={`pill ${adminTab === t ? 'on' : ''}`} onClick={() => setAdminTab(t)}
                        style={{ padding: '7px 20px', fontSize: 13, fontWeight: 600 }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {adminTab === 'users' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ color: C.textMuted, fontSize: 13 }}>{adminUsers.length} users</span>
                        <button className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }} onClick={() => setShowAddUser(v => !v)}>+ Add User</button>
                      </div>

                      {showAddUser && (
                        <div className="card" style={{ marginBottom: 16, borderColor: `${C.blue}40` }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 18 }}>New User</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div><div className="lbl">Name</div><input className="inp" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full name" /></div>
                            <div><div className="lbl">Email</div><input className="inp" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="email@example.com" /></div>
                            <div><div className="lbl">Password</div><input className="inp" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Min. 8 characters" /></div>
                            <div><div className="lbl">Role</div>
                              <select className="inp" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="admin">Admin</option><option value="client">Client</option>
                              </select>
                            </div>
                            {newUser.role === 'client' && (
                              <div style={{ gridColumn: '1/-1' }}><div className="lbl">Client Account</div>
                                <select className="inp" value={newUser.clientId} onChange={e => setNewUser({ ...newUser, clientId: e.target.value })}>
                                  <option value="">Select client...</option>
                                  {adminClients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary" onClick={createUser} style={{ fontSize: 13, padding: '8px 16px' }}>Create User</button>
                            <button className="btn-ghost" onClick={() => setShowAddUser(false)} style={{ fontSize: 13, padding: '8px 16px' }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      <div className="card">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Name', 'Email', 'Role', 'Client', ''].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                          <tbody>
                            {adminUsers.map((u: DashboardUser) => (
                              <tr key={u.id} className="trow" style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: '12px 14px', color: C.text, fontWeight: 600 }}>{u.name}</td>
                                <td style={{ padding: '12px 14px', color: C.textMuted, fontSize: 12 }}>{u.email}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ background: u.role === 'admin' ? C.blueGlow : C.linkedinBg, color: u.role === 'admin' ? C.blue : C.linkedin, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                                </td>
                                <td style={{ padding: '12px 14px', color: C.textDim, fontSize: 12 }}>{u.clientId ? adminClients.find(c => c.id === u.clientId)?.name || u.clientId : '—'}</td>
                                <td style={{ padding: '12px 14px' }}><button className="btn-danger" onClick={() => delUser(u.id)}>Delete</button></td>
                              </tr>
                            ))}
                            {adminUsers.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>No users yet</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminTab === 'clients' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ color: C.textMuted, fontSize: 13 }}>{adminClients.length} clients</span>
                        <button className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }} onClick={() => setShowAddClient(v => !v)}>+ Add Client</button>
                      </div>

                      {showAddClient && (
                        <div className="card" style={{ marginBottom: 16, borderColor: `${C.blue}40` }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: C.text, marginBottom: 18 }}>New Client</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                            <div><div className="lbl">Client Name</div><input className="inp" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="e.g. Epsilon" /></div>
                            <div><div className="lbl">Email Bison Domain</div><input className="inp" value={newClient.emailBisonDomain} onChange={e => setNewClient({ ...newClient, emailBisonDomain: e.target.value })} placeholder="send.founderled.io" /></div>
                            <div style={{ gridColumn: '1/-1' }}><div className="lbl">Email Bison API Key</div><input className="inp" value={newClient.emailBisonKey} onChange={e => setNewClient({ ...newClient, emailBisonKey: e.target.value })} placeholder="81|xxxx..." /></div>
                            <div style={{ gridColumn: '1/-1' }}><div className="lbl">HeyReach API Key</div><input className="inp" value={newClient.heyreachKey} onChange={e => setNewClient({ ...newClient, heyreachKey: e.target.value })} placeholder="v3xyz..." /></div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-primary" onClick={createClient} style={{ fontSize: 13, padding: '8px 16px' }}>Create Client</button>
                            <button className="btn-ghost" onClick={() => setShowAddClient(false)} style={{ fontSize: 13, padding: '8px 16px' }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      <div className="card">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Name', 'Email Bison Domain', 'EB Key', 'HeyReach Key', 'Added'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                          <tbody>
                            {adminClients.map((c: Client) => (
                              <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: '12px 14px', color: C.text, fontWeight: 600 }}>{c.name}</td>
                                <td style={{ padding: '12px 14px', color: C.textMuted, fontSize: 12 }}>{c.emailBisonDomain}</td>
                                <td style={{ padding: '12px 14px', color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{c.emailBisonKey ? c.emailBisonKey.slice(0, 14) + '...' : '—'}</td>
                                <td style={{ padding: '12px 14px', color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{c.heyreachKey ? c.heyreachKey.slice(0, 14) + '...' : '—'}</td>
                                <td style={{ padding: '12px 14px', color: C.textDim, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                            {adminClients.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>No clients yet</td></tr>}
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
    </>
  );
}
