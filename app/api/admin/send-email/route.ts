import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject, and body are required.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Alfima Realty Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body,
    });

    return NextResponse.json({ success: true, message: 'Email sent successfully.' });
  } catch (error: any) {
    console.error('[send-email] Exception:', error?.message);
    return NextResponse.json({ error: error?.message ?? 'Failed to send email.' }, { status: 500 });
  }
}