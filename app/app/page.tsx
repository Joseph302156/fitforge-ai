"use client";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import dynamic from "next/dynamic";

const HomeTab      = dynamic(() => import("../components/HomeTab"),      { ssr: false });
const WorkoutTab   = dynamic(() => import("../components/WorkoutTab"),   { ssr: false });
const CalendarTab  = dynamic(() => import("../components/CalendarTab"),  { ssr: false });
const NutritionTab = dynamic(() => import("../components/NutritionTab"), { ssr: false });

function FitForgeLogo({ size = 36 }: { size?: number }) {
  const s = size, r = s * 0.25;
  const calX=s*0.14, calY=s*0.18, calW=s*0.72, calH=s*0.62, calR=s*0.1, headerH=s*0.18;
  const pin1X=s*0.29, pin2X=s*0.65, pinY=s*0.13, pinW=s*0.07, pinH=s*0.12, pinR=pinW/2;
  const dotR=s*0.045;
  const dotCols=[s*0.27,s*0.42,s*0.57,s*0.73];
  const dotRows=[s*0.56,s*0.70,s*0.84];
  const dotActive=[[0,0],[1,1],[2,2],[0,2]];
  const dotGreen=[[2,1]];
  const plateW=s*0.13, plateH=s*0.28, plateR=s*0.055;
  const innerW=s*0.065, innerH=s*0.2, innerR=s*0.03;
  const barY=s/2-s*0.04, barH=s*0.08, barR=barH/2;
  const leftPlateX=s*0.08, rightPlateX=s*0.79;
  const plateTop=s/2-plateH/2;
  const barLeft=leftPlateX+plateW, barRight=rightPlateX;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none">
      <rect x="0" y="0" width={s} height={s} rx={r} fill="white" stroke="#e5e7eb" strokeWidth={s*0.014}/>
      <rect x={calX} y={calY} width={calW} height={calH} rx={calR} fill="#f9fafb" stroke="#e5e7eb" strokeWidth={s*0.012}/>
      <rect x={calX} y={calY} width={calW} height={headerH} rx={calR} fill="#eef2ff"/>
      <rect x={calX} y={calY+headerH*0.6} width={calW} height={headerH*0.4} fill="#eef2ff"/>
      <rect x={pin1X} y={pinY} width={pinW} height={pinH} rx={pinR} fill="#4f46e5"/>
      <rect x={pin2X} y={pinY} width={pinW} height={pinH} rx={pinR} fill="#4f46e5"/>
      {dotRows.map((ry,ri)=>dotCols.map((rx2,ci)=>{
        const isActive=dotActive.some(([c,r2])=>c===ci&&r2===ri);
        const isGreen=dotGreen.some(([c,r2])=>c===ci&&r2===ri);
        return <circle key={`${ri}-${ci}`} cx={rx2} cy={ry} r={dotR} fill={isGreen?"#22c55e":isActive?"#4f46e5":"#c7d2fe"}/>;
      }))}
      <rect x={leftPlateX} y={plateTop} width={plateW} height={plateH} rx={plateR} fill="#4f46e5"/>
      <rect x={leftPlateX+s*0.03} y={plateTop+s*0.04} width={innerW} height={innerH} rx={innerR} fill="#6366f1"/>
      <rect x={barLeft} y={barY} width={barRight-barLeft} height={barH} rx={barR} fill="#4f46e5"/>
      <rect x={rightPlateX} y={plateTop} width={plateW} height={plateH} rx={plateR} fill="#4f46e5"/>
      <rect x={rightPlateX+s*0.03} y={plateTop+s*0.04} width={innerW} height={innerH} rx={innerR} fill="#6366f1"/>
    </svg>
  );
}

const TABS = [
  { id:"home", label:"Home", icon:(a:boolean)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?"#4f46e5":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id:"workout", label:"Workout", icon:(a:boolean)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?"#4f46e5":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
  { id:"calendar", label:"Calendar", icon:(a:boolean)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?"#4f46e5":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { id:"nutrition", label:"Nutrition", icon:(a:boolean)=><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?"#4f46e5":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg> },
];

export default function AppPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("home");
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

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      <main style={{ minHeight:"100vh", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }}>
        <div style={{ width:"100%", maxWidth:"384px" }}>
          <div style={{ background:"white", borderRadius:"24px", overflow:"hidden", boxShadow:"0 1px 3px rgba(0,0,0,0.08)", border:"1px solid #f3f4f6" }}>

            {/* App header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 12px", borderBottom:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <FitForgeLogo size={36} />
                <div>
                  <p style={{ fontSize:"14px", fontWeight:700, color:"#1a1a2e", margin:0, letterSpacing:"-0.3px" }}>FitForge AI</p>
                  <p style={{ fontSize:"10px", color:"#9ca3af", margin:0 }}>Your personal trainer</p>
                </div>
              </div>
              <div style={{ position:"relative" }}>
                <button onClick={() => setShowUserMenu(v => !v)}
                  style={{ width:"34px", height:"34px", borderRadius:"50%", border:"2px solid #f3f4f6", cursor:"pointer", padding:0, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </button>
                {showUserMenu && (
                  <div style={{ position:"absolute", top:"42px", right:0, background:"white", borderRadius:"14px", border:"1px solid #f3f4f6", boxShadow:"0 4px 20px rgba(0,0,0,0.1)", padding:"8px", zIndex:100, minWidth:"180px" }}>
                    <div style={{ padding:"8px 10px 10px", borderBottom:"1px solid #f3f4f6", marginBottom:"6px" }}>
                      <p style={{ fontSize:"12px", fontWeight:500, color:"#1f2937", margin:0 }}>{session?.user?.name}</p>
                      <p style={{ fontSize:"11px", color:"#9ca3af", margin:"2px 0 0" }}>{session?.user?.email}</p>
                    </div>
                    <button onClick={() => { setShowUserMenu(false); signOut({ callbackUrl:"/" }); }}
                      style={{ width:"100%", display:"flex", alignItems:"center", gap:"8px", padding:"8px 10px", borderRadius:"8px", border:"none", background:"transparent", cursor:"pointer", fontSize:"12px", color:"#dc2626" }}
                      onMouseEnter={e => (e.currentTarget.style.background="#fef2f2")}
                      onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display:"flex", borderBottom:"1px solid #f3f4f6" }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  style={{ flex:1, background:"none", border:"none", padding:"10px 4px 8px", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"4px", position:"relative" }}>
                  {tab.icon(activeTab === tab.id)}
                  <span style={{ fontSize:"9px", fontWeight:500, color:activeTab===tab.id?"#4f46e5":"#9ca3af" }}>{tab.label}</span>
                  <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", height:"2px", borderRadius:"2px", background:"#4f46e5", width:activeTab===tab.id?"20px":"0px", transition:"width 0.2s" }}/>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === "home"      && <HomeTab onStartWorkout={() => setActiveTab("workout")} />}
              {activeTab === "workout"   && <WorkoutTab onWorkoutComplete={logCompletedWorkout} />}
              {activeTab === "calendar"  && <CalendarTab workoutLog={workoutLog} />}
              {activeTab === "nutrition" && <NutritionTab />}
            </div>

          </div>
        </div>
      </main>

      {showUserMenu && (
        <div style={{ position:"fixed", inset:0, zIndex:99 }} onClick={() => setShowUserMenu(false)} />
      )}
    </>
  );
}