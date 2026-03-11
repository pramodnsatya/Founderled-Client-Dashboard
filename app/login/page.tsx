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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#f0f4fb;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .card{animation:fadeUp .4s ease both}
        .inp{width:100%;padding:11px 14px;background:#f5f8ff;border:1px solid #dde4f0;border-radius:9px;color:#0f1729;font-size:14px;font-family:'Sora',sans-serif;outline:none;transition:all .15s}
        .inp:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.09)}
        .inp::placeholder{color:#94a8c4}
        .btn{width:100%;padding:12px;background:#2563eb;color:#fff;border:none;border-radius:9px;cursor:pointer;font-size:14.5px;font-weight:600;font-family:'Sora',sans-serif;transition:all .15s}
        .btn:hover:not(:disabled){background:#1d4ed8;box-shadow:0 4px 20px rgba(37,99,235,.3)}
        .btn:disabled{opacity:.5;cursor:default}
      ` }} />

      <div style={{ minHeight: '100vh', background: '#f0f4fb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card" style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Founderled.io" style={{ width: 150, height: 'auto' }} />
            </div>
            <p style={{ color: '#5a6e8c', fontSize: 13.5 }}>Campaign intelligence dashboard</p>
          </div>

          {/* Card */}
          <div style={{ background: '#ffffff', border: '1px solid #dde4f0', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#0f1729', fontSize: 18, fontWeight: 700, marginBottom: 4, letterSpacing: '-.02em' }}>Sign in</div>
              <div style={{ color: '#5a6e8c', fontSize: 13 }}>Enter your credentials to continue</div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#94a8c4', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Email</div>
                <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required autoComplete="email" />
              </div>
              <div style={{ marginBottom: 22 }}>
                <div style={{ color: '#94a8c4', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Password</div>
                <input className="inp" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, color: '#94a8c4', fontSize: 12 }}>
            Founderled.io — Outbound Intelligence Platform
          </div>
        </div>
      </div>
    </>
  );
}
