'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Photo {
  id: string;
  filename: string;
  status: string;
  createdAt: string;
  photoSession: {
    consentGiven: boolean;
    consentVersion: string | null;
    consentedAt: string | null;
    guestSession: {
      nickname: string | null;
    };
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function PhotosPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [consentFilter, setConsentFilter] = useState<string>('');
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPhotos();
  }, [eventId, filter, consentFilter]);

  async function fetchPhotos(page: number = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (consentFilter) params.set('consent', consentFilter);
      params.set('page', page.toString());
      params.set('limit', '50');

      const res = await fetch(`/api/events/${eventId}/photos?${params}`);
      const data = await res.json();

      if (res.ok) {
        setPhotos(data.photos);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch photos:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(photoId: string, status: string) {
    setProcessing((prev) => new Set(prev).add(photoId));
    try {
      const res = await fetch(`/api/events/${eventId}/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, status } : p))
        );
      }
    } catch (error) {
      console.error('Failed to update photo:', error);
    } finally {
      setProcessing((prev) => {
        const next = new Set(prev);
        next.delete(photoId);
        return next;
      });
    }
  }

  async function handleBulkAction(status: string) {
    if (selectedPhotos.size === 0) return;

    const photoIds = Array.from(selectedPhotos);
    setProcessing(new Set(photoIds));

    try {
      const res = await fetch(`/api/events/${eventId}/photos/bulk`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds, status }),
      });

      if (res.ok) {
        setPhotos((prev) =>
          prev.map((p) =>
            selectedPhotos.has(p.id) ? { ...p, status } : p
          )
        );
        setSelectedPhotos(new Set());
      }
    } catch (error) {
      console.error('Failed to bulk update:', error);
    } finally {
      setProcessing(new Set());
    }
  }

  function toggleSelect(photoId: string) {
    setSelectedPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map((p) => p.id)));
    }
  }

  const pendingCount = photos.filter((p) => p.status === 'PENDING').length;
  const approvedCount = photos.filter((p) => p.status === 'APPROVED').length;
  const hiddenCount = photos.filter((p) => p.status === 'HIDDEN').length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link href={`/admin/event/${eventId}`} className="back-link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Detail Event
        </Link>
        <h1 className="page-title mt-3">Moderasi Foto</h1>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Menunggu</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Disetujui</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{approvedCount}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Disembunyikan</p>
          <p className="mt-1 text-2xl font-bold text-warm-500">{hiddenCount}</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {[
            { value: '', label: 'Semua' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'HIDDEN', label: 'Hidden' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                filter === item.value
                  ? 'bg-brand-600 text-white shadow-soft'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-warm-200" />

        <div className="flex gap-1.5">
          {[
            { value: '', label: 'Semua Consent' },
            { value: 'true', label: 'Dengan Consent' },
            { value: 'false', label: 'Tanpa Consent' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setConsentFilter(item.value)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                consentFilter === item.value
                  ? 'bg-green-600 text-white shadow-soft'
                  : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {selectedPhotos.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">
            {selectedPhotos.size} foto dipilih
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkAction('APPROVED')}
              className="rounded-lg bg-green-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors duration-200"
            >
              Setujui Semua
            </button>
            <button
              onClick={() => handleBulkAction('HIDDEN')}
              className="rounded-lg bg-warm-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-warm-700 transition-colors duration-200"
            >
              Sembunyikan Semua
            </button>
            <button
              onClick={() => handleBulkAction('DELETED')}
              className="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors duration-200"
            >
              Hapus Semua
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-6 w-6 animate-spin text-warm-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : photos.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
            <svg className="h-8 w-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-warm-500">Tidak ada foto</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedPhotos.size === photos.length && photos.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-warm-700">Pilih Semua</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <div key={photo.id} className={`group relative rounded-xl border bg-white p-2 transition-all duration-200 ${
                selectedPhotos.has(photo.id) ? 'border-brand-300 ring-2 ring-brand-100' : 'hover:shadow-card'
              }`}>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.has(photo.id)}
                    onChange={() => toggleSelect(photo.id)}
                    className="absolute left-3 top-3 z-10 h-5 w-5 rounded border-warm-300 text-brand-600 focus:ring-brand-500"
                  />
                  <img
                    src={`/api/events/${eventId}/photos/${photo.id}/file?type=optimized`}
                    alt={photo.filename}
                    className="w-full rounded-lg aspect-square object-cover"
                  />
                  
                  {photo.photoSession.consentGiven ? (
                    <div className="absolute right-2 top-2 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      Consent
                    </div>
                  ) : (
                    <div className="absolute right-2 top-2 rounded-full bg-warm-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                      Privat
                    </div>
                  )}

                  <div className={`absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ${
                    photo.status === 'PENDING' ? 'bg-amber-500' :
                    photo.status === 'APPROVED' ? 'bg-green-500' :
                    photo.status === 'HIDDEN' ? 'bg-warm-500' :
                    'bg-red-500'
                  }`}>
                    {photo.status === 'PENDING' ? 'Pending' :
                     photo.status === 'APPROVED' ? 'Approved' :
                     photo.status === 'HIDDEN' ? 'Hidden' : 'Deleted'}
                  </div>
                </div>

                <div className="mt-2 flex gap-1">
                  {photo.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleStatusChange(photo.id, 'APPROVED')}
                      disabled={processing.has(photo.id)}
                      className="flex-1 rounded-lg bg-green-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                    >
                      Setujui
                    </button>
                  )}
                  {photo.status !== 'HIDDEN' && (
                    <button
                      onClick={() => handleStatusChange(photo.id, 'HIDDEN')}
                      disabled={processing.has(photo.id)}
                      className="flex-1 rounded-lg bg-warm-200 px-2 py-1.5 text-xs font-medium text-warm-700 hover:bg-warm-300 disabled:opacity-50 transition-colors duration-200"
                    >
                      Sembunyikan
                    </button>
                  )}
                  {photo.status !== 'DELETED' && (
                    <button
                      onClick={() => handleStatusChange(photo.id, 'DELETED')}
                      disabled={processing.has(photo.id)}
                      className="flex-1 rounded-lg bg-red-100 px-2 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors duration-200"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {photo.photoSession.guestSession.nickname && (
                  <p className="mt-1.5 text-xs text-warm-400 truncate">
                    Oleh: {photo.photoSession.guestSession.nickname}
                  </p>
                )}
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchPhotos(page)}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                    pagination.page === page
                      ? 'bg-brand-600 text-white shadow-soft'
                      : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
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
  );
}
