'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SlideshowControlPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [galleryToken, setGalleryToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  async function fetchEvent() {
    try {
      const res = await fetch(`/api/events/${eventId}`);
      const data = await res.json();

      if (res.ok) {
        setSlideshowEnabled(data.event.slideshowEnabled);
        setGalleryToken(data.event.galleryToken || '');
      } else {
        throw new Error(data.error || 'Gagal memuat event');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideshowEnabled: !slideshowEnabled }),
      });

      const data = await res.json();

      if (res.ok) {
        setSlideshowEnabled(!slideshowEnabled);
        setSuccess(`Slideshow berhasil ${!slideshowEnabled ? 'diaktifkan' : 'dinonaktifkan'}`);
      } else {
        throw new Error(data.error || 'Gagal mengubah status slideshow');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  const slideshowUrl = typeof window !== 'undefined' && galleryToken
    ? `${window.location.origin}/slideshow/${galleryToken}`
    : '';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href={`/admin/event/${eventId}`} className="back-link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Detail Event
        </Link>
        <h1 className="page-title mt-3">Kontrol Slideshow</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700 border border-green-100">
          {success}
        </div>
      )}

      <div className="card p-6">
        <h2 className="section-title">Status Slideshow</h2>
        <p className="mt-2 text-sm text-warm-500">
          Aktifkan atau nonaktifkan slideshow untuk menampilkan foto di layar acara
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-warm-800">Slideshow</p>
            <p className="text-sm text-warm-500">
              {slideshowEnabled ? 'Aktif - Foto akan ditampilkan' : 'Nonaktif - Foto tidak ditampilkan'}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`rounded-lg px-6 py-3 font-medium text-white transition-colors duration-200 ${
              slideshowEnabled
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            } disabled:opacity-50`}
          >
            {saving ? 'Menyimpan...' : slideshowEnabled ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </div>

      {slideshowEnabled && galleryToken && (
        <div className="card mt-6 p-6">
          <h2 className="section-title">URL Slideshow</h2>
          <p className="mt-2 text-sm text-warm-500">
            Buka URL ini di layar acara untuk menampilkan slideshow
          </p>

          <div className="mt-4">
            <div className="rounded-xl bg-warm-50 p-4 border border-warm-200">
              <p className="break-all text-sm font-mono text-warm-700">{slideshowUrl}</p>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(slideshowUrl);
                  setSuccess('URL berhasil disalin!');
                  setTimeout(() => setSuccess(''), 2000);
                }}
                className="btn-primary"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Salin URL
              </button>
              <a
                href={slideshowUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                Buka Slideshow
              </a>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-200/60">
            <p className="text-sm text-amber-800">
              <strong>Catatan:</strong> Slideshow akan otomatis memperbarui setiap 10 detik ketika ada foto baru yang disetujui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
