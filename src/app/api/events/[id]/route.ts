import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Get event error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existingEvent = await prisma.event.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.userId },
          { admins: { some: { userId: session.userId, joinedAt: { not: null } } } },
        ],
      },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      coupleName,
      startDate,
      endDate,
      timezone,
      maxSessions,
      maxPhotos,
      capacity,
      retentionDays,
      status,
      galleryEnabled,
      slideshowEnabled,
    } = body;

    const updateData: Record<string, unknown> = {};
    
    if (name !== undefined) updateData.name = name;
    if (coupleName !== undefined) updateData.coupleName = coupleName;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (timezone !== undefined) updateData.timezone = timezone;
    if (maxSessions !== undefined) updateData.maxSessions = maxSessions;
    if (maxPhotos !== undefined) updateData.maxPhotos = maxPhotos;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (retentionDays !== undefined) updateData.retentionDays = retentionDays;
    if (status !== undefined) updateData.status = status;
    if (galleryEnabled !== undefined) updateData.galleryEnabled = galleryEnabled;
    if (slideshowEnabled !== undefined) updateData.slideshowEnabled = slideshowEnabled;

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditRecord.create({
      data: {
        eventId: id,
        actorId: session.userId,
        action: 'EVENT_UPDATED',
        objectType: 'Event',
        objectId: id,
        metadata: JSON.stringify({ changes: Object.keys(updateData) }),
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: { id, ownerId: session.userId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event tidak ditemukan atau Anda bukan pemilik' },
        { status: 404 }
      );
    }

    await prisma.event.delete({ where: { id } });

    return NextResponse.json({ message: 'Event berhasil dihapus' });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
