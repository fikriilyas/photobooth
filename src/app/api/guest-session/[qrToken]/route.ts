import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateToken } from '@/lib/utils/token';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    const { qrToken } = await params;

    const event = await prisma.event.findUnique({
      where: { qrToken },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        coupleName: event.coupleName,
        maxSessions: event.maxSessions,
        maxPhotos: event.maxPhotos,
      },
    });
  } catch (error) {
    console.error('Get event info error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  try {
    const { qrToken } = await params;

    const event = await prisma.event.findUnique({
      where: { qrToken },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    if (event.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Event tidak menerima foto saat ini' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < event.startDate || now > event.endDate) {
      return NextResponse.json(
        { error: 'Event tidak dalam periode aktif' },
        { status: 400 }
      );
    }

    const photoCount = await prisma.photo.count({
      where: { eventId: event.id, status: { not: 'DELETED' } },
    });

    if (photoCount >= event.capacity) {
      return NextResponse.json(
        { error: 'Event sudah mencapai kapasitas maksimum' },
        { status: 400 }
      );
    }

    const sessionToken = generateToken(24);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const guestSession = await prisma.guestSession.create({
      data: {
        eventId: event.id,
        sessionToken,
        expiresAt,
      },
    });

    return NextResponse.json({
      session: {
        id: guestSession.id,
        sessionToken: guestSession.sessionToken,
        expiresAt: guestSession.expiresAt,
      },
      event: {
        id: event.id,
        name: event.name,
        coupleName: event.coupleName,
        maxSessions: event.maxSessions,
        maxPhotos: event.maxPhotos,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Create guest session error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
