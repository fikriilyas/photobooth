import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMagicLink(email: string, link: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Login Photo Booth Wedding</h2>
      <p>Klik tombol di bawah untuk login:</p>
      <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Login Sekarang
      </a>
      <p style="color: #666; font-size: 14px;">Link ini berlaku selama 5 menit. Jika Anda tidak meminta link ini, abaikan email ini.</p>
    </div>
  `;

  const text = `Login Photo Booth Wedding\n\nKlik link berikut untuk login:\n${link}\n\nLink ini berlaku selama 5 menit.`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@photobooth.app',
    to: email,
    subject: 'Link Login Photo Booth Wedding',
    html,
    text,
  });
}

export async function sendAdminInvite(email: string, link: string, eventName: string): Promise<void> {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Undangan Admin</h2>
      <p>Anda diundang sebagai admin untuk event <strong>${eventName}</strong>.</p>
      <p>Klik tombol di bawah untuk menerima undangan:</p>
      <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Terima Undangan
      </a>
      <p style="color: #666; font-size: 14px;">Link ini berlaku selama 5 menit. Jika Anda tidak mengharapkan undangan ini, abaikan email ini.</p>
    </div>
  `;

  const text = `Undangan Admin\n\nAnda diundang sebagai admin untuk event ${eventName}.\n\nKlik link berikut untuk menerima:\n${link}\n\nLink ini berlaku selama 5 menit.`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@photobooth.app',
    to: email,
    subject: `Undangan Admin - ${eventName}`,
    html,
    text,
  });
}
