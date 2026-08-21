'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface AuditRecord {
  id: string;
  action: string;
  objectType: string;
  objectId: string;
  actorId: string | null;
  metadata: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AuditPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudit();
  }, [eventId]);

  async function fetchAudit(page: number = 1) {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/audit?page=${page}&limit=50`);
      const data = await res.json();

      if (res.ok) {
        setAuditRecords(data.auditRecords);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch audit:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatAction(action: string): string {
    const actionMap: Record<string, string> = {
      EVENT_CREATED: 'Event dibuat',
      EVENT_UPDATED: 'Event diperbarui',
      PHOTO_APPROVED: 'Foto disetujui',
      PHOTO_HIDDEN: 'Foto disembunyikan',
      PHOTO_DELETED: 'Foto dihapus',
      PHOTOS_BULK_APPROVED: 'Foto disetujui (bulk)',
      PHOTOS_BULK_HIDDEN: 'Foto disembunyikan (bulk)',
      PHOTOS_BULK_DELETED: 'Foto dihapus (bulk)',
    };
    return actionMap[action] || action;
  }

  function formatMetadata(metadata: string | null): string {
    if (!metadata) return '';
    try {
      const data = JSON.parse(metadata);
      if (data.changes) return `Perubahan: ${data.changes.join(', ')}`;
      if (data.count) return `Jumlah: ${data.count}`;
      return JSON.stringify(data);
    } catch {
      return metadata;
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <Link href={`/admin/event/${eventId}`} className="back-link">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Detail Event
        </Link>
        <h1 className="page-title mt-3">Audit Log</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="h-6 w-6 animate-spin text-warm-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : auditRecords.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
            <svg className="h-8 w-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-warm-500">Belum ada aktivitas</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-warm-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">
                    Waktu
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">
                    Aksi
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">
                    Objek
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-warm-500">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-white">
                {auditRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-warm-50/50 transition-colors duration-150">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-warm-500">
                      {new Date(record.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-warm-800">
                      {formatAction(record.action)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-warm-500">
                      <span className="badge-neutral">{record.objectType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-warm-500">
                      {formatMetadata(record.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1.5">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchAudit(page)}
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
