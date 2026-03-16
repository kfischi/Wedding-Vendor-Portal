import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { escapeHtml, escapeHtmlMultiline } from "@/lib/security/sanitize";
import { RESEND_API_KEY, ADMIN_EMAIL, NEXT_PUBLIC_APP_URL } from "@/lib/env";

const contactSchema = z.object({
  name: z.string().min(2, "שם נדרש").max(100),
  email: z.string().email("אימייל לא תקין").max(255),
  subject: z.string().min(2, "נושא נדרש").max(200),
  message: z.string().min(10, "ההודעה קצרה מדי").max(5000),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "שגיאה בנתונים" },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;

  // Determine recipient — fall back to a well-known alias if ADMIN_EMAIL unset
  const hostname = new URL(NEXT_PUBLIC_APP_URL).hostname;
  const supportEmail = ADMIN_EMAIL || `support@${hostname}`;
  const fromAddress = `WeddingPro <noreply@${hostname}>`;

  // Escape all user-supplied values before HTML interpolation
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtmlMultiline(message);

  try {
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: fromAddress,
      to: supportEmail,
      replyTo: email, // raw email — Resend handles this, not inserted into HTML
      subject: `[צור קשר] ${subject}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background:#faf8f5; border-radius:12px; overflow:hidden;">
          <div style="background: linear-gradient(135deg, #1a1614 0%, #2d2420 100%); padding: 24px 28px;">
            <p style="margin:0; font-size:20px; color:#b8976a; font-weight:bold;">WeddingPro</p>
          </div>
          <div style="padding: 24px 28px; background:#ffffff;">
            <h2 style="color:#1a1614; border-bottom:2px solid #c9a84c; padding-bottom:8px; margin-top:0;">
              פנייה חדשה מהאתר
            </h2>
            <table style="width:100%; border-collapse:collapse; margin-top:16px;">
              <tr>
                <td style="padding:8px 0; color:#666; font-size:14px; width:100px;">שם:</td>
                <td style="padding:8px 0; font-weight:600;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#666; font-size:14px;">אימייל:</td>
                <td style="padding:8px 0;">
                  <a href="mailto:${safeEmail}" style="color:#b8976a;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0; color:#666; font-size:14px;">נושא:</td>
                <td style="padding:8px 0; font-weight:600;">${safeSubject}</td>
              </tr>
            </table>
            <div style="margin-top:16px; padding:16px; background:#faf9f7; border-radius:8px; border:1px solid #e8ddd0;">
              <p style="color:#666; font-size:12px; margin:0 0 8px;">הודעה:</p>
              <p style="margin:0; line-height:1.6;">${safeMessage}</p>
            </div>
          </div>
          <div style="padding:12px 28px; background:#faf8f5; text-align:center; font-size:11px; color:#9e8e86;">
            WeddingPro — פלטפורמת ספקי חתונות בישראל
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json(
      { error: "שגיאה בשליחה, נסו שוב" },
      { status: 500 }
    );
  }
}
