"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { getWorkoutLogs, getWorkoutPlan } from "@/lib/supabase";

type LogEntry = { dayName: string; duration: string; exerciseCount: number; timeElapsed: number };
type PlanDay = { day: string; type: string; name: string; duration?: string };

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOT_COLORS: Record<string,string> = { Monday:"#4f46e5",Tuesday:"#16a34a",Wednesday:"#ea580c",Thursday:"#9333ea",Friday:"#e11d48",Saturday:"#0284c7",Sunday:"#78716c" };
const BADGE: Record<string,{bg:string;text:string;label:string}> = {
  Monday:{bg:"#eef2ff",text:"#4338ca",label:"MON"},Tuesday:{bg:"#f0fdf4",text:"#15803d",label:"TUE"},
  Wednesday:{bg:"#fff7ed",text:"#c2410c",label:"WED"},Thursday:{bg:"#faf5ff",text:"#7e22ce",label:"THU"},
  Friday:{bg:"#fff1f2",text:"#be123c",label:"FRI"},Saturday:{bg:"#f0f9ff",text:"#0369a1",label:"SAT"},
  Sunday:{bg:"#fafaf9",text:"#57534e",label:"SUN"},
};

function pad(n:number){return String(n).padStart(2,"0");}
function toDateStr(d:Date){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;}
function getDayName(d:Date){return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()];}
function fmtTime(s:number){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60;return h>0?`${h}:${pad(m)}:${pad(sc)}`:`${pad(m)}:${pad(sc)}`;}
function getWeekKey(date:Date){const jan4=new Date(date.getFullYear(),0,4);const dayOfYear=Math.floor((date.getTime()-new Date(date.getFullYear(),0,0).getTime())/86400000);const weekNum=Math.ceil((dayOfYear+jan4.getDay())/7);return `${date.getFullYear()}-W${String(weekNum).padStart(2,"0")}`;}
type CT="completed"|"today-done"|"today-sched"|"today"|"upcoming"|"missed"|"empty";

export default function CalendarTab({ workoutLog: propLog, isDesktop }: { workoutLog: Record<string, LogEntry>; isDesktop?: boolean }) {
  const { data: session } = useSession();
  const userId = session?.user?.id||session?.user?.email||"";
  const [now]=useState(()=>{const d=new Date();return {year:d.getFullYear(),month:d.getMonth(),date:d.getDate(),day:d.getDay()};});
  const todayStr=`${now.year}-${pad(now.month+1)}-${pad(now.date)}`;
  const [viewYear,setViewYear]=useState(now.year);
  const [viewMonth,setViewMonth]=useState(now.month);
  const [selected,setSelected]=useState<string|null>(todayStr);
  const [schedMap,setSchedMap]=useState<Record<string,{name:string;dayName:string}>>({});
  const [fullLog,setFullLog]=useState<Record<string,LogEntry>>(propLog);

  useEffect(()=>{
    if(!userId)return;
    async function load(){
      const [logs,plan]=await Promise.all([getWorkoutLogs(userId),getWorkoutPlan(userId,getWeekKey(new Date()))]);
      setFullLog(logs);
      if(!plan)return;
      const days=(plan as any).days as PlanDay[];
      if(!Array.isArray(days))return;
      const offset=now.day===0?-6:1-now.day;
      const monday=new Date(now.year,now.month,now.date+offset);
      const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      const result:Record<string,{name:string;dayName:string}>={};
      days.forEach((d,i)=>{
        if(d.type==="workout"){
          const dt=new Date(monday.getFullYear(),monday.getMonth(),monday.getDate()+i);
          result[toDateStr(dt)]={name:d.name||"",dayName:dayNames[i]};
        }
      });
      setSchedMap(result);
    }
    load();
  },[userId]);

  function prevMonth(){if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);setSelected(null);}
  function nextMonth(){if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);setSelected(null);}

  const firstDay=new Date(viewYear,viewMonth,1).getDay();
  const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
  function ds(day:number){return `${viewYear}-${pad(viewMonth+1)}-${pad(day)}`;}

  function cellType(day:number):CT{
    const s=ds(day);
    const cellDate=new Date(viewYear,viewMonth,day);
    const todayDate=new Date(now.year,now.month,now.date);
    const hasLog=!!fullLog[s];const hasSched=!!schedMap[s];const isToday=s===todayStr;
    if(isToday&&hasLog)return "today-done";
    if(isToday&&hasSched)return "today-sched";
    if(isToday)return "today";
    if(hasLog)return "completed";
    if(cellDate<todayDate&&hasSched)return "missed";
    if(cellDate>todayDate&&hasSched)return "upcoming";
    return "empty";
  }

  function cellStyle(ct:CT):{bg:string;num:string}{
    if(ct==="completed")return{bg:"#eef2ff",num:"#4338ca"};
    if(ct==="today-done"||ct==="today-sched"||ct==="today")return{bg:"#1a1a2e",num:"white"};
    if(ct==="upcoming")return{bg:"#f5f3ff",num:"#7c3aed"};
    if(ct==="missed")return{bg:"#fef2f2",num:"#dc2626"};
    return{bg:"#f9fafb",num:"#d1d5db"};
  }

  const monthPfx=`${viewYear}-${pad(viewMonth+1)}`;
  const monthDone=Object.keys(fullLog).filter(d=>d.startsWith(monthPfx)).length;
  const upcoming=Object.keys(schedMap).filter(d=>new Date(d+"T00:00:00")>new Date(now.year,now.month,now.date)).length;
  let streak=0;const sc=new Date(now.year,now.month,now.date);while(fullLog[toDateStr(sc)]){streak++;sc.setDate(sc.getDate()-1);}

  const selEntry=selected?fullLog[selected]:null;
  const selSched=selected?schedMap[selected]:null;
  const selDate=selected?new Date(parseInt(selected.split("-")[0]),parseInt(selected.split("-")[1])-1,parseInt(selected.split("-")[2])):null;
  const todayDate=new Date(now.year,now.month,now.date);
  const selBadge=selected?BADGE[getDayName(new Date(parseInt(selected.split("-")[0]),parseInt(selected.split("-")[1])-1,parseInt(selected.split("-")[2])))]:null;
  const isMissed=!!(selected&&!selEntry&&selSched&&selDate&&selDate<todayDate);
  const isUpcoming=!!(selected&&!selEntry&&selSched&&selDate&&selDate>=todayDate&&selected!==todayStr);
  const isTodaySched=!!(selected===todayStr&&!selEntry&&selSched);

  const GRID: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:"4px" };

  const cells:(number|null)[]=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);

  // desktop cell height — fixed so they don't grow with page width
  const CELL_H = isDesktop ? "44px" : undefined;
  const CELL_ASPECT = isDesktop ? undefined : "1";

  const CalendarGrid=()=>(
    <>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <button onClick={prevMonth} style={{width:"28px",height:"28px",borderRadius:"7px",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:"13px",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"}}>‹</button>
        <span style={{fontSize:"13px",fontWeight:500,color:"#1f2937"}}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{width:"28px",height:"28px",borderRadius:"7px",border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",fontSize:"13px",color:"#6b7280",display:"flex",alignItems:"center",justifyContent:"center"}}>›</button>
      </div>

      {/* Day headers — same grid as cells */}
      <div style={{...GRID, marginBottom:"4px"}}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=>(
          <div key={d} style={{textAlign:"center",fontSize:"11px",color:"#9ca3af",fontWeight:500,padding:"3px 0"}}>{d}</div>
        ))}
      </div>

      {/* Day cells — fixed height on desktop, aspect-ratio on mobile */}
      <div style={GRID}>
        {cells.map((day,i)=>{
          if(day===null)return <div key={`e-${i}`}/>;
          const s=ds(day);const ct=cellType(day);const{bg,num}=cellStyle(ct);const isSel=selected===s;
          const dotC=fullLog[s]?DOT_COLORS[getDayName(new Date(viewYear,viewMonth,day))]:null;
          return (
            <div key={s} onClick={()=>setSelected(isSel?null:s)}
              style={{
                height:CELL_H,
                aspectRatio:CELL_ASPECT,
                borderRadius:"8px",
                background:bg,
                border:isSel?"2px solid #4f46e5":"1.5px solid transparent",
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                gap:"3px",
                cursor:"pointer",
                transition:"border 0.15s",
              }}>
              <span style={{fontSize:"12px",fontWeight:500,color:num,lineHeight:1}}>{day}</span>
              {ct==="completed"&&dotC&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:dotC}}/>}
              {ct==="today-done"&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"rgba(255,255,255,0.7)"}}/>}
              {ct==="today-sched"&&<div style={{width:"5px",height:"5px",borderRadius:"50%",background:"rgba(255,255,255,0.9)"}}/>}
              {ct==="upcoming"&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#7c3aed",opacity:0.7}}/>}
              {ct==="missed"&&<div style={{width:"4px",height:"4px",borderRadius:"50%",background:"#fca5a5"}}/>}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:"12px",marginTop:"10px",flexWrap:"wrap"}}>
        {[{bg:"#eef2ff",border:"#4f46e5",label:"Completed"},{bg:"#f5f3ff",border:"#7c3aed",label:"Upcoming"},{bg:"#fef2f2",border:"#fca5a5",label:"Missed"},{bg:"#f9fafb",border:"#e5e7eb",label:"Rest / none"}].map(item=>(
          <div key={item.label} style={{display:"flex",alignItems:"center",gap:"5px"}}>
            <div style={{width:"10px",height:"10px",borderRadius:"3px",background:item.bg,border:`1px solid ${item.border}`}}/>
            <span style={{fontSize:"11px",color:"#9ca3af"}}>{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );

  const DetailCard=()=>(
    <>
      {selected&&(
        <div style={{background:"#f9fafb",borderRadius:"10px",padding:"12px 14px",border:"1px solid #f3f4f6"}}>
          {selEntry&&selBadge?(
            <>
              <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}>
                <div style={{width:"34px",height:"34px",borderRadius:"8px",background:selBadge.bg,color:selBadge.text,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",fontWeight:700,flexShrink:0}}>{selBadge.label}</div>
                <div>
                  <p style={{fontSize:"13px",fontWeight:500,color:"#1f2937",margin:0}}>{selEntry.dayName}</p>
                  <p style={{fontSize:"11px",color:"#9ca3af",margin:"2px 0 0"}}>{MONTH_NAMES[parseInt(selected!.split("-")[1])-1]} {parseInt(selected!.split("-")[2])} · completed</p>
                </div>
              </div>
              <div style={{display:"flex",gap:"8px"}}>
                {[{val:fmtTime(selEntry.timeElapsed),lbl:"Duration"},{val:String(selEntry.exerciseCount),lbl:"Exercises"},{val:"100%",lbl:"Completed"}].map(s=>(
                  <div key={s.lbl} style={{flex:1,background:"white",border:"1px solid #f3f4f6",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:"14px",fontWeight:500,color:"#1f2937"}}>{s.val}</div>
                    <div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </>
          ):(isUpcoming||isTodaySched)&&selSched?(
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"34px",height:"34px",borderRadius:"8px",background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
              <div><p style={{fontSize:"13px",fontWeight:500,color:"#7c3aed",margin:0}}>{selSched.name}</p><p style={{fontSize:"11px",color:"#9ca3af",margin:"2px 0 0"}}>{MONTH_NAMES[parseInt(selected!.split("-")[1])-1]} {parseInt(selected!.split("-")[2])} · {isTodaySched?"scheduled for today":"scheduled"}</p></div>
            </div>
          ):isMissed?(
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"34px",height:"34px",borderRadius:"8px",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div><p style={{fontSize:"13px",fontWeight:500,color:"#dc2626",margin:0}}>Missed workout</p><p style={{fontSize:"11px",color:"#9ca3af",margin:"2px 0 0"}}>{MONTH_NAMES[parseInt(selected!.split("-")[1])-1]} {parseInt(selected!.split("-")[2])} · scheduled but not completed</p></div>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{width:"34px",height:"34px",borderRadius:"8px",background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
              <div><p style={{fontSize:"13px",fontWeight:500,color:"#6b7280",margin:0}}>Rest day</p><p style={{fontSize:"11px",color:"#9ca3af",margin:"2px 0 0"}}>{MONTH_NAMES[parseInt(selected!.split("-")[1])-1]} {parseInt(selected!.split("-")[2])} · no workout scheduled</p></div>
            </div>
          )}
        </div>
      )}
    </>
  );

  const StatsRow=()=>(
    <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
      <div style={{flex:1,background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"10px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
        <div style={{width:"24px",height:"24px",borderRadius:"6px",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
        <div><div style={{fontSize:"16px",fontWeight:500,color:"#1f2937",lineHeight:1}}>{streak}</div><div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>day streak</div></div>
      </div>
      <div style={{flex:1,background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"10px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
        <div style={{width:"24px",height:"24px",borderRadius:"6px",background:"#eef2ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
        <div><div style={{fontSize:"16px",fontWeight:500,color:"#1f2937",lineHeight:1}}>{monthDone}</div><div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>this month</div></div>
      </div>
      {upcoming>0&&(
        <div style={{flex:1,background:"#f9fafb",border:"1px solid #f3f4f6",borderRadius:"10px",padding:"10px 12px",display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"24px",height:"24px",borderRadius:"6px",background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div><div style={{fontSize:"16px",fontWeight:500,color:"#1f2937",lineHeight:1}}>{upcoming}</div><div style={{fontSize:"11px",color:"#9ca3af",marginTop:"2px"}}>upcoming</div></div>
        </div>
      )}
    </div>
  );

  // ── DESKTOP ──────────────────────────────────────────────────────────────────
  if(isDesktop){return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{background:"#1a1a2e",padding:"24px 28px 20px",flexShrink:0}}>
        <h1 style={{color:"white",fontSize:"22px",fontWeight:500,margin:"0 0 4px"}}>Monthly calendar</h1>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"13px",margin:0}}>{MONTH_NAMES[viewMonth]} {viewYear} · {monthDone} completed · {upcoming} upcoming</p>
      </div>
      {/* Outer scroll area with generous padding on all sides */}
      <div style={{flex:1,overflowY:"auto",padding:"32px 48px"}}>
        {/* Card constrained to 700px and centered — cells are fixed 44px height so they never grow huge */}
        <div style={{background:"white",borderRadius:"16px",border:"1px solid #f3f4f6",padding:"24px",maxWidth:"700px",margin:"0 auto"}}>
          <CalendarGrid/>
          {selected&&(
            <>
              <div style={{height:"1px",background:"#f3f4f6",margin:"14px 0"}}/>
              <DetailCard/>
            </>
          )}
          <StatsRow/>
        </div>
      </div>
    </div>
  );}

  // ── MOBILE ───────────────────────────────────────────────────────────────────
  return(
    <>
      <div style={{background:"#1a1a2e",padding:"20px"}}>
        <h1 style={{color:"white",fontSize:"18px",fontWeight:500,margin:0}}>Monthly calendar</h1>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",margin:"4px 0 0"}}>{MONTH_NAMES[viewMonth]} {viewYear} · {monthDone} completed · {upcoming} upcoming</p>
      </div>
      <div style={{padding:"16px"}}>
        <CalendarGrid/>
        {selected&&(
          <>
            <div style={{height:"1px",background:"#f3f4f6",margin:"12px 0"}}/>
            <DetailCard/>
          </>
        )}
        <StatsRow/>
      </div>
    </>
  );
}