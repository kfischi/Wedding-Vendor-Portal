import { CookieBanner } from "@/components/shared/CookieBanner";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
