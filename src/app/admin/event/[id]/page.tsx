import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { EventActions } from './event-actions';
import { QRCodeDisplay } from './qr-code-display';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'badge-success' },
  DRAFT: { label: 'Draft', className: 'badge-neutral' },
  ARCHIVED: { label: 'Arsip', className: 'badge-warning' },
  EXPIRED: { label: 'Kedaluwarsa', className: 'badge-destructive' },
};

export default async function EventDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) notFound();

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.userId },
        { admins: { some: { userId: session.userId, joinedAt: { not: null } } } },
      ],
    },
    include: {
      owner: { select: { id: true, email: true } },
      admins: {
        include: { user: { select: { id: true, email: true } } },
        where: { joinedAt: { not: null } },
      },
      _count: {
        select: { photos: true },
      },
    },
  });

  if (!event) notFound();

  const isOwner = event.ownerId === session.userId;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const qrUrl = `${baseUrl}/event/${event.qrToken}`;
  const status = statusConfig[event.status] || statusConfig.DRAFT;
  const capacityPercent = Math.round((event._count.photos / event.capacity) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/admin/events" className="back-link">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Events
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-warm-900">{event.name}</h1>
            <span className={status.className}>{status.label}</span>
          </div>
          <p className="mt-1 text-warm-500">{event.coupleName}</p>
        </div>
        <EventActions eventId={event.id} status={event.status} isOwner={isOwner} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="section-title">Informasi Event</h2>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-warm-500">Tanggal Mulai</dt>
                <dd className="text-sm font-medium text-warm-800">{new Date(event.startDate).toLocaleString('id-ID')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-warm-500">Tanggal Selesai</dt>
                <dd className="text-sm font-medium text-warm-800">{new Date(event.endDate).toLocaleString('id-ID')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-warm-500">Zona Waktu</dt>
                <dd className="text-sm font-medium text-warm-800">{event.timezone.replace('_', ' ')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-warm-500">Pemilik</dt>
                <dd className="text-sm font-medium text-warm-800">{event.owner.email}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="section-title">Pengaturan</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-warm-50 p-3">
                <dt className="text-xs text-warm-500">Maks Sesi/Tamu</dt>
                <dd className="mt-1 text-lg font-semibold text-warm-800">{event.maxSessions}</dd>
              </div>
              <div className="rounded-lg bg-warm-50 p-3">
                <dt className="text-xs text-warm-500">Maks Foto/Sesi</dt>
                <dd className="mt-1 text-lg font-semibold text-warm-800">{event.maxPhotos}</dd>
              </div>
              <div className="rounded-lg bg-warm-50 p-3">
                <dt className="text-xs text-warm-500">Kapasitas</dt>
                <dd className="mt-1 text-lg font-semibold text-warm-800">
                  {event._count.photos} <span className="text-sm font-normal text-warm-400">/ {event.capacity}</span>
                </dd>
              </div>
              <div className="rounded-lg bg-warm-50 p-3">
                <dt className="text-xs text-warm-500">Retensi</dt>
                <dd className="mt-1 text-lg font-semibold text-warm-800">{event.retentionDays} <span className="text-sm font-normal text-warm-400">hari</span></dd>
              </div>
            </dl>
            {capacityPercent >= 90 && (
              <div className="mt-4 rounded-lg bg-red-50 p-3 border border-red-100">
                <p className="text-sm text-red-700">
                  <strong>Peringatan:</strong> Kapasitas hampir penuh ({capacityPercent}%)
                </p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="section-title">Tampilan Publik</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-warm-50 px-4 py-3">
                <span className="text-sm font-medium text-warm-700">Public Gallery</span>
                <span className={`text-sm font-semibold ${event.galleryEnabled ? 'text-green-600' : 'text-warm-400'}`}>
                  {event.galleryEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-warm-50 px-4 py-3">
                <span className="text-sm font-medium text-warm-700">Event Slideshow</span>
                <span className={`text-sm font-semibold ${event.slideshowEnabled ? 'text-green-600' : 'text-warm-400'}`}>
                  {event.slideshowEnabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            </div>
            {event.galleryEnabled && event.gallerySlug && (
              <div className="mt-4">
                <p className="text-xs text-warm-400 mb-1.5">Link Galeri:</p>
                <a
                  href={`/gallery/${event.gallerySlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link text-sm break-all"
                >
                  {baseUrl}/gallery/{event.gallerySlug}
                </a>
              </div>
            )}
            {event.slideshowEnabled && (
              <div className="mt-4">
                <Link
                  href={`/admin/event/${event.id}/slideshow`}
                  className="link text-sm"
                >
                  Kontrol Slideshow
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <QRCodeDisplay eventId={event.id} qrUrl={qrUrl} />

          <div className="card p-6">
            <h2 className="section-title">Admin</h2>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center justify-between rounded-lg bg-warm-50 px-4 py-2.5">
                <span className="text-sm text-warm-800">{event.owner.email}</span>
                <span className="badge-primary">Owner</span>
              </li>
              {event.admins.map((admin) => (
                <li key={admin.id} className="flex items-center justify-between rounded-lg bg-warm-50 px-4 py-2.5">
                  <span className="text-sm text-warm-800">{admin.user.email}</span>
                  <span className="badge-neutral">Admin</span>
                </li>
              ))}
            </ul>
            {isOwner && (
              <Link
                href={`/admin/event/${event.id}/admins`}
                className="link mt-4 block text-center text-sm"
              >
                Kelola Admin
              </Link>
            )}
          </div>

          <div className="card p-6">
            <h2 className="section-title">Foto</h2>
            <div className="mt-4 flex items-baseline gap-1.5">
              <p className="text-3xl font-bold text-warm-900">{event._count.photos}</p>
              <p className="text-sm text-warm-400">foto diunggah</p>
            </div>
            <div className="mt-4 space-y-2">
              <Link
                href={`/admin/event/${event.id}/photos`}
                className="btn-primary w-full"
              >
                Kelola Foto
              </Link>
              <a
                href={`/api/events/${event.id}/export`}
                className="btn-secondary w-full"
              >
                Export Data
              </a>
              <Link
                href={`/admin/event/${event.id}/audit`}
                className="btn-ghost w-full"
              >
                Lihat Audit Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
