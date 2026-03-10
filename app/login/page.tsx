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
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(232,255,71,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,255,71,0.03) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      {/* Glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '300px',
        background: 'radial-gradient(ellipse, rgba(232,255,71,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '0 24px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '36px', height: '36px', background: '#e8ff47',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14L9 3L15 14H3Z" fill="#0a0a0f" />
              </svg>
            </div>
            <span style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 800, fontSize: '20px', color: '#f0f0f5', letterSpacing: '-0.5px' }}>
              Founder<span style={{ color: '#e8ff47' }}>.Led</span>
            </span>
          </div>
          <p style={{ color: '#6b6b80', fontSize: '13px' }}>Campaign Intelligence Dashboard</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#111118',
          border: '1px solid #1e1e28',
          borderRadius: '16px',
          padding: '36px',
        }}>
          <h1 style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", fontWeight: 700,
            fontSize: '22px', color: '#f0f0f5', marginBottom: '6px',
          }}>Sign in</h1>
          <p style={{ color: '#6b6b80', fontSize: '13px', marginBottom: '28px' }}>
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#9090a8', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#18181f', border: '1px solid #1e1e28',
                  borderRadius: '8px', color: '#f0f0f5', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#e8ff47'}
                onBlur={e => e.target.style.borderColor = '#1e1e28'}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: '#9090a8', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%', padding: '12px 14px',
                  background: '#18181f', border: '1px solid #1e1e28',
                  borderRadius: '8px', color: '#f0f0f5', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#e8ff47'}
                onBlur={e => e.target.style.borderColor = '#1e1e28'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px',
                color: '#f87171', fontSize: '13px', marginBottom: '16px',
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? '#6b6b30' : '#e8ff47',
                color: '#0a0a0f', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontWeight: 700, fontSize: '14px', letterSpacing: '0.3px',
                border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#6b6b80', fontSize: '12px', marginTop: '24px' }}>
          Powered by Founder.Led · Confidential
        </p>
      </div>
    </div>
  );
}
