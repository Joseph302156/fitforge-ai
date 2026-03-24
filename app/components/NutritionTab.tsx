"use client";

export default function NutritionTab() {
  return (
    <>
      <div className="px-5 py-6" style={{ background: "#1a1a2e" }}>
        <h1 className="text-white text-lg font-medium">Nutrition tracker</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Track your daily meals and macros
        </p>
      </div>
      <div className="p-5 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Coming soon</p>
        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
          Log your meals, track calories, and see your weekly nutrition averages here.
        </p>
      </div>
    </>
  );
}