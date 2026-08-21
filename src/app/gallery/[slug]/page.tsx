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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PublicGalleryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  async function fetchGallery(page: number = 1) {
    setLoading(true);
    try {
      const res = await fetch(`/api/gallery/${slug}?page=${page}&limit=50`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat galeri');
      }

      setEvent(data.event);
      setPhotos(data.photos);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main className="flex min-h-screen items-center justify-center">
          <svg className="h-6 w-6 animate-spin text-warm-400" viewBox="0 0 24 24" fill="none">
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
        <title>{event.name} - Galeri Foto</title>
      </Head>
      <main className="min-h-screen bg-[var(--color-background)] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl font-semibold text-warm-900 sm:text-5xl">{event.name}</h1>
            <p className="mt-3 text-lg text-warm-500">{event.coupleName}</p>
          </div>

          {photos.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
                <svg className="h-8 w-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-warm-800">Belum Ada Foto</h2>
              <p className="mt-2 text-sm text-warm-500">
                Foto akan muncul di sini setelah disetujui oleh admin
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-sm text-warm-400">
                  {pagination?.total || 0} foto
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-white shadow-soft transition-shadow duration-200 hover:shadow-card">
                    <img
                      src={`/api/events/${photo.eventId}/photos/${photo.id}/file?type=optimized`}
                      alt={photo.filename}
                      className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => fetchGallery(page)}
                      className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                        pagination.page === page
                          ? 'bg-brand-600 text-white shadow-soft'
                          : 'bg-white text-warm-600 hover:bg-warm-50 border border-warm-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
