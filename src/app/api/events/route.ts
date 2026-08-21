import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { generateToken } from '@/lib/utils/token';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      coupleName,
      startDate,
      endDate,
      timezone,
      maxSessions = 3,
      maxPhotos = 4,
      capacity = 1000,
      retentionDays = 90,
    } = body;

    if (!name || !coupleName || !startDate || !endDate || !timezone) {
      return NextResponse.json(
        { error: 'Nama event, nama pasangan, tanggal, dan zona waktu wajib diisi' },
        { status: 400 }
      );
    }

    const qrToken = generateToken(16);
    const gallerySlug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${generateToken(4)}`;
    const galleryToken = generateToken(16);

    const event = await prisma.event.create({
      data: {
        name,
        coupleName,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        timezone,
        qrToken,
        maxSessions,
        maxPhotos,
        capacity,
        retentionDays,
        gallerySlug,
        galleryToken,
        ownerId: session.userId,
        status: 'DRAFT',
      },
    });

    await prisma.auditRecord.create({
      data: {
        eventId: event.id,
        actorId: session.userId,
        action: 'EVENT_CREATED',
        objectType: 'Event',
        objectId: event.id,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
