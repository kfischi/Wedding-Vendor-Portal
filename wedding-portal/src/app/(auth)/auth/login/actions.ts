"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const next = formData.get("next")?.toString() ?? "/dashboard";

  if (!email || !password) {
    return { error: "יש למלא אימייל וסיסמה" };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "אימייל או סיסמה שגויים" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "יש לאמת את כתובת האימייל תחילה" };
    }
    return { error: "שגיאת כניסה — נסה שוב" };
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
