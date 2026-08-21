'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Props {
  eventId: string;
  status: string;
  isOwner: boolean;
}

export function EventActions({ eventId, status, isOwner }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/admin/events');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/admin/event/${eventId}/edit`}
        className="btn-secondary"
      >
        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </Link>

      {status === 'DRAFT' && (
        <button
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={loading}
          className="btn-primary !bg-green-600 hover:!bg-green-700"
        >
          Aktifkan
        </button>
      )}

      {status === 'ACTIVE' && (
        <button
          onClick={() => handleStatusChange('ARCHIVED')}
          disabled={loading}
          className="btn-secondary !border-amber-300 !text-amber-700 hover:!bg-amber-50"
        >
          Arsipkan
        </button>
      )}

      {status === 'ARCHIVED' && (
        <button
          onClick={() => handleStatusChange('ACTIVE')}
          disabled={loading}
          className="btn-primary !bg-green-600 hover:!bg-green-700"
        >
          Aktifkan Kembali
        </button>
      )}

      {isOwner && (
        <>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
            className="btn-destructive"
          >
            Hapus
          </button>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
              <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-elevated">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-warm-900 text-center">Hapus Event</h3>
                <p className="mt-2 text-sm text-warm-500 text-center">
                  Apakah Anda yakin ingin menghapus event ini? Tindakan ini tidak dapat dibatalkan
                  dan semua foto akan dihapus permanen.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="btn-secondary flex-1"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="btn-destructive flex-1"
                  >
                    {loading ? 'Menghapus...' : 'Hapus Permanen'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
