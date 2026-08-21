'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';

interface Photo {
  id: string;
  eventId: string;
  filename: string;
  approvedAt: string;
}

interface EventInfo {
  name: string;
  coupleName: string;
}

export default function SlideshowPage() {
  const params = useParams();
  const token = params.token as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchSlideshow();
    const interval = setInterval(fetchSlideshow, 10000);
    return () => clearInterval(interval);
  }, [token]);

  async function fetchSlideshow() {
    try {
      const res = await fetch(`/api/slideshow/${token}?limit=100`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat slideshow');
      }

      setEvent(data.event);
      setPhotos(data.photos);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main className="flex min-h-screen items-center justify-center bg-warm-900">
          <svg className="h-8 w-8 animate-spin text-warm-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main className="flex min-h-screen flex-col items-center justify-center bg-warm-900 p-6">
          <h1 className="text-2xl font-bold text-red-400">Error</h1>
          <p className="mt-4 text-warm-400">{error}</p>
        </main>
      </>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
        <title>{event.name} - Slideshow</title>
      </Head>
      <main className="min-h-screen bg-warm-900 p-4 sm:p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">{event.name}</h1>
            <p className="mt-3 text-xl text-warm-400">{event.coupleName}</p>
            {lastUpdate && (
              <p className="mt-3 text-sm text-warm-600">
                Terakhir diperbarui: {lastUpdate.toLocaleTimeString('id-ID')}
              </p>
            )}
          </div>

          {photos.length === 0 ? (
            <div className="rounded-2xl bg-warm-800/50 p-12 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-700/50">
                <svg className="h-8 w-8 text-warm-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Belum Ada Foto</h2>
              <p className="mt-2 text-warm-500">
                Foto akan muncul di sini setelah disetujui oleh admin
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-warm-800 shadow-lg">
                  <img
                    src={`/api/events/${photo.eventId}/photos/${photo.id}/file?type=optimized`}
                    alt={photo.filename}
                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
