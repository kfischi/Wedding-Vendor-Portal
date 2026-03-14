import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };

  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "כל השדות חובה" }, { status: 400 });
  }

  if (message.length < 10) {
    return NextResponse.json({ error: "ההודעה קצרה מדי" }, { status: 400 });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "WeddingPro <noreply@weddingpro.co.il>",
      to: "support@weddingpro.co.il",
      replyTo: email,
      subject: `[צור קשר] ${subject}`,
      html: `
        <div dir="rtl" style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1614; border-bottom: 2px solid #c9a84c; padding-bottom: 8px;">פנייה חדשה מהאתר</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px; width: 100px;">שם:</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">אימייל:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666; font-size: 14px;">נושא:</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
          </table>
          <div style="margin-top: 16px; padding: 16px; background: #faf9f7; border-radius: 8px; border: 1px solid #e8ddd0;">
            <p style="color: #666; font-size: 12px; margin: 0 0 8px;">הודעה:</p>
            <p style="margin: 0; line-height: 1.6;">${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "שגיאה בשליחה, נסו שוב" }, { status: 500 });
  }
}
