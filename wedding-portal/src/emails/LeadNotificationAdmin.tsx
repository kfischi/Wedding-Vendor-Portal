/**
 * Email sent to admin when a new lead is submitted on the platform.
 */

interface LeadNotificationAdminProps {
  vendorName: string;
  vendorSlug: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string | null;
  leadMessage: string;
  adminUrl: string;
}

export function LeadNotificationAdmin({
  vendorName,
  vendorSlug,
  leadName,
  leadEmail,
  leadPhone,
  leadMessage,
  adminUrl,
}: LeadNotificationAdminProps) {
  const gold = "#b8935a";
  const obsidian = "#1a1619";
  const ivory = "#faf8f5";
  const stone = "#6b6460";

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ליד חדש בפלטפורמה — WeddingPro Admin</title>
      </head>
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a", fontFamily: "Georgia, serif", direction: "rtl" }}>
        <table width="100%" cellPadding={0} cellSpacing={0} style={{ background: "#0a0a0a" }}>
          <tr>
            <td align="center" style={{ padding: "40px 20px" }}>
              <table
                width="560"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  maxWidth: "560px",
                  width: "100%",
                  background: "#1a1a1a",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: `1px solid ${gold}30`,
                }}
              >
                {/* Header */}
                <tr>
                  <td style={{ padding: "24px 32px", borderBottom: `1px solid ${gold}20` }}>
                    <p style={{ margin: 0, fontSize: "22px", color: gold, fontFamily: "Palatino, serif" }}>
                      WeddingPro Admin
                    </p>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      ליד חדש התקבל בפלטפורמה
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "28px 32px" }}>
                    {/* Vendor */}
                    <div style={{ marginBottom: "20px", padding: "16px", background: `${gold}10`, borderRadius: "10px", border: `1px solid ${gold}20` }}>
                      <p style={{ margin: "0 0 4px", fontSize: "11px", color: gold, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        ספק
                      </p>
                      <p style={{ margin: 0, fontSize: "16px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                        {vendorName}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.4)", direction: "ltr" }}>
                        /vendors/{vendorSlug}
                      </p>
                    </div>

                    {/* Lead */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "20px" }}>
                      {[
                        { label: "שם", value: leadName },
                        { label: "אימייל", value: leadEmail, dir: "ltr" },
                        leadPhone ? { label: "טלפון", value: leadPhone, dir: "ltr" } : null,
                      ]
                        .filter(Boolean)
                        .map((row, i) => (
                          <tr key={i}>
                            <td style={{ padding: "6px 0", fontSize: "12px", color: "rgba(255,255,255,0.4)", width: "30%", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              {row!.label}
                            </td>
                            <td style={{ padding: "6px 0 6px 12px", fontSize: "13px", color: "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.05)", direction: row!.dir as "ltr" | "rtl" | undefined }}>
                              {row!.value}
                            </td>
                          </tr>
                        ))}
                    </table>

                    {/* Message preview */}
                    <div style={{ padding: "14px", background: "rgba(255,255,255,0.04)", borderRadius: "8px", borderRight: `2px solid ${gold}40`, marginBottom: "24px" }}>
                      <p style={{ margin: 0, fontSize: "13px", color: "rgba(255,255,255,0.65)", lineHeight: 1.6 }}>
                        {leadMessage.slice(0, 200)}{leadMessage.length > 200 ? "..." : ""}
                      </p>
                    </div>

                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td align="center">
                          <a
                            href={adminUrl}
                            style={{
                              display: "inline-block",
                              padding: "12px 28px",
                              background: gold,
                              color: "#0a0a0a",
                              borderRadius: "50px",
                              fontSize: "13px",
                              fontWeight: 700,
                              textDecoration: "none",
                            }}
                          >
                            פתח את לוח הניהול
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: "16px 32px", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>
                      WeddingPro Admin Alert — אימייל אוטומטי
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
