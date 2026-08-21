import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPhotoFilePath } from '@/lib/storage/files';
import { readFile, stat } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const { id: eventId, photoId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'optimized';

    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        eventId,
        status: { not: 'DELETED' },
      },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    const isOptimized = type === 'optimized';
    const photoPath = isOptimized ? photo.optimizedPath : photo.originalPath;
    const filePath = getPhotoFilePath(photoPath);

    try {
      const fileStat = await stat(filePath);
      const fileBuffer = await readFile(filePath);

      const contentType = photo.filename.endsWith('.png') ? 'image/png' : 'image/jpeg';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': fileStat.size.toString(),
          'Cache-Control': isOptimized ? 'public, max-age=3600' : 'private, no-cache',
        },
      });
    } catch {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }
  } catch (error) {
    console.error('Serve photo error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
