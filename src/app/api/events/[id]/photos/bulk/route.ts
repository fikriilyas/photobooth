import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function PATCH(
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

    const { photoIds, status } = await request.json();

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'photoIds harus array tidak kosong' }, { status: 400 });
    }

    if (!['PENDING', 'APPROVED', 'HIDDEN', 'DELETED'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    
    if (status === 'APPROVED') {
      updateData.approvedAt = new Date();
      updateData.hiddenAt = null;
      updateData.deletedAt = null;
    } else if (status === 'HIDDEN') {
      updateData.hiddenAt = new Date();
    } else if (status === 'DELETED') {
      updateData.deletedAt = new Date();
    } else if (status === 'PENDING') {
      updateData.approvedAt = null;
      updateData.hiddenAt = null;
      updateData.deletedAt = null;
    }

    await prisma.photo.updateMany({
      where: {
        id: { in: photoIds },
        eventId,
      },
      data: updateData,
    });

    await prisma.auditRecord.create({
      data: {
        eventId,
        actorId: session.userId,
        action: `PHOTOS_BULK_${status}`,
        objectType: 'Photo',
        objectId: photoIds.join(','),
        metadata: JSON.stringify({ count: photoIds.length }),
      },
    });

    return NextResponse.json({ 
      message: `${photoIds.length} foto berhasil diperbarui`,
      count: photoIds.length,
    });
  } catch (error) {
    console.error('Bulk update photos error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
