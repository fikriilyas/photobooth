import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { deletePhotoFiles } from '@/lib/storage/files';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; photoId: string }> }
) {
  try {
    const { token, photoId } = await params;

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

    if (guestSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session sudah kedaluwarsa' }, { status: 410 });
    }

    const photo = guestSession.photoSessions
      .flatMap((ps) => ps.photos)
      .find((p) => p.id === photoId);

    if (!photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    await deletePhotoFiles(photo.originalPath, photo.optimizedPath);

    await prisma.photo.update({
      where: { id: photoId },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Foto berhasil dihapus' });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
