/**
 * Welcome email sent to vendor when their account is approved.
 */

interface WelcomeVendorProps {
  vendorName: string;
  businessName: string;
  profileUrl: string;
  dashboardUrl: string;
  plan: "free" | "standard" | "premium";
}

export function WelcomeVendor({
  vendorName,
  businessName,
  profileUrl,
  dashboardUrl,
  plan,
}: WelcomeVendorProps) {
  const gold = "#b8935a";
  const obsidian = "#1a1619";
  const ivory = "#faf8f5";
  const stone = "#6b6460";

  const planLabel =
    plan === "premium" ? "פרמיום" : plan === "standard" ? "סטנדרט" : "חינמי";

  const steps = [
    { num: "01", title: "עדכנו את פרופילכם", desc: "הוסיפו תיאור, תמונות, חבילות מחיר ופרטי קשר" },
    { num: "02", title: "הציגו את העבודות שלכם", desc: "העלו תמונות לגלריה — כמה שיותר, כך תקבלו יותר לידים" },
    { num: "03", title: "קבלו לידים", desc: "לקוחות פוטנציאליים יפנו אליכם ישירות דרך הפרופיל" },
  ];

  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ברוכים הבאים ל-WeddingPro!</title>
      </head>
      <body style={{ margin: 0, padding: 0, background: ivory, fontFamily: "Georgia, 'Times New Roman', serif", direction: "rtl", color: obsidian }}>
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
                  borderRadius: "20px",
                  overflow: "hidden",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
                }}
              >
                {/* Hero header */}
                <tr>
                  <td style={{ background: obsidian, padding: "48px 40px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "36px", color: gold, fontFamily: "Palatino Linotype, Palatino, serif", letterSpacing: "0.05em" }}>
                      WeddingPro
                    </p>
                    <p style={{ margin: "12px 0 0", fontSize: "20px", color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                      ברוכים הבאים! 🎊
                    </p>
                    <p style={{ margin: "8px 0 0", fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                      הפרופיל שלכם אושר ועכשיו פעיל
                    </p>
                  </td>
                </tr>

                {/* Gold accent */}
                <tr>
                  <td style={{ height: "4px", background: `linear-gradient(to left, transparent, ${gold}, transparent)` }} />
                </tr>

                {/* Body */}
                <tr>
                  <td style={{ padding: "40px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "15px", color: stone }}>
                      שלום {vendorName},
                    </p>
                    <p style={{ margin: "0 0 28px", fontSize: "17px", lineHeight: 1.7, color: obsidian }}>
                      אנחנו שמחים לבשר שהפרופיל של{" "}
                      <strong style={{ color: gold }}>{businessName}</strong>{" "}
                      אושר ועלה לאוויר! עכשיו זוגות יכולים למצוא אתכם ולפנות אליכם ישירות.
                    </p>

                    {/* Plan badge */}
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "8px 20px",
                        background: `${gold}15`,
                        border: `1px solid ${gold}40`,
                        borderRadius: "50px",
                        fontSize: "13px",
                        color: gold,
                        fontWeight: 600,
                      }}>
                        פלאן {planLabel}
                      </span>
                    </div>

                    {/* Steps */}
                    <p style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: obsidian }}>
                      שלושה צעדים ראשונים:
                    </p>
                    {steps.map((s) => (
                      <div
                        key={s.num}
                        style={{
                          display: "flex",
                          gap: "16px",
                          padding: "16px",
                          background: ivory,
                          borderRadius: "12px",
                          marginBottom: "10px",
                        }}
                      >
                        <div style={{
                          flexShrink: 0,
                          width: "36px",
                          height: "36px",
                          background: `${gold}15`,
                          border: `1px solid ${gold}30`,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: 700,
                          color: gold,
                        }}>
                          {s.num}
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: obsidian }}>
                            {s.title}
                          </p>
                          <p style={{ margin: 0, fontSize: "13px", color: stone, lineHeight: 1.5 }}>
                            {s.desc}
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* CTAs */}
                    <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "32px" }}>
                      <tr>
                        <td align="center">
                          <table cellPadding={0} cellSpacing={0}>
                            <tr>
                              <td style={{ paddingLeft: "8px" }}>
                                <a
                                  href={dashboardUrl}
                                  style={{
                                    display: "inline-block",
                                    padding: "14px 28px",
                                    background: gold,
                                    color: "#ffffff",
                                    borderRadius: "50px",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    textDecoration: "none",
                                  }}
                                >
                                  עבור לדאשבורד
                                </a>
                              </td>
                              <td>
                                <a
                                  href={profileUrl}
                                  style={{
                                    display: "inline-block",
                                    padding: "14px 28px",
                                    border: `1px solid ${gold}50`,
                                    color: gold,
                                    borderRadius: "50px",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    textDecoration: "none",
                                  }}
                                >
                                  צפה בפרופיל
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{ background: "#f5f3f0", padding: "24px 40px", textAlign: "center" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "18px", color: gold, fontFamily: "Palatino, serif" }}>
                      WeddingPro
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: stone }}>
                      הפלטפורמה המובילה לספקי חתונות בישראל
                    </p>
                    <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#aaa" }}>
                      Built with ❤️ in Israel
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
