/**
 * Email sent to vendor when a new lead is submitted via their profile.
 * Used with Resend: resend.emails.send({ react: <LeadNotificationVendor ... /> })
 */

interface LeadNotificationVendorProps {
  vendorName: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  leadMessage: string;
  eventDate?: string | null;
  guestCount?: number | null;
  budget?: string | null;
  profileUrl: string;
}

export function LeadNotificationVendor({
  vendorName,
  leadName,
  leadEmail,
  leadPhone,
  leadMessage,
  eventDate,
  guestCount,
  budget,
  profileUrl,
}: LeadNotificationVendorProps) {
  const gold = "#b8935a";
  const obsidian = "#1a1619";
  const ivory = "#faf8f5";
  const stone = "#6b6460";

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>פנייה חדשה — WeddingPro</title>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: ivory,
          fontFamily: "Georgia, 'Times New Roman', serif",
          direction: "rtl",
          color: obsidian,
        }}
      >
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: ivory }}>
          <tr>
            <td align="center" style={{ padding: "40px 20px" }}>
              <table
                width="600"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  maxWidth: "600px",
                  width: "100%",
                  background: "#ffffff",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                }}
              >
                {/* Header */}
                <tr>
                  <td
                    style={{
                      background: obsidian,
                      padding: "32px 40px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "28px",
                        color: gold,
                        fontFamily: "'Palatino Linotype', Palatino, serif",
                        letterSpacing: "0.05em",
                      }}
                    >
                      WeddingPro
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: "13px",
                        color: "rgba(255,255,255,0.5)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      פנייה חדשה התקבלה
                    </p>
                  </td>
                </tr>

                {/* Gold divider */}
                <tr>
                  <td style={{ height: "3px", background: `linear-gradient(to left, transparent, ${gold}, transparent)` }} />
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: "40px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "14px", color: stone }}>
                      שלום {vendorName},
                    </p>
                    <p style={{ margin: "0 0 28px", fontSize: "22px", color: obsidian, fontWeight: 700 }}>
                      קיבלתם פנייה חדשה! 🎉
                    </p>

                    {/* Lead details card */}
                    <table
                      width="100%"
                      cellPadding={0}
                      cellSpacing={0}
                      style={{
                        background: ivory,
                        borderRadius: "12px",
                        border: `1px solid ${gold}30`,
                        marginBottom: "24px",
                      }}
                    >
                      <tr>
                        <td style={{ padding: "24px" }}>
                          <table width="100%" cellPadding={0} cellSpacing={0}>
                            {[
                              { label: "שם הפונה", value: leadName },
                              { label: "אימייל", value: leadEmail, dir: "ltr" },
                              leadPhone ? { label: "טלפון", value: leadPhone, dir: "ltr" } : null,
                              eventDate ? { label: "תאריך אירוע", value: eventDate } : null,
                              guestCount ? { label: "מספר אורחים", value: String(guestCount) } : null,
                              budget ? { label: "תקציב", value: budget } : null,
                            ]
                              .filter(Boolean)
                              .map((row, i) => (
                                <tr key={i}>
                                  <td
                                    style={{
                                      padding: "8px 0",
                                      fontSize: "13px",
                                      color: stone,
                                      width: "35%",
                                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                                      verticalAlign: "top",
                                    }}
                                  >
                                    {row!.label}:
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 0 8px 16px",
                                      fontSize: "13px",
                                      color: obsidian,
                                      fontWeight: 600,
                                      borderBottom: "1px solid rgba(0,0,0,0.05)",
                                      direction: row!.dir as "ltr" | "rtl" | undefined,
                                    }}
                                  >
                                    {row!.value}
                                  </td>
                                </tr>
                              ))}
                          </table>
                        </td>
                      </tr>
                    </table>

                    {/* Message */}
                    <p
                      style={{
                        margin: "0 0 8px",
                        fontSize: "12px",
                        color: stone,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      הודעה
                    </p>
                    <div
                      style={{
                        background: ivory,
                        borderRadius: "10px",
                        padding: "16px 20px",
                        borderRight: `3px solid ${gold}`,
                        marginBottom: "32px",
                        fontSize: "14px",
                        lineHeight: "1.7",
                        color: obsidian,
                      }}
                    >
                      {leadMessage}
                    </div>

                    {/* CTA */}
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td align="center">
                          <a
                            href={profileUrl}
                            style={{
                              display: "inline-block",
                              padding: "14px 32px",
                              background: gold,
                              color: "#ffffff",
                              borderRadius: "50px",
                              fontSize: "14px",
                              fontWeight: 700,
                              textDecoration: "none",
                              letterSpacing: "0.03em",
                            }}
                          >
                            כנסו לדאשבורד
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td
                    style={{
                      background: "#f5f3f0",
                      padding: "20px 40px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "12px", color: stone }}>
                      אימייל זה נשלח אוטומטית על ידי WeddingPro. לבטל הרשמה,{" "}
                      <a href={profileUrl} style={{ color: gold }}>
                        כנסו להגדרות
                      </a>
                      .
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}
