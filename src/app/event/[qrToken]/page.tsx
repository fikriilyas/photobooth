'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

interface EventInfo {
  id: string;
  name: string;
  coupleName: string;
  maxSessions: number;
  maxPhotos: number;
}

interface SessionInfo {
  id: string;
  sessionToken: string;
  expiresAt: string;
}

interface PhotoData {
  id: string;
  photoSessionId: string;
  filename: string;
  status: string;
  preview?: string;
}

interface PhotoSessionInfo {
  id: string;
  photoCount: number;
  maxPhotos: number;
}

export default function GuestCameraPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrToken = params.qrToken as string;
  const isContinue = searchParams.get('continue') === 'true';

  const [step, setStep] = useState<'welcome' | 'camera' | 'preview' | 'consent' | 'done'>('welcome');
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [currentPhotos, setCurrentPhotos] = useState<PhotoData[]>([]);
  const [currentPhotoSession, setCurrentPhotoSession] = useState<PhotoSessionInfo | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const existingToken = localStorage.getItem(`guest_session_${qrToken}`);
    if (existingToken && !isContinue) {
      router.push(`/session/${existingToken}`);
    } else if (isContinue && existingToken) {
      loadContinueSession(existingToken);
    }
  }, [qrToken, router, isContinue]);

  async function loadContinueSession(sessionToken: string) {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/guest-session/${qrToken}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat event');
      }

      setEvent(data.event);
      setSession({ id: '', sessionToken, expiresAt: '' });
      setStep('camera');
      startCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/guest-session/${qrToken}`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat sesi');
      }

      setEvent(data.event);
      setSession(data.session);
      localStorage.setItem(`guest_session_${qrToken}`, data.session.sessionToken);
      setStep('camera');
      startCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setError('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !session) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('photo', blob, `photo-${Date.now()}.jpg`);

        try {
          const res = await fetch(`/api/events/${session ? event?.id : ''}/photos`, {
            method: 'POST',
            headers: {
              'x-session-token': session!.sessionToken,
            },
            body: formData,
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Gagal mengunggah foto');
          }

          const preview = canvas.toDataURL('image/jpeg', 0.8);

          setCurrentPhotos((prev) => [
            ...prev,
            { ...data.photo, preview },
          ]);
          setCurrentPhotoSession(data.photoSession);

          if (data.photoSession.photoCount >= (event?.maxPhotos || 4)) {
            stopCamera();
            setStep('preview');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Gagal mengunggah foto');
        }
      },
      'image/jpeg',
      0.9
    );
  }, [session, event]);

  function handleDoneTaking() {
    setStep('consent');
  }

  function handleTakeMore() {
    setCurrentPhotos([]);
    setCurrentPhotoSession(null);
    setStep('camera');
    startCamera();
  }

  async function handleSubmitConsent() {
    if (!session || !currentPhotoSession) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/session/${session.sessionToken}/consent`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoSessionId: currentPhotoSession.id,
          consentGiven,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan pilihan');
      }

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (error && step === 'welcome') {
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

  if (step === 'welcome') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="card-elevated w-full max-w-md p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
            <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-semibold text-warm-900">Photo Booth</h1>
          <p className="mt-3 text-warm-500">Ambil foto untuk mengenang momen spesial ini</p>
          
          {loading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-warm-400">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Memuat...</span>
            </div>
          )}
          
          <button
            onClick={handleStart}
            disabled={loading}
            className="btn-primary mt-8 w-full py-3.5 text-base"
          >
            Mulai Ambil Foto
          </button>
        </div>
      </main>
    );
  }

  if (step === 'camera') {
    return (
      <main className="flex min-h-screen flex-col bg-warm-900">
        <div className="flex flex-1 flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg">
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-elevated">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-500/10 p-3.5 text-sm text-red-300 border border-red-500/20">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div className="rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm font-medium text-white/80">
                  {currentPhotos.length} <span className="text-white/50">/ {event?.maxPhotos || 4}</span>
                </p>
              </div>
              <button
                onClick={capturePhoto}
                className="flex h-18 w-18 items-center justify-center rounded-full bg-white p-5 text-brand-600 shadow-elevated transition-transform duration-150 active:scale-95 hover:shadow-lg"
                style={{ height: '72px', width: '72px' }}
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="w-16" />
            </div>

            {currentPhotos.length > 0 && (
              <button
                onClick={() => { stopCamera(); setStep('preview'); }}
                className="btn-secondary mt-6 w-full !border-white/20 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20"
              >
                Selesai & Lihat Foto
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (step === 'preview') {
    return (
      <main className="flex min-h-screen flex-col items-center p-6">
        <div className="w-full max-w-lg">
          <h1 className="font-display text-2xl font-semibold text-center text-warm-900">Foto Anda</h1>
          <p className="mt-2 text-center text-sm text-warm-500">Pilih foto yang ingin disimpan</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {currentPhotos.map((photo, index) => (
              <div key={photo.id} className="relative group">
                {photo.preview && (
                  <img
                    src={photo.preview}
                    alt={`Foto ${index + 1}`}
                    className="w-full rounded-xl aspect-square object-cover shadow-soft"
                  />
                )}
                <button
                  onClick={() => {
                    setCurrentPhotos((prev) => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-md transition-transform duration-150 active:scale-90"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {currentPhotos.length === 0 && (
            <div className="mt-8 rounded-xl bg-warm-50 p-8 text-center">
              <p className="text-sm text-warm-400">Tidak ada foto yang dipilih</p>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <button
              onClick={handleSubmitConsent}
              disabled={currentPhotos.length === 0 || loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </button>
            <button
              onClick={handleTakeMore}
              className="btn-secondary w-full"
            >
              Ambil Foto Lagi
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (step === 'consent') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="card-elevated w-full max-w-md p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
            <svg className="h-7 w-7 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-center text-warm-900">Izin Publikasi</h1>
          <p className="mt-3 text-center text-sm text-warm-500">
            Apakah Anda mengizinkan foto ini ditampilkan di galeri publik?
          </p>

          <div className="mt-6 space-y-3">
            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
              consentGiven ? 'border-brand-300 bg-brand-50 ring-2 ring-brand-100' : 'border-warm-200 hover:bg-warm-50'
            }`}>
              <input
                type="radio"
                name="consent"
                checked={consentGiven}
                onChange={() => setConsentGiven(true)}
                className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="font-medium text-warm-800">Ya, tampilkan di galeri</p>
                <p className="text-sm text-warm-500 mt-0.5">
                  Foto Anda akan ditampilkan di galeri publik setelah disetujui admin
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
              !consentGiven ? 'border-warm-300 bg-warm-50 ring-2 ring-warm-100' : 'border-warm-200 hover:bg-warm-50'
            }`}>
              <input
                type="radio"
                name="consent"
                checked={!consentGiven}
                onChange={() => setConsentGiven(false)}
                className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="font-medium text-warm-800">Tidak, simpan privat</p>
                <p className="text-sm text-warm-500 mt-0.5">
                  Foto hanya untuk Anda dan pengantin
                </p>
              </div>
            </label>
          </div>

          <p className="mt-4 text-xs text-warm-400">
            Anda bertanggung jawab atas izin orang lain yang terlihat dalam foto.
          </p>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-100">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmitConsent}
            disabled={loading}
            className="btn-primary mt-6 w-full py-3"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pilihan'}
          </button>
        </div>
      </main>
    );
  }

  if (step === 'done') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="card-elevated w-full max-w-md p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display mt-5 text-2xl font-semibold text-warm-900">Terima Kasih!</h1>
          <p className="mt-3 text-sm text-warm-500">
            Foto Anda telah disimpan. Simpan tautan di bawah untuk mengakses foto Anda nanti.
          </p>

          {session && (
            <div className="mt-6 rounded-xl bg-warm-50 p-4 border border-warm-200">
              <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Tautan Privat Anda:</p>
              <a
                href={`/session/${session.sessionToken}`}
                className="mt-2 block break-all text-sm text-brand-600 hover:text-brand-700 font-mono"
              >
                {typeof window !== 'undefined' && window.location.origin}/session/{session.sessionToken}
              </a>
            </div>
          )}

          <button
            onClick={() => router.push(`/session/${session?.sessionToken}`)}
            className="btn-primary mt-6 w-full py-3"
          >
            Lihat Foto Saya
          </button>
        </div>
      </main>
    );
  }

  return null;
}
