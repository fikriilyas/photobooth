import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/auth/session';

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [auditRecords, total] = await Promise.all([
      prisma.auditRecord.findMany({
        where: { eventId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditRecord.count({ where: { eventId } }),
    ]);

    return NextResponse.json({
      auditRecords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
