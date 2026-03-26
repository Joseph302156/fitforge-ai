"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getWorkoutLogs, getWorkoutPlan } from "@/lib/supabase";

type LogEntry = { dayName: string; duration: string; exerciseCount: number; timeElapsed: number };
type PlanDay = { day: string; type: string; name: string; duration?: string };

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOT_COLORS: Record<string,string> = { Monday:"#4f46e5", Tuesday:"#16a34a", Wednesday:"#ea580c", Thursday:"#9333ea", Friday:"#e11d48", Saturday:"#0284c7", Sunday:"#78716c" };
const BADGE: Record<string,{bg:string;text:string;label:string}> = {
  Monday:{bg:"#eef2ff",text:"#4338ca",label:"MON"}, Tuesday:{bg:"#f0fdf4",text:"#15803d",label:"TUE"},
  Wednesday:{bg:"#fff7ed",text:"#c2410c",label:"WED"}, Thursday:{bg:"#faf5ff",text:"#7e22ce",label:"THU"},
  Friday:{bg:"#fff1f2",text:"#be123c",label:"FRI"}, Saturday:{bg:"#f0f9ff",text:"#0369a1",label:"SAT"},
  Sunday:{bg:"#fafaf9",text:"#57534e",label:"SUN"},
};

function pad(n: number) { return String(n).padStart(2,"0"); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function getDayName(d: Date) { return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]; }
function fmtTime(s: number) {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;
  return h>0?`${h}:${pad(m)}:${pad(sc)}`:`${pad(m)}:${pad(sc)}`;
}
function getWeekKey(date: Date) {
  const jan4 = new Date(date.getFullYear(),0,4);
  const dayOfYear = Math.floor((date.getTime()-new Date(date.getFullYear(),0,0).getTime())/86400000);
  const weekNum = Math.ceil((dayOfYear+jan4.getDay())/7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2,"0")}`;
}

export default function CalendarTab({ workoutLog }: { workoutLog: Record<string, LogEntry> }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || "";

  const [now] = useState(() => { const d=new Date(); return {year:d.getFullYear(),month:d.getMonth(),date:d.getDate(),day:d.getDay()}; });
  const todayStr = `${now.year}-${pad(now.month+1)}-${pad(now.date)}`;
  const [viewYear, setViewYear] = useState(now.year);
  const [viewMonth, setViewMonth] = useState(now.month);
  const [selected, setSelected] = useState<string|null>(todayStr);
  const [schedMap, setSchedMap] = useState<Record<string,{name:string;dayName:string}>>({});
  const [fullLog, setFullLog] = useState<Record<string, LogEntry>>(workoutLog);

  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [logs, plan] = await Promise.all([
        getWorkoutLogs(userId),
        getWorkoutPlan(userId, getWeekKey(new Date())),
      ]);
      setFullLog(logs);
      if (!plan) return;
      const days: PlanDay[] = (plan as any).days;
      if (!Array.isArray(days)) return;
      const dayOfWeek = now.day;
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now.year, now.month, now.date + offset);
      const dayNames = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const result: Record<string,{name:string;dayName:string}> = {};
      days.forEach((d, i) => {
        if (d.type === "workout") {
          const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
          result[toDateStr(dt)] = { name: d.name || "", dayName: dayNames[i] };
        }
      });
      setSchedMap(result);
    }
    load();
  }, [userId]);

  function prevMonth() { if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); setSelected(null); }
  function nextMonth() { if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); setSelected(null); }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

  function ds(day: number) { return `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`; }

  type CT = "completed"|"today-done"|"today-sched"|"today"|"upcoming"|"missed"|"empty";
  function cellType(day: number): CT {
    const s = ds(day);
    const cellDate = new Date(viewYear, viewMonth, day);
    const todayDate = new Date(now.year, now.month, now.date);
    const hasLog = !!fullLog[s];
    const hasSched = !!schedMap[s];
    const isToday = s === todayStr;
    const isPast = cellDate < todayDate;
    const isFuture = cellDate > todayDate;
    if (isToday && hasLog) return "today-done";
    if (isToday && hasSched) return "today-sched";
    if (isToday) return "today";
    if (hasLog) return "completed";
    if (isPast && hasSched) return "missed";
    if (isFuture && hasSched) return "upcoming";
    return "empty";
  }

  function cellStyle(ct: CT): {bg:string;num:string} {
    if (ct==="completed")  return {bg:"#eef2ff",num:"#4338ca"};
    if (ct==="today-done") return {bg:"#1a1a2e",num:"white"};
    if (ct==="today-sched")return {bg:"#1a1a2e",num:"white"};
    if (ct==="today")      return {bg:"#1a1a2e",num:"white"};
    if (ct==="upcoming")   return {bg:"#f5f3ff",num:"#7c3aed"};
    if (ct==="missed")     return {bg:"#fef2f2",num:"#dc2626"};
    return {bg:"#f9fafb",num:"#d1d5db"};
  }

  const monthPfx = `${viewYear}-${pad(viewMonth+1)}`;
  const monthDone = Object.keys(fullLog).filter(d=>d.startsWith(monthPfx)).length;
  const upcoming = Object.keys(schedMap).filter(d=>new Date(d+"T00:00:00")>new Date(now.year,now.month,now.date)).length;

  let streak=0;
  const sc = new Date(now.year,now.month,now.date);
  while(fullLog[toDateStr(sc)]){streak++;sc.setDate(sc.getDate()-1);}

  const selEntry = selected ? fullLog[selected] : null;
  const selSched = selected ? schedMap[selected] : null;
  const selDate = selected ? new Date(parseInt(selected.split("-")[0]),parseInt(selected.split("-")[1])-1,parseInt(selected.split("-")[2])) : null;
  const todayDate = new Date(now.year,now.month,now.date);
  const selBadge = selected ? BADGE[getDayName(new Date(parseInt(selected.split("-")[0]),parseInt(selected.split("-")[1])-1,parseInt(selected.split("-")[2])))] : null;
  const isMissed = !!(selected && !selEntry && selSched && selDate && selDate < todayDate);
  const isUpcoming = !!(selected && !selEntry && selSched && selDate && selDate >= todayDate && selected !== todayStr);
  const isTodaySched = !!(selected === todayStr && !selEntry && selSched);

  const cells: (number|null)[] = [];
  for(let i=0;i<firstDay;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);

  return (
    <>
      <div style={{background:"#1a1a2e",padding:"20px"}}>
        <h1 style={{color:"white",fontSize:"18px",fontWeight:500,margin:0}}>Monthly calendar</h1>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:"4px 0 0"}}>
          {MONTH_NAMES[viewMonth]} {viewYear} · {monthDone} completed · {upcoming} upcoming
        </p>
      </div>
      <div style={{padding:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
          <button onClick={prevMonth} style={{width:"30px",height:"30px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:"14px",color:"#6b7280"}}>‹</button>
          <span style={{fontSize:"13px",fontWeight:500,color:"#1f2937"}}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{width:"30px",height:"30px",borderRadius:"8px",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:"14px",color:"#6b7280"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
            <div key={d} style={{textAlign:"center",fontSize:"10px",color:"#9ca3af",fontWeight:500,padding:"4px 0"}}>{d}</div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
          {cells.map((day,i)=>{
            if(day===null) return <div key={`e-${i}`}/>;
            const s=ds(day); const ct=cellType(day); const {bg,num}=cellStyle(ct); const isSel=selected===s;
            const dotC = fullLog[s] ? DOT_COLORS[getDayName(new Date(viewYear,viewMonth,day))] : null;
            return (
              <div key={s} onClick={()=>setSelected(isSel?null:s)}
                style={{aspectRatio:"1",borderRadius:"8px",background:bg,border:isSel?"2px solid #4f46e5":"1.5px solid transparent",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"3px",cursor:"pointer"}}>
                <span style={{fontSize:"11px",fontWeight:500,color:num,lineHeight:1}}>{day}</span>
                {ct==="completed"&&dotC&&<div style={{width:"5px",height:"5px",borderRadius:"50%",background:dotC}}/>}
                {ct==="today-done"&&<div style={{width:"5px",height:"5px",borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>}
                {ct==="today-sched"&&<div style={{width:"6px",height:"6px",borderRadius:"50%",background:"rgba(255,255,255,0.9)"}}/>}
                {ct==="upcoming"&&<div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#7c3aed",opacity:0.7}}/>}
                {ct==="missed"&&<div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#fca5a5"}}/>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:"10px",marginTop:"10px",flexWrap:"wrap"}}>
          {[{bg:"#eef2ff",dot:"#4f46e5",label:"Completed"},{bg:"#f5f3ff",dot:"#7c3aed",label:"Upcoming"},{bg:"#fef2f2",dot:"#fca5a5",label:"Missed"},{bg:"#f9fafb",dot:"#d1d5db",label:"Rest / none"}].map(item=>(
            <div key={item.label} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"14px",height:"14px",borderRadius:"4px",background:item.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"5px",height:"5px",borderRadius:"50%",background:item.dot}}/>
              </div>
              <span style={{fontSize:"10px",color:"#9ca3af"}}>{item.label}</span>
            </div>
          ))}
        </div>
        {selected && (
          <div style={{marginTop:"12px",background:"#f9fafb",borderRadius:"12px",padding:"12px 14px",border:"1px solid #f3f4f6"}}>
            {selEntry && selBadge ? (
              <>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"8px",background:selBadge.bg,color:selBadge.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",fontWeight:700,flexShrink:0}}>{selBadge.label}</div>
                  <div>
                    <p style={{fontSize:"13px",fontWeight:500,color:"#1f2937",margin:0}}>{selEntry.dayName}</p>
                    <p style={{fontSize:"11px",color:"#9ca3af",margin:"1px 0 0"}}>{MONTH_NAMES[parseInt(selected.split("-")[1])-1]} {parseInt(selected.split("-")[2])} · completed</p>
                  </div>
                </div>
                <div style={{display:"flex",gap:"8px"}}>
                  {[{val:fmtTime(selEntry.timeElapsed),lbl:"Duration"},{val:String(selEntry.exerciseCount),lbl:"Exercises"},{val:"100%",lbl:"Completed"}].map(s=>(
                    <div key={s.lbl} style={{flex:1,background:"white",border:"1px solid #f3f4f6",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"14px",fontWeight:500,color:"#1f2937"}}>{s.val}</div>
                      <div style={{fontSize:"10px",color:"#9ca3af",marginTop:"2px"}}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (isUpcoming || isTodaySched) && selSched ? (
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <p style={{fontSize:"13px",fontWeight:500,color:"#7c3aed",margin:0}}>{selSched.name}</p>
                  <p style={{fontSize:"11px",color:"#9ca3af",margin:"1px 0 0"}}>{MONTH_NAMES[parseInt(selected.split("-")[1])-1]} {parseInt(selected.split("-")[2])} · {isTodaySched ? "scheduled for today" : "scheduled"}</p>
                </div>
              </div>
            ) : isMissed ? (
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <p style={{fontSize:"13px",fontWeight:500,color:"#dc2626",margin:0}}>Missed workout</p>
                  <p style={{fontSize:"11px",color:"#9ca3af",margin:"1px 0 0"}}>{MONTH_NAMES[parseInt(selected.split("-")[1])-1]} {parseInt(selected.split("-")[2])} · scheduled but not completed</p>
                </div>
              </div>
            ) : (
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <div>
                  <p style={{fontSize:"13px",fontWeight:500,color:"#6b7280",margin:0}}>Rest day</p>
                  <p style={{fontSize:"11px",color:"#9ca3af",margin:"1px 0 0"}}>{MONTH_NAMES[parseInt(selected.split("-")[1])-1]} {parseInt(selected.split("-")[2])} · no workout scheduled</p>
                </div>
              </div>
            )}
          </div>
        )}
        <div style={{marginTop:"12px",display:"flex",gap:"8px"}}>
          <div style={{flex:1,background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"12px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <div style={{fontSize:"18px",fontWeight:500,color:"#1f2937",lineHeight:1}}>{streak}</div>
              <div style={{fontSize:"10px",color:"#9ca3af",marginTop:"2px"}}>day streak</div>
            </div>
          </div>
          <div style={{flex:1,background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"12px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"28px",height:"28px",borderRadius:"8px",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div style={{fontSize:"18px",fontWeight:500,color:"#1f2937",lineHeight:1}}>{monthDone}</div>
              <div style={{fontSize:"10px",color:"#9ca3af",marginTop:"2px"}}>this month</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}