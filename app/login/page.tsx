'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/Marketplace';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    alert('Demo authentication. Add Supabase environment variables to enable real accounts.');
  }

  const isLogin = mode === 'login';

  return (
    <>
      <Header />
      <main className="page">
        <div className="container" style={{ maxWidth: 520 }}>
          <div className="panel">
            <div className="small">
              {isLogin ? 'WELCOME BACK' : 'JOIN THE MARKETPLACE'}
            </div>

            <h1 style={{ fontSize: 36, letterSpacing: '-1.5px' }}>
              {isLogin ? 'Sign in' : 'Create your account'}
            </h1>

            <form className="form" onSubmit={handleSubmit}>
              {!isLogin && (
                <label>
                  Name
                  <input required placeholder="Your name" />
                </label>
              )}

              <label>
                Email
                <input required type="email" placeholder="you@example.com" />
              </label>

              <label>
                Password
                <input required type="password" placeholder="••••••••" />
              </label>

              <button className="primary" type="submit">
                {isLogin ? 'Sign in' : 'Create account'}
              </button>
            </form>

            <p className="small" style={{ marginTop: 18 }}>
              {isLogin ? 'New here?' : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode(isLogin ? 'signup' : 'login')}
                style={{
                  border: 0,
                  background: 'none',
                  color: 'var(--accent)',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {isLogin ? 'Create account' : 'Sign in'}
              </button>
            </p>

            <div className="notice" style={{ marginTop: 16 }}>
              Demo mode is intentionally credential-free. Production auth is prepared for Supabase.
            </div>

            <Link
              href="/"
              className="small"
              style={{ display: 'block', marginTop: 18 }}
            >
              ← Back home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
