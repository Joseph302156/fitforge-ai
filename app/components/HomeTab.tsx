"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getWorkoutLogs, getWorkoutPlan, getNutritionLogs, getNutritionGoals } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────
type Day = { day: string; type: string; name: string; duration?: string; exercises?: string[] };
type Plan = { days: Day[]; tip?: string };
type LogEntry = { dayName: string; duration: string; exerciseCount: number; timeElapsed: number };
type Meal = { id: string; name: string; calories: number; protein: number; carbs: number; fat: number };
type ChatMsg = { role: "user" | "assistant"; content: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function localDateStr(date: Date) { return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
function getWeekKey(date: Date) {
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2,"0")}`;
}

const DAYS_OF_WEEK = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const DAY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  Monday:    { bg:"#eef2ff", text:"#4338ca", border:"#c7d2fe", badge:"MON" },
  Tuesday:   { bg:"#f0fdf4", text:"#15803d", border:"#bbf7d0", badge:"TUE" },
  Wednesday: { bg:"#fff7ed", text:"#c2410c", border:"#fed7aa", badge:"WED" },
  Thursday:  { bg:"#faf5ff", text:"#7e22ce", border:"#e9d5ff", badge:"THU" },
  Friday:    { bg:"#fff1f2", text:"#be123c", border:"#fecdd3", badge:"FRI" },
  Saturday:  { bg:"#f0f9ff", text:"#0369a1", border:"#bae6fd", badge:"SAT" },
  Sunday:    { bg:"#fafaf9", text:"#57534e", border:"#e7e5e4", badge:"SUN" },
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fmtTime(s: number) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = s%60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sc)}` : `${pad(m)}:${pad(sc)}`;
}

// ── HomeTab ───────────────────────────────────────────────────────────────────
export default function HomeTab({ onStartWorkout }: { onStartWorkout?: () => void }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || "";
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const today = new Date();
  const todayStr = localDateStr(today);
  const currentDayName = DAYS_OF_WEEK[today.getDay() === 0 ? 6 : today.getDay() - 1];
  const currentDayIndex = DAYS_OF_WEEK.indexOf(currentDayName);

  // ── State ─────────────────────────────────────────────────────────────────
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workoutLog, setWorkoutLog] = useState<Record<string, LogEntry>>({});
  const [nutritionData, setNutritionData] = useState<Record<string, { meals: Meal[] }>>({});
  const [goals, setGoals] = useState({ calories: 2200, protein: 150, carbs: 200, fat: 70 });
  const [loaded, setLoaded] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load data from Supabase ───────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    async function load() {
      const [logs, planData, nutritionLogs, savedGoals] = await Promise.all([
        getWorkoutLogs(userId),
        getWorkoutPlan(userId, getWeekKey(today)),
        getNutritionLogs(userId),
        getNutritionGoals(userId),
      ]);
      setWorkoutLog(logs as Record<string, LogEntry>);
      if (planData) setPlan(planData as Plan);
      const typedLogs: Record<string, { meals: Meal[] }> = {};
      Object.entries(nutritionLogs).forEach(([date, entry]) => {
        typedLogs[date] = { meals: (entry as any).meals || [] };
      });
      setNutritionData(typedLogs);
      if (savedGoals) setGoals(savedGoals as any);
      setLoaded(true);
    }
    load();
  }, [userId]);

  // ── Auto-generate daily summary once data loads ───────────────────────────
  useEffect(() => {
    if (!loaded || summaryLoaded || !userId) return;
    setSummaryLoaded(true);
    generateSummary();
  }, [loaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // ── Computed values ───────────────────────────────────────────────────────
  const todayMeals = nutritionData[todayStr]?.meals || [];
  const todayCalories = todayMeals.reduce((s, m) => s + m.calories, 0);
  const todayProtein = todayMeals.reduce((s, m) => s + m.protein, 0);

  // Streak
  let streak = 0;
  const check = new Date(today);
  while (workoutLog[localDateStr(check)]) { streak++; check.setDate(check.getDate() - 1); }

  // Weekly workout count
  const weekDates = DAYS_OF_WEEK.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - currentDayIndex + i);
    return localDateStr(d);
  });
  const weeklyDone = weekDates.filter(d => workoutLog[d]).length;
  const weeklyTotal = plan?.days.filter(d => d.type === "workout").length || 0;

  // Today's workout
  const todayWorkout = plan?.days.find(d => d.day === currentDayName && d.type === "workout");
  const todayCompleted = todayWorkout && workoutLog[todayStr]?.dayName === todayWorkout.name;

  // Rest of week — from today onwards
  const weekPlan = plan?.days.map((d, i) => {
    const dayDate = new Date(today);
    dayDate.setDate(today.getDate() - currentDayIndex + i);
    const dateStr = localDateStr(dayDate);
    const isToday = d.day === currentDayName;
    const isPast = i < currentDayIndex;
    const isCompleted = d.type === "workout" && !!workoutLog[dateStr] && workoutLog[dateStr].dayName === d.name;
    return { ...d, dateStr, isToday, isPast, isCompleted };
  }).filter(d => !d.isPast || d.isCompleted) || [];

  // Build context string for AI
  function buildContext(): string {
    const lines = [
      `User name: ${firstName}`,
      `Today: ${currentDayName}, ${today.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" })}`,
      `Workout streak: ${streak} days`,
      `Weekly workouts: ${weeklyDone} completed out of ${weeklyTotal} planned`,
      `Today's workout: ${todayWorkout ? `${todayWorkout.name} (${todayWorkout.duration}, ${todayWorkout.exercises?.length} exercises)` : "Rest day"}`,
      `Today's workout status: ${todayCompleted ? "Completed" : todayWorkout ? "Not yet done" : "Rest day"}`,
      `Today's calories: ${todayCalories} of ${goals.calories} kcal goal`,
      `Today's protein: ${todayProtein}g of ${goals.protein}g goal`,
      `Today's carbs goal: ${goals.carbs}g, fat goal: ${goals.fat}g`,
    ];
    if (plan?.days) {
      lines.push("This week's plan:");
      plan.days.forEach(d => {
        lines.push(`  ${d.day}: ${d.type === "rest" ? "Rest day" : `${d.name} (${d.duration})`}`);
      });
    }
    return lines.join("\n");
  }

  async function generateSummary() {
    setChatLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: buildContext(),
          messages: [{ role: "user", content: "Give me my daily overview and coaching summary for today." }],
        }),
      });
      const data = await res.json();
      setMsgs([{ role: "assistant", content: data.message }]);
    } catch {
      setMsgs([{ role: "assistant", content: "Hey! I'm your AI coach. Ask me anything about your workouts, nutrition, or fitness goals!" }]);
    } finally {
      setChatLoading(false);
    }
  }

  async function sendMessage(text?: string) {
    const t = text || input.trim();
    if (!t || chatLoading) return;
    setInput("");
    setChatLoading(true);
    const newMsgs: ChatMsg[] = [...msgs, { role: "user", content: t }];
    setMsgs(newMsgs);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: buildContext(),
          messages: newMsgs,
        }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: "assistant", content: data.message }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setChatLoading(false);
    }
  }

  const SUGGESTIONS = [
    "What should I eat after today's workout?",
    "Find me a YouTube tutorial for bench press form",
    "How do I stay motivated this week?",
    "What's a good warm-up for upper body?",
  ];

  if (!loaded) {
    return (
      <>
        <div style={{ background:"#1a1a2e", padding:"20px" }}>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:"0 0 2px" }}>{getGreeting()}, {firstName}</p>
          <h1 style={{ color:"white", fontSize:"18px", fontWeight:500, margin:0 }}>Today's overview</h1>
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"64px 0" }}>
          <div style={{ width:"24px", height:"24px", borderRadius:"50%", border:"2px solid #e5e7eb", borderTopColor:"#6366f1", animation:"spin 0.8s linear infinite" }} />
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ background:"#1a1a2e", padding:"20px 20px 16px" }}>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:"0 0 2px" }}>{getGreeting()}, {firstName}</p>
        <h1 style={{ color:"white", fontSize:"18px", fontWeight:500, margin:"0 0 14px" }}>Today's overview</h1>

        {/* Today's workout card */}
        {todayWorkout && !todayCompleted && (
          <div style={{ background:"rgba(255,255,255,0.08)", borderRadius:"12px", padding:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
              </svg>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:"white", fontSize:"13px", fontWeight:500, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{todayWorkout.name}</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"10px", margin:"2px 0 0" }}>Today · {todayWorkout.duration} · {todayWorkout.exercises?.length} exercises</p>
            </div>
            <button onClick={onStartWorkout}
              style={{ background:"#4f46e5", border:"none", borderRadius:"8px", padding:"7px 12px", fontSize:"11px", color:"white", fontWeight:500, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" }}>
              Start →
            </button>
          </div>
        )}

        {todayCompleted && (
          <div style={{ background:"rgba(34,197,94,0.15)", borderRadius:"12px", padding:"12px", display:"flex", alignItems:"center", gap:"10px", border:"1px solid rgba(34,197,94,0.3)" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ color:"white", fontSize:"13px", fontWeight:500, margin:0 }}>{todayWorkout?.name} — done!</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"10px", margin:"2px 0 0" }}>
                {fmtTime(workoutLog[todayStr]?.timeElapsed || 0)} · {workoutLog[todayStr]?.exerciseCount} exercises completed
              </p>
            </div>
          </div>
        )}

        {!todayWorkout && (
          <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:"12px", padding:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              </svg>
            </div>
            <div>
              <p style={{ color:"white", fontSize:"13px", fontWeight:500, margin:0 }}>Rest day</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"10px", margin:"2px 0 0" }}>No workout scheduled — recover well!</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ padding:"14px", display:"flex", flexDirection:"column", gap:"14px" }}>

        {/* Stats grid */}
        <div>
          <p style={{ fontSize:"10px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Your stats</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>

            <div style={{ background:"#f9fafb", borderRadius:"10px", padding:"10px 12px", border:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"6px", background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span style={{ fontSize:"10px", color:"#9ca3af" }}>Streak</span>
              </div>
              <div style={{ fontSize:"24px", fontWeight:500, color:"#1f2937" }}>{streak}</div>
              <div style={{ fontSize:"10px", color:"#9ca3af" }}>days in a row</div>
            </div>

            <div style={{ background:"#f9fafb", borderRadius:"10px", padding:"10px 12px", border:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"6px", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <span style={{ fontSize:"10px", color:"#9ca3af" }}>This week</span>
              </div>
              <div style={{ fontSize:"24px", fontWeight:500, color:"#1f2937" }}>
                {weeklyDone}<span style={{ fontSize:"13px", color:"#9ca3af" }}>/{weeklyTotal || "—"}</span>
              </div>
              <div style={{ fontSize:"10px", color:"#9ca3af" }}>workouts done</div>
            </div>

            <div style={{ background:"#f9fafb", borderRadius:"10px", padding:"10px 12px", border:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"6px", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <span style={{ fontSize:"10px", color:"#9ca3af" }}>Calories</span>
              </div>
              <div style={{ fontSize:"24px", fontWeight:500, color:"#1f2937" }}>{todayCalories.toLocaleString()}</div>
              <div style={{ fontSize:"10px", color:"#9ca3af" }}>of {goals.calories.toLocaleString()} today</div>
            </div>

            <div style={{ background:"#f9fafb", borderRadius:"10px", padding:"10px 12px", border:"1px solid #f3f4f6" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" }}>
                <div style={{ width:"20px", height:"20px", borderRadius:"6px", background:"#f0fdf4", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                </div>
                <span style={{ fontSize:"10px", color:"#9ca3af" }}>Protein</span>
              </div>
              <div style={{ fontSize:"24px", fontWeight:500, color:"#1f2937" }}>{todayProtein}<span style={{ fontSize:"13px", color:"#9ca3af" }}>g</span></div>
              <div style={{ fontSize:"10px", color:"#9ca3af" }}>of {goals.protein}g goal</div>
            </div>

          </div>
        </div>

        {/* Rest of week */}
        {weekPlan.length > 0 && (
          <div>
            <p style={{ fontSize:"10px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>Rest of the week</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {weekPlan.map(d => {
                const c = DAY_COLORS[d.day];
                if (d.isCompleted) {
                  return (
                    <div key={d.day} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 10px", background:"#f0fdf4", borderRadius:"10px", border:"1px solid #bbf7d0" }}>
                      <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#f0fdf4", border:"1px solid #bbf7d0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:500, color:"#15803d", flexShrink:0 }}>{c.badge}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:"11px", fontWeight:500, color:"#15803d", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</p>
                        <p style={{ fontSize:"10px", color:"#86efac", margin:"1px 0 0" }}>
                          Completed · {fmtTime(workoutLog[d.dateStr]?.timeElapsed || 0)}
                        </p>
                      </div>
                      <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:"#22c55e", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>
                  );
                }
                if (d.type === "rest") {
                  return (
                    <div key={d.day} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 10px", background:"#f9fafb", borderRadius:"10px", border:"1px solid #f3f4f6", opacity:0.6 }}>
                      <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:500, color:"#9ca3af", flexShrink:0 }}>{c.badge}</div>
                      <p style={{ fontSize:"11px", color:"#9ca3af", margin:0 }}>Rest day</p>
                    </div>
                  );
                }
                if (d.isToday) {
                  return (
                    <div key={d.day} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 10px", background:c.bg, borderRadius:"10px", border:`1px solid ${c.border}` }}>
                      <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:c.bg, border:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:500, color:c.text, flexShrink:0 }}>{c.badge}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:"11px", fontWeight:500, color:c.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</p>
                        <p style={{ fontSize:"10px", color:c.text, opacity:0.6, margin:"1px 0 0" }}>Today · {d.duration}</p>
                      </div>
                      <div style={{ background:c.text, borderRadius:"6px", padding:"3px 8px", fontSize:"9px", color:"white", fontWeight:500, flexShrink:0 }}>Today</div>
                    </div>
                  );
                }
                return (
                  <div key={d.day} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 10px", background:"#f9fafb", borderRadius:"10px", border:"1px solid #f3f4f6", opacity:0.75 }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:500, color:"#9ca3af", flexShrink:0 }}>{c.badge}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:"11px", fontWeight:500, color:"#6b7280", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</p>
                      <p style={{ fontSize:"10px", color:"#9ca3af", margin:"1px 0 0" }}>{d.day} · {d.duration}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Coach chat */}
        <div>
          <p style={{ fontSize:"10px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", margin:"0 0 8px" }}>AI coach</p>
          <div style={{ background:"#f9fafb", borderRadius:"12px", border:"1px solid #f3f4f6", overflow:"hidden" }}>

            {/* Messages */}
            <div style={{ padding:"12px", display:"flex", flexDirection:"column", gap:"10px", maxHeight:"300px", overflowY:"auto" }}>

              {msgs.length === 0 && chatLoading && (
                <div style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div style={{ padding:"9px 12px", borderRadius:"16px", borderBottomLeftRadius:"4px", background:"#f3f4f6" }}>
                    <div style={{ display:"flex", gap:"4px", alignItems:"center", height:"16px" }}>
                      {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#9ca3af", animation:`bounce 1s infinite ${d}s` }}/>)}
                    </div>
                  </div>
                </div>
              )}

              {msgs.map((m, i) => (
                <div key={i} style={{ display:"flex", justifyContent:m.role==="user" ? "flex-end" : "flex-start", gap:"8px", alignItems:"flex-start" }}>
                  {m.role === "assistant" && (
                    <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:"2px" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                  )}
                  <div style={{ maxWidth:"82%", fontSize:"12px", lineHeight:1.6, padding:"9px 12px", borderRadius:"16px", background:m.role==="user" ? "#1a1a2e" : "#f3f4f6", color:m.role==="user" ? "white" : "#374151", borderBottomRightRadius:m.role==="user" ? "4px" : "16px", borderBottomLeftRadius:m.role==="assistant" ? "4px" : "16px" }}>
                    {m.content}
                  </div>
                </div>
              ))}

              {msgs.length > 0 && chatLoading && (
                <div style={{ display:"flex", gap:"8px", alignItems:"flex-start" }}>
                  <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#eef2ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <div style={{ padding:"9px 12px", borderRadius:"16px", borderBottomLeftRadius:"4px", background:"#f3f4f6" }}>
                    <div style={{ display:"flex", gap:"4px", alignItems:"center", height:"16px" }}>
                      {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#9ca3af", animation:`bounce 1s infinite ${d}s` }}/>)}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick suggestions — only before user has sent anything */}
              {msgs.length === 1 && !chatLoading && (
                <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)}
                      style={{ textAlign:"left", background:"white", border:"1px solid #f3f4f6", borderRadius:"10px", padding:"7px 12px", fontSize:"11px", color:"#6b7280", cursor:"pointer" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ display:"flex", gap:"8px", padding:"10px 12px", borderTop:"1px solid #f3f4f6", alignItems:"center" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                placeholder="Ask your AI coach anything..."
                disabled={chatLoading}
                style={{ flex:1, fontSize:"12px", background:"white", border:"1px solid #e5e7eb", borderRadius:"10px", padding:"8px 12px", color:"#374151", outline:"none" }}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || chatLoading}
                style={{ width:"32px", height:"32px", borderRadius:"9px", border:"none", background:input.trim() && !chatLoading ? "#4f46e5" : "#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !chatLoading ? "white" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </>
  );
}