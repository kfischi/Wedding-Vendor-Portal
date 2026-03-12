export const metadata = {
  title: "כניסה | WeddingPro",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-4">
      {children}
    </div>
  );
}
