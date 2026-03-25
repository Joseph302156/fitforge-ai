"use client";

export default function CalendarTab({ workoutLog }) {
  return (
    <>
      <div className="px-5 py-6" style={{ background: "#1a1a2e" }}>
        <h1 className="text-white text-lg font-medium">Monthly calendar</h1>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
          Your workout history this month
        </p>
      </div>
      <div className="p-5 flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-700 mb-1">Coming soon</p>
        <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
          Your monthly workout calendar is being built. Complete a workout to start tracking!
        </p>
        {Object.keys(workoutLog).length > 0 && (
          <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-xs text-green-600 font-medium">
            {Object.keys(workoutLog).length} workout{Object.keys(workoutLog).length > 1 ? "s" : ""} logged so far!
          </div>
        )}
      </div>
    </>
  );
}