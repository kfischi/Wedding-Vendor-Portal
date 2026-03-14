export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-champagne/40" />
          <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
        </div>
        <p className="font-script text-xl text-gold/70">טוען...</p>
      </div>
    </div>
  );
}
