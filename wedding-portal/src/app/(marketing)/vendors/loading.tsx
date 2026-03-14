export default function VendorsLoading() {
  return (
    <div dir="rtl" className="min-h-screen bg-[#faf9f7]">
      {/* Header skeleton */}
      <div className="bg-white border-b border-champagne/60 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-3">
          <div className="h-6 w-32 bg-champagne/60 rounded-full mx-auto animate-pulse" />
          <div className="h-12 w-80 bg-champagne/40 rounded-xl mx-auto animate-pulse" />
          <div className="h-5 w-64 bg-champagne/30 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Filters skeleton */}
        <div className="flex gap-3">
          {[120, 96, 80, 104, 88].map((w) => (
            <div key={w} className={`h-10 w-${w} bg-champagne/40 rounded-xl animate-pulse`} style={{ width: w }} />
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-champagne/60 overflow-hidden animate-pulse">
              <div className="h-48 bg-champagne/40" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-champagne/50 rounded-lg w-3/4" />
                <div className="h-4 bg-champagne/30 rounded-lg w-1/2" />
                <div className="h-4 bg-champagne/30 rounded-lg w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
