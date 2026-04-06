"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { getWorkoutPlan, saveWorkoutPlan, deleteWorkoutPlan, saveWorkoutLog, getWorkoutLogs } from "@/lib/supabase";

const DAY_COLORS: Record<string, { bg: string; text: string; badge: string; accent: string }> = {
  Monday:    { bg:"#eef2ff", text:"#4338ca", badge:"MON", accent:"#4f46e5" },
  Tuesday:   { bg:"#f0fdf4", text:"#15803d", badge:"TUE", accent:"#16a34a" },
  Wednesday: { bg:"#fff7ed", text:"#c2410c", badge:"WED", accent:"#ea580c" },
  Thursday:  { bg:"#faf5ff", text:"#7e22ce", badge:"THU", accent:"#9333ea" },
  Friday:    { bg:"#fff1f2", text:"#be123c", badge:"FRI", accent:"#e11d48" },
  Saturday:  { bg:"#f0f9ff", text:"#0369a1", badge:"SAT", accent:"#0284c7" },
  Sunday:    { bg:"#fafaf9", text:"#57534e", badge:"SUN", accent:"#78716c" },
};

const HINTS = ["Bad knee, avoid high impact","Only 20 minutes per session","No equipment, bodyweight only","I travel a lot, hotel workouts","Pregnancy safe workouts","Night shift worker","Lower back pain","Weekends only"];
const CHAT_SUGGESTIONS = ["Make Monday easier","Add more cardio","I only have 20 min per day","Make it harder overall","Remove all leg exercises","Add a rest day on Wednesday"];

type Day = { day: string; type: string; name: string; duration?: string; exercises?: string[] };
type Plan = { days: Day[]; tip?: string };

function localDateStr(d: Date) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function getWeekKey() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
}

// ── Set tracking helpers ──────────────────────────────────────────
const REST_SECS = 90;
const RING_CIRC = 100.5; // 2π×16

type MetricType = "weight_reps"|"reps_only"|"distance"|"laps"|"timed";
type SetEntry = { v1:string; v2:string; done:boolean };
type ExState  = { sets:SetEntry[]; metric:MetricType };
type RestInfo = { secsLeft:number; exIdx:number; setIdx:number };

function parseSetCount(ex:string):number {
  const m=ex.match(/(\d+)\s*[xX×]\s*\d+/);
  if(m)return Math.min(Math.max(parseInt(m[1]),1),8);
  return 3;
}

function detectMetric(ex:string):MetricType {
  const s=ex.toLowerCase();
  // Explicit equipment keyword → always weight+reps (checked first so "dumbbell row" isn't caught as cardio)
  if(/\b(barbell|dumbbell|db|cable|kettlebell|kb|ez.?bar|trap.?bar|smith|landmine)\b/.test(s))return"weight_reps";
  // Cardio / distance
  if(/\b(running|sprints?|jogging|biking|cycling|treadmill)\b/.test(s))return"distance";
  if(/\brun\b/.test(s)||/\bbike\b/.test(s)||/\bcycle\b/.test(s))return"distance";
  // Swimming
  if(/\b(swim|swimming|freestyle|backstroke|breaststroke|laps?)\b/.test(s))return"laps";
  // Timed holds
  if(/\b(plank|wall.?sit|isometric|dead.?hang|farmer.?carry|suitcase.?carry|hollow.?hold)\b/.test(s))return"timed";
  // Bodyweight / calisthenics — reps only (no weight field)
  if(/\b(push.?ups?|pull.?ups?|chin.?ups?|sit.?ups?|crunches?|burpees?|jumping.?jacks?|mountain.?climbers?|leg.?raises?|v.?ups?|flutter.?kicks?|dips?|lunges?|step.?ups?|box.?jumps?|jump.?rope|skipping|air.?squats?|bodyweight|body.?weight|pike.?push|inverted.?row|ring.?row|ring.?push|muscle.?up|handstand)\b/.test(s))return"reps_only";
  return"weight_reps";
}

function metricFields(m:MetricType):{v1Label:string;v1Ph:string;v2Label?:string;v2Ph?:string} {
  if(m==="weight_reps")return{v1Label:"lbs",v1Ph:"0",v2Label:"reps",v2Ph:"0"};
  if(m==="reps_only")  return{v1Label:"reps",v1Ph:"0"};
  if(m==="distance")   return{v1Label:"mi",v1Ph:"0.0"};
  if(m==="laps")       return{v1Label:"laps",v1Ph:"0"};
  return                     {v1Label:"sec",v1Ph:"0"};
}

function WorkoutSession({ day, onClose, onDone }: { day: Day; onClose: ()=>void; onDone: (n:string,d:string,c:number,s:number)=>void }) {
  const c=DAY_COLORS[day.day]||{bg:"#f9fafb",text:"#6b7280",badge:"DAY",accent:"#6366f1"};
  const exNames=day.exercises||[];

  const [exStates,setExStates]=useState<ExState[]>(()=>
    exNames.map(ex=>({metric:detectMetric(ex),sets:Array(parseSetCount(ex)).fill(null).map(()=>({v1:"",v2:"",done:false}))}))
  );
  const [started,setStarted]=useState(false);
  const [secs,setSecs]=useState(0);
  const [done,setDone]=useState(false);
  const [expanded,setExpanded]=useState<number|null>(null);
  const [rest,setRest]=useState<RestInfo|null>(null);
  const [confirmEnd,setConfirmEnd]=useState(false);
  const mainT=useRef<ReturnType<typeof setInterval>|null>(null);
  const restT=useRef<ReturnType<typeof setInterval>|null>(null);

  const totalSets=exStates.reduce((a,ex)=>a+ex.sets.length,0);
  const doneSets=exStates.reduce((a,ex)=>a+ex.sets.filter(s=>s.done).length,0);
  const allDone=doneSets===totalSets&&totalSets>0;

  useEffect(()=>{if(allDone&&started&&!done){const t=setTimeout(finish,800);return()=>clearTimeout(t);}},[allDone,started,done]);
  useEffect(()=>()=>{if(mainT.current)clearInterval(mainT.current);if(restT.current)clearInterval(restT.current);},[]);

  function start(){setStarted(true);mainT.current=setInterval(()=>setSecs(s=>s+1),1000);setExpanded(0);}
  function finish(){if(mainT.current)clearInterval(mainT.current);if(restT.current)clearInterval(restT.current);setRest(null);setDone(true);onDone(day.name,day.duration||"",exNames.length,secs);}

  function completeSet(exIdx:number,setIdx:number){
    setExStates(prev=>{const n=prev.map(ex=>({...ex,sets:ex.sets.map(s=>({...s}))}));n[exIdx].sets[setIdx].done=true;return n;});
    if(restT.current)clearInterval(restT.current);
    setRest({secsLeft:REST_SECS,exIdx,setIdx});
    restT.current=setInterval(()=>setRest(p=>{if(!p)return null;if(p.secsLeft<=1){clearInterval(restT.current!);return null;}return{...p,secsLeft:p.secsLeft-1};}),1000);
  }

  function skipRest(){if(restT.current)clearInterval(restT.current);setRest(null);}

  function updateSet(exIdx:number,setIdx:number,field:"v1"|"v2",val:string){
    setExStates(prev=>{const n=prev.map(ex=>({...ex,sets:ex.sets.map(s=>({...s}))}));n[exIdx].sets[setIdx][field]=val;return n;});
  }

  function adjustSets(exIdx:number,delta:number){
    setExStates(prev=>{
      const n=prev.map(ex=>({...ex,sets:ex.sets.map(s=>({...s}))}));
      const ex=n[exIdx];
      const nc=Math.min(Math.max(ex.sets.length+delta,1),8);
      if(nc>ex.sets.length){for(let i=ex.sets.length;i<nc;i++)ex.sets.push({v1:"",v2:"",done:false});}
      else{ex.sets=ex.sets.slice(0,nc);}
      return n;
    });
  }

  function getNextLabel(exIdx:number,setIdx:number):string {
    const ex=exStates[exIdx];
    if(setIdx<ex.sets.length-1)return`Set ${setIdx+2} of ${ex.sets.length}`;
    if(exIdx<exStates.length-1){const nm=exNames[exIdx+1].replace(/\s*\d+\s*[xX×]\s*\d+.*$/,"").trim();return nm.length>22?nm.slice(0,20)+"…":nm;}
    return"Final set!";
  }

  function fmt(s:number){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;}

  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"16px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)"}}>
      <div style={{width:"100%",maxWidth:"384px",background:"white",borderRadius:"24px",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease forwards"}}>

        {/* ── Header ── */}
        <div style={{background:"#1a1a2e",padding:"20px 20px 16px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"10px",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,flexShrink:0}}>{c.badge}</div>
              <div><p style={{color:"white",fontSize:"14px",fontWeight:500,margin:0}}>{day.name}</p><p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",margin:"2px 0 0"}}>{day.duration} · {exNames.length} exercises</p></div>
            </div>
            {!started&&<button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"20px",cursor:"pointer",lineHeight:1}}>✕</button>}
          </div>
          <div style={{textAlign:"center",padding:"10px 0 4px"}}>
            <div style={{fontFamily:"monospace",fontSize:"40px",fontWeight:700,color:"white",letterSpacing:"4px"}}>{fmt(secs)}</div>
            <p style={{color:"rgba(255,255,255,0.35)",fontSize:"11px",margin:"4px 0 0"}}>{!started?"Ready to start":done?"Workout complete":"Time elapsed"}</p>
          </div>
          {started&&!done&&<><div style={{background:"rgba(255,255,255,0.1)",borderRadius:"99px",height:"5px",overflow:"hidden",marginTop:"10px"}}><div style={{height:"100%",borderRadius:"99px",background:"#22c55e",width:`${(doneSets/totalSets)*100}%`,transition:"width 0.5s"}}/></div><p style={{color:"rgba(255,255,255,0.3)",fontSize:"10px",textAlign:"center",margin:"5px 0 0"}}>{doneSets} of {totalSets} sets done</p></>}
        </div>

        {/* ── Rest timer banner ── */}
        {rest&&(
          <div style={{background:"#f0fdf4",borderBottom:"1px solid #bbf7d0",padding:"10px 16px",display:"flex",alignItems:"center",gap:"10px",flexShrink:0}}>
            <div style={{width:"38px",height:"38px",position:"relative",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="38" height="38" viewBox="0 0 38 38" style={{position:"absolute",top:0,left:0}}>
                <circle cx="19" cy="19" r="16" fill="none" stroke="#bbf7d0" strokeWidth="3"/>
                <circle cx="19" cy="19" r="16" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeDasharray={RING_CIRC} strokeDashoffset={RING_CIRC*(1-rest.secsLeft/REST_SECS)}
                  strokeLinecap="round" transform="rotate(-90 19 19)" style={{transition:"stroke-dashoffset 1s linear"}}/>
              </svg>
              <span style={{color:"#15803d",fontSize:"11px",fontWeight:700,fontFamily:"monospace",position:"relative",zIndex:1}}>{rest.secsLeft}</span>
            </div>
            <div style={{flex:1}}>
              <p style={{color:"#15803d",fontSize:"12px",fontWeight:600,margin:0}}>Rest — Set {rest.setIdx+1} complete ✓</p>
              <p style={{color:"#16a34a",fontSize:"10px",margin:"2px 0 0"}}>Next: {getNextLabel(rest.exIdx,rest.setIdx)}</p>
            </div>
            <button onClick={skipRest} style={{color:"#15803d",fontSize:"11px",fontWeight:500,background:"white",border:"1px solid #bbf7d0",borderRadius:"8px",padding:"5px 10px",cursor:"pointer"}}>Skip →</button>
          </div>
        )}

        {/* ── Exercise list ── */}
        {!done&&(
          <div style={{flex:1,overflowY:"auto",padding:"14px 16px"}}>
            <p style={{fontSize:"10px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>Exercises</p>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {exNames.map((exName,exIdx)=>{
                const ex=exStates[exIdx];
                const exDone=ex.sets.every(s=>s.done)&&ex.sets.length>0;
                const isOpen=expanded===exIdx;
                const ml=metricFields(ex.metric);
                const cleanName=exName.replace(/\s*\d+\s*[xX×]\s*\d+.*$/,"").trim()||exName;
                return(
                  <div key={exIdx} style={{borderRadius:"12px",border:`1.5px solid ${exDone?"#bbf7d0":isOpen?"#e5e7eb":"#f3f4f6"}`,overflow:"hidden",background:exDone?"#f0fdf4":"#fafafa"}}>
                    {/* Collapsed header */}
                    <div onClick={()=>setExpanded(isOpen?null:exIdx)} style={{display:"flex",alignItems:"center",gap:"10px",padding:"11px 12px",cursor:"pointer"}}>
                      <div style={{width:"32px",height:"32px",borderRadius:"8px",background:exDone?"#dcfce7":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"10px",fontWeight:700,color:exDone?"#15803d":"#9ca3af"}}>
                        {exDone?"✓":`${ex.sets.length}×`}
                      </div>
                      <p style={{flex:1,fontSize:"12px",fontWeight:500,color:exDone?"#15803d":"#1f2937",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cleanName}</p>
                      {/* +/- set count controls + dots */}
                      <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
                        <button onClick={e=>{e.stopPropagation();adjustSets(exIdx,-1);}} disabled={ex.sets.length<=1} style={{width:"16px",height:"16px",borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",fontSize:"11px",color:"#9ca3af",cursor:ex.sets.length<=1?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1,opacity:ex.sets.length<=1?0.3:1}}>−</button>
                        <div style={{display:"flex",gap:"3px",alignItems:"center"}}>
                          {ex.sets.map((s,si)=>(
                            <div key={si} style={{width:"9px",height:"9px",borderRadius:"50%",background:s.done?"#22c55e":"#e5e7eb"}}/>
                          ))}
                        </div>
                        <button onClick={e=>{e.stopPropagation();adjustSets(exIdx,1);}} disabled={ex.sets.length>=8} style={{width:"16px",height:"16px",borderRadius:"50%",border:"1px solid #e5e7eb",background:"white",fontSize:"11px",color:"#9ca3af",cursor:ex.sets.length>=8?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,lineHeight:1,opacity:ex.sets.length>=8?0.3:1}}>+</button>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:isOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",marginLeft:"2px"}}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>
                    {/* Expanded set panel */}
                    {isOpen&&(
                      <div style={{borderTop:"1px solid #f3f4f6",padding:"12px",background:"white",display:"flex",flexDirection:"column",gap:"8px"}}>
                        {!started&&<p style={{fontSize:"10px",color:"#9ca3af",margin:"0 0 2px"}}>Start workout to log sets · tap ✓ after each set</p>}
                        {ex.sets.map((s,si)=>(
                          <div key={si} style={{display:"flex",alignItems:"center",gap:"8px"}}>
                            <span style={{width:"22px",fontSize:"10px",fontWeight:600,color:s.done?"#9ca3af":"#374151",flexShrink:0}}>S{si+1}</span>
                            <div style={{display:"flex",alignItems:"center",gap:"5px",flex:1}}>
                              <input value={s.v1} onChange={e=>updateSet(exIdx,si,"v1",e.target.value)} placeholder={ml.v1Ph} disabled={s.done||!started} type="number" inputMode="decimal"
                                style={{width:"52px",background:s.done?"#f0fdf4":"#f9fafb",border:`1px solid ${s.done?"#bbf7d0":"#e5e7eb"}`,borderRadius:"8px",padding:"6px 8px",fontSize:"12px",color:s.done?"#15803d":"#374151",textAlign:"center",outline:"none"}}/>
                              <span style={{fontSize:"10px",color:"#9ca3af"}}>{ml.v1Label}</span>
                              {ml.v2Label&&<>
                                <span style={{fontSize:"11px",color:"#d1d5db"}}>×</span>
                                <input value={s.v2} onChange={e=>updateSet(exIdx,si,"v2",e.target.value)} placeholder={ml.v2Ph} disabled={s.done||!started} type="number" inputMode="numeric"
                                  style={{width:"52px",background:s.done?"#f0fdf4":"#f9fafb",border:`1px solid ${s.done?"#bbf7d0":"#e5e7eb"}`,borderRadius:"8px",padding:"6px 8px",fontSize:"12px",color:s.done?"#15803d":"#374151",textAlign:"center",outline:"none"}}/>
                                <span style={{fontSize:"10px",color:"#9ca3af"}}>{ml.v2Label}</span>
                              </>}
                            </div>
                            <button onClick={()=>{if(started&&!s.done&&!rest)completeSet(exIdx,si);}} disabled={!started||s.done||!!rest}
                              style={{width:"30px",height:"30px",borderRadius:"50%",border:s.done?"none":"1.5px solid #d1d5db",background:s.done?"#22c55e":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",cursor:started&&!s.done&&!rest?"pointer":"default",flexShrink:0,opacity:rest&&!s.done?0.4:1}}>
                              {s.done&&<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Done screen ── */}
        {done&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",textAlign:"center"}}>
            <div style={{width:"64px",height:"64px",borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"16px",animation:"popIn 0.4s ease forwards"}}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{fontSize:"18px",fontWeight:600,color:"#1f2937",margin:"0 0 4px"}}>Workout complete!</h3>
            <p style={{fontSize:"12px",color:"#9ca3af",margin:"0 0 8px"}}>{doneSets} of {totalSets} sets logged</p>
            <p style={{fontFamily:"monospace",fontSize:"28px",fontWeight:700,color:"#374151",margin:"8px 0 4px"}}>{fmt(secs)}</p>
            <p style={{fontSize:"10px",color:"#9ca3af"}}>Total time</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{padding:"8px 20px 20px",flexShrink:0,display:"flex",flexDirection:"column",gap:"8px"}}>
          {!started&&<button onClick={start} style={{width:"100%",background:c.accent,color:"white",border:"none",borderRadius:"16px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Start workout</button>}
          {started&&!done&&!confirmEnd&&(
            <button onClick={()=>{if(doneSets<totalSets)setConfirmEnd(true);else finish();}} style={{width:"100%",background:"#1f2937",color:"white",border:"none",borderRadius:"16px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>End workout</button>
          )}
          {confirmEnd&&(
            <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:"14px",padding:"12px 14px"}}>
              <p style={{fontSize:"12px",color:"#c2410c",fontWeight:500,margin:"0 0 10px"}}>⚠️ {totalSets-doneSets} set{totalSets-doneSets!==1?"s":""} still remaining — end workout anyway?</p>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={finish} style={{flex:1,background:"#1f2937",color:"white",border:"none",borderRadius:"10px",padding:"10px",fontSize:"12px",fontWeight:500,cursor:"pointer"}}>Yes, end it</button>
                <button onClick={()=>setConfirmEnd(false)} style={{flex:1,background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:"10px",padding:"10px",fontSize:"12px",cursor:"pointer"}}>Keep going</button>
              </div>
            </div>
          )}
          {done&&<button onClick={onClose} style={{width:"100%",background:c.accent,color:"white",border:"none",borderRadius:"16px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Done</button>}
          {!done&&<button onClick={onClose} style={{width:"100%",background:"transparent",color:"#9ca3af",border:"1px solid #e5e7eb",borderRadius:"16px",padding:"10px",fontSize:"12px",cursor:"pointer"}}>{started?"Minimize":"Cancel"}</button>}
        </div>
      </div>
    </div>
  );
}

function EditModal({ day, onSave, onClose }: { day: Day; onSave:(d:Day)=>void; onClose:()=>void }) {
  const [name,setName]=useState(day.name);
  const [duration,setDuration]=useState(day.duration||"");
  const [exercises,setExercises]=useState<string[]>([...(day.exercises||[])]);
  const [newEx,setNewEx]=useState("");
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"16px",background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)"}}>
      <div style={{width:"100%",maxWidth:"384px",background:"white",borderRadius:"20px",overflow:"hidden",animation:"slideUp 0.25s ease forwards"}}>
        <div style={{background:"#1a1a2e",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><p style={{color:"white",fontSize:"14px",fontWeight:500,margin:0}}>Edit {day.day}</p><p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",margin:"2px 0 0"}}>Customize your workout</p></div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"18px",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"20px",maxHeight:"70vh",overflowY:"auto"}}>
          <label style={{display:"block",fontSize:"11px",color:"#9ca3af",fontWeight:500,marginBottom:"6px"}}>Workout name</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Upper body strength" style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"10px 12px",fontSize:"13px",color:"#374151",outline:"none",marginBottom:"16px",boxSizing:"border-box"}}/>
          <label style={{display:"block",fontSize:"11px",color:"#9ca3af",fontWeight:500,marginBottom:"6px"}}>Duration</label>
          <input value={duration} onChange={e=>setDuration(e.target.value)} placeholder="e.g. 40 min" style={{width:"100%",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"10px 12px",fontSize:"13px",color:"#374151",outline:"none",marginBottom:"16px",boxSizing:"border-box"}}/>
          <label style={{display:"block",fontSize:"11px",color:"#9ca3af",fontWeight:500,marginBottom:"8px"}}>Exercises ({exercises.length})</label>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"12px"}}>{exercises.map((ex,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:"8px"}}><span style={{fontSize:"10px",color:"#d1d5db",width:"16px"}}>{i+1}</span><input value={ex} onChange={e=>{const u=[...exercises];u[i]=e.target.value;setExercises(u);}} style={{flex:1,background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"8px",padding:"8px 10px",fontSize:"12px",color:"#374151",outline:"none"}}/><button onClick={()=>setExercises(exercises.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:"14px"}}>✕</button></div>)}</div>
          <div style={{display:"flex",gap:"8px",marginBottom:"20px"}}><input value={newEx} onChange={e=>setNewEx(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newEx.trim()){setExercises([...exercises,newEx.trim()]);setNewEx("");}}} placeholder="Add exercise... (Enter)" style={{flex:1,background:"#f9fafb",border:"1px dashed #d1d5db",borderRadius:"8px",padding:"8px 10px",fontSize:"12px",color:"#374151",outline:"none"}}/><button onClick={()=>{if(newEx.trim()){setExercises([...exercises,newEx.trim()]);setNewEx("");}}} style={{background:"#4f46e5",color:"white",border:"none",borderRadius:"8px",padding:"8px 12px",fontSize:"12px",cursor:"pointer"}}>+ Add</button></div>
          <button onClick={()=>onSave({...day,name,duration,exercises})} style={{width:"100%",background:"#4f46e5",color:"white",border:"none",borderRadius:"12px",padding:"12px",fontSize:"13px",fontWeight:500,cursor:"pointer",marginBottom:"8px"}}>Save changes</button>
          <button onClick={onClose} style={{width:"100%",background:"transparent",color:"#9ca3af",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"10px",fontSize:"12px",cursor:"pointer"}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DayCard({ day, onEdit, onStart, isCompleted, isToday }: { day:Day; onEdit:(d:Day)=>void; onStart:(d:Day)=>void; isCompleted:boolean; isToday:boolean }) {
  const c=DAY_COLORS[day.day]||{bg:"#f9fafb",text:"#6b7280",badge:"DAY",accent:"#6366f1"};
  const [hovered,setHovered]=useState(false);
  if(day.type==="rest") return <div style={{display:"flex",alignItems:"center",gap:"12px",background:"#f9fafb",borderRadius:"12px",padding:"12px",opacity:0.5}}><div style={{width:"36px",height:"36px",borderRadius:"8px",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:500,flexShrink:0}}>{c.badge}</div><p style={{fontSize:"12px",color:"#9ca3af",margin:0}}>Rest day — recovery</p></div>;
  if(isCompleted) return <div style={{background:"#f0fdf4",borderRadius:"12px",border:"1px solid #bbf7d0"}}><div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 12px 8px"}}><div style={{width:"36px",height:"36px",borderRadius:"8px",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:500,flexShrink:0}}>{c.badge}</div><div style={{flex:1,minWidth:0}}><p style={{fontSize:"12px",fontWeight:500,color:"#15803d",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.name}</p><p style={{fontSize:"10px",color:"#86efac",margin:"2px 0 0"}}>{day.duration} · completed</p></div><div style={{width:"28px",height:"28px",borderRadius:"50%",background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div></div><div style={{borderLeft:"2px solid #bbf7d0",marginLeft:"16px",paddingLeft:"12px",paddingBottom:"12px",display:"flex",flexDirection:"column",gap:"4px"}}>{day.exercises?.map((ex,i)=><p key={i} style={{fontSize:"10px",color:"#86efac",margin:0}}>{ex}</p>)}</div></div>;
  return <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} onClick={()=>{if(isToday)onStart(day);}} style={{background:"#f9fafb",borderRadius:"12px",border:hovered&&isToday?"1px solid #e5e7eb":"1px solid #f3f4f6",cursor:isToday?"pointer":"default",transition:"border-color 0.15s",opacity:isToday?1:0.75}}><div style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 12px 8px"}}><div style={{width:"36px",height:"36px",borderRadius:"8px",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:500,flexShrink:0}}>{c.badge}</div><div style={{flex:1,minWidth:0}}><p style={{fontSize:"12px",fontWeight:500,color:"#1f2937",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{day.name}</p><p style={{fontSize:"10px",color:"#9ca3af",margin:"2px 0 0"}}>{day.duration} · {day.exercises?.length} exercises</p>{!isToday&&<p style={{fontSize:"10px",color:"#f59e0b",margin:"2px 0 0"}}>available on {day.day}</p>}</div><div style={{display:"flex",alignItems:"center",gap:"6px"}}><button onClick={e=>{e.stopPropagation();onEdit(day);}} style={{width:"28px",height:"28px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",opacity:hovered?1:0,transition:"opacity 0.15s",color:"#d1d5db"}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>{isToday&&<div style={{width:"28px",height:"28px",display:"flex",alignItems:"center",justifyContent:"center",color:hovered?"#6b7280":"#d1d5db"}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></div>}</div></div><div style={{borderLeft:"2px solid #e5e7eb",marginLeft:"16px",paddingLeft:"12px",paddingBottom:"12px",display:"flex",flexDirection:"column",gap:"4px"}}>{day.exercises?.map((ex,i)=><p key={i} style={{fontSize:"10px",color:"#6b7280",margin:0}}>{ex}</p>)}</div></div>;
}

function ChatBox({ plan, goal, level, currentDay, pastDays, userPrompt, onPlanUpdate }: { plan:Plan; goal:string; level:string; currentDay:string; pastDays:string[]; userPrompt:string; onPlanUpdate:(p:Plan)=>void }) {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Hey! I'm your AI trainer. Ask me anything about your plan.",updated:false}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);const [open,setOpen]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(open)bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  async function send(text?:string){
    const t=text||input.trim();if(!t||loading)return;
    setInput("");setLoading(true);
    const next=[...msgs,{role:"user",text:t,updated:false}];setMsgs(next);
    const summary=plan.days.map(d=>d.type==="rest"?`${d.day}: Rest`:`${d.day}: ${d.name} (${d.duration}) — ${d.exercises?.join(", ")}`).join("\n");
    try{const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal,level,planSummary:summary,currentDay,pastDays,userPrompt,messages:next.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}))})});const data=await res.json();if(data.updatedPlan){onPlanUpdate(data.updatedPlan);setMsgs(p=>[...p,{role:"assistant",text:data.message||"Plan updated!",updated:true}]);}else setMsgs(p=>[...p,{role:"assistant",text:data.message||"Let me know if you need changes!",updated:false}]);}
    catch{setMsgs(p=>[...p,{role:"assistant",text:"Sorry, something went wrong.",updated:false}]);}
    finally{setLoading(false);}
  }
  return(
    <div style={{marginTop:"16px"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderRadius:"16px",border:`1px solid ${open?"#1a1a2e":"#e5e7eb"}`,background:open?"#1a1a2e":"white",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}><div style={{width:"20px",height:"20px",borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><span style={{fontSize:"12px",fontWeight:500,color:open?"white":"#374151"}}>Ask your AI trainer</span>{msgs.length>1&&<span style={{fontSize:"10px",padding:"2px 6px",borderRadius:"99px",background:open?"rgba(255,255,255,0.15)":"#eef2ff",color:open?"white":"#4f46e5",fontWeight:500}}>{msgs.length-1}</span>}</div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open?"white":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{transform:open?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s"}}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open&&<div style={{marginTop:"8px",border:"1px solid #f3f4f6",borderRadius:"16px",overflow:"hidden",background:"white"}}>
        <div style={{display:"flex",flexDirection:"column",gap:"12px",padding:"16px",maxHeight:"260px",overflowY:"auto"}}>
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>{m.role==="assistant"&&<div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:"8px",marginTop:"2px"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>}<div style={{display:"flex",flexDirection:"column",gap:"4px",maxWidth:"80%"}}><div style={{fontSize:"12px",lineHeight:1.6,padding:"8px 12px",borderRadius:"16px",background:m.role==="user"?"#1a1a2e":"#f3f4f6",color:m.role==="user"?"white":"#374151",borderBottomRightRadius:m.role==="user"?"4px":"16px",borderBottomLeftRadius:m.role==="assistant"?"4px":"16px"}}>{m.text}</div>{m.updated&&<span style={{fontSize:"10px",color:"#16a34a",fontWeight:500,paddingLeft:"4px"}}>✓ Plan updated above</span>}</div></div>)}
          {loading&&<div style={{display:"flex"}}><div style={{width:"24px",height:"24px",borderRadius:"50%",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:"8px"}}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div><div style={{padding:"8px 12px",borderRadius:"16px",borderBottomLeftRadius:"4px",background:"#f3f4f6"}}><div style={{display:"flex",gap:"4px",alignItems:"center",height:"16px"}}>{[0,0.2,0.4].map((d,i)=><div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:"#9ca3af",animation:`bounce 1s infinite ${d}s`}}/>)}</div></div></div>}
          <div ref={bottomRef}/>
        </div>
        {msgs.length===1&&<div style={{padding:"0 16px 12px",display:"flex",gap:"6px",flexWrap:"wrap"}}>{CHAT_SUGGESTIONS.map(s=><button key={s} onClick={()=>send(s)} style={{fontSize:"10px",padding:"4px 10px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#f9fafb",color:"#6b7280",cursor:"pointer"}}>{s}</button>)}</div>}
        <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"12px",borderTop:"1px solid #f3f4f6"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask anything about your plan..." disabled={loading} style={{flex:1,fontSize:"12px",background:"#f9fafb",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"8px 12px",color:"#374151",outline:"none"}}/>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{width:"32px",height:"32px",borderRadius:"10px",border:"none",background:input.trim()&&!loading?"#4f46e5":"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={input.trim()&&!loading?"white":"#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>
        </div>
      </div>}
    </div>
  );
}

export default function WorkoutTab({ onWorkoutComplete, isDesktop }: { onWorkoutComplete:(n:string,d:string,c:number,s:number)=>void; isDesktop?: boolean }) {
  const { data: session } = useSession();
  const userId = session?.user?.id||session?.user?.email||"";
  const [goal,setGoal]=useState("Lose weight");
  const [level,setLevel]=useState("Beginner");
  const [prompt,setPrompt]=useState("");
  const [plan,setPlan]=useState<Plan|null>(null);
  const [workoutLog,setWorkoutLog]=useState<Record<string,{dayName:string}>>({});
  const [mounted,setMounted]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [editDay,setEditDay]=useState<Day|null>(null);
  const [sessionDay,setSessionDay]=useState<Day|null>(null);
  const [toast,setToast]=useState("");

  const today=new Date();
  const todayStr=localDateStr(today);
  const daysOfWeek=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const currentDayName=daysOfWeek[today.getDay()===0?6:today.getDay()-1];
  const currentDayIndex=daysOfWeek.indexOf(currentDayName);
  const pastDays=daysOfWeek.slice(0,currentDayIndex);
  const weekKey=getWeekKey();

  useEffect(()=>{
    if(!userId)return;
    async function load(){
      const [savedPlan,logs]=await Promise.all([getWorkoutPlan(userId,weekKey),getWorkoutLogs(userId)]);
      if(savedPlan)setPlan(savedPlan as Plan);
      const simpleLogs:Record<string,{dayName:string}>={};
      Object.entries(logs).forEach(([date,entry])=>{simpleLogs[date]={dayName:entry.dayName};});
      setWorkoutLog(simpleLogs);setMounted(true);
    }
    load();
  },[userId]);

  function showToast(msg:string){setToast(msg);setTimeout(()=>setToast(""),2500);}
  async function updatePlan(p:Plan){setPlan(p);await saveWorkoutPlan(userId,weekKey,p);}
  async function generate(){
    setLoading(true);setError("");setPlan(null);
    try{const res=await fetch("/api/generate-plan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal,level,userPrompt:prompt,currentDay:currentDayName,pastDays})});const data=await res.json();if(data.error)throw new Error(data.error);await updatePlan(data);}
    catch{setError("Something went wrong. Please try again.");}
    finally{setLoading(false);}
  }
  async function handleWorkoutComplete(n:string,d:string,c:number,s:number){
    const updated={...workoutLog,[todayStr]:{dayName:n}};setWorkoutLog(updated);
    await saveWorkoutLog(userId,todayStr,n,d,c,s);
    onWorkoutComplete(n,d,c,s);setSessionDay(null);showToast("Workout logged!");
  }
  async function startOver(){await deleteWorkoutPlan(userId,weekKey);setPlan(null);setError("");setPrompt("");}

  if(!mounted)return<><div style={{background:"#1a1a2e",padding:"20px"}}><h1 style={{color:"white",fontSize:"18px",fontWeight:500,margin:0}}>Build your week</h1><p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:"4px 0 0"}}>Loading...</p></div><div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:"64px 0"}}><div style={{width:"24px",height:"24px",borderRadius:"50%",border:"2px solid #e5e7eb",borderTopColor:"#6366f1",animation:"spin 0.8s linear infinite"}}/></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></>;

  const buildContent=(
    <>
      <p style={{fontSize:"12px",color:"#9ca3af",fontWeight:500,marginBottom:"8px"}}>Your goal</p>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"16px"}}>{["Lose weight","Build muscle","Stay fit"].map(g=><button key={g} onClick={()=>setGoal(g)} style={{fontSize:"12px",padding:"6px 14px",borderRadius:"99px",border:`1px solid ${goal===g?"#1a1a2e":"#e5e7eb"}`,background:goal===g?"#1a1a2e":"transparent",color:goal===g?"white":"#6b7280",cursor:"pointer"}}>{g}</button>)}</div>
      <p style={{fontSize:"12px",color:"#9ca3af",fontWeight:500,marginBottom:"8px"}}>Fitness level</p>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>{["Beginner","Intermediate","Advanced"].map(l=><button key={l} onClick={()=>setLevel(l)} style={{fontSize:"12px",padding:"6px 14px",borderRadius:"99px",border:`1px solid ${level===l?"#1a1a2e":"#e5e7eb"}`,background:level===l?"#1a1a2e":"transparent",color:level===l?"white":"#6b7280",cursor:"pointer"}}>{l}</button>)}</div>
      <hr style={{border:"none",borderTop:"1px solid #f3f4f6",marginBottom:"20px"}}/>
      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}><p style={{fontSize:"12px",fontWeight:500,color:"#374151",margin:0}}>Tell the AI your situation</p><span style={{fontSize:"10px",background:"#eef2ff",color:"#4f46e5",padding:"2px 8px",borderRadius:"99px",fontWeight:500}}>AI</span></div>
      <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={4} placeholder="e.g. I have a bad knee so no running..." style={{width:"100%",fontSize:"12px",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"12px",color:"#374151",background:"#f9fafb",resize:"none",outline:"none",lineHeight:1.6,boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px",marginBottom:"20px"}}>{HINTS.map(h=><button key={h} onClick={()=>setPrompt(p=>p.trim()?p.trimEnd()+". "+h:h)} style={{fontSize:"10px",padding:"4px 10px",borderRadius:"6px",background:"#f9fafb",border:"1px solid #e5e7eb",color:"#9ca3af",cursor:"pointer"}}>{h}</button>)}</div>
      <button onClick={generate} style={{width:"100%",background:"#4f46e5",color:"white",border:"none",borderRadius:"12px",padding:"12px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Generate my weekly plan →</button>
      {error&&<div style={{marginTop:"12px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"12px",padding:"12px",fontSize:"12px",color:"#dc2626"}}>{error}</div>}
    </>
  );

  const planContent=(
    <>
      {toast&&<div style={{marginBottom:"12px",background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"12px",padding:"10px 16px",fontSize:"12px",color:"#16a34a",textAlign:"center",fontWeight:500}}>{toast}</div>}
      {plan?.tip&&<div style={{background:"#eef2ff",borderRadius:"12px",padding:"12px",marginBottom:"16px"}}><p style={{fontSize:"10px",color:"#4f46e5",fontWeight:500,margin:"0 0 4px"}}>AI tip for you</p><p style={{fontSize:"12px",color:"#3730a3",lineHeight:1.6,margin:0}}>{plan.tip}</p></div>}
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {plan?.days.filter((_,i)=>i>=currentDayIndex).map(day=>{
          const dows=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
          const di=dows.indexOf(day.day);const ci=dows.indexOf(currentDayName);
          const diff=di-ci;const dd=new Date(today);dd.setDate(today.getDate()+diff);
          const dds=localDateStr(dd);
          const isComp=day.type!=="rest"&&!!workoutLog[dds]&&workoutLog[dds].dayName===day.name;
          const isToday=day.day===currentDayName;
          return <DayCard key={day.day} day={day} onEdit={d=>setEditDay(d)} onStart={d=>{if(!isComp)setSessionDay(d);}} isCompleted={isComp} isToday={isToday}/>;
        })}
      </div>
      <ChatBox plan={plan!} goal={goal} level={level} currentDay={currentDayName} pastDays={pastDays} userPrompt={prompt} onPlanUpdate={p=>{updatePlan(p);showToast("Plan updated!");}}/>
      <button onClick={startOver} style={{width:"100%",marginTop:"12px",background:"transparent",border:"1px solid #e5e7eb",borderRadius:"12px",padding:"10px",fontSize:"12px",color:"#9ca3af",cursor:"pointer"}}>← Start over</button>
    </>
  );

  const header=(title:string,sub:string)=>(
    <div style={{background:"#1a1a2e",padding:isDesktop?"24px 28px 20px":"20px",flexShrink:0}}>
      <h1 style={{color:"white",fontSize:isDesktop?"22px":"18px",fontWeight:500,margin:"0 0 4px"}}>{title}</h1>
      <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:0}}>{sub}</p>
    </div>
  );

  const loadingSpinner=(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"64px 0",gap:"16px"}}><div style={{width:"32px",height:"32px",borderRadius:"50%",border:"2px solid #e5e7eb",borderTopColor:"#6366f1",animation:"spin 0.8s linear infinite"}}/><p style={{fontSize:"12px",color:"#9ca3af"}}>Building your personalized plan...</p></div>);

  if(isDesktop){return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      {header(plan?"Your weekly plan":"Build your week",plan?`${goal} · ${level} · tap today's workout to start`:"Powered by AI — just describe your situation")}
      <div style={{flex:1,overflowY:"auto",padding:"32px 48px"}}>
        <div style={{maxWidth:"1000px",margin:"0 auto"}}>{loading?loadingSpinner:plan?planContent:buildContent}</div>
      </div>
      {editDay&&<EditModal day={editDay} onSave={d=>{updatePlan({...plan!,days:plan!.days.map(x=>x.day===d.day?d:x)});setEditDay(null);showToast("Day updated!");}} onClose={()=>setEditDay(null)}/>}
      {sessionDay&&<WorkoutSession day={sessionDay} onClose={()=>setSessionDay(null)} onDone={handleWorkoutComplete}/>}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );}

  return(
    <>
      {header(plan?"Your weekly plan":"Build your week",plan?`${goal} · ${level} · tap today's workout to start`:"Powered by AI — just describe your situation")}
      <div style={{padding:"20px"}}>{loading?loadingSpinner:plan?planContent:buildContent}</div>
      {editDay&&<EditModal day={editDay} onSave={d=>{updatePlan({...plan!,days:plan!.days.map(x=>x.day===d.day?d:x)});setEditDay(null);showToast("Day updated!");}} onClose={()=>setEditDay(null)}/>}
      {sessionDay&&<WorkoutSession day={sessionDay} onClose={()=>setSessionDay(null)} onDone={handleWorkoutComplete}/>}
      <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}} @keyframes popIn{0%{transform:scale(0.6);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </>
  );
}