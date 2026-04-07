"use server";

import { createClient } from "@/lib/supabase/server";
import { NEXT_PUBLIC_APP_URL } from "@/lib/env";

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = formData.get("email")?.toString().trim() ?? "";

  if (!email) return { error: "יש להזין כתובת אימייל" };

  const supabase = await createClient();

  const baseUrl = NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    console.error("[forgot-password]", error);
    return { error: "שגיאה בשליחת האימייל — נסה שוב" };
  }

  // Always return success (don't reveal if email exists)
  return { success: true };
}
