import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const event = await prisma.event.findUnique({
      where: { galleryToken: token },
      select: {
        id: true,
        name: true,
        coupleName: true,
        slideshowEnabled: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Slideshow tidak ditemukan' }, { status: 404 });
    }

    if (!event.slideshowEnabled) {
      return NextResponse.json({ error: 'Slideshow tidak aktif' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const photos = await prisma.photo.findMany({
      where: {
        eventId: event.id,
        status: 'APPROVED',
        photoSession: {
          consentGiven: true,
        },
      },
      select: {
        id: true,
        eventId: true,
        filename: true,
        approvedAt: true,
      },
      orderBy: { approvedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      event: {
        name: event.name,
        coupleName: event.coupleName,
      },
      photos,
    });
  } catch (error) {
    console.error('Get slideshow error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
