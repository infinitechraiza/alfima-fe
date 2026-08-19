import { NextRequest, NextResponse } from 'next/server';

// Using require avoids the need for @types/nodemailer as a prod dependency.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer') as typeof import('nodemailer');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 422 }
      );
    }

    // ── 1. Send admin notification email FIRST via Nodemailer ──────────
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Alfima Realty Contact" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `[Alfima Realty] New Contact: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body  { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
              .wrap { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,.08); }
              .hdr  { background: linear-gradient(135deg,#c0392b,#96281b); padding: 32px; }
              .hdr h1 { color: #fff; margin: 0; font-size: 22px; }
              .hdr p  { color: rgba(255,255,255,.7); margin: 6px 0 0; font-size: 13px; }
              .body { padding: 32px; }
              .row  { margin-bottom: 20px; }
              .lbl  { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #999; margin-bottom: 4px; }
              .val  { font-size: 15px; color: #222; }
              .msg  { background: #fafafa; border-left: 4px solid #c0392b; padding: 16px; border-radius: 0 8px 8px 0; font-size: 15px; color: #333; white-space: pre-wrap; }
              .ftr  { background: #f9f9f9; padding: 20px 32px; font-size: 12px; color: #aaa; border-top: 1px solid #eee; }
            </style>
          </head>
          <body>
            <div class="wrap">
              <div class="hdr">
                <h1>&#128235; New Contact Form Submission</h1>
                <p>Alfima Realty Inc. &mdash; ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
              </div>
              <div class="body">
                <div class="row">
                  <div class="lbl">Full Name</div>
                  <div class="val">${name}</div>
                </div>
                <div class="row">
                  <div class="lbl">Email</div>
                  <div class="val"><a href="mailto:${email}" style="color:#c0392b">${email}</a></div>
                </div>
                <div class="row">
                  <div class="lbl">Phone</div>
                  <div class="val">${phone || '&mdash;'}</div>
                </div>
                <div class="row">
                  <div class="lbl">Subject</div>
                  <div class="val">${subject}</div>
                </div>
                <div class="row">
                  <div class="lbl">Message</div>
                  <div class="msg">${message}</div>
                </div>
              </div>
              <div class="ftr">This email was sent automatically from alfimarealtyinc.com. Reply directly to respond to the sender.</div>
            </div>
          </body>
        </html>
      `,
    });

    // ── 2. Save to database via Laravel API ────────────────────────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: true, message: 'Email sent. No database configured.' },
        { status: 200 }
      );
    }

    const dbRes = await fetch(`${apiUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ name, email, phone, subject, message }),
    });

    if (!dbRes.ok) {
      const dbErr = await dbRes.json().catch(() => ({}));
      console.error('[contact/route] DB save failed:', dbErr);
      return NextResponse.json(
        {
          success: true,
          warning: 'Email sent but failed to save record to database.',
          dbError: dbErr?.message ?? 'Unknown DB error',
        },
        { status: 207 }
      );
    }

    const dbData = await dbRes.json();
    return NextResponse.json({ success: true, data: dbData }, { status: 200 });
  } catch (err: unknown) {
    console.error('[contact/route] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
