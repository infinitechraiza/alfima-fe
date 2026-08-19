import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer') as typeof import('nodemailer');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 422 }
      );
    }

    // ── 1. Save subscriber to DB via Laravel ───────────────────────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (apiUrl) {
      const dbRes  = await fetch(`${apiUrl}/api/newsletter/subscribe`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const dbData = await dbRes.json().catch(() => ({}));

      if (!dbRes.ok) {
        if (dbRes.status === 409) {
          return NextResponse.json(
            { success: false, error: 'This email is already subscribed.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, error: dbData?.message ?? 'Failed to save subscription.' },
          { status: dbRes.status }
        );
      }
    }

    // ── 2. Send welcome email to subscriber ────────────────────────────
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://demo-alfima.vercel.app/';

    await transporter.sendMail({
      from:    `"Alfima Realty Inc." <${process.env.SMTP_USER}>`,
      to:      email,
      subject: `Welcome to Alfima Realty — You're on the list! 🏡`,
      html: `
        <!DOCTYPE html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
            <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
              <div style="background:linear-gradient(135deg,#c0392b,#96281b);padding:36px 32px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:900;">You're Subscribed! 🎉</h1>
                <p style="color:rgba(255,255,255,.75);margin:8px 0 0;font-size:14px;">Alfima Realty Inc. — Property Newsletter</p>
              </div>
              <div style="padding:32px;">
                <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px;">
                  Hi there! Thank you for subscribing to the <strong>Alfima Realty</strong> newsletter.
                </p>
                <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px;">
                  You'll be the first to know whenever we post new properties, exclusive listings,
                  and real estate tips.
                </p>
                <a href="${siteUrl}/properties"
                   style="display:inline-block;background:linear-gradient(135deg,#c0392b,#96281b);color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:8px;">
                  Browse Properties →
                </a>
              </div>
              <div style="background:#f9f9f9;padding:20px 32px;font-size:11px;color:#aaa;border-top:1px solid #eee;text-align:center;">
                © ${new Date().getFullYear()} Alfima Realty Inc.<br/>
                <a href="${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}" style="color:#c0392b;">Unsubscribe</a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    // ── 3. Notify admin ────────────────────────────────────────────────
    await transporter.sendMail({
      from:    `"Alfima Realty System" <${process.env.SMTP_USER}>`,
      to:      process.env.ADMIN_EMAIL,
      subject: `[Alfima Realty] New Newsletter Subscriber`,
      html: `<p style="font-family:Arial,sans-serif;font-size:15px;color:#333;">
               New subscriber: <strong>${email}</strong><br/>
               Time: ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
             </p>`,
    });

    return NextResponse.json(
      { success: true, message: 'Subscribed! Check your inbox for a welcome email.' },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('[newsletter/subscribe] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}