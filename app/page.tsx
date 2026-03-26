"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";

const WorkoutTab   = dynamic(() => import("./components/WorkoutTab"),   { ssr: false });
const CalendarTab  = dynamic(() => import("./components/CalendarTab"),  { ssr: false });
const NutritionTab = dynamic(() => import("./components/NutritionTab"), { ssr: false });

export default function Home() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("workout");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [workoutLog, setWorkoutLog] = useState<Record<string, {
    dayName: string; duration: string; exerciseCount: number; timeElapsed: number;
  }>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("fitforge_log") || "{}"); }
    catch { return {}; }
  });

  function logCompletedWorkout(dayName: string, duration: string, exerciseCount: number, timeElapsed: number) {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const updated = { ...workoutLog, [dateStr]: { dayName, duration, exerciseCount, timeElapsed } };
    setWorkoutLog(updated);
    localStorage.setItem("fitforge_log", JSON.stringify(updated));
  }

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <main style={{ minHeight:"100vh", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
        <div style={{ width:"100%", maxWidth:"384px" }}>
          <div style={{ background:"white", borderRadius:"24px", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:"1px solid #f3f4f6" }}>

            {/* Tab bar */}
            <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6", background:"white" }}>

              <button onClick={() => setActiveTab("workout")} style={{ flex:1, background:"none", border:"none", padding:"12px 4px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", position:"relative" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab==="workout" ? "#4f46e5" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span style={{ fontSize:"10px", fontWeight:500, color:activeTab==="workout" ? "#4f46e5" : "#9ca3af" }}>Workout</span>
                <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", height:"2px", borderRadius:"2px", background:"#4f46e5", width:activeTab==="workout" ? "24px" : "0px", transition:"width 0.2s" }} />
              </button>

              <button onClick={() => setActiveTab("calendar")} style={{ flex:1, background:"none", border:"none", padding:"12px 4px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", position:"relative" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab==="calendar" ? "#4f46e5" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span style={{ fontSize:"10px", fontWeight:500, color:activeTab==="calendar" ? "#4f46e5" : "#9ca3af" }}>Calendar</span>
                <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", height:"2px", borderRadius:"2px", background:"#4f46e5", width:activeTab==="calendar" ? "24px" : "0px", transition:"width 0.2s" }} />
              </button>

              <button onClick={() => setActiveTab("nutrition")} style={{ flex:1, background:"none", border:"none", padding:"12px 4px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", position:"relative" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeTab==="nutrition" ? "#4f46e5" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                </svg>
                <span style={{ fontSize:"10px", fontWeight:500, color:activeTab==="nutrition" ? "#4f46e5" : "#9ca3af" }}>Nutrition</span>
                <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", height:"2px", borderRadius:"2px", background:"#4f46e5", width:activeTab==="nutrition" ? "24px" : "0px", transition:"width 0.2s" }} />
              </button>

              {/* User avatar */}
              <div style={{ display:"flex", alignItems:"center", padding:"0 12px", position:"relative" }}>
                <button
                  onClick={() => setShowUserMenu(v => !v)}
                  style={{ width:"30px", height:"30px", borderRadius:"50%", border:"none", cursor:"pointer", overflow:"hidden", padding:0, flexShrink:0 }}>
                  {session?.user?.image ? (
                    <img src={session.user.image} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:"#1a1a2e", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:600, color:"white" }}>
                      {userInitials}
                    </div>
                  )}
                </button>

                {/* User dropdown menu */}
                {showUserMenu && (
                  <div style={{ position:"absolute", top:"48px", right:"8px", background:"white", borderRadius:"14px", border:"1px solid #f3f4f6", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", padding:"8px", zIndex:100, minWidth:"180px", animation:"fadeUp 0.15s ease forwards" }}>
                    <div style={{ padding:"8px 10px 10px", borderBottom:"1px solid #f3f4f6", marginBottom:"6px" }}>
                      <p style={{ fontSize:"12px", fontWeight:500, color:"#1f2937", margin:0 }}>{session?.user?.name}</p>
                      <p style={{ fontSize:"11px", color:"#9ca3af", margin:"2px 0 0" }}>{session?.user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: "/signin" }); }}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", fontSize:"12px", color:"#dc2626" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab content */}
            <div>
              {activeTab === "workout"   && <WorkoutTab onWorkoutComplete={logCompletedWorkout} />}
              {activeTab === "calendar"  && <CalendarTab workoutLog={workoutLog} />}
              {activeTab === "nutrition" && <NutritionTab />}
            </div>

          </div>
        </div>
      </main>

      {/* Close menu on outside click */}
      {showUserMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:99 }} onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
}