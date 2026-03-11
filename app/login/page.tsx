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
        body{background:#080d18;font-family:'Sora',sans-serif;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        .card{animation:fadeUp .4s ease both}
        .inp{width:100%;padding:11px 14px;background:#0f1623;border:1px solid #1c2840;border-radius:9px;color:#e2eaf8;font-size:14px;font-family:'Sora',sans-serif;outline:none;transition:all .15s}
        .inp:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .inp::placeholder{color:#2e4560}
        .btn{width:100%;padding:12px;background:#3b82f6;color:#fff;border:none;border-radius:9px;cursor:pointer;font-size:14.5px;font-weight:600;font-family:'Sora',sans-serif;transition:all .15s;letter-spacing:.01em}
        .btn:hover:not(:disabled){background:#2563eb;box-shadow:0 0 28px rgba(59,130,246,.35)}
        .btn:disabled{opacity:.5;cursor:default}
        .orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;z-index:0}
      ` }} />

      {/* Background orbs */}
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(59,130,246,0.06)', top: -100, left: -100 }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'rgba(99,102,241,0.05)', bottom: -80, right: -60 }} />

      <div style={{ minHeight: '100vh', background: '#080d18', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', zIndex: 1 }}>
        <div className="card" style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Founderled.io" style={{ width: 150, height: 'auto', filter: 'brightness(1.15) saturate(1.1)' }} />
            </div>
            <p style={{ color: '#5e7a9e', fontSize: 13.5, lineHeight: 1.5 }}>
              Campaign intelligence dashboard
            </p>
          </div>

          {/* Card */}
          <div style={{ background: '#0f1623', border: '1px solid #1c2840', borderRadius: 16, padding: '32px 28px' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ color: '#e2eaf8', fontSize: 18, fontWeight: 700, marginBottom: 4, letterSpacing: '-.02em' }}>Sign in</div>
              <div style={{ color: '#5e7a9e', fontSize: 13 }}>Enter your credentials to access the dashboard</div>
            </div>

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: '#2e4560', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Email</div>
                <input
                  className="inp"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <div style={{ color: '#2e4560', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Password</div>
                <input
                  className="inp"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div style={{ background: '#2d0a0a', border: '1px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20, color: '#2e4560', fontSize: 12 }}>
            Founderled.io — Outbound Intelligence Platform
          </div>
        </div>
      </div>
    </>
  );
}
