"use client";

export default function NutritionTab() {
  return (
    <>
      <div style={{ background: "#1a1a2e", padding: "20px" }}>
        <h1 style={{ color: "white", fontSize: "18px", fontWeight: 500, margin: 0 }}>Nutrition tracker</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "4px 0 0" }}>
          Track your daily meals and macros
        </p>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/>
            <line x1="10" y1="1" x2="10" y2="4"/>
            <line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
        </div>
        <p style={{ fontSize: "14px", fontWeight: 500, color: "#374151", margin: "0 0 6px" }}>Coming soon</p>
        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6, maxWidth: "200px", margin: 0 }}>
          Log your meals, track calories, and see your weekly nutrition averages here.
        </p>
      </div>
    </>
  );
}