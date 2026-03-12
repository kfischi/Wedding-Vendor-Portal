import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db/db";
import { vendors } from "@/lib/db/schema";
import { ContentEditor } from "@/components/dashboard/ContentEditor";

export const metadata = { title: "עריכת תוכן | WeddingPro" };

export default async function ContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  let vendor = null;
  try {
    const rows = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, user.id))
      .limit(1);
    vendor = rows[0] ?? null;
  } catch {
    // DB not connected yet
  }

  if (!vendor) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-stone">פרופיל הספק לא נמצא. אנא צור קשר עם התמיכה.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="font-script text-xl text-gold">עריכה</p>
        <h1 className="font-display text-4xl text-obsidian">תוכן הפרופיל</h1>
      </div>
      <ContentEditor vendor={vendor} />
    </div>
  );
}
