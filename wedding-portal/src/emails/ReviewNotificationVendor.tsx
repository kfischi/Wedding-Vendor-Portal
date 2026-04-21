interface ReviewNotificationVendorProps {
  vendorName: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  dashboardUrl: string;
}

export function ReviewNotificationVendor({
  vendorName,
  authorName,
  rating,
  title,
  body,
  dashboardUrl,
}: ReviewNotificationVendorProps) {
  const gold = "#b8935a";
  const obsidian = "#1a1619";
  const ivory = "#faf8f5";
  const stone = "#6b6460";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ביקורת חדשה — WeddingPro</title>
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
                  <td style={{ background: obsidian, padding: "32px 40px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "28px", color: gold, fontFamily: "'Palatino Linotype', Palatino, serif", letterSpacing: "0.05em" }}>
                      WeddingPro
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      ביקורת חדשה התקבלה
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
                      קיבלתם ביקורת חדשה! ⭐
                    </p>

                    {/* Review card */}
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
                          <p style={{ margin: "0 0 4px", fontSize: "13px", color: stone }}>מאת:</p>
                          <p style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: obsidian }}>{authorName}</p>

                          <p style={{ margin: "0 0 4px", fontSize: "13px", color: stone }}>דירוג:</p>
                          <p style={{ margin: "0 0 16px", fontSize: "22px", color: gold, letterSpacing: "2px" }}>{stars}</p>

                          {title && (
                            <>
                              <p style={{ margin: "0 0 4px", fontSize: "13px", color: stone }}>כותרת:</p>
                              <p style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: obsidian }}>{title}</p>
                            </>
                          )}
                        </td>
                      </tr>
                    </table>

                    {/* Review body */}
                    <p style={{ margin: "0 0 8px", fontSize: "12px", color: stone, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      הביקורת
                    </p>
                    <div
                      style={{
                        background: ivory,
                        borderRadius: "10px",
                        padding: "16px 20px",
                        borderRight: `3px solid ${gold}`,
                        marginBottom: "28px",
                        fontSize: "14px",
                        lineHeight: "1.7",
                        color: obsidian,
                      }}
                    >
                      {body}
                    </div>

                    <p style={{ margin: "0 0 24px", fontSize: "13px", color: stone, lineHeight: "1.6" }}>
                      הביקורת ממתינה לאישור מנהל לפני פרסום. תוצאות האישור יפורסמו בפרופיל שלכם.
                    </p>

                    {/* CTA */}
                    <table width="100%" cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td align="center">
                          <a
                            href={dashboardUrl}
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
                  <td style={{ background: "#f5f3f0", padding: "20px 40px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: "12px", color: stone }}>
                      אימייל זה נשלח אוטומטית על ידי WeddingPro.
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
