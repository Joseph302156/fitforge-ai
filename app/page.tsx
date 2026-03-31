"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

function FitForgeLogo({ size = 36 }: { size?: number }) {
  const s = size, r = s * 0.25;
  const calX=s*0.14,calY=s*0.18,calW=s*0.72,calH=s*0.62,calR=s*0.1,headerH=s*0.18;
  const pin1X=s*0.29,pin2X=s*0.65,pinY=s*0.13,pinW=s*0.07,pinH=s*0.12,pinR=pinW/2;
  const dotR=s*0.045,dotCols=[s*0.27,s*0.42,s*0.57,s*0.73],dotRows=[s*0.56,s*0.70,s*0.84];
  const dotActive=[[0,0],[1,1],[2,2],[0,2]],dotGreen=[[2,1]];
  const plateW=s*0.13,plateH=s*0.28,plateR=s*0.055,innerW=s*0.065,innerH=s*0.2,innerR=s*0.03;
  const barY=s/2-s*0.04,barH=s*0.08,barR=barH/2,leftPlateX=s*0.08,rightPlateX=s*0.79;
  const plateTop=s/2-plateH/2,barLeft=leftPlateX+plateW,barRight=rightPlateX;
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

function Dumbbell({ size=16, color="#4f46e5" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="4" height="12" rx="1"/><rect x="18" y="6" width="4" height="12" rx="1"/>
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth="3"/>
      <line x1="6" y1="8" x2="6" y2="16" strokeWidth="1.5"/><line x1="18" y1="8" x2="18" y2="16" strokeWidth="1.5"/>
    </svg>
  );
}

// Shared phone preview content — used by both mobile and desktop panels
function PhoneContent() {
  const dayRows = [
    { badge:"MON", name:"Core strength", sub:"Completed · 38 min", style:{ bg:"#f0fdf4", border:"#bbf7d0", textColor:"#15803d", subColor:"#86efac" }, check:true },
    { badge:"TUE", name:"Rest day", sub:"", style:{ bg:"#f9fafb", border:"#f3f4f6", textColor:"#9ca3af", subColor:"" }, rest:true },
    { badge:"WED", name:"Lower body strength", sub:"Completed · 42 min", style:{ bg:"#f0fdf4", border:"#bbf7d0", textColor:"#15803d", subColor:"#86efac" }, check:true },
    { badge:"THU", name:"Pull day", sub:"Completed · 45 min", style:{ bg:"#f0fdf4", border:"#bbf7d0", textColor:"#15803d", subColor:"#86efac" }, check:true },
    { badge:"FRI", name:"Upper body strength", sub:"Today · 45 min", style:{ bg:"#eef2ff", border:"#c7d2fe", textColor:"#4338ca", subColor:"#6366f1" }, today:true },
    { badge:"SAT", name:"Full body HIIT", sub:"Tomorrow · 50 min", style:{ bg:"#f9fafb", border:"#f3f4f6", textColor:"#6b7280", subColor:"#9ca3af" }, faded:true },
    { badge:"SUN", name:"Rest day", sub:"", style:{ bg:"#f9fafb", border:"#f3f4f6", textColor:"#9ca3af", subColor:"" }, rest:true, faded:true },
  ];

  return (
    <>
      {/* Stats grid */}
      <div style={{ padding:"7px 10px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px" }}>
        <div style={{ background:"#f9fafb", borderRadius:"6px", padding:"6px" }}><p style={{ fontSize:"6px", color:"#9ca3af", margin:"0 0 1px" }}>Streak</p><p style={{ fontSize:"13px", fontWeight:500, color:"#1f2937", margin:0 }}>4</p><p style={{ fontSize:"6px", color:"#9ca3af" }}>days in a row</p></div>
        <div style={{ background:"#f9fafb", borderRadius:"6px", padding:"6px" }}><p style={{ fontSize:"6px", color:"#9ca3af", margin:"0 0 1px" }}>This week</p><p style={{ fontSize:"13px", fontWeight:500, color:"#1f2937", margin:0 }}>3<span style={{ fontSize:"8px", color:"#9ca3af" }}>/5</span></p><p style={{ fontSize:"6px", color:"#9ca3af" }}>workouts done</p></div>
        <div style={{ background:"#eef2ff", borderRadius:"6px", padding:"6px" }}><p style={{ fontSize:"6px", color:"#4338ca", margin:"0 0 1px" }}>Calories</p><p style={{ fontSize:"13px", fontWeight:500, color:"#1e1b4b", margin:0 }}>1,840</p><p style={{ fontSize:"6px", color:"#6366f1" }}>of 2,200</p></div>
        <div style={{ background:"#f0fdf4", borderRadius:"6px", padding:"6px" }}><p style={{ fontSize:"6px", color:"#15803d", margin:"0 0 1px" }}>Protein</p><p style={{ fontSize:"13px", fontWeight:500, color:"#14532d", margin:0 }}>142<span style={{ fontSize:"7px", color:"#15803d" }}>g</span></p><p style={{ fontSize:"6px", color:"#86efac" }}>of 150g</p></div>
      </div>

      {/* Full week */}
      <div style={{ padding:"0 10px 7px" }}>
        <p style={{ fontSize:"6px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 4px" }}>This week</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
          {dayRows.map(d => (
            <div key={d.badge} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"5px 7px", borderRadius:"7px", background:d.style.bg, border:`1px solid ${d.style.border}`, opacity:d.faded?0.7:1 }}>
              <div style={{ width:"22px", height:"22px", borderRadius:"5px", background:d.style.bg, border:`1px solid ${d.style.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"6px", fontWeight:700, color:d.style.textColor, flexShrink:0 }}>{d.badge}</div>
              {d.rest ? <p style={{ fontSize:"7px", color:"#9ca3af", margin:0 }}>Rest day</p> : (
                <>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:"7px", fontWeight:500, color:d.style.textColor, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</p>
                    {d.sub && <p style={{ fontSize:"6px", color:d.style.subColor, margin:"1px 0 0" }}>{d.sub}</p>}
                  </div>
                  {d.check && <div style={{ width:"12px", height:"12px", borderRadius:"50%", background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                  {d.today && <div style={{ background:"#4f46e5", borderRadius:"3px", padding:"2px 5px", fontSize:"6px", color:"white", fontWeight:500, flexShrink:0 }}>Today</div>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI Coach */}
      <div style={{ padding:"0 10px 10px" }}>
        <p style={{ fontSize:"6px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.05em", margin:"0 0 4px" }}>AI coach</p>
        <div style={{ background:"#f9fafb", borderRadius:"7px", padding:"7px" }}>
          <div style={{ display:"flex", gap:"5px", alignItems:"flex-start", marginBottom:"5px" }}>
            <div style={{ width:"14px", height:"14px", borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
            <p style={{ fontSize:"7px", color:"#374151", lineHeight:1.5, background:"#f3f4f6", padding:"4px 6px", borderRadius:"7px", borderBottomLeftRadius:"2px", margin:0 }}>4-day streak! Upper body today — finish strong this week!</p>
          </div>
          <div style={{ display:"flex", gap:"4px", background:"#f3f4f6", borderRadius:"5px", padding:"4px 6px", alignItems:"center" }}>
            <p style={{ fontSize:"7px", color:"#9ca3af", flex:1, margin:0 }}>Ask anything...</p>
            <div style={{ width:"14px", height:"14px", borderRadius:"4px", background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div>
          </div>
        </div>
      </div>
    </>
  );
}

function PhoneFrame({ width=450, height=976 }: { width?: number; height?: number }) {
  return (
    <div style={{ width:`${width}px`, height:`${height}px`, borderRadius:"32px", overflow:"hidden", border:"6px solid #0f0f1e", boxShadow:"0 0 0 2px rgba(255,255,255,0.08), 0 24px 60px rgba(0,0,0,0.4)", flexShrink:0, background:"white", display:"flex", flexDirection:"column" }}>
      {/* Status bar */}
      <div style={{ background:"#1a1a2e", height:"12px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <div style={{ width:"50px", height:"3px", borderRadius:"2px", background:"rgba(255,255,255,0.15)" }}/>
      </div>
      {/* Fixed header */}
      <div style={{ background:"#1a1a2e", padding:"8px 11px 7px", flexShrink:0 }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"7px", margin:"0 0 1px" }}>Good morning, Joseph</p>
        <p style={{ color:"white", fontSize:"11px", fontWeight:500, margin:"0 0 7px" }}>Today's overview</p>
        <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:"7px", padding:"7px 9px", display:"flex", alignItems:"center", gap:"6px" }}>
          <div style={{ width:"22px", height:"22px", borderRadius:"6px", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><Dumbbell size={10}/></div>
          <div style={{ flex:1 }}><p style={{ color:"white", fontSize:"8px", fontWeight:500, margin:0 }}>Upper body strength</p><p style={{ color:"rgba(255,255,255,0.4)", fontSize:"6px", margin:"1px 0 0" }}>Today · 45 min · 6 exercises</p></div>
          <div style={{ background:"#4f46e5", borderRadius:"4px", padding:"2px 6px", fontSize:"6px", color:"white", fontWeight:500 }}>Start →</div>
        </div>
      </div>
      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:"scroll", WebkitOverflowScrolling:"touch" as any, scrollbarWidth:"none" as any }}>
        <style>{`.phone-scroll::-webkit-scrollbar{display:none}`}</style>
        <PhoneContent/>
      </div>
      {/* Fixed tab bar */}
      <div style={{ display:"flex", borderTop:"1px solid #f3f4f6", background:"white", padding:"5px 0 7px", flexShrink:0 }}>
        {[
          { label:"Home", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, active:true },
          { label:"Workout", icon:<Dumbbell size={13} color="#9ca3af"/>, active:false },
          { label:"Calendar", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, active:false },
          { label:"Nutrition", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>, active:false },
        ].map(tab => (
          <div key={tab.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"2px" }}>
            {tab.icon}
            <span style={{ fontSize:"6px", color:tab.active?"#4f46e5":"#9ca3af", fontWeight:500 }}>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [loading, setLoading] = useState(false);

  async function handleGetStarted() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/app" });
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #1a1a2e !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.5s ease 0.1s both; }
        .fade-up-3 { animation: fadeUp 0.5s ease 0.2s both; }
        .cta-btn:hover { background: #4338ca !important; }
        .secondary-btn:hover { background: rgba(255,255,255,0.12) !important; }
        .feature-card:hover { background: rgba(255,255,255,0.07) !important; }
        .layout { display: flex; flex-direction: column; min-height: 100vh; }
        .left-panel { padding: 36px 22px 28px; display: flex; flex-direction: column; gap: 22px; }
        .right-panel { display: flex; flex-direction: column; align-items: center; padding: 32px 22px 40px; border-top: 1px solid rgba(255,255,255,0.08); }
        .cta-row { flex-direction: column; }
        .cta-btn { width: 100%; }
        .secondary-btn { width: 100%; justify-content: center; }
        @media (min-width: 900px) {
          .layout { flex-direction: row; }
          .left-panel { flex: 1; padding: 60px 48px; justify-content: center; max-width: 560px; }
          .right-panel { display: flex !important; flex-direction: column; flex: 1; background: #f3f4f6; align-items: center; justify-content: center; padding: 40px 32px; min-height: 100vh; border-top: none; }
          .cta-row { flex-direction: row; }
          .cta-btn { width: auto; }
          .secondary-btn { width: auto; }
          .desktop-hide { display: none !important; }
        }
      `}</style>

      <div className="layout">
        {/* ── Left panel ── */}
        <div className="left-panel">
          <div className="fade-up" style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <FitForgeLogo size={40}/>
            <span style={{ color:"white", fontSize:"18px", fontWeight:700, letterSpacing:"-0.3px" }}>FitForge AI</span>
          </div>
          <div className="fade-up-2" style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            <h1 style={{ color:"white", fontSize:"32px", fontWeight:700, lineHeight:1.15, letterSpacing:"-1px" }}>
              Your AI personal<br/><span style={{ color:"#6366f1" }}>trainer</span>, in your pocket
            </h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"14px", lineHeight:1.7, maxWidth:"420px" }}>
              AI-generated workout plans, smart nutrition tracking, and a personal coach that knows your goals — all for less than a cup of coffee a week.
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ display:"flex" }}>
                {["#4f46e5","#7c3aed","#0284c7","#16a34a"].map((c,i) => (
                  <div key={i} style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, border:"2px solid #1a1a2e", marginLeft:i===0?0:"-8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:"white", fontWeight:600 }}>{["J","M","A","S"][i]}</div>
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>Join hundreds already training smarter</p>
            </div>
          </div>
          <div className="fade-up-3 cta-row" style={{ display:"flex", gap:"10px" }}>
            <button className="cta-btn" onClick={handleGetStarted} disabled={loading}
              style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", background:"#4f46e5", color:"white", border:"none", borderRadius:"12px", padding:"11px 22px", fontSize:"14px", fontWeight:500, cursor:loading?"not-allowed":"pointer", transition:"background 0.2s", opacity:loading?0.8:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                {loading ? <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }}/> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>}
                {loading ? "Signing in..." : "Sign in"}
              </div>
              {!loading && <span style={{ fontSize:"11px", fontWeight:400, color:"rgba(255,255,255,0.6)" }}>New users start for $3/month</span>}
            </button>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer" className="secondary-btn"
              style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px", padding:"11px 22px", fontSize:"14px", fontWeight:500, cursor:"pointer", transition:"background 0.2s", textDecoration:"none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
              Download app
            </a>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {[
              { icon:"⚡", title:"AI workout planner", desc:"Personalized weekly plans built around your schedule and goals" },
              { icon:"🥗", title:"Nutrition tracking with AI", desc:"Describe your meal — AI calculates calories and macros instantly" },
              { icon:"💬", title:"Personal AI coach", desc:"Ask anything — form tips, meal advice, workout tutorials" },
              { icon:"📅", title:"Monthly progress calendar", desc:"See your completed workouts, streaks, and upcoming sessions" },
            ].map(f => (
              <div key={f.title} className="feature-card"
                style={{ display:"flex", alignItems:"flex-start", gap:"12px", padding:"11px 14px", borderRadius:"12px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.07)", transition:"background 0.2s" }}>
                <span style={{ fontSize:"16px", flexShrink:0, marginTop:"1px" }}>{f.icon}</span>
                <div><p style={{ color:"white", fontSize:"13px", fontWeight:500, margin:"0 0 2px" }}>{f.title}</p><p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", lineHeight:1.5 }}>{f.desc}</p></div>
              </div>
            ))}
          </div>
          <p style={{ color:"rgba(255,255,255,0.2)", fontSize:"11px" }}>
            © 2026 FitForge AI · <a href="/privacy" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Privacy policy</a> · <a href="/terms" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Terms</a>
          </p>
        </div>

        {/* ── Right panel ── */}
        <div className="right-panel">
          {/* Mobile label */}
          <div className="desktop-hide" style={{ width:"100%", maxWidth:"280px", marginBottom:"16px" }}>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:"10px", fontWeight:500, textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 4px" }}>App preview</p>
            <p style={{ color:"white", fontSize:"16px", fontWeight:500, margin:0, letterSpacing:"-0.3px" }}>See what's inside</p>
          </div>

          {/* Phone — 260×564 = exact 9:19.5 iPhone ratio */}
          <PhoneFrame width={260} height={564}/>

          {/* Mobile footer */}
          <div className="desktop-hide" style={{ marginTop:"28px", textAlign:"center" }}>
            <p style={{ color:"rgba(255,255,255,0.2)", fontSize:"11px", margin:0 }}>
              © 2026 FitForge AI · <a href="/privacy" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Privacy policy</a> · <a href="/terms" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Terms</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}