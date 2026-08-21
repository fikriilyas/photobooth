import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const guestSession = await prisma.guestSession.findUnique({
      where: { sessionToken: token },
      include: {
        photoSessions: true,
      },
    });

    if (!guestSession) {
      return NextResponse.json({ error: 'Session tidak ditemukan' }, { status: 404 });
    }

    if (guestSession.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Session sudah kedaluwarsa' }, { status: 410 });
    }

    const { photoSessionId, consentGiven } = await request.json();

    if (typeof consentGiven !== 'boolean') {
      return NextResponse.json({ error: 'consentGiven harus boolean' }, { status: 400 });
    }

    const photoSession = guestSession.photoSessions.find(
      (ps) => ps.id === photoSessionId
    );

    if (!photoSession) {
      return NextResponse.json({ error: 'Photo session tidak ditemukan' }, { status: 404 });
    }

    await prisma.photoSession.update({
      where: { id: photoSessionId },
      data: {
        consentGiven,
        consentVersion: consentGiven ? 'v1' : null,
        consentedAt: consentGiven ? new Date() : null,
      },
    });

    if (consentGiven) {
      await prisma.photo.updateMany({
        where: {
          photoSessionId,
          status: 'PENDING',
        },
        data: {
          status: 'PENDING',
        },
      });
    } else {
      await prisma.photo.updateMany({
        where: {
          photoSessionId,
          status: 'APPROVED',
        },
        data: {
          status: 'HIDDEN',
          hiddenAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: consentGiven ? 'Izin publikasi diberikan' : 'Izin publikasi dicabut',
    });
  } catch (error) {
    console.error('Update consent error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
