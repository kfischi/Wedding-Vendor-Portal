export default function VendorPageLoading() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#faf9f7] animate-pulse">
      {/* Hero */}
      <div className="h-[55vh] bg-champagne/40" />

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-champagne/60 p-6 space-y-4">
              <div className="h-8 bg-champagne/50 rounded-xl w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-champagne/30 rounded-lg" />
                <div className="h-4 bg-champagne/30 rounded-lg w-5/6" />
                <div className="h-4 bg-champagne/30 rounded-lg w-4/5" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-champagne/60 p-6">
              <div className="h-6 bg-champagne/40 rounded-lg w-32 mb-4" />
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-champagne/40 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-champagne/60 p-5 space-y-3">
              <div className="h-10 bg-champagne/50 rounded-xl" />
              <div className="h-10 bg-champagne/30 rounded-xl" />
              <div className="h-4 bg-champagne/20 rounded-lg w-2/3 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
