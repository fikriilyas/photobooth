import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const session = await verifySession(token);

  if (!session) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('admin_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
