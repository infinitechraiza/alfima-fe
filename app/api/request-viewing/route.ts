import { NextRequest, NextResponse } from 'next/server';

const nodemailer = require('nodemailer') as typeof import('nodemailer');

interface PropertyItem {
  id:    string | number;
  title: string;
  city?: string;
}

interface ViewingRequestBody {
  name:           string;
  email:          string;
  phone:          string;
  preferred_date: string;
  preferred_time: string;
  properties:     PropertyItem[];
}

// ── Email HTML builder ────────────────────────────────────────────────────────

function buildAdminHtml(data: ViewingRequestBody): string {
  const propertyRows = data.properties
    .map(
      (p, i) => `
        <tr>
          <td style="padding:6px 0;color:#999;font-size:13px;width:28px">#${i + 1}</td>
          <td style="padding:6px 12px;font-size:14px;color:#222">${p.title}</td>
          <td style="padding:6px 0;font-size:13px;color:#777">${p.city ?? '—'}</td>
        </tr>`,
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><style>
        body  { font-family:Arial,sans-serif; background:#f5f5f5; margin:0; padding:0; }
        .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08); }
        .hdr  { background:linear-gradient(135deg,#c0392b,#96281b); padding:32px; }
        .hdr h1 { color:#fff; margin:0; font-size:22px; }
        .hdr p  { color:rgba(255,255,255,.7); margin:6px 0 0; font-size:13px; }
        .body { padding:32px; }
        .row  { margin-bottom:20px; }
        .lbl  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#999; margin-bottom:4px; }
        .val  { font-size:15px; color:#222; }
        .tbl  { width:100%; border-collapse:collapse; }
        .date-box { background:#fef2f2; border:1px solid #fca5a5; border-radius:8px; padding:14px 18px; display:inline-block; }
        .date-val { font-size:18px; font-weight:700; color:#c0392b; }
        .time-val { font-size:13px; color:#999; margin-top:2px; }
        .ftr  { background:#f9f9f9; padding:20px 32px; font-size:12px; color:#aaa; border-top:1px solid #eee; }
      </style></head>
      <body>
        <div class="wrap">
          <div class="hdr">
            <h1>&#128197; New Viewing Request</h1>
            <p>Alfima Realty Inc. &mdash; ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}</p>
          </div>
          <div class="body">

            <div class="row">
              <div class="lbl">Full Name</div>
              <div class="val">${data.name}</div>
            </div>

            <div class="row">
              <div class="lbl">Email</div>
              <div class="val"><a href="mailto:${data.email}" style="color:#c0392b">${data.email}</a></div>
            </div>

            <div class="row">
              <div class="lbl">Phone</div>
              <div class="val">${data.phone}</div>
            </div>

            <div class="row">
              <div class="lbl">Preferred Schedule</div>
              <div class="date-box">
                <div class="date-val">${new Date(data.preferred_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</div>
                <div class="time-val">${data.preferred_time}</div>
              </div>
            </div>

            <div class="row">
              <div class="lbl">Properties to View (${data.properties.length})</div>
              <table class="tbl">
                ${propertyRows}
              </table>
            </div>

          </div>
          <div class="ftr">
            This email was sent automatically from alfimarealtyinc.com. Reply directly to respond to the client.
          </div>
        </div>
      </body>
    </html>
  `;
}

function buildClientHtml(data: ViewingRequestBody): string {
  const propertyList = data.properties
    .map(p => `<li style="padding:6px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151">${p.title}${p.city ? ` &mdash; ${p.city}` : ''}</li>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><style>
        body  { font-family:Arial,sans-serif; background:#f5f5f5; margin:0; padding:0; }
        .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,.08); }
        .hdr  { background:linear-gradient(135deg,#c0392b,#96281b); padding:32px; text-align:center; }
        .hdr h1 { color:#fff; margin:0; font-size:24px; }
        .hdr p  { color:rgba(255,255,255,.75); margin:8px 0 0; font-size:14px; }
        .body { padding:32px; }
        .greeting { font-size:16px; color:#111; margin-bottom:16px; }
        .info-box { background:#fef2f2; border-radius:10px; padding:20px 24px; margin-bottom:24px; }
        .info-row { display:flex; gap:12px; margin-bottom:10px; font-size:14px; }
        .info-lbl { color:#999; min-width:80px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; padding-top:2px; }
        .info-val { color:#111; font-weight:600; }
        .prop-lbl { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:#999; margin-bottom:8px; }
        ul { margin:0; padding:0; list-style:none; }
        .note { font-size:13px; color:#6b7280; line-height:1.7; margin-top:24px; }
        .ftr  { background:#f9f9f9; padding:20px 32px; font-size:12px; color:#aaa; border-top:1px solid #eee; text-align:center; }
      </style></head>
      <body>
        <div class="wrap">
          <div class="hdr">
            <h1>&#10003; Viewing Request Received</h1>
            <p>Alfima Realty Inc.</p>
          </div>
          <div class="body">
            <p class="greeting">Hi ${data.name},</p>
            <p style="font-size:14px;color:#555;line-height:1.7;margin-bottom:24px">
              Thank you for your viewing request! We've received your details and our agents will reach out within <strong>24 hours</strong> to confirm your schedule.
            </p>

            <div class="info-box">
              <div class="info-row">
                <span class="info-lbl">Date</span>
                <span class="info-val">${new Date(data.preferred_date).toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">Time</span>
                <span class="info-val">${data.preferred_time}</span>
              </div>
              <div class="info-row">
                <span class="info-lbl">Phone</span>
                <span class="info-val">${data.phone}</span>
              </div>
            </div>

            <div class="prop-lbl">Properties you selected (${data.properties.length})</div>
            <ul>${propertyList}</ul>

            <p class="note">
              If you need to reschedule or have questions, feel free to reply to this email or call us directly.
              We look forward to showing you your future home!
            </p>
          </div>
          <div class="ftr">
            &copy; ${new Date().getFullYear()} Alfima Realty Inc. &mdash; alfimarealtyinc.com
          </div>
        </div>
      </body>
    </html>
  `;
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: ViewingRequestBody = await req.json();
    const { name, email, phone, preferred_date, preferred_time, properties } = body;

    // ── Validate ──────────────────────────────────────────────────────────
    if (!name || !email || !phone || !preferred_date || !preferred_time || !properties?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' },
        { status: 422 },
      );
    }

    // ── 1. Save to Laravel DB first ───────────────────────────────────────
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { success: false, error: 'API URL not configured.' },
        { status: 500 },
      );
    }

    const dbRes = await fetch(`${apiUrl}/api/viewing-requests`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
      body: JSON.stringify({ name, email, phone, preferred_date, preferred_time, properties }),
    });

    if (!dbRes.ok) {
      const dbErr = await dbRes.json().catch(() => ({}));
      console.error('[request-viewing] DB save failed:', dbErr);
      return NextResponse.json(
        {
          success: false,
          error:   dbErr?.message ?? 'Failed to save viewing request.',
          errors:  dbErr?.errors  ?? undefined,
        },
        { status: dbRes.status },
      );
    }

    const dbData = await dbRes.json();

    // ── 2. Send emails via Nodemailer ─────────────────────────────────────
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Admin notification
    await transporter.sendMail({
      from:    `"Alfima Realty" <${process.env.SMTP_USER}>`,
      to:      process.env.ADMIN_EMAIL,
      replyTo: email,
      subject: `[Viewing Request] ${name} — ${new Date(preferred_date).toLocaleDateString('en-PH', { timeZone: 'UTC' })} at ${preferred_time}`,
      html:    buildAdminHtml(body),
    });

    // Client confirmation
    await transporter.sendMail({
      from:    `"Alfima Realty" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: 'Your Viewing Request — Alfima Realty Inc.',
      html:    buildClientHtml(body),
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Viewing request submitted and confirmation email sent.',
        data:    dbData.data,
      },
      { status: 201 },
    );

  } catch (err: unknown) {
    console.error('[request-viewing] Error:', err);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 },
    );
  }
}