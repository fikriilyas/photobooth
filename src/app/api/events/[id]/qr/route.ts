import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';
import QRCode from 'qrcode';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const event = await prisma.event.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.userId },
          { admins: { some: { userId: session.userId, joinedAt: { not: null } } } },
        ],
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/event/${event.qrToken}`;

    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    return NextResponse.json({ qrCode: qrDataUrl, qrUrl });
  } catch (error) {
    console.error('Generate QR error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
