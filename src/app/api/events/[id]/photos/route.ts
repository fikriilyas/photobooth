import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { savePhoto } from '@/lib/storage/files';
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

    const { id: eventId } = await params;

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        OR: [
          { ownerId: session.userId },
          { admins: { some: { userId: session.userId, joinedAt: { not: null } } } },
        ],
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const consent = searchParams.get('consent');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = { eventId };

    if (status) {
      where.status = status;
    }

    if (consent === 'true' || consent === 'false') {
      where.photoSession = {
        consentGiven: consent === 'true',
      };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        include: {
          photoSession: {
            select: {
              consentGiven: true,
              consentVersion: true,
              consentedAt: true,
              guestSession: {
                select: {
                  nickname: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);

    return NextResponse.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get photos error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
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

    const sessionToken = request.headers.get('x-session-token');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token tidak ditemukan' }, { status: 401 });
    }

    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionToken },
      include: {
        photoSessions: {
          include: { photos: true },
        },
      },
    });

    if (!guestSession || guestSession.eventId !== eventId) {
      return NextResponse.json({ error: 'Session tidak valid' }, { status: 401 });
    }

    if (guestSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session sudah kedaluwarsa' }, { status: 401 });
    }

    const currentPhotoCount = await prisma.photo.count({
      where: { eventId, status: { not: 'DELETED' } },
    });

    if (currentPhotoCount >= event.capacity) {
      return NextResponse.json(
        { error: 'Event sudah mencapai kapasitas maksimum' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ error: 'File foto tidak ditemukan' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { filename, originalPath, optimizedPath } = await savePhoto(eventId, buffer);

    let photoSession = guestSession.photoSessions.find(
      (ps) => ps.photos.length < event.maxPhotos
    );

    let photoSessionId: string;
    let photoCount: number;

    if (!photoSession) {
      if (guestSession.photoSessions.length >= event.maxSessions) {
        return NextResponse.json(
          { error: `Anda telah mencapai batas maksimal ${event.maxSessions} sesi foto` },
          { status: 400 }
        );
      }
      const newSession = await prisma.photoSession.create({
        data: {
          guestSessionId: guestSession.id,
        },
      });
      photoSessionId = newSession.id;
      photoCount = 1;
    } else {
      photoSessionId = photoSession.id;
      photoCount = photoSession.photos.length + 1;
    }

    const photo = await prisma.photo.create({
      data: {
        photoSessionId,
        eventId,
        filename: file.name || filename,
        originalPath,
        optimizedPath,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      photo: {
        id: photo.id,
        photoSessionId: photo.photoSessionId,
        filename: photo.filename,
        status: photo.status,
      },
      photoSession: {
        id: photoSessionId,
        photoCount,
        maxPhotos: event.maxPhotos,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
