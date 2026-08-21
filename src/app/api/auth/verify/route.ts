import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createSession, setSessionCookie } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }

  try {
    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    if (magicLink.usedAt) {
      return NextResponse.redirect(new URL('/login?error=token_used', request.url));
    }

    if (magicLink.expiresAt < new Date()) {
      return NextResponse.redirect(new URL('/login?error=token_expired', request.url));
    }

    const user = await prisma.user.findUnique({
      where: { email: magicLink.email },
    });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    await prisma.magicLink.update({
      where: { id: magicLink.id },
      data: { usedAt: new Date() },
    });

    const sessionToken = await createSession(user.id, user.email, user.role);
    await setSessionCookie(sessionToken);

    return NextResponse.redirect(new URL('/admin/events', request.url));
  } catch (error) {
    console.error('Verify magic link error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', request.url));
  }
}
