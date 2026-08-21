'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const errorMessages: Record<string, string> = {
  invalid_token: 'Link tidak valid',
  token_used: 'Link sudah digunakan',
  token_expired: 'Link sudah kedaluwarsa',
  server_error: 'Terjadi kesalahan, coba lagi',
};

function LoginForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengirim link');
      }

      const data = await res.json();
      setSent(true);
      
      if (data.devLink) {
        setDevLink(data.devLink);
      }
    } catch {
      alert('Gagal mengirim link login. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="card-elevated w-full max-w-md p-8">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <svg className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-center text-warm-900">Cek Email Anda</h1>
        <p className="mt-3 text-center text-warm-600">
          Link login telah dikirim ke <strong className="text-warm-800">{email}</strong>
        </p>
        <p className="mt-1.5 text-center text-sm text-warm-400">
          Link berlaku selama 5 menit.
        </p>
        
        {devLink && (
          <div className="mt-5 rounded-xl bg-amber-50 p-4 border border-amber-200/60">
            <p className="text-sm font-medium text-amber-800">Development Mode:</p>
            <a 
              href={devLink} 
              className="mt-2 block text-sm text-brand-600 underline break-all hover:text-brand-700"
            >
              {devLink}
            </a>
          </div>
        )}
        
        <button
          onClick={() => { setSent(false); setEmail(''); setDevLink(null); }}
          className="btn-secondary mt-6 w-full"
        >
          Kirim Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="card-elevated w-full max-w-md p-8">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
        <svg className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
      <h1 className="text-xl font-semibold text-center text-warm-900">Login Admin</h1>
      <p className="mt-2 text-center text-sm text-warm-500">
        Masukkan email untuk menerima link login
      </p>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-100">
          {errorMessages[error] || 'Terjadi kesalahan'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6">
        <label htmlFor="email" className="block text-sm font-medium text-warm-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="nama@email.com"
          className="input-field mt-1.5"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-4 w-full py-3"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Mengirim...
            </span>
          ) : 'Kirim Link Login'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <Suspense fallback={
        <div className="card-elevated w-full max-w-md p-8">
          <p className="text-center text-warm-500">Memuat...</p>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}
