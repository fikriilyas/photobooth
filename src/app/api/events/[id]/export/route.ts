import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import { getPhotoFilePath } from '@/lib/storage/files';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

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

    const photos = await prisma.photo.findMany({
      where: { eventId, status: { not: 'DELETED' } },
      include: {
        photoSession: {
          include: {
            guestSession: {
              select: { nickname: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const metadata = photos.map((photo, index) => ({
      index: index + 1,
      filename: photo.filename,
      status: photo.status,
      consentGiven: photo.photoSession.consentGiven,
      consentVersion: photo.photoSession.consentVersion,
      consentedAt: photo.photoSession.consentedAt,
      guestNickname: photo.photoSession.guestSession.nickname,
      createdAt: photo.createdAt,
      approvedAt: photo.approvedAt,
    }));

    const csvHeader = 'Index,Filename,Status,Consent Given,Consent Version,Consented At,Guest Nickname,Created At,Approved At\n';
    const csvRows = metadata.map((m) => 
      `${m.index},"${m.filename}",${m.status},${m.consentGiven},"${m.consentVersion || ''}","${m.consentedAt || ''}","${m.guestNickname || ''}","${m.createdAt.toISOString()}","${m.approvedAt ? m.approvedAt.toISOString() : ''}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    const tempDir = tmpdir();
    const tempFile = join(tempDir, `export-${eventId}-${randomUUID()}.csv`);
    
    const { writeFile } = await import('fs/promises');
    await writeFile(tempFile, csvContent, 'utf-8');

    const fileBuffer = await readFile(tempFile);
    
    const { unlink } = await import('fs/promises');
    await unlink(tempFile);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="event-${eventId}-export.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
