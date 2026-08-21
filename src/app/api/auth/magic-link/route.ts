import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { generateToken } from '@/lib/utils/token';
import { sendMagicLink } from '@/lib/auth/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ 
        message: 'Jika email terdaftar, link login akan dikirim.' 
      });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.magicLink.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const link = `${baseUrl}/api/auth/verify?token=${token}`;

    // In development mode, return the link directly for easy testing
    const isDev = process.env.NODE_ENV !== 'production';
    
    if (!isDev) {
      await sendMagicLink(normalizedEmail, link);
    } else {
      console.log('\n=== DEVELOPMENT MAGIC LINK ===');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Link: ${link}`);
      console.log('==============================\n');
    }

    return NextResponse.json({ 
      message: 'Jika email terdaftar, link login akan dikirim.',
      ...(isDev && { devLink: link }),
    });
  } catch (error) {
    console.error('Magic link request error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan' }, { status: 500 });
  }
}
