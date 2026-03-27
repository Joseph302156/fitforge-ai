"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

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

        /* Mobile: single column */
        .layout { display: flex; flex-direction: column; min-height: 100vh; }
        .left-panel { padding: 40px 24px 32px; display: flex; flex-direction: column; gap: 32px; }
        .right-panel { display: none; }
        .hero-title { font-size: 32px; }
        .cta-row { flex-direction: column; }
        .cta-btn { width: 100%; justify-content: center; }
        .secondary-btn { width: 100%; justify-content: center; }
        .mobile-phone { display: block; }
        .stats-strip { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        /* Desktop: two columns */
        @media (min-width: 900px) {
          .layout { flex-direction: row; }
          .left-panel { flex: 1; padding: 60px 48px; justify-content: center; max-width: 560px; }
          .right-panel { display: flex; flex: 1; background: #f3f4f6; align-items: center; justify-content: center; padding: 32px; min-height: 100vh; }
          .hero-title { font-size: 42px; }
          .cta-row { flex-direction: row; }
          .cta-btn { width: auto; }
          .secondary-btn { width: auto; }
          .mobile-phone { display: none; }
        }
      `}</style>

      <div className="layout">

        {/* ── Left panel ── */}
        <div className="left-panel">

          {/* Logo + wordmark */}
          <div className="fade-up" style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <FitForgeLogo size={40} />
            <span style={{ color:"white", fontSize:"18px", fontWeight:700, letterSpacing:"-0.3px" }}>FitForge AI</span>
          </div>

          {/* Hero */}
          <div className="fade-up-2" style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <h1 className="hero-title" style={{ color:"white", fontWeight:700, lineHeight:1.15, letterSpacing:"-1px" }}>
              Your AI personal<br/>
              <span style={{ color:"#6366f1" }}>trainer</span>, in your pocket
            </h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"15px", lineHeight:1.7, maxWidth:"440px" }}>
              AI-generated workout plans, smart nutrition tracking, and a personal coach that knows your goals — all for less than a cup of coffee a week.
            </p>

            {/* Social proof */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ display:"flex" }}>
                {["#4f46e5","#7c3aed","#0284c7","#16a34a"].map((c,i) => (
                  <div key={i} style={{ width:"28px", height:"28px", borderRadius:"50%", background:c, border:"2px solid #1a1a2e", marginLeft:i===0?0:"-8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", color:"white", fontWeight:600 }}>
                    {["J","M","A","S"][i]}
                  </div>
                ))}
              </div>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px" }}>Join hundreds of users already training smarter</p>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="fade-up-3 cta-row" style={{ display:"flex", gap:"10px" }}>
            <button className="cta-btn" onClick={handleGetStarted} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:"8px", background:"#4f46e5", color:"white", border:"none", borderRadius:"12px", padding:"13px 20px", fontSize:"14px", fontWeight:500, cursor:loading?"not-allowed":"pointer", transition:"background 0.2s", opacity:loading?0.8:1 }}>
              {loading ? (
                <div style={{ width:"16px", height:"16px", borderRadius:"50%", border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"white", animation:"spin 0.8s linear infinite" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              )}
              {loading ? "Signing in..." : "Start for $5/month →"}
            </button>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", marginTop:"6px" }}>Less than $0.17/day · Cancel anytime</p>
            <a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
              className="secondary-btn"
              style={{ display:"flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.7)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:"12px", padding:"13px 20px", fontSize:"14px", fontWeight:500, cursor:"pointer", transition:"background 0.2s", textDecoration:"none" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>
              Download app
            </a>
          </div>

          {/* Mobile phone preview — only on small screens */}
          <div className="mobile-phone">
            <MobilePreview />
          </div>

          {/* Features */}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {[
              { icon:"⚡", title:"AI workout planner", desc:"Personalized weekly plans built around your schedule, equipment, and goals" },
              { icon:"🥗", title:"Nutrition tracking with AI", desc:"Describe your meal in plain English — AI calculates calories and macros instantly" },
              { icon:"💬", title:"Personal AI coach", desc:"Ask anything — form tips, meal advice, workout tutorials, motivation" },
              { icon:"📅", title:"Monthly progress calendar", desc:"See your completed workouts, streaks, and upcoming sessions at a glance" },
            ].map(f => (
              <div key={f.title} className="feature-card"
                style={{ display:"flex", alignItems:"flex-start", gap:"12px", padding:"12px", borderRadius:"12px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.06)", transition:"background 0.2s" }}>
                <span style={{ fontSize:"18px", flexShrink:0, marginTop:"1px" }}>{f.icon}</span>
                <div>
                  <p style={{ color:"white", fontSize:"13px", fontWeight:500, margin:"0 0 3px" }}>{f.title}</p>
                  <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px", lineHeight:1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ color:"rgba(255,255,255,0.2)", fontSize:"11px" }}>
            © 2026 FitForge AI · <a href="/privacy" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Privacy policy</a> · <a href="/terms" style={{ color:"rgba(255,255,255,0.3)", textDecoration:"none" }}>Terms</a>
          </p>
        </div>

        {/* ── Right panel (desktop only) ── */}
        <div className="right-panel">
          <MobilePreview />
        </div>

      </div>
    </>
  );
}

function MobilePreview() {
  return (
    <div style={{ transform:"scale(1.6)", transformOrigin:"center center", margin:"80px 0" }}>
      <div style={{ background:"white", borderRadius:"28px", width:"280px", overflow:"hidden", border:"1px solid #e5e7eb", boxShadow:"0 20px 60px rgba(0,0,0,0.15)" }}>

        {/* App header */}
        <div style={{ background:"#1a1a2e", padding:"16px 14px 12px" }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"10px", margin:"0 0 2px" }}>Good morning, Joseph</p>
          <h3 style={{ color:"white", fontSize:"14px", fontWeight:500, margin:"0 0 10px" }}>Today's overview</h3>
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:"10px", padding:"10px", display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:"white", fontSize:"11px", fontWeight:500, margin:0 }}>Upper body strength</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"9px", margin:"1px 0 0" }}>Today · 45 min · 6 exercises</p>
            </div>
            <div style={{ background:"#4f46e5", borderRadius:"6px", padding:"4px 8px", fontSize:"9px", color:"white", fontWeight:500 }}>Start →</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding:"12px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
          <div style={{ background:"#f9fafb", borderRadius:"8px", padding:"8px" }}>
            <p style={{ fontSize:"9px", color:"#9ca3af", margin:"0 0 2px" }}>Streak</p>
            <p style={{ fontSize:"18px", fontWeight:500, color:"#1f2937", margin:0 }}>4</p>
            <p style={{ fontSize:"9px", color:"#9ca3af" }}>days in a row</p>
          </div>
          <div style={{ background:"#f9fafb", borderRadius:"8px", padding:"8px" }}>
            <p style={{ fontSize:"9px", color:"#9ca3af", margin:"0 0 2px" }}>This week</p>
            <p style={{ fontSize:"18px", fontWeight:500, color:"#1f2937", margin:0 }}>3<span style={{ fontSize:"11px", color:"#9ca3af" }}>/5</span></p>
            <p style={{ fontSize:"9px", color:"#9ca3af" }}>workouts done</p>
          </div>
          <div style={{ background:"#eef2ff", borderRadius:"8px", padding:"8px" }}>
            <p style={{ fontSize:"9px", color:"#4338ca", margin:"0 0 2px" }}>Calories</p>
            <p style={{ fontSize:"18px", fontWeight:500, color:"#1e1b4b", margin:0 }}>1,840</p>
            <p style={{ fontSize:"9px", color:"#6366f1" }}>of 2,200 today</p>
          </div>
          <div style={{ background:"#f0fdf4", borderRadius:"8px", padding:"8px" }}>
            <p style={{ fontSize:"9px", color:"#15803d", margin:"0 0 2px" }}>Protein</p>
            <p style={{ fontSize:"18px", fontWeight:500, color:"#14532d", margin:0 }}>142<span style={{ fontSize:"10px", color:"#15803d" }}>g</span></p>
            <p style={{ fontSize:"9px", color:"#86efac" }}>of 150g goal</p>
          </div>
        </div>

        {/* AI coach preview */}
        <div style={{ padding:"0 12px 12px" }}>
          <p style={{ fontSize:"9px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 6px" }}>AI coach</p>
          <div style={{ background:"#f9fafb", borderRadius:"10px", padding:"10px" }}>
            <div style={{ display:"flex", gap:"6px", alignItems:"flex-start", marginBottom:"6px" }}>
              <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <p style={{ fontSize:"10px", color:"#374151", lineHeight:1.5, background:"#f3f4f6", padding:"6px 8px", borderRadius:"10px", borderBottomLeftRadius:"2px", margin:0 }}>
                You're crushing it! 3 workouts done this week. Upper body today — let's go! 💪
              </p>
            </div>
            <div style={{ display:"flex", gap:"6px", background:"#f3f4f6", borderRadius:"8px", padding:"6px 8px", alignItems:"center" }}>
              <p style={{ fontSize:"10px", color:"#9ca3af", flex:1, margin:0 }}>Ask anything...</p>
              <div style={{ width:"22px", height:"22px", borderRadius:"6px", background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}