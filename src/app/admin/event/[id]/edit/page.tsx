import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { EditEventForm } from './edit-event-form';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
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
  });

  if (!event) notFound();

  function formatDate(date: Date): string {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <EditEventForm
      event={{
        id: event.id,
        name: event.name,
        coupleName: event.coupleName,
        startDate: formatDate(event.startDate),
        endDate: formatDate(event.endDate),
        timezone: event.timezone,
        maxSessions: event.maxSessions,
        maxPhotos: event.maxPhotos,
        capacity: event.capacity,
        retentionDays: event.retentionDays,
        galleryEnabled: event.galleryEnabled,
        slideshowEnabled: event.slideshowEnabled,
      }}
    />
  );
}
