import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Aktif', className: 'badge-success' },
  DRAFT: { label: 'Draft', className: 'badge-neutral' },
  ARCHIVED: { label: 'Arsip', className: 'badge-warning' },
  EXPIRED: { label: 'Kedaluwarsa', className: 'badge-destructive' },
};

export default async function EventsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const events = await prisma.event.findMany({
    where: {
      OR: [
        { ownerId: session.userId },
        { admins: { some: { userId: session.userId, joinedAt: { not: null } } } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { photos: true },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="page-title">Events</h1>
        <Link href="/admin/events/new" className="btn-primary">
          <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Buat Event Baru
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="card mt-8 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warm-100">
            <svg className="h-8 w-8 text-warm-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-warm-600">Belum ada event</p>
          <Link
            href="/admin/events/new"
            className="btn-primary mt-4"
          >
            Buat Event Pertama
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {events.map((event) => {
            const status = statusConfig[event.status] || statusConfig.DRAFT;
            const capacityPercent = Math.round((event._count.photos / event.capacity) * 100);
            return (
              <Link
                key={event.id}
                href={`/admin/event/${event.id}`}
                className="card group p-5 transition-all duration-200 hover:shadow-card hover:border-brand-200"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="font-semibold text-warm-900 group-hover:text-brand-700 transition-colors duration-200 truncate">
                        {event.name}
                      </h2>
                      <span className={status.className}>
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-warm-500">{event.coupleName}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-warm-700">
                        {event._count.photos} <span className="text-warm-400">/ {event.capacity}</span>
                      </p>
                      <p className="text-xs text-warm-400">foto</p>
                    </div>
                    <svg className="h-5 w-5 text-warm-300 group-hover:text-brand-400 transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {capacityPercent >= 90 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-warm-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            capacityPercent >= 100 ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        capacityPercent >= 100 ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {capacityPercent}%
                      </span>
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
