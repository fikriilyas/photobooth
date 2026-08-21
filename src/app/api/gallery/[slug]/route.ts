import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const event = await prisma.event.findUnique({
      where: { gallerySlug: slug },
      select: {
        id: true,
        name: true,
        coupleName: true,
        galleryEnabled: true,
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Galeri tidak ditemukan' }, { status: 404 });
    }

    if (!event.galleryEnabled) {
      return NextResponse.json({ error: 'Galeri tidak aktif' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {
      eventId: event.id,
      status: 'APPROVED' as const,
      photoSession: {
        consentGiven: true,
      },
    };

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        select: {
          id: true,
          eventId: true,
          filename: true,
          approvedAt: true,
        },
        orderBy: { approvedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);

    return NextResponse.json({
      event: {
        name: event.name,
        coupleName: event.coupleName,
      },
      photos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get gallery error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
