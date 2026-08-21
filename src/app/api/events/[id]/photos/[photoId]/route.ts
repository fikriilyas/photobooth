import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId, photoId } = await params;

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

    const photo = await prisma.photo.findFirst({
      where: { id: photoId, eventId },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Foto tidak ditemukan' }, { status: 404 });
    }

    const { status } = await request.json();

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

    await prisma.photo.update({
      where: { id: photoId },
      data: updateData,
    });

    await prisma.auditRecord.create({
      data: {
        eventId,
        actorId: session.userId,
        action: `PHOTO_${status}`,
        objectType: 'Photo',
        objectId: photoId,
      },
    });

    return NextResponse.json({ message: 'Status foto berhasil diperbarui' });
  } catch (error) {
    console.error('Update photo status error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
