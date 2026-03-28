"use client";
import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  const jan4 = new Date(now.getFullYear(),0,4);
  const dayOfYear = Math.floor((now.getTime()-new Date(now.getFullYear(),0,0).getTime())/86400000);
  const weekNum = Math.ceil((dayOfYear+jan4.getDay())/7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2,"0")}`;
}

function WorkoutSession({ day, onClose, onDone }: { day: Day; onClose: ()=>void; onDone: (n:string,d:string,c:number,s:number)=>void }) {
  const c = DAY_COLORS[day.day]||{bg:"#f9fafb",text:"#6b7280",badge:"DAY",accent:"#6366f1"};
  const [started,setStarted]=useState(false);
  const [secs,setSecs]=useState(0);
  const [checked,setChecked]=useState<boolean[]>(Array(day.exercises?.length||0).fill(false));
  const [done,setDone]=useState(false);
  const timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const completed=checked.filter(Boolean).length;
  const allDone=completed===checked.length&&checked.length>0;
  useEffect(()=>{if(allDone&&started&&!done)setTimeout(finish,600);},[checked]);
  useEffect(()=>()=>{if(timer.current)clearInterval(timer.current);},[]);
  function start(){setStarted(true);timer.current=setInterval(()=>setSecs(s=>s+1),1000);}
  function finish(){if(timer.current)clearInterval(timer.current);setDone(true);onDone(day.name,day.duration||"",day.exercises?.length||0,secs);}
  function toggle(i:number){if(!started||done)return;setChecked(p=>{const u=[...p];u[i]=!u[i];return u;});}
  function fmt(s:number){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;}
  return (
    <div style={{position:"fixed",inset:0,zIndex:50,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"16px",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)"}}>
      <div style={{width:"100%",maxWidth:"384px",background:"white",borderRadius:"24px",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column",animation:"slideUp 0.3s ease forwards"}}>
        <div style={{background:"#1a1a2e",padding:"20px 20px 16px",flexShrink:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"10px",background:c.bg,color:c.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,flexShrink:0}}>{c.badge}</div>
              <div><p style={{color:"white",fontSize:"14px",fontWeight:500,margin:0}}>{day.name}</p><p style={{color:"rgba(255,255,255,0.4)",fontSize:"11px",margin:"2px 0 0"}}>{day.duration} · {day.exercises?.length} exercises</p></div>
            </div>
            {!started&&<button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"20px",cursor:"pointer",lineHeight:1}}>✕</button>}
          </div>
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{fontFamily:"monospace",fontSize:"40px",fontWeight:700,color:"white",letterSpacing:"4px"}}>{fmt(secs)}</div>
            <p style={{color:"rgba(255,255,255,0.35)",fontSize:"11px",margin:"4px 0 0"}}>{!started?"Ready to start":done?"Workout complete":"Time elapsed"}</p>
          </div>
          {started&&!done&&<><div style={{background:"rgba(255,255,255,0.1)",borderRadius:"99px",height:"6px",overflow:"hidden",marginTop:"8px"}}><div style={{height:"100%",borderRadius:"99px",background:c.accent,width:`${(completed/checked.length)*100}%`,transition:"width 0.5s"}}/></div><p style={{color:"rgba(255,255,255,0.35)",fontSize:"10px",textAlign:"center",margin:"6px 0 0"}}>{completed} of {checked.length} done</p></>}
        </div>
        {!done&&<div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}><p style={{fontSize:"10px",fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"12px"}}>Exercises</p><div style={{display:"flex",flexDirection:"column",gap:"8px"}}>{day.exercises?.map((ex,i)=><button key={i} onClick={()=>toggle(i)} disabled={!started||done} style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px",borderRadius:"12px",border:checked[i]?"1px solid #bbf7d0":"1px solid #f3f4f6",background:checked[i]?"#f0fdf4":"#f9fafb",cursor:started&&!done?"pointer":"default",textAlign:"left",opacity:!started?0.6:1}}><div style={{width:"20px",height:"20px",borderRadius:"50%",border:checked[i]?"2px solid #22c55e":"2px solid #d1d5db",background:checked[i]?"#22c55e":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{checked[i]&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div><span style={{fontSize:"12px",color:checked[i]?"#16a34a":"#374151",textDecoration:checked[i]?"line-through":"none",flex:1}}>{ex}</span></button>)}</div></div>}
        {done&&<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",textAlign:"center"}}><div style={{width:"64px",height:"64px",borderRadius:"50%",background:"#dcfce7",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"16px",animation:"popIn 0.4s ease forwards"}}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><h3 style={{fontSize:"18px",fontWeight:600,color:"#1f2937",margin:"0 0 4px"}}>{allDone?"Workout complete!":"Good effort!"}</h3><p style={{fontSize:"12px",color:"#9ca3af",margin:"0 0 8px"}}>{allDone?`You crushed all ${day.exercises?.length} exercises`:`Completed ${completed} of ${day.exercises?.length}`}</p><p style={{fontFamily:"monospace",fontSize:"28px",fontWeight:700,color:"#374151",margin:"8px 0 4px"}}>{fmt(secs)}</p><p style={{fontSize:"10px",color:"#9ca3af"}}>Total time</p></div>}
        <div style={{padding:"8px 20px 20px",flexShrink:0,display:"flex",flexDirection:"column",gap:"8px"}}>
          {!started&&<button onClick={start} style={{width:"100%",background:c.accent,color:"white",border:"none",borderRadius:"16px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>Start workout</button>}
          {started&&!done&&<button onClick={finish} style={{width:"100%",background:"#1f2937",color:"white",border:"none",borderRadius:"16px",padding:"14px",fontSize:"14px",fontWeight:500,cursor:"pointer"}}>End workout</button>}
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

function ChatBox({ plan, goal, level, onPlanUpdate }: { plan:Plan; goal:string; level:string; onPlanUpdate:(p:Plan)=>void }) {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Hey! I'm your AI trainer. Ask me anything about your plan.",updated:false}]);
  const [input,setInput]=useState("");const [loading,setLoading]=useState(false);const [open,setOpen]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(open)bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);
  async function send(text?:string){
    const t=text||input.trim();if(!t||loading)return;
    setInput("");setLoading(true);
    const next=[...msgs,{role:"user",text:t,updated:false}];setMsgs(next);
    const summary=plan.days.map(d=>d.type==="rest"?`${d.day}: Rest`:`${d.day}: ${d.name} (${d.duration}) — ${d.exercises?.join(", ")}`).join("\n");
    try{const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal,level,planSummary:summary,messages:next.map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}))})});const data=await res.json();if(data.updatedPlan){onPlanUpdate(data.updatedPlan);setMsgs(p=>[...p,{role:"assistant",text:data.message||"Plan updated!",updated:true}]);}else setMsgs(p=>[...p,{role:"assistant",text:data.message||"Let me know if you need changes!",updated:false}]);}
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
        {plan?.days.map(day=>{
          const dows=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
          const di=dows.indexOf(day.day);const ci=dows.indexOf(currentDayName);
          const diff=di-ci;const dd=new Date(today);dd.setDate(today.getDate()+diff);
          const dds=localDateStr(dd);
          const isComp=day.type!=="rest"&&!!workoutLog[dds]&&workoutLog[dds].dayName===day.name;
          const isToday=day.day===currentDayName;
          return <DayCard key={day.day} day={day} onEdit={d=>setEditDay(d)} onStart={d=>{if(!isComp)setSessionDay(d);}} isCompleted={isComp} isToday={isToday}/>;
        })}
      </div>
      <ChatBox plan={plan!} goal={goal} level={level} onPlanUpdate={p=>{updatePlan(p);showToast("Plan updated!");}}/>
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