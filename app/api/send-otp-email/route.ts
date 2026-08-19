import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { otp, propertyTitle } = await request.json();

    // Read from server-side env (never exposed to browser)
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!otp || !propertyTitle || !adminEmail) {
      console.error("[send-otp-email] Missing:", { otp: !!otp, propertyTitle: !!propertyTitle, adminEmail: !!adminEmail });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Property Deletion OTP</h1>
        </div>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; margin: 0 0 15px 0;">
            A request has been made to delete the property <strong>"${propertyTitle}"</strong>.
          </p>
          <p style="color: #666; font-size: 14px; margin: 0 0 20px 0;">
            Use the following OTP to confirm deletion:
          </p>
          <div style="background: white; border: 2px dashed #667eea; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">OTP Code</p>
            <p style="margin: 0; font-size: 48px; font-weight: bold; letter-spacing: 5px; color: #667eea; font-family: 'Courier New', monospace;">
              ${otp}
            </p>
          </div>
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
            <p style="margin: 0; color: #856404; font-size: 13px;">
              ⏱️ <strong>This OTP will expire in 10 minutes.</strong>
            </p>
          </div>
          <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Admin" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `Property Deletion OTP - ${propertyTitle}`,
      html: emailHtml,
    });

    return NextResponse.json({ message: "OTP email sent successfully" });

  } catch (error) {
    console.error("[send-otp-email] Error:", error);
    return NextResponse.json(
      { message: "OTP email could not be sent, but verification is still active" },
      { status: 200 }
    );
  }
}