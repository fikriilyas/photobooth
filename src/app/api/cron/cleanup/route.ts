import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { deletePhotoFiles } from '@/lib/storage/files';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const expiredEvents = await prisma.event.findMany({
      where: {
        status: { in: ['ACTIVE', 'ARCHIVED', 'EXPIRED'] },
        endDate: {
          lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        id: true,
        retentionDays: true,
        endDate: true,
      },
    });

    let deletedPhotos = 0;
    let deletedEvents = 0;

    for (const event of expiredEvents) {
      const retentionEndDate = new Date(
        event.endDate.getTime() + event.retentionDays * 24 * 60 * 60 * 1000
      );

      if (now > retentionEndDate) {
        const photos = await prisma.photo.findMany({
          where: { eventId: event.id },
          select: { originalPath: true, optimizedPath: true },
        });

        for (const photo of photos) {
          await deletePhotoFiles(photo.originalPath, photo.optimizedPath);
          deletedPhotos++;
        }

        await prisma.event.update({
          where: { id: event.id },
          data: { status: 'EXPIRED' },
        });

        deletedEvents++;
      }
    }

    return NextResponse.json({
      message: 'Cleanup completed',
      deletedPhotos,
      deletedEvents,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
