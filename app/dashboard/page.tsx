'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, Area, AreaChart
} from 'recharts';

interface User { id: string; email: string; role: 'admin' | 'client'; clientId?: string; name: string; }
interface Client { id: string; name: string; slug: string; emailBisonKey: string; heyreachKey: string; emailBisonDomain: string; createdAt: string; }
interface DashboardUser { id: string; email: string; role: string; clientId?: string; name: string; }

// ── Theme tokens ──────────────────────────────────────────────────────────────
function makeTheme(dark: boolean) {
  return dark ? {
    bg:         '#080d18',
    bgCard:     '#0f1623',
    bgHover:    '#141d2e',
    border:     '#1c2840',
    borderHi:   '#263754',
    text:       '#e2eaf8',
    textMuted:  '#5e7a9e',
    textDim:    '#2e4560',
    blue:       '#3b82f6',
    blueDim:    '#0f2043',
    blueGlow:   'rgba(59,130,246,0.12)',
    green:      '#10b981',
    greenDim:   '#0a2e21',
    red:        '#ef4444',
    amber:      '#f59e0b',
    linkedin:   '#0a84ff',
    linkedinBg: '#061830',
    shadow:     '0 8px 32px rgba(0,0,0,0.45)',
    inputBg:    '#080d18',
    warnBg:     '#1a1200',
    warnBorder: '#3d2e00',
    warnText:   '#f59e0b',
  } : {
    bg:         '#f0f4fb',
    bgCard:     '#ffffff',
    bgHover:    '#f5f8ff',
    border:     '#dde4f0',
    borderHi:   '#b8c9e8',
    text:       '#0f1729',
    textMuted:  '#5a6e8c',
    textDim:    '#94a8c4',
    blue:       '#2563eb',
    blueDim:    '#dbeafe',
    blueGlow:   'rgba(37,99,235,0.09)',
    green:      '#059669',
    greenDim:   '#d1fae5',
    red:        '#dc2626',
    amber:      '#d97706',
    linkedin:   '#0a66c2',
    linkedinBg: '#dbeafe',
    shadow:     '0 4px 20px rgba(0,0,0,0.07)',
    inputBg:    '#f5f8ff',
    warnBg:     '#fefce8',
    warnBorder: '#fde047',
    warnText:   '#854d0e',
  };
}

function buildCss(t: ReturnType<typeof makeTheme>, dark: boolean) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:${t.bg};color:${t.text};font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:${t.border};border-radius:2px}
    select option{background:${t.bgCard};color:${t.text}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.35}}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    .fu{animation:fadeUp .35s ease both}
    .d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.12s}
    .d4{animation-delay:.16s}.d5{animation-delay:.20s}.d6{animation-delay:.24s}
    .nav-btn{display:flex;align-items:center;gap:10px;width:100%;padding:9px 11px;border-radius:8px;border:none;cursor:pointer;font-size:13.5px;font-family:'Sora',sans-serif;font-weight:400;text-align:left;transition:all .15s;color:${t.textMuted};background:transparent}
    .nav-btn:hover{color:${t.text};background:${t.bgHover}}
    .nav-btn.on{color:${t.blue};background:${t.blueGlow};font-weight:600}
    .stat{background:${t.bgCard};border:1px solid ${t.border};border-radius:12px;padding:20px;transition:all .2s;position:relative;overflow:hidden;cursor:default;box-shadow:${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)'}}
    .stat::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;opacity:0;transition:opacity .2s}
    .stat:hover{border-color:${t.borderHi};transform:translateY(-2px);box-shadow:${t.shadow}}
    .stat:hover::after{opacity:1}
    .stat.blue::after{background:linear-gradient(90deg,${t.blue},transparent)}
    .stat.green::after{background:linear-gradient(90deg,${t.green},transparent)}
    .stat.linkedin::after{background:linear-gradient(90deg,${t.linkedin},transparent)}
    .stat.red::after{background:linear-gradient(90deg,${t.red},transparent)}
    .card{background:${t.bgCard};border:1px solid ${t.border};border-radius:14px;padding:24px;box-shadow:${dark ? 'none' : '0 1px 4px rgba(0,0,0,0.05)'}}
    .trow:hover{background:${t.bgHover}!important}
    .pill{padding:5px 11px;border-radius:6px;border:1px solid ${t.border};background:transparent;color:${t.textMuted};font-size:11.5px;font-family:'Sora',sans-serif;cursor:pointer;transition:all .15s;font-weight:500}
    .pill:hover{border-color:${t.borderHi};color:${t.text}}
    .pill.on{border-color:${t.blue};background:${t.blueGlow};color:${t.blue}}
    .pill:disabled{opacity:.35;cursor:default}
    .btn-primary{padding:9px 20px;background:${t.blue};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13.5px;font-weight:600;font-family:'Sora',sans-serif;transition:all .15s}
    .btn-primary:hover{filter:brightness(1.1);box-shadow:0 0 20px ${t.blue}50}
    .btn-primary:disabled{opacity:.45;cursor:default;box-shadow:none;filter:none}
    .btn-ghost{padding:9px 20px;background:transparent;color:${t.textMuted};border:1px solid ${t.border};border-radius:8px;cursor:pointer;font-size:13.5px;font-family:'Sora',sans-serif;transition:all .15s}
    .btn-ghost:hover{border-color:${t.borderHi};color:${t.text}}
    .btn-danger{padding:5px 12px;background:transparent;color:${t.red};border:1px solid ${t.red}40;border-radius:6px;cursor:pointer;font-size:12px;font-family:'Sora',sans-serif;transition:all .15s}
    .btn-danger:hover{background:${t.red}12;border-color:${t.red}}
    .inp{width:100%;padding:10px 13px;background:${t.inputBg};border:1px solid ${t.border};border-radius:8px;color:${t.text};font-size:13.5px;font-family:'Sora',sans-serif;outline:none;transition:border-color .15s}
    .inp:focus{border-color:${t.blue};box-shadow:0 0 0 3px ${t.blueGlow}}
    .inp::placeholder{color:${t.textDim}}
    .lbl{color:${t.textDim};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
    .shimmer{background:linear-gradient(90deg,transparent,${t.blue}30,transparent);background-size:200% 100%;animation:shimmer 1.4s infinite}
    .theme-toggle{display:flex;align-items:center;gap:6px;padding:6px 10px;border-radius:8px;border:1px solid ${t.border};background:${t.bgHover};cursor:pointer;transition:all .15s;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;color:${t.textMuted}}
    .theme-toggle:hover{border-color:${t.borderHi};color:${t.text}}
  `;
}

function StatusBadge({ status, t }: { status: string; t: ReturnType<typeof makeTheme> }) {
  const s = (status || '').toUpperCase();
  const m: Record<string, [string, string]> = {
    IN_PROGRESS: [t.green, t.greenDim], ACTIVE: [t.green, t.greenDim], RUNNING: [t.green, t.greenDim],
    PAUSED: [t.amber, t.warnBg], FINISHED: [t.blue, t.blueDim], COMPLETED: [t.blue, t.blueDim],
    FAILED: [t.red, '#2d0a0a'], CANCELED: [t.red, '#2d0a0a'], DRAFT: [t.textMuted, t.bgHover],
  };
  const [color, bg] = m[s] || [t.textMuted, t.bgHover];
  const label = s === 'IN_PROGRESS' ? 'Active' : s.charAt(0) + s.slice(1).toLowerCase();
  const live = ['IN_PROGRESS', 'ACTIVE', 'RUNNING'].includes(s);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: bg, color, fontSize: 11, fontWeight: 600 }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, display: 'inline-block', animation: live ? 'pulseDot 2s infinite' : 'none' }} />
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent, cls = '', t }: {
  label: string; value: string | number; sub?: string;
  accent: 'blue' | 'green' | 'red' | 'linkedin';
  cls?: string; t: ReturnType<typeof makeTheme>;
}) {
  const ac = { blue: t.blue, green: t.green, red: t.red, linkedin: t.linkedin }[accent];
  const ab = { blue: t.blueGlow, green: `${t.green}14`, red: `${t.red}12`, linkedin: `${t.linkedin}14` }[accent];
  return (
    <div className={`stat ${accent} fu ${cls}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: ab, border: `1px solid ${ac}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: ac, opacity: .8 }} />
        </div>
        {sub && <span style={{ color: t.textMuted, fontSize: 11, background: t.bgHover, padding: '2px 8px', borderRadius: 6, border: `1px solid ${t.border}` }}>{sub}</span>}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: t.text, lineHeight: 1, marginBottom: 6, letterSpacing: '-.03em' }}>{value}</div>
      <div style={{ color: t.textMuted, fontSize: 12.5, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label, t }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: t.bgCard, border: `1px solid ${t.borderHi}`, borderRadius: 10, padding: '11px 15px', fontSize: 12, boxShadow: t.shadow }}>
      <div style={{ color: t.textMuted, marginBottom: 8, fontWeight: 500, fontSize: 10 }}>{label}</div>
      {payload.map((p: { name: string; value: number; color: string }, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
          <span style={{ color: t.textMuted }}>{p.name}:</span>
          <span style={{ color: t.text, fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function DateFilter({ v, set, t }: { v: 30 | 60 | 90 | 'all'; set: (x: 30 | 60 | 90 | 'all') => void; t: ReturnType<typeof makeTheme> }) {
  void t;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {([30, 60, 90, 'all'] as (30 | 60 | 90 | 'all')[]).map(x => (
        <button key={String(x)} className={`pill ${v === x ? 'on' : ''}`} onClick={() => set(x)}>
          {x === 'all' ? 'All' : `${x}D`}
        </button>
      ))}
    </div>
  );
}

function Sec({ title, color, count, t }: { title: string; color: string; count?: number; t: ReturnType<typeof makeTheme> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
      <span style={{ fontWeight: 700, fontSize: 14.5, color: t.text }}>{title}</span>
      {count !== undefined && <span style={{ background: `${color}18`, color, fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20 }}>{count} campaigns</span>}
    </div>
  );
}

function TH({ children, t }: { children: React.ReactNode; t: ReturnType<typeof makeTheme> }) {
  return (
    <th style={{ padding: '10px 14px', textAlign: 'left', color: t.textDim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.border}` }}>{children}</th>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [dark, setDark] = useState(false);
  const t = useMemo(() => makeTheme(dark), [dark]);
  const css = useMemo(() => buildCss(t, dark), [t, dark]);

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
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientForm, setEditClientForm] = useState({ name: '', emailBisonKey: '', emailBisonDomain: '', heyreachKey: '' });
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

  const startEditClient = (c: Client) => {
    setEditingClient(c);
    setEditClientForm({ name: c.name, emailBisonKey: c.emailBisonKey, emailBisonDomain: c.emailBisonDomain, heyreachKey: c.heyreachKey });
  };

  const saveEditClient = async () => {
    if (!editingClient) return;
    const r = await fetch(`/api/admin/clients`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingClient.id, ...editClientForm }) });
    if (r.ok) { setEditingClient(null); loadAdmin(); fetch(`/api/admin/clients`).then(r2 => r2.json()).then(d => Array.isArray(d) && setClients(d)); }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${t.blue}, #6366f1)`, margin: '0 auto 16px', opacity: .9 }} />
        <div style={{ color: t.textMuted, fontSize: 13 }}>Loading...</div>
      </div>
    </div>
  );

  const email = dashboard?.email;
  const linkedin = dashboard?.linkedin;
  const clientInfo = dashboard?.client;
  const ea = email?.aggregate || {};
  const la = linkedin?.aggregate || {};
  // Sort all campaigns by most recent first (startedAt / createdAt)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byRecent = (a: any, b: any) => {
    const da = new Date(a.startedAt || a.createdAt || 0).getTime();
    const db = new Date(b.startedAt || b.createdAt || 0).getTime();
    return db - da;
  };
  const eCamps = [...(email?.campaigns || [])].sort(byRecent);
  const lCamps = [...(linkedin?.campaigns || [])].sort(byRecent);
  const ts: { date: string; connectionsSent: number; connectionsAccepted: number; messagesSent: number; messagesStarted: number; replies: number }[] = linkedin?.timeSeries || [];
  const eDebug = email?._debug || null;
  const lDebug = linkedin?._debug || null;
  const clientName = clients.find(c => c.id === selectedClientId)?.name || clientInfo?.name || 'Client';

  const filteredTs = (() => {
    if (dateRange === 'all') return ts;
    const cut = new Date(); cut.setDate(cut.getDate() - dateRange);
    const cs = cut.toISOString().split('T')[0];
    const filtered = ts.filter(d => d.date >= cs);
    // Auto-fallback to full range if selected window has no data (campaign finished months ago)
    return filtered.length > 0 ? filtered : ts;
  })();
  // True if we fell back to full range because the selected window was empty
  const tsRangeIsFallback = dateRange !== 'all' && (() => {
    const cut = new Date(); cut.setDate(cut.getDate() - dateRange);
    const cs = cut.toISOString().split('T')[0];
    return ts.filter(d => d.date >= cs).length === 0 && ts.length > 0;
  })();

  // Email chart: latest 10 campaigns (eCamps already sorted by most recent)
  const emailOverviewChart = eCamps
    .slice(0, 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      name: (c.name || '').length > 20 ? c.name.slice(0, 20) + '…' : c.name,
      sent: c.sent || 0,
      replies: c.replies || 0,
    }));

  // Email chart: latest 10 campaigns for the Email tab chart
  const emailChartFull = eCamps
    .slice(0, 10)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: any) => ({
      name: (c.name || '').length > 24 ? c.name.slice(0, 24) + '…' : c.name,
      sent: c.sent || 0,
      replies: c.replies || 0,
    }));

  const totalPages = Math.ceil(eCamps.length / PER_PAGE);
  const paged = eCamps.slice((emailPage - 1) * PER_PAGE, emailPage * PER_PAGE);

  const navItems = [
    { id: 'overview', label: 'Overview',  icon: '▦' },
    { id: 'email',    label: 'Email',     icon: '✉' },
    { id: 'linkedin', label: 'LinkedIn',  icon: 'in', mono: true },
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin', icon: '⚙' }] : []),
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div style={{ display: 'flex', minHeight: '100vh', background: t.bg }}>

        {/* ── Sidebar ──────────────────────────────── */}
        <aside style={{
          width: 218, minHeight: '100vh', background: t.bgCard,
          borderRight: `1px solid ${t.border}`, position: 'fixed',
          left: 0, top: 0, bottom: 0, overflowY: 'auto', zIndex: 20,
          display: 'flex', flexDirection: 'column',
          boxShadow: dark ? 'none' : '2px 0 12px rgba(0,0,0,0.06)',
        }}>
          {/* Logo — centered */}
          <div style={{ padding: '22px 18px 18px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Founderled" style={{ width: 130, height: 'auto', display: 'block', filter: dark ? 'brightness(1.15)' : 'none' }} />
          </div>

          {/* Client selector */}
          {user?.role === 'admin' && clients.length > 0 && (
            <div style={{ padding: '14px 14px 6px' }}>
              <div className="lbl">Client</div>
              <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, fontSize: 13, fontFamily: "'Sora', sans-serif", cursor: 'pointer', outline: 'none' }}>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Nav */}
          <nav style={{ padding: '10px 10px', flex: 1 }}>
            {navItems.map(item => (
              <button key={item.id} className={`nav-btn ${activeTab === item.id ? 'on' : ''}`}
                onClick={() => setActiveTab(item.id as typeof activeTab)}>
                <span style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: activeTab === item.id ? t.blueGlow : 'transparent',
                  border: `1px solid ${activeTab === item.id ? t.blue + '30' : 'transparent'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: item.mono ? 10 : 12, fontWeight: 700, flexShrink: 0, transition: 'all .15s',
                  fontFamily: 'inherit',
                }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* User footer */}
          <div style={{ padding: 14, borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${t.blue}, #6366f1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: t.text, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                <div style={{ color: t.textDim, fontSize: 11, textTransform: 'capitalize' }}>{user?.role}</div>
              </div>
            </div>
            <button className="btn-ghost" onClick={logout} style={{ width: '100%', textAlign: 'center', fontSize: 12.5, padding: '7px 14px' }}>Sign out</button>
          </div>
        </aside>

        {/* ── Main ─────────────────────────────────── */}
        <main style={{ marginLeft: 218, padding: '32px 40px', minHeight: '100vh', flex: 1, maxWidth: 'calc(100vw - 218px)' }}>

          {/* Page header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ color: t.textDim, fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.9px', marginBottom: 7 }}>
                {activeTab === 'admin' ? 'System Admin' : clientName}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: t.text, lineHeight: 1.15, letterSpacing: '-.025em' }}>
                {activeTab === 'overview' && 'Performance Overview'}
                {activeTab === 'email' && 'Email Campaigns'}
                {activeTab === 'linkedin' && 'LinkedIn Outreach'}
                {activeTab === 'admin' && 'Admin Panel'}
              </h1>
            </div>

            {/* Right controls: theme toggle + refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              {/* Light/Dark toggle */}
              <button className="theme-toggle" onClick={() => setDark(d => !d)} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <span style={{ fontSize: 14 }}>{dark ? '☀️' : '🌙'}</span>
                <span>{dark ? 'Light' : 'Dark'}</span>
              </button>

              {activeTab !== 'admin' && (
                <button className="btn-primary" onClick={() => loadDash(selectedClientId)} disabled={dashLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ display: 'inline-block', animation: dashLoading ? 'spin .8s linear infinite' : 'none', fontSize: 14 }}>↻</span>
                  {dashLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              )}
            </div>
          </div>

          {/* Loading bar */}
          {dashLoading && (
            <div style={{ textAlign: 'center', padding: '80px 40px' }}>
              <div style={{ width: 50, height: 3, background: t.border, borderRadius: 2, margin: '0 auto 18px', overflow: 'hidden' }}>
                <div className="shimmer" style={{ height: '100%', width: '55%' }} />
              </div>
              <div style={{ color: t.textMuted, fontSize: 13.5 }}>Fetching live data from Email Bison &amp; HeyReach...</div>
            </div>
          )}

          {!dashLoading && (
            <>
              {/* ══ OVERVIEW ══════════════════════════════ */}
              {activeTab === 'overview' && (
                <div className="fu">
                  {/* Email section */}
                  <Sec title="Email Performance" color={t.blue} count={ea.totalCampaigns} t={t} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 24 }}>
                    <StatCard label="Emails Sent"      value={(ea.totalSent || 0).toLocaleString()}     accent="blue"  cls="d1" t={t} />
                    <StatCard label="Replies"          value={(ea.totalReplies || 0).toLocaleString()}   sub={`${ea.replyRate || 0}% rate`}   accent="green" cls="d2" t={t} />
                    <StatCard label="Bounces"          value={(ea.totalBounces || 0).toLocaleString()}   sub={`${ea.bounceRate || 0}% rate`}  accent="red"   cls="d3" t={t} />
                    <StatCard label="Active Campaigns" value={ea.activeCampaigns || 0}                   accent="blue"  cls="d4" t={t} />
                  </div>

                  {eDebug?.error && (
                    <div style={{ background: t.warnBg, border: `1px solid ${t.warnBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: t.warnText }}>
                      <strong>Email Bison API notice</strong> — error <code style={{ fontSize: 11.5 }}>{eDebug.error}</code>. Check your API key and domain in Admin Settings.
                    </div>
                  )}

                  {/* Email activity chart */}
                  {emailOverviewChart.length > 0 && (
                    <div className="card fu" style={{ marginBottom: 32 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 3 }}>Email Campaign Activity</div>
                          <div style={{ color: t.textMuted, fontSize: 12 }}>
                            {emailOverviewChart.length < eCamps.length ? `Top ${emailOverviewChart.length} of ${eCamps.length} campaigns` : `All ${eCamps.length} campaigns`}
                          </div>
                        </div>
                      </div>
                      <ResponsiveContainer width="100%" height={Math.max(180, emailOverviewChart.length * 30)}>
                        <BarChart data={emailOverviewChart} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
                          <XAxis type="number" tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" tick={{ fill: t.textMuted, fontSize: 11.5 }} tickLine={false} axisLine={false} width={160} />
                          <Tooltip content={(props) => <ChartTip {...props} t={t} />} cursor={{ fill: t.blueGlow }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: t.textMuted }} />
                          <Bar dataKey="sent" name="Sent" fill={t.blue} opacity={0.85} radius={[0, 4, 4, 0]} />
                          <Bar dataKey="replies" name="Replies" fill={t.green} opacity={0.85} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* LinkedIn section */}
                  <Sec title="LinkedIn Performance" color={t.linkedin} count={la.totalCampaigns} t={t} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 24 }}>
                    <StatCard label="Connections Sent" value={(la.totalConnectionsSent || 0).toLocaleString()}    accent="linkedin" cls="d1" t={t} />
                    <StatCard label="Accepted"         value={(la.totalConnectionsAccepted || 0).toLocaleString()} sub={`${la.acceptanceRate || 0}% rate`} accent="green" cls="d2" t={t} />
                    <StatCard label="Messages Sent"    value={(la.totalMessagesSent || 0).toLocaleString()}        accent="linkedin" cls="d3" t={t} />
                    <StatCard label="Replies"          value={(la.totalReplies || 0).toLocaleString()}             sub={`${la.replyRate || 0}% rate`} accent="green" cls="d4" t={t} />
                    <StatCard label="Active Campaigns" value={la.activeCampaigns || 0}                             accent={la.activeCampaigns > 0 ? 'green' : 'linkedin'} cls="d5" t={t} />
                  </div>

                  {/* LinkedIn activity chart */}
                  {filteredTs.length > 0 && (
                    <div className="card fu">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 3 }}>LinkedIn Activity</div>
                          <div style={{ color: tsRangeIsFallback ? t.warnText : t.textMuted, fontSize: 12 }}>{tsRangeIsFallback ? `Showing all data — no activity in last ${dateRange}d` : `${filteredTs.length} active days`}</div>
                        </div>
                        <DateFilter v={dateRange} set={setDateRange} t={t} />
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={filteredTs} margin={{ top: 5, right: 8, bottom: 5, left: 0 }}>
                          <defs>
                            <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={t.linkedin} stopOpacity={dark ? 0.25 : 0.15} />
                              <stop offset="95%" stopColor={t.linkedin} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={t.green} stopOpacity={dark ? 0.25 : 0.15} />
                              <stop offset="95%" stopColor={t.green} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                          <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                          <Tooltip content={(props) => <ChartTip {...props} t={t} />} />
                          <Legend wrapperStyle={{ fontSize: 12, color: t.textMuted }} />
                          <Area type="monotone" dataKey="connectionsSent" name="Sent" stroke={t.linkedin} fill="url(#gS)" strokeWidth={2} dot={false} />
                          <Area type="monotone" dataKey="connectionsAccepted" name="Accepted" stroke={t.green} fill="url(#gA)" strokeWidth={2} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}

              {/* ══ EMAIL ═════════════════════════════════ */}
              {activeTab === 'email' && (
                <div className="fu">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 28 }}>
                    <StatCard label="Total Sent"      value={(ea.totalSent || 0).toLocaleString()}   accent="blue"  cls="d1" t={t} />
                    <StatCard label="Reply Rate"      value={`${ea.replyRate || 0}%`}               sub={`${(ea.totalReplies || 0).toLocaleString()} replies`}  accent="green" cls="d2" t={t} />
                    <StatCard label="Bounce Rate"     value={`${ea.bounceRate || 0}%`}              sub={`${(ea.totalBounces || 0).toLocaleString()} bounces`}  accent="red"   cls="d3" t={t} />
                    <StatCard label="Total Campaigns" value={ea.totalCampaigns || 0}                 accent="blue"  cls="d4" t={t} />
                    <StatCard label="Active"          value={ea.activeCampaigns || 0}                accent={ea.activeCampaigns > 0 ? 'green' : 'blue'} cls="d5" t={t} />
                  </div>

                  {eDebug?.error && (
                    <div style={{ background: t.warnBg, border: `1px solid ${t.warnBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: t.warnText }}>
                      <strong>Email Bison API issue</strong> — error <code style={{ fontSize: 11.5 }}>{eDebug.error}</code>.
                      {eDebug.rawKeys && <div style={{ marginTop: 4, color: t.textMuted, fontSize: 12 }}>Response keys: {eDebug.rawKeys.join(', ')}</div>}
                    </div>
                  )}

                  {eCamps.length > 0 ? (
                    <>
                      {emailChartFull.length > 0 && (
                        <div className="card fu" style={{ marginBottom: 18 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 3 }}>Campaign Performance</div>
                              <div style={{ color: t.textMuted, fontSize: 12 }}>
                                {emailChartFull.length < eCamps.length ? `Top ${emailChartFull.length} of ${eCamps.length}` : `All ${eCamps.length} campaigns`}
                              </div>
                            </div>
                          </div>
                          <ResponsiveContainer width="100%" height={Math.max(200, emailChartFull.length * 31)}>
                            <BarChart data={emailChartFull} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={t.border} horizontal={false} />
                              <XAxis type="number" tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                              <YAxis dataKey="name" type="category" tick={{ fill: t.textMuted, fontSize: 12 }} tickLine={false} axisLine={false} width={175} />
                              <Tooltip content={(props) => <ChartTip {...props} t={t} />} cursor={{ fill: t.blueGlow }} />
                              <Legend wrapperStyle={{ fontSize: 12, color: t.textMuted }} />
                              <Bar dataKey="sent" name="Sent" fill={t.blue} opacity={0.85} radius={[0, 4, 4, 0]} />
                              <Bar dataKey="replies" name="Replies" fill={t.green} opacity={0.85} radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      <div className="card fu">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text }}>
                            All Campaigns <span style={{ color: t.textMuted, fontWeight: 400, fontSize: 13 }}>({eCamps.length})</span>
                          </div>
                          {totalPages > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button className="pill" onClick={() => setEmailPage(p => Math.max(1, p - 1))} disabled={emailPage === 1} style={{ padding: '4px 10px' }}>‹</button>
                              <span style={{ color: t.textMuted, fontSize: 11.5 }}>{emailPage} / {totalPages}</span>
                              <button className="pill" onClick={() => setEmailPage(p => Math.min(totalPages, p + 1))} disabled={emailPage === totalPages} style={{ padding: '4px 10px' }}>›</button>
                            </div>
                          )}
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead><tr>{['Campaign', 'Status', 'Sent', 'Replies', 'Reply %', 'Bounces', 'Bounce %'].map(h => <TH key={h} t={t}>{h}</TH>)}</tr></thead>
                            <tbody>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(paged as any[]).map((c: any) => (
                                <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${t.border}` }}>
                                  <td style={{ padding: '12px 14px', color: t.text, fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                  <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} t={t} /></td>
                                  <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{(c.sent || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{(c.replies || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ color: t.blue, fontWeight: 700, fontSize: 12 }}>{c.replyRate}%</span></td>
                                  <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{(c.bounces || 0).toLocaleString()}</td>
                                  <td style={{ padding: '12px 14px' }}><span style={{ color: parseFloat(c.bounceRate) > 5 ? t.red : t.textMuted, fontSize: 12 }}>{c.bounceRate}%</span></td>
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
                      <div style={{ fontWeight: 600, color: t.text, marginBottom: 6 }}>No email campaigns found</div>
                      <div style={{ fontSize: 13, color: t.textMuted }}>{eDebug?.error ? 'API returned an error — check your Email Bison API key' : 'Email Bison campaigns will appear here once data is available'}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ══ LINKEDIN ══════════════════════════════ */}
              {activeTab === 'linkedin' && (
                <div className="fu">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))', gap: 14, marginBottom: 28 }}>
                    <StatCard label="Connections Sent" value={(la.totalConnectionsSent || 0).toLocaleString()}    accent="linkedin" cls="d1" t={t} />
                    <StatCard label="Acceptance Rate"  value={`${la.acceptanceRate || 0}%`}                     sub={`${(la.totalConnectionsAccepted || 0).toLocaleString()} accepted`} accent="green" cls="d2" t={t} />
                    <StatCard label="Messages Sent"    value={(la.totalMessagesSent || 0).toLocaleString()}       accent="linkedin" cls="d3" t={t} />
                    <StatCard label="Reply Rate"       value={`${la.replyRate || 0}%`}                          sub={`${(la.totalReplies || 0).toLocaleString()} replies`} accent="green" cls="d4" t={t} />
                    <StatCard label="Total Campaigns"  value={la.totalCampaigns || 0}                            accent="linkedin" cls="d5" t={t} />
                    <StatCard label="Active Campaigns" value={la.activeCampaigns || 0}                           accent={la.activeCampaigns > 0 ? 'green' : 'linkedin'} cls="d6" t={t} />
                  </div>

                  {lDebug && la.totalConnectionsSent === 0 && (
                    <div style={{ background: t.warnBg, border: `1px solid ${t.warnBorder}`, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: t.warnText }}>
                      HeyReach debug — stats: {lDebug.statsFulfilled ? 'OK' : 'failed'}, campaigns: {lDebug.campaignsFulfilled ? 'OK' : 'failed'}
                      {lDebug.statsRawKeys?.length > 0 && <span>, keys: [{lDebug.statsRawKeys.join(', ')}]</span>}
                    </div>
                  )}

                  {filteredTs.length > 0 && (
                    <div className="card fu" style={{ marginBottom: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 3 }}>Daily Activity</div>
                          <div style={{ color: tsRangeIsFallback ? t.warnText : t.textMuted, fontSize: 12 }}>{tsRangeIsFallback ? `Showing all data — no activity in last ${dateRange}d` : `${filteredTs.length} active days`}</div>
                        </div>
                        <DateFilter v={dateRange} set={setDateRange} t={t} />
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={filteredTs} margin={{ top: 5, right: 8, bottom: 5, left: 0 }} barGap={2}>
                          <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false} />
                          <XAxis dataKey="date" tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fill: t.textDim, fontSize: 10.5 }} tickLine={false} axisLine={false} />
                          <Tooltip content={(props) => <ChartTip {...props} t={t} />} cursor={{ fill: t.blueGlow }} />
                          <Legend wrapperStyle={{ fontSize: 12, color: t.textMuted }} />
                          <Bar dataKey="connectionsSent" name="Sent" fill={t.linkedin} opacity={0.9} radius={[3, 3, 0, 0]} />
                          <Bar dataKey="connectionsAccepted" name="Accepted" fill={t.green} opacity={0.9} radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {lCamps.length > 0 && (
                    <div className="card fu">
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 18 }}>
                        LinkedIn Campaigns <span style={{ color: t.textMuted, fontWeight: 400, fontSize: 13 }}>({lCamps.length})</span>
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr>{['Campaign', 'Status', 'Total Leads', 'In Progress', 'Finished', 'Failed', 'Lead List', 'Started'].map(h => <TH key={h} t={t}>{h}</TH>)}</tr></thead>
                          <tbody>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {lCamps.map((c: any) => (
                              <tr key={c.id} className="trow" style={{ borderBottom: `1px solid ${t.border}` }}>
                                <td style={{ padding: '12px 14px', color: t.text, fontWeight: 500, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</td>
                                <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} t={t} /></td>
                                <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{(c.total || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: t.linkedin, fontSize: 12, fontWeight: 600 }}>{(c.inProgress || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: t.green, fontSize: 12, fontWeight: 600 }}>{(c.finished || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: c.failed > 0 ? t.red : t.textDim, fontSize: 12 }}>{(c.failed || 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', color: t.textMuted, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{c.listName || '—'}</td>
                                <td style={{ padding: '12px 14px', color: t.textDim, fontSize: 11 }}>{c.startedAt ? new Date(c.startedAt).toLocaleDateString() : '—'}</td>
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
                    {(['users', 'clients'] as const).map(tab => (
                      <button key={tab} className={`pill ${adminTab === tab ? 'on' : ''}`} onClick={() => setAdminTab(tab)}
                        style={{ padding: '7px 20px', fontSize: 13, fontWeight: 600 }}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  {adminTab === 'users' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ color: t.textMuted, fontSize: 13 }}>{adminUsers.length} users</span>
                        <button className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }} onClick={() => setShowAddUser(v => !v)}>+ Add User</button>
                      </div>

                      {showAddUser && (
                        <div className="card" style={{ marginBottom: 16, borderColor: `${t.blue}50` }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 18 }}>New User</div>
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
                          <thead><tr>{['Name', 'Email', 'Role', 'Client', ''].map(h => <TH key={h} t={t}>{h}</TH>)}</tr></thead>
                          <tbody>
                            {adminUsers.map((u: DashboardUser) => (
                              <tr key={u.id} className="trow" style={{ borderBottom: `1px solid ${t.border}` }}>
                                <td style={{ padding: '12px 14px', color: t.text, fontWeight: 600 }}>{u.name}</td>
                                <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{u.email}</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ background: u.role === 'admin' ? t.blueGlow : t.linkedinBg, color: u.role === 'admin' ? t.blue : t.linkedin, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{u.role}</span>
                                </td>
                                <td style={{ padding: '12px 14px', color: t.textDim, fontSize: 12 }}>{u.clientId ? adminClients.find(c => c.id === u.clientId)?.name || u.clientId : '—'}</td>
                                <td style={{ padding: '12px 14px' }}><button className="btn-danger" onClick={() => delUser(u.id)}>Delete</button></td>
                              </tr>
                            ))}
                            {adminUsers.length === 0 && <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: t.textDim }}>No users yet</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminTab === 'clients' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <span style={{ color: t.textMuted, fontSize: 13 }}>{adminClients.length} clients</span>
                        <button className="btn-primary" style={{ fontSize: 13, padding: '7px 16px' }} onClick={() => setShowAddClient(v => !v)}>+ Add Client</button>
                      </div>

                      {showAddClient && (
                        <div className="card" style={{ marginBottom: 16, borderColor: `${t.blue}50` }}>
                          <div style={{ fontWeight: 600, fontSize: 14.5, color: t.text, marginBottom: 18 }}>New Client</div>
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

                      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr>
                              {['Client', 'Domain', 'Email Bison Key', 'HeyReach Key', 'Added', ''].map(h => <TH key={h} t={t}>{h}</TH>)}
                            </tr>
                          </thead>
                          <tbody>
                            {adminClients.map((c: Client) => (
                              <>
                                <tr key={c.id} className="trow" style={{ borderBottom: editingClient?.id === c.id ? 'none' : `1px solid ${t.border}` }}>
                                  <td style={{ padding: '12px 14px', color: t.text, fontWeight: 600 }}>{c.name}</td>
                                  <td style={{ padding: '12px 14px', color: t.textMuted, fontSize: 12 }}>{c.emailBisonDomain}</td>
                                  <td style={{ padding: '12px 14px', fontSize: 11 }}>
                                    {c.emailBisonKey
                                      ? <span style={{ color: t.green }}>{c.emailBisonKey.slice(0, 14)}...</span>
                                      : <span style={{ color: t.red }}>Not set</span>}
                                  </td>
                                  <td style={{ padding: '12px 14px', fontSize: 11 }}>
                                    {c.heyreachKey
                                      ? <span style={{ color: t.green }}>{c.heyreachKey.slice(0, 14)}...</span>
                                      : <span style={{ color: t.red, fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: 11 }}>Not set</span>}
                                  </td>
                                  <td style={{ padding: '12px 14px', color: t.textDim, fontSize: 11 }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                                  <td style={{ padding: '12px 14px' }}>
                                    {editingClient?.id === c.id
                                      ? <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 12px', color: t.textMuted }} onClick={() => setEditingClient(null)}>Cancel</button>
                                      : <button className="pill" style={{ fontSize: 12, padding: '4px 12px' }} onClick={() => startEditClient(c)}>Edit</button>
                                    }
                                  </td>
                                </tr>
                                {editingClient?.id === c.id && (
                                  <tr key={`edit-${c.id}`} style={{ borderBottom: `1px solid ${t.border}` }}>
                                    <td colSpan={6} style={{ padding: '0' }}>
                                      <div style={{ padding: '18px 20px', background: t.bgHover, borderTop: `1px solid ${t.border}` }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, color: t.text, marginBottom: 14 }}>
                                          Editing: <span style={{ color: t.blue }}>{c.name}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                          <div>
                                            <div className="lbl">Client Name</div>
                                            <input className="inp" value={editClientForm.name} onChange={e => setEditClientForm({ ...editClientForm, name: e.target.value })} />
                                          </div>
                                          <div>
                                            <div className="lbl">Email Bison Domain</div>
                                            <input className="inp" value={editClientForm.emailBisonDomain} onChange={e => setEditClientForm({ ...editClientForm, emailBisonDomain: e.target.value })} />
                                          </div>
                                          <div>
                                            <div className="lbl">Email Bison API Key</div>
                                            <input className="inp" value={editClientForm.emailBisonKey} onChange={e => setEditClientForm({ ...editClientForm, emailBisonKey: e.target.value })} placeholder="81|xxxx..." />
                                          </div>
                                          <div>
                                            <div className="lbl">HeyReach API Key</div>
                                            <input className="inp" value={editClientForm.heyreachKey} onChange={e => setEditClientForm({ ...editClientForm, heyreachKey: e.target.value })} placeholder="v3xyz..." />
                                          </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                          <button className="btn-primary" onClick={saveEditClient} style={{ fontSize: 12, padding: '7px 16px' }}>Save Changes</button>
                                          <button className="btn-ghost" onClick={() => setEditingClient(null)} style={{ fontSize: 12, padding: '7px 16px' }}>Cancel</button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))}
                            {adminClients.length === 0 && <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: t.textDim }}>No clients yet</td></tr>}
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
