import { Navbar } from "@/components/layout/Navbar";
import { CookieBanner } from "@/components/shared/CookieBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default function GroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <CookieBanner />
      <ChatWidget />
    </>
  );
}
