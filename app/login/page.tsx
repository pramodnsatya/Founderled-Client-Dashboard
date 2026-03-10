'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      router.push('/dashboard');
    } catch { setError('Network error. Please try again.'); setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '34px', height: '34px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 13L8 2L14 13H2Z" fill="white" /></svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: '20px', color: '#0f1729', letterSpacing: '-0.4px' }}>Founderled<span style={{ color: '#2563eb' }}>.io</span></span>
          </div>
          <p style={{ color: '#64748b', fontSize: '13px' }}>Campaign Intelligence Dashboard</p>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e5ef', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontWeight: 700, fontSize: '20px', color: '#0f1729', marginBottom: '4px' }}>Welcome back</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Sign in to access your dashboard</p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e5ef', borderRadius: '7px', color: '#0f1729', fontSize: '14px', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e5ef'} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                style={{ width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e5ef', borderRadius: '7px', color: '#0f1729', fontSize: '14px', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e5ef'} />
            </div>
            {error && <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '7px', color: '#dc2626', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', fontWeight: 600, fontSize: '14px', border: 'none', borderRadius: '7px', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '20px' }}>Founderled.io · Confidential</p>
      </div>
    </div>
  );
}
