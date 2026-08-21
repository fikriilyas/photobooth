'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Photo {
  id: string;
  eventId: string;
  filename: string;
  status: string;
  createdAt: string;
  photoSession: {
    id: string;
    consentGiven: boolean;
  };
}

interface SessionData {
  id: string;
  nickname: string | null;
  expiresAt: string;
  event: {
    id: string;
    name: string;
    coupleName: string;
    qrToken: string;
  };
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [togglingConsentId, setTogglingConsentId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/session/${token}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Gagal memuat sesi');
        }

        setSession(data.session);
        setPhotos(data.photos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [token]);

  async function handleDeleteSession() {
    if (!confirm('Apakah Anda yakin ingin menghapus semua foto dan sesi ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    try {
      const res = await fetch(`/api/session/${token}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        localStorage.removeItem(`guest_session_${session?.event.id}`);
        router.push('/');
      }
    } catch (err) {
      alert('Gagal menghapus sesi');
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm('Apakah Anda yakin ingin menghapus foto ini? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }

    setDeletingPhotoId(photoId);
    try {
      const res = await fetch(`/api/session/${token}/photos/${photoId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal menghapus foto');
      }
    } catch (err) {
      alert('Gagal menghapus foto');
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function handleToggleConsent(photoSessionId: string, currentConsent: boolean) {
    setTogglingConsentId(photoSessionId);
    try {
      const res = await fetch(`/api/session/${token}/consent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoSessionId,
          consentGiven: !currentConsent,
        }),
      });

      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.photoSession.id === photoSessionId
              ? { ...p, photoSession: { ...p.photoSession, consentGiven: !currentConsent } }
              : p
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal mengubah izin publikasi');
      }
    } catch (err) {
      alert('Gagal mengubah izin publikasi');
    } finally {
      setTogglingConsentId(null);
    }
  }

  function handleDownloadAll() {
    photos.forEach((photo) => {
      const link = document.createElement('a');
      link.href = `/api/events/${photo.eventId}/photos/${photo.id}/file?type=original`;
      link.download = photo.filename;
      link.click();
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-warm-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="card-elevated w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-warm-900">Terjadi Kesalahan</h1>
          <p className="mt-2 text-sm text-warm-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold text-warm-900">{session.event.name}</h1>
              <p className="mt-1 text-warm-500">{session.event.coupleName}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium text-warm-400 uppercase tracking-wide">Sesi berakhir:</p>
              <p className="text-sm font-medium text-warm-700">
                {new Date(session.expiresAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-warm-900">Foto Anda <span className="text-warm-400 font-normal">({photos.length})</span></h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => router.push(`/event/${session.event.qrToken}?continue=true`)}
                className="btn-primary"
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ambil Foto Lagi
              </button>
              {photos.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="btn-secondary"
                >
                  <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Unduh Semua
                </button>
              )}
              <button
                onClick={handleDeleteSession}
                className="btn-destructive"
              >
                Hapus Sesi
              </button>
            </div>
          </div>

          {photos.length === 0 ? (
            <div className="card mt-4 p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
                <svg className="h-8 w-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-warm-500">Belum ada foto</p>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {Array.from(new Set(photos.map((p) => p.photoSession.id))).map((sessionId) => {
                const sessionPhotos = photos.filter((p) => p.photoSession.id === sessionId);
                const consentGiven = sessionPhotos[0]?.photoSession.consentGiven;
                
                return (
                  <div key={sessionId} className="card p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-warm-800">Sesi Foto</h3>
                        {consentGiven ? (
                          <span className="badge-success">Publik</span>
                        ) : (
                          <span className="badge-neutral">Privat</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleConsent(sessionId, consentGiven)}
                        disabled={togglingConsentId === sessionId}
                        className="btn-secondary !py-2 text-sm disabled:opacity-50"
                      >
                        {togglingConsentId === sessionId
                          ? 'Memproses...'
                          : consentGiven
                          ? 'Jadikan Privat'
                          : 'Tampilkan di Galeri'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {sessionPhotos.map((photo) => (
                        <div key={photo.id} className="group relative overflow-hidden rounded-xl">
                          <img
                            src={`/api/events/${photo.eventId}/photos/${photo.id}/file?type=optimized`}
                            alt={photo.filename}
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <a
                              href={`/api/events/${photo.eventId}/photos/${photo.id}/file?type=original`}
                              download={photo.filename}
                              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-warm-800 hover:bg-warm-50 transition-colors duration-150"
                            >
                              Unduh
                            </a>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              disabled={deletingPhotoId === photo.id}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors duration-150"
                            >
                              {deletingPhotoId === photo.id ? '...' : 'Hapus'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card mt-6 !bg-amber-50 !border-amber-200/60 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-amber-800">
              <strong>Penting:</strong> Simpan tautan halaman ini untuk mengakses foto Anda nanti.
              Sesi akan berakhir pada tanggal yang tertera di atas.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
