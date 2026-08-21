import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { deletePhotoFiles } from '@/lib/storage/files';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionToken: token },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            coupleName: true,
            qrToken: true,
          },
        },
        photoSessions: {
          include: {
            photos: {
              orderBy: { createdAt: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!guestSession) {
      return NextResponse.json({ error: 'Session tidak ditemukan' }, { status: 404 });
    }

    if (guestSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session sudah kedaluwarsa' }, { status: 410 });
    }

    const photos = guestSession.photoSessions.flatMap((ps) =>
      ps.photos.map((photo) => ({
        ...photo,
        photoSession: {
          id: ps.id,
          consentGiven: ps.consentGiven,
        },
      }))
    );

    return NextResponse.json({
      session: {
        id: guestSession.id,
        nickname: guestSession.nickname,
        expiresAt: guestSession.expiresAt,
        event: guestSession.event,
      },
      photos,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionToken: token },
      include: {
        photoSessions: {
          include: {
            photos: true,
          },
        },
      },
    });

    if (!guestSession) {
      return NextResponse.json({ error: 'Session tidak ditemukan' }, { status: 404 });
    }

    for (const photoSession of guestSession.photoSessions) {
      for (const photo of photoSession.photos) {
        await deletePhotoFiles(photo.originalPath, photo.optimizedPath);
      }
    }

    await prisma.guestSession.delete({
      where: { id: guestSession.id },
    });

    return NextResponse.json({ message: 'Session berhasil dihapus' });
  } catch (error) {
    console.error('Delete session error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
