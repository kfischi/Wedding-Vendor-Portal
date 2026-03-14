import { Navbar } from "@/components/layout/Navbar";
import { CookieBanner } from "@/components/shared/CookieBanner";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <CookieBanner />
    </>
  );
}
