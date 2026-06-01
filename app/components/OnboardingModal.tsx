"use client";
import { useState } from "react";
import { UserProfile } from "@/lib/supabase";

const GENDERS = ["Male", "Female", "Other"];
const BUILDS = ["Slim / Lean", "Average", "Athletic", "Heavy / Stocky"];
const GOALS = [
  { value: "Lose fat and get lean",       emoji: "🔥", desc: "Burn fat, reveal a leaner body" },
  { value: "Build muscle and get bigger", emoji: "💪", desc: "Gain strength and muscle mass" },
  { value: "Athletic performance",        emoji: "⚡", desc: "Speed, power, endurance, agility" },
  { value: "Stay healthy and active",     emoji: "🌿", desc: "General fitness and wellbeing" },
];
const PHYSIQUES = [
  { value: "Lean and toned",          desc: "Defined without bulk" },
  { value: "Muscular and strong",     desc: "Size, strength, and power" },
  { value: "Athletic and functional", desc: "Perform at your best" },
  { value: "Healthy and balanced",    desc: "Feel great, look great" },
];
const AI_HINTS = [
  "Bad knee, avoid high impact",
  "I play basketball on weekends",
  "I want bigger arms",
  "No gym — home workouts only",
  "30 min max per session",
  "Lower back pain",
  "Recovering from shoulder surgery",
  "Night shift worker",
];

export default function OnboardingModal({ onComplete }: { onComplete: (p: UserProfile) => void }) {
  const [step, setStep] = useState(1);

  // Step 1 state
  const [gender, setGender] = useState("");
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(8);
  const [weightLbs, setWeightLbs] = useState<number | "">(160);
  const [bodyFatPct, setBodyFatPct] = useState<number | "">("");
  const [build, setBuild] = useState("");

  // Step 2 state
  const [fitnessGoal, setFitnessGoal] = useState("");
  const [targetPhysique, setTargetPhysique] = useState("");

  // Step 3 state
  const [aiNotes, setAiNotes] = useState("");

  const can1 = !!(gender && weightLbs && build);
  const can2 = !!(fitnessGoal && targetPhysique);

  function submit() {
    onComplete({
      gender,
      heightFt,
      heightIn,
      weightLbs: Number(weightLbs) || 160,
      bodyFatPct: bodyFatPct !== "" ? Number(bodyFatPct) : null,
      build,
      fitnessGoal,
      targetPhysique,
      aiNotes,
    });
  }

  const stepLabels = ["About You", "Your Goals", "Your Coach"];

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(10,10,20,0.75)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
      <div style={{width:"100%",maxWidth:"420px",background:"white",borderRadius:"24px",overflow:"hidden",maxHeight:"92vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 60px rgba(0,0,0,0.3)",animation:"slideUp 0.35s ease forwards"}}>

        {/* ── Header ── */}
        <div style={{background:"#1a1a2e",padding:"24px 24px 20px",flexShrink:0}}>
          {/* Progress bar */}
          <div style={{display:"flex",gap:"6px",marginBottom:"18px"}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{flex:1,height:"3px",borderRadius:"99px",background:i<=step?"#4f46e5":"rgba(255,255,255,0.15)",transition:"background 0.3s"}}/>
            ))}
          </div>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase",margin:"0 0 6px"}}>
            Step {step} of 3 · {stepLabels[step-1]}
          </p>
          <h2 style={{color:"white",fontSize:"20px",fontWeight:600,margin:"0 0 5px"}}>
            {step===1 && "Let's get to know you 👋"}
            {step===2 && "What are you training for? 🎯"}
            {step===3 && "Tell your AI coach 💬"}
          </h2>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:0,lineHeight:1.5}}>
            {step===1 && "Your stats help build smarter, more accurate workouts."}
            {step===2 && "Your goals shape every exercise, rep, and set."}
            {step===3 && "The more context you give, the better your plan gets."}
          </p>
        </div>

        {/* ── Content ── */}
        <div style={{flex:1,overflowY:"auto",padding:"20px 24px"}}>

          {/* Step 1 — Stats */}
          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

              {/* Gender */}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Gender</label>
                <div style={{display:"flex",gap:"8px"}}>
                  {GENDERS.map(g=>(
                    <button key={g} onClick={()=>setGender(g)} style={{flex:1,padding:"10px 0",borderRadius:"10px",border:`1.5px solid ${gender===g?"#4f46e5":"#e5e7eb"}`,background:gender===g?"#eef2ff":"#f9fafb",color:gender===g?"#4338ca":"#6b7280",fontSize:"13px",fontWeight:gender===g?500:400,cursor:"pointer",transition:"all 0.15s"}}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Height</label>
                <div style={{display:"flex",gap:"8px"}}>
                  <select value={heightFt} onChange={e=>setHeightFt(Number(e.target.value))} style={{flex:1,padding:"10px 12px",borderRadius:"10px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"13px",color:"#374151",outline:"none",cursor:"pointer",appearance:"auto"}}>
                    {[4,5,6,7].map(n=><option key={n} value={n}>{n} ft</option>)}
                  </select>
                  <select value={heightIn} onChange={e=>setHeightIn(Number(e.target.value))} style={{flex:1,padding:"10px 12px",borderRadius:"10px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"13px",color:"#374151",outline:"none",cursor:"pointer",appearance:"auto"}}>
                    {Array.from({length:12},(_,i)=>i).map(n=><option key={n} value={n}>{n} in</option>)}
                  </select>
                </div>
              </div>

              {/* Weight */}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Weight (lbs)</label>
                <input type="number" inputMode="numeric" value={weightLbs} onChange={e=>setWeightLbs(e.target.value===""?"":Number(e.target.value))} placeholder="e.g. 165"
                  style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"13px",color:"#374151",outline:"none",boxSizing:"border-box"}}/>
              </div>

              {/* Build */}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Current build</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {BUILDS.map(b=>(
                    <button key={b} onClick={()=>setBuild(b)} style={{padding:"10px 12px",borderRadius:"10px",border:`1.5px solid ${build===b?"#4f46e5":"#e5e7eb"}`,background:build===b?"#eef2ff":"#f9fafb",color:build===b?"#4338ca":"#6b7280",fontSize:"12px",fontWeight:build===b?500:400,cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body fat — optional */}
              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"4px"}}>
                  Body fat %{"  "}<span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"#9ca3af",fontSize:"11px"}}>(optional — rough guess is fine)</span>
                </label>
                <input type="number" inputMode="decimal" value={bodyFatPct} onChange={e=>setBodyFatPct(e.target.value===""?"":Number(e.target.value))} placeholder="e.g. 18"
                  style={{width:"100%",padding:"10px 12px",borderRadius:"10px",border:"1.5px solid #e5e7eb",background:"#f9fafb",fontSize:"13px",color:"#374151",outline:"none",boxSizing:"border-box",marginTop:"6px"}}/>
              </div>
            </div>
          )}

          {/* Step 2 — Goals */}
          {step===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>

              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Primary goal</label>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {GOALS.map(g=>(
                    <button key={g.value} onClick={()=>setFitnessGoal(g.value)} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 14px",borderRadius:"12px",border:`1.5px solid ${fitnessGoal===g.value?"#4f46e5":"#e5e7eb"}`,background:fitnessGoal===g.value?"#eef2ff":"#f9fafb",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                      <span style={{fontSize:"22px",flexShrink:0}}>{g.emoji}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{margin:0,fontSize:"13px",fontWeight:500,color:fitnessGoal===g.value?"#4338ca":"#1f2937"}}>{g.value}</p>
                        <p style={{margin:"2px 0 0",fontSize:"11px",color:"#9ca3af"}}>{g.desc}</p>
                      </div>
                      {fitnessGoal===g.value&&(
                        <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{display:"block",fontSize:"11px",fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:"8px"}}>Target physique</label>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {PHYSIQUES.map(p=>(
                    <button key={p.value} onClick={()=>setTargetPhysique(p.value)} style={{padding:"11px 12px",borderRadius:"10px",border:`1.5px solid ${targetPhysique===p.value?"#4f46e5":"#e5e7eb"}`,background:targetPhysique===p.value?"#eef2ff":"#f9fafb",cursor:"pointer",textAlign:"left",transition:"all 0.15s"}}>
                      <p style={{margin:"0 0 2px",fontSize:"12px",fontWeight:500,color:targetPhysique===p.value?"#4338ca":"#1f2937"}}>{p.value}</p>
                      <p style={{margin:0,fontSize:"10px",color:"#9ca3af",lineHeight:1.4}}>{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — AI Notes */}
          {step===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
              <p style={{fontSize:"13px",color:"#6b7280",margin:0,lineHeight:1.7}}>
                Share anything that'll help your AI coach build the perfect plan — injuries, sports you play, your schedule, aesthetic goals, lifestyle, or anything else.
              </p>
              <textarea value={aiNotes} onChange={e=>setAiNotes(e.target.value)} rows={5}
                placeholder="E.g. I have a bad left knee and play recreational basketball on Sundays. I want bigger arms and a stronger core. I only have time Monday–Friday and I'm mostly sedentary at a desk job..."
                style={{width:"100%",fontSize:"13px",border:"1.5px solid #e5e7eb",borderRadius:"12px",padding:"12px 14px",color:"#374151",background:"#f9fafb",resize:"none",outline:"none",lineHeight:1.7,boxSizing:"border-box"}}/>

              {/* Quick-add hints */}
              <div>
                <p style={{fontSize:"11px",color:"#9ca3af",margin:"0 0 7px"}}>Quick add:</p>
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                  {AI_HINTS.map(h=>(
                    <button key={h} onClick={()=>setAiNotes(n=>n.trim()?n.trimEnd()+". "+h:h)}
                      style={{fontSize:"11px",padding:"4px 10px",borderRadius:"8px",background:"#f3f4f6",border:"1px solid #e5e7eb",color:"#6b7280",cursor:"pointer"}}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"12px",padding:"12px 14px"}}>
                <p style={{fontSize:"11px",color:"#15803d",margin:0,lineHeight:1.6}}>
                  💡 You can skip this for now and update it anytime from your Profile page.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{padding:"14px 24px 24px",flexShrink:0,borderTop:"1px solid #f3f4f6"}}>
          {step===1&&(
            <button onClick={()=>setStep(2)} disabled={!can1}
              style={{width:"100%",background:can1?"#4f46e5":"#e5e7eb",color:can1?"white":"#9ca3af",border:"none",borderRadius:"14px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:can1?"pointer":"default",transition:"background 0.2s"}}>
              Continue →
            </button>
          )}
          {step===2&&(
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setStep(1)} style={{padding:"14px 18px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:"14px",fontSize:"13px",color:"#6b7280",cursor:"pointer"}}>← Back</button>
              <button onClick={()=>setStep(3)} disabled={!can2}
                style={{flex:1,background:can2?"#4f46e5":"#e5e7eb",color:can2?"white":"#9ca3af",border:"none",borderRadius:"14px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:can2?"pointer":"default",transition:"background 0.2s"}}>
                Continue →
              </button>
            </div>
          )}
          {step===3&&(
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>setStep(2)} style={{padding:"14px 18px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:"14px",fontSize:"13px",color:"#6b7280",cursor:"pointer"}}>← Back</button>
              <button onClick={submit}
                style={{flex:1,background:"#4f46e5",color:"white",border:"none",borderRadius:"14px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>
                Build my profile →
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
