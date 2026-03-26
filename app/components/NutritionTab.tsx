"use client";
import { useState, useEffect, useRef } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Meal = { id: string; name: string; calories: number; protein: number; carbs: number; fat: number };
type DayLog = { meals: Meal[] };
type NutritionData = { [dateStr: string]: DayLog };
type Goals = { calories: number; protein: number; carbs: number; fat: number };
type ChatMsg = { role: "user" | "assistant"; content: string; estimate?: Meal };

// ── Helpers ───────────────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, "0"); }
function toDateStr(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

function getWeekDays(today: Date) {
  const day = today.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
  return ["MON","TUE","WED","THU","FRI","SAT","SUN"].map((label, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return { label, num: d.getDate(), dateStr: toDateStr(d) };
  });
}

function sumDay(meals: Meal[]) {
  return meals.reduce((a, m) => ({ calories: a.calories+m.calories, protein: a.protein+m.protein, carbs: a.carbs+m.carbs, fat: a.fat+m.fat }), { calories:0, protein:0, carbs:0, fat:0 });
}

function getWeekAvg(data: NutritionData, weekDays: { dateStr: string }[]) {
  const days = weekDays.filter(d => data[d.dateStr]?.meals?.length > 0);
  if (!days.length) return 0;
  return Math.round(days.reduce((s, d) => s + sumDay(data[d.dateStr].meals).calories, 0) / days.length);
}

const DEFAULT_GOALS: Goals = { calories: 2200, protein: 150, carbs: 200, fat: 70 };

// ── EditIcon ──────────────────────────────────────────────────────────────────
function EditIcon({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width:"20px", height:"20px", borderRadius:"6px", border:`0.5px solid ${color}30`, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, padding:0 }}>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    </button>
  );
}

// ── EditGoalModal ─────────────────────────────────────────────────────────────
function EditGoalModal({ field, current, onSave, onClose }: { field: keyof Goals; current: number; onSave: (v: number) => void; onClose: () => void }) {
  const [val, setVal] = useState(String(current));
  const cfg = { calories:{label:"Calorie goal",unit:"kcal",color:"#4f46e5",bg:"#eef2ff"}, protein:{label:"Protein goal",unit:"g",color:"#15803d",bg:"#f0fdf4"}, carbs:{label:"Carbs goal",unit:"g",color:"#c2410c",bg:"#fff7ed"}, fat:{label:"Fat goal",unit:"g",color:"#7e22ce",bg:"#faf5ff"} }[field];
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"16px", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)" }}>
      <div style={{ width:"100%", maxWidth:"384px", background:"white", borderRadius:"20px", overflow:"hidden", animation:"slideUp 0.25s ease forwards" }}>
        <div style={{ background:"#1a1a2e", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ color:"white", fontSize:"14px", fontWeight:500, margin:0 }}>Edit {cfg.label.toLowerCase()}</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:"2px 0 0" }}>Set your daily target</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:"18px", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"20px" }}>
          <label style={{ display:"block", fontSize:"11px", color:"#9ca3af", fontWeight:500, marginBottom:"8px" }}>{cfg.label} ({cfg.unit})</label>
          <div style={{ display:"flex", gap:"10px", alignItems:"center", marginBottom:"20px" }}>
            <input type="number" value={val} onChange={e => setVal(e.target.value)}
              style={{ flex:1, background:cfg.bg, border:`1px solid ${cfg.color}40`, borderRadius:"12px", padding:"12px 14px", fontSize:"20px", fontWeight:500, color:cfg.color, outline:"none", textAlign:"center" }} />
            <span style={{ fontSize:"14px", color:"#9ca3af", flexShrink:0 }}>{cfg.unit}</span>
          </div>
          <button onClick={() => { const n=parseInt(val); if(n>0) onSave(n); }} style={{ width:"100%", background:"#1a1a2e", color:"white", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:500, cursor:"pointer", marginBottom:"8px" }}>Save goal</button>
          <button onClick={onClose} style={{ width:"100%", background:"transparent", color:"#9ca3af", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"10px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── AddMealModal ──────────────────────────────────────────────────────────────
function AddMealModal({ dateStr, onAdd, onClose }: { dateStr: string; onAdd: (m: Meal) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [err, setErr] = useState("");
  const dateObj = new Date(parseInt(dateStr.split("-")[0]), parseInt(dateStr.split("-")[1])-1, parseInt(dateStr.split("-")[2]));
  const dateLabel = dateObj.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
  const ib: React.CSSProperties = { width:"100%", border:"1px solid #e5e7eb", borderRadius:"10px", padding:"10px 12px", fontSize:"13px", color:"#374151", outline:"none", boxSizing:"border-box" };
  function handleAdd() {
    if (!name.trim()) { setErr("Please enter a food name."); return; }
    if (!calories || isNaN(Number(calories))) { setErr("Please enter valid calories."); return; }
    setErr("");
    onAdd({ id:Date.now().toString(), name:name.trim(), calories:Math.round(Number(calories)), protein:Math.round(Number(protein)||0), carbs:Math.round(Number(carbs)||0), fat:Math.round(Number(fat)||0) });
  }
  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"16px", background:"rgba(0,0,0,0.35)", backdropFilter:"blur(4px)" }}>
      <div style={{ width:"100%", maxWidth:"384px", background:"white", borderRadius:"20px", overflow:"hidden", animation:"slideUp 0.25s ease forwards" }}>
        <div style={{ background:"#1a1a2e", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <p style={{ color:"white", fontSize:"14px", fontWeight:500, margin:0 }}>Log a meal</p>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:"2px 0 0" }}>{dateLabel}</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:"18px", cursor:"pointer" }}>✕</button>
        </div>
        <div style={{ padding:"20px", maxHeight:"75vh", overflowY:"auto" }}>
          <label style={{ display:"block", fontSize:"11px", color:"#9ca3af", fontWeight:500, marginBottom:"6px" }}>Food name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grilled chicken breast" style={{ ...ib, background:"#f9fafb", marginBottom:"14px" }} />
          <label style={{ display:"block", fontSize:"11px", color:"#4338ca", fontWeight:500, marginBottom:"6px" }}>Calories (kcal)</label>
          <input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g. 280" style={{ ...ib, background:"#eef2ff", borderColor:"#c7d2fe", color:"#4338ca", marginBottom:"14px" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px", marginBottom:"14px" }}>
            <div><label style={{ display:"block", fontSize:"11px", color:"#15803d", fontWeight:500, marginBottom:"6px" }}>Protein (g)</label><input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="0" style={{ ...ib, background:"#f0fdf4", borderColor:"#bbf7d0", color:"#15803d" }} /></div>
            <div><label style={{ display:"block", fontSize:"11px", color:"#c2410c", fontWeight:500, marginBottom:"6px" }}>Carbs (g)</label><input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="0" style={{ ...ib, background:"#fff7ed", borderColor:"#fed7aa", color:"#c2410c" }} /></div>
            <div><label style={{ display:"block", fontSize:"11px", color:"#7e22ce", fontWeight:500, marginBottom:"6px" }}>Fat (g)</label><input type="number" value={fat} onChange={e => setFat(e.target.value)} placeholder="0" style={{ ...ib, background:"#faf5ff", borderColor:"#e9d5ff", color:"#7e22ce" }} /></div>
          </div>
          {err && <p style={{ fontSize:"12px", color:"#dc2626", marginBottom:"10px" }}>{err}</p>}
          <button onClick={handleAdd} style={{ width:"100%", background:"#1a1a2e", color:"white", border:"none", borderRadius:"12px", padding:"12px", fontSize:"13px", fontWeight:500, cursor:"pointer", marginBottom:"8px" }}>Add meal</button>
          <button onClick={onClose} style={{ width:"100%", background:"transparent", color:"#9ca3af", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"10px", fontSize:"12px", cursor:"pointer" }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── AIMealCalculator ──────────────────────────────────────────────────────────
function AIMealCalculator({ dateStr, onLog, onClose }: { dateStr: string; onLog: (m: Meal) => void; onClose: () => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{
    role: "assistant",
    content: "Hey! Describe what you ate and I'll calculate the nutrition for you. Be as specific as you can — include portion sizes, cooking methods, or brand names if you know them.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMeal, setPendingMeal] = useState<Meal | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dateObj = new Date(parseInt(dateStr.split("-")[0]), parseInt(dateStr.split("-")[1])-1, parseInt(dateStr.split("-")[2]));
  const dateLabel = dateObj.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  async function send(text?: string) {
    const t = text || input.trim();
    if (!t || loading) return;
    setInput("");
    setLoading(true);
    setPendingMeal(null);

    const newMsgs: ChatMsg[] = [...msgs, { role:"user", content:t }];
    setMsgs(newMsgs);

    try {
      const res = await fetch("/api/meal-calc", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ messages: newMsgs.map(m => ({ role:m.role, content:m.content })) }),
      });
      const data = await res.json();

      if (data.type === "estimate" && data.meal) {
        const meal: Meal = { id:Date.now().toString(), ...data.meal };
        setPendingMeal(meal);
        setMsgs(p => [...p, { role:"assistant", content:data.message, estimate:meal }]);
      } else {
        setMsgs(p => [...p, { role:"assistant", content:data.message }]);
      }
    } catch {
      setMsgs(p => [...p, { role:"assistant", content:"Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "2 scrambled eggs with toast",
    "Chipotle burrito bowl with chicken",
    "Large cheese pizza slice",
    "Protein shake with banana",
    "Caesar salad with grilled salmon",
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"flex-end", justifyContent:"center", padding:"16px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)" }}>
      <div style={{ width:"100%", maxWidth:"384px", background:"white", borderRadius:"24px", overflow:"hidden", maxHeight:"88vh", display:"flex", flexDirection:"column", animation:"slideUp 0.3s ease forwards" }}>

        {/* Header */}
        <div style={{ background:"#1a1a2e", padding:"16px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <p style={{ color:"white", fontSize:"14px", fontWeight:500, margin:0 }}>AI meal calculator</p>
              <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"11px", margin:"2px 0 0" }}>{dateLabel}</p>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:"18px", cursor:"pointer", lineHeight:1 }}>✕</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px", display:"flex", flexDirection:"column", gap:"12px" }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              <div style={{ display:"flex", justifyContent:m.role==="user" ? "flex-end" : "flex-start" }}>
                {m.role === "assistant" && (
                  <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:"8px", marginTop:"2px" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                  </div>
                )}
                <div style={{ maxWidth:"78%", fontSize:"12px", lineHeight:1.6, padding:"9px 12px", borderRadius:"16px", background:m.role==="user" ? "#1a1a2e" : "#f3f4f6", color:m.role==="user" ? "white" : "#374151", borderBottomRightRadius:m.role==="user" ? "4px" : "16px", borderBottomLeftRadius:m.role==="assistant" ? "4px" : "16px" }}>
                  {m.content}
                </div>
              </div>

              {/* Nutrition estimate card */}
              {m.estimate && (
                <div style={{ marginLeft:"34px", background:"white", border:"1px solid #e5e7eb", borderRadius:"14px", overflow:"hidden" }}>
                  <div style={{ background:"#f9fafb", padding:"10px 14px", borderBottom:"1px solid #f3f4f6" }}>
                    <p style={{ fontSize:"12px", fontWeight:500, color:"#1f2937", margin:0 }}>{m.estimate.name}</p>
                  </div>
                  <div style={{ padding:"10px 14px" }}>
                    {/* Calories row */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px", background:"#eef2ff", borderRadius:"8px", padding:"7px 10px" }}>
                      <span style={{ fontSize:"11px", fontWeight:500, color:"#4338ca" }}>Calories</span>
                      <span style={{ fontSize:"14px", fontWeight:500, color:"#1e1b4b" }}>{m.estimate.calories} kcal</span>
                    </div>
                    {/* Macros row */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"10px" }}>
                      <div style={{ background:"#f0fdf4", borderRadius:"8px", padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:"9px", color:"#15803d", fontWeight:500 }}>Protein</div>
                        <div style={{ fontSize:"14px", fontWeight:500, color:"#14532d" }}>{m.estimate.protein}g</div>
                      </div>
                      <div style={{ background:"#fff7ed", borderRadius:"8px", padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:"9px", color:"#c2410c", fontWeight:500 }}>Carbs</div>
                        <div style={{ fontSize:"14px", fontWeight:500, color:"#7c2d12" }}>{m.estimate.carbs}g</div>
                      </div>
                      <div style={{ background:"#faf5ff", borderRadius:"8px", padding:"6px 8px", textAlign:"center" }}>
                        <div style={{ fontSize:"9px", color:"#7e22ce", fontWeight:500 }}>Fat</div>
                        <div style={{ fontSize:"14px", fontWeight:500, color:"#581c87" }}>{m.estimate.fat}g</div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button
                        onClick={() => { onLog(m.estimate!); onClose(); }}
                        style={{ flex:1, background:"#1a1a2e", color:"white", border:"none", borderRadius:"10px", padding:"9px", fontSize:"12px", fontWeight:500, cursor:"pointer" }}>
                        Log this meal
                      </button>
                      <button
                        onClick={() => send("Can you adjust the estimate?")}
                        style={{ flex:1, background:"transparent", color:"#6b7280", border:"1px solid #e5e7eb", borderRadius:"10px", padding:"9px", fontSize:"12px", cursor:"pointer" }}>
                        Adjust
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading dots */}
          {loading && (
            <div style={{ display:"flex", justifyContent:"flex-start" }}>
              <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:"#fff7ed", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginRight:"8px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
              </div>
              <div style={{ padding:"9px 12px", borderRadius:"16px", borderBottomLeftRadius:"4px", background:"#f3f4f6" }}>
                <div style={{ display:"flex", gap:"4px", alignItems:"center", height:"16px" }}>
                  {[0,0.2,0.4].map((d,i) => <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#9ca3af", animation:`bounce 1s infinite ${d}s` }}/>)}
                </div>
              </div>
            </div>
          )}

          {/* Quick suggestions — only on first message */}
          {msgs.length === 1 && !loading && (
            <div style={{ display:"flex", flexDirection:"column", gap:"6px", marginTop:"4px" }}>
              <p style={{ fontSize:"10px", color:"#9ca3af", margin:0 }}>Try describing:</p>
              {suggestions.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ textAlign:"left", background:"#f9fafb", border:"1px solid #f3f4f6", borderRadius:"10px", padding:"8px 12px", fontSize:"11px", color:"#6b7280", cursor:"pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding:"12px 14px", borderTop:"1px solid #f3f4f6", flexShrink:0, display:"flex", gap:"8px", alignItems:"center" }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Describe what you ate..."
            disabled={loading}
            style={{ flex:1, fontSize:"12px", background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:"12px", padding:"9px 12px", color:"#374151", outline:"none" }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width:"34px", height:"34px", borderRadius:"10px", border:"none", background:input.trim() && !loading ? "#4f46e5" : "#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? "white" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── NutritionTab ──────────────────────────────────────────────────────────────
export default function NutritionTab() {
  const [today] = useState(() => new Date());
  const todayStr = toDateStr(today);
  const weekDays = getWeekDays(today);

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState<NutritionData>({});
  const [goals, setGoals] = useState<Goals>(DEFAULT_GOALS);
  const [editingGoal, setEditingGoal] = useState<keyof Goals | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAICalc, setShowAICalc] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem("fitforge_nutrition");
      if (d) setData(JSON.parse(d));
      const g = localStorage.getItem("fitforge_nutrition_goals");
      if (g) setGoals(JSON.parse(g));
    } catch { /* ignore */ }
  }, []);

  function saveData(nd: NutritionData) { setData(nd); localStorage.setItem("fitforge_nutrition", JSON.stringify(nd)); }
  function saveGoals(ng: Goals) { setGoals(ng); localStorage.setItem("fitforge_nutrition_goals", JSON.stringify(ng)); }

  function handleAddMeal(meal: Meal) {
    const existing = data[selectedDate]?.meals || [];
    saveData({ ...data, [selectedDate]: { meals: [...existing, meal] } });
    setShowAddMeal(false);
  }

  function handleLogAIMeal(meal: Meal) {
    const existing = data[selectedDate]?.meals || [];
    saveData({ ...data, [selectedDate]: { meals: [...existing, { ...meal, id: Date.now().toString() }] } });
  }

  function handleDeleteMeal(id: string) {
    const existing = data[selectedDate]?.meals || [];
    saveData({ ...data, [selectedDate]: { meals: existing.filter(m => m.id !== id) } });
  }

  const meals = data[selectedDate]?.meals || [];
  const totals = sumDay(meals);
  const weekAvg = getWeekAvg(data, weekDays);
  const calPct = Math.min(100, Math.round((totals.calories / goals.calories) * 100));

  const selDateObj = new Date(parseInt(selectedDate.split("-")[0]), parseInt(selectedDate.split("-")[1])-1, parseInt(selectedDate.split("-")[2]));
  const selDateLabel = selDateObj.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });

  return (
    <>
      {/* Header */}
      <div style={{ background:"#1a1a2e", padding:"20px" }}>
        <h1 style={{ color:"white", fontSize:"18px", fontWeight:500, margin:0 }}>Nutrition tracker</h1>
        <p style={{ color:"rgba(255,255,255,0.4)", fontSize:"12px", margin:"4px 0 0" }}>
          {weekAvg > 0 ? `Week of ${weekDays[0].num} · avg ${weekAvg.toLocaleString()} kcal/day` : "Log your meals to see weekly averages"}
        </p>
      </div>

      {/* Day strip */}
      <div style={{ display:"flex", gap:"4px", padding:"12px 14px", borderBottom:"1px solid #f3f4f6" }}>
        {weekDays.map(d => {
          const isSel = d.dateStr === selectedDate;
          const isToday = d.dateStr === todayStr;
          const hasData = !!(data[d.dateStr]?.meals?.length);
          return (
            <button key={d.dateStr} onClick={() => setSelectedDate(d.dateStr)}
              style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"7px 4px", borderRadius:"10px", border:isSel?"none":hasData?"1px solid #4f46e5":"1px solid transparent", background:isSel?"#1a1a2e":"transparent", cursor:"pointer", minWidth:"36px" }}>
              <span style={{ fontSize:"9px", fontWeight:500, color:isSel?"rgba(255,255,255,0.45)":"#9ca3af" }}>{d.label}</span>
              <span style={{ fontSize:"12px", fontWeight:500, color:isSel?"white":isToday||hasData?"#4f46e5":"#6b7280" }}>{d.num}</span>
              <div style={{ width:"4px", height:"4px", borderRadius:"50%", background:isSel?"rgba(255,255,255,0.35)":hasData?"#4f46e5":"transparent" }} />
            </button>
          );
        })}
      </div>

      <div style={{ padding:"14px" }}>

        {/* Calories card */}
        <div style={{ background:"#eef2ff", borderRadius:"12px", padding:"12px 14px", marginBottom:"8px" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"6px" }}>
            <div>
              <div style={{ fontSize:"10px", fontWeight:500, color:"#4338ca", marginBottom:"3px" }}>Calories</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"5px" }}>
                <span style={{ fontSize:"24px", fontWeight:500, color:"#1e1b4b" }}>{totals.calories.toLocaleString()}</span>
                <span style={{ fontSize:"11px", color:"#4338ca" }}>/ {goals.calories.toLocaleString()} kcal</span>
              </div>
            </div>
            <EditIcon color="#4f46e5" onClick={() => setEditingGoal("calories")} />
          </div>
          <div style={{ height:"5px", background:"#c7d2fe", borderRadius:"3px", overflow:"hidden" }}>
            <div style={{ height:"100%", background:"#4f46e5", borderRadius:"3px", width:`${calPct}%`, transition:"width 0.4s" }} />
          </div>
          <p style={{ fontSize:"10px", color:"#6366f1", margin:"4px 0 0" }}>{calPct}% of daily goal</p>
        </div>

        {/* Protein · Carbs · Fat */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"6px", marginBottom:"16px" }}>
          {([
            { key:"protein" as keyof Goals, label:"Protein", color:"#15803d", dark:"#14532d", bg:"#f0fdf4", sub:"#86efac" },
            { key:"carbs"   as keyof Goals, label:"Carbs",   color:"#c2410c", dark:"#7c2d12", bg:"#fff7ed", sub:"#fed7aa" },
            { key:"fat"     as keyof Goals, label:"Fat",     color:"#7e22ce", dark:"#581c87", bg:"#faf5ff", sub:"#d8b4fe" },
          ] as const).map(m => (
            <div key={m.key} style={{ background:m.bg, borderRadius:"10px", padding:"9px 10px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"3px" }}>
                <span style={{ fontSize:"9px", fontWeight:500, color:m.color }}>{m.label}</span>
                <EditIcon color={m.color} onClick={() => setEditingGoal(m.key)} />
              </div>
              <div style={{ fontSize:"18px", fontWeight:500, color:m.dark }}>{totals[m.key]}<span style={{ fontSize:"9px", color:m.color, marginLeft:"1px" }}>g</span></div>
              <div style={{ fontSize:"9px", color:m.sub, marginTop:"1px" }}>goal {goals[m.key]}g</div>
            </div>
          ))}
        </div>

        {/* Meal list */}
        <div style={{ fontSize:"10px", fontWeight:500, color:"#9ca3af", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:"8px" }}>{selDateLabel}</div>

        {meals.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px 0", color:"#9ca3af", fontSize:"12px" }}>No meals logged yet for this day</div>
        ) : (
          <div>
            {meals.map(meal => (
              <div key={meal.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 0", borderBottom:"0.5px solid #f3f4f6" }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:"12px", fontWeight:500, color:"#1f2937", margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{meal.name}</p>
                  <div style={{ display:"flex", gap:"5px", marginTop:"3px" }}>
                    <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"4px", background:"#f0fdf4", color:"#15803d", fontWeight:500 }}>P {meal.protein}g</span>
                    <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"4px", background:"#fff7ed", color:"#c2410c", fontWeight:500 }}>C {meal.carbs}g</span>
                    <span style={{ fontSize:"9px", padding:"1px 6px", borderRadius:"4px", background:"#faf5ff", color:"#7e22ce", fontWeight:500 }}>F {meal.fat}g</span>
                  </div>
                </div>
                <span style={{ fontSize:"11px", color:"#6b7280", flexShrink:0 }}>{meal.calories} kcal</span>
                <button onClick={() => handleDeleteMeal(meal.id)} style={{ background:"none", border:"none", color:"#d1d5db", cursor:"pointer", fontSize:"14px", lineHeight:1, padding:"0 2px", flexShrink:0 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Log a meal button */}
        <button onClick={() => setShowAddMeal(true)}
          style={{ width:"100%", marginTop:"12px", padding:"11px", borderRadius:"12px", border:"1.5px dashed #e5e7eb", background:"transparent", fontSize:"12px", color:"#9ca3af", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", color:"#6b7280", lineHeight:1 }}>+</div>
          Log a meal manually
        </button>

        {/* AI Meal Calculator button */}
        <button onClick={() => setShowAICalc(true)}
          style={{ width:"100%", marginTop:"8px", padding:"11px", borderRadius:"12px", border:"1.5px solid #fed7aa", background:"#fff7ed", fontSize:"12px", color:"#c2410c", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
            <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
          </svg>
          Calculate nutrition with AI
        </button>

      </div>

      {/* Modals */}
      {showAddMeal && <AddMealModal dateStr={selectedDate} onAdd={handleAddMeal} onClose={() => setShowAddMeal(false)} />}
      {showAICalc && <AIMealCalculator dateStr={selectedDate} onLog={handleLogAIMeal} onClose={() => setShowAICalc(false)} />}
      {editingGoal && <EditGoalModal field={editingGoal} current={goals[editingGoal]} onSave={v => { saveGoals({...goals,[editingGoal]:v}); setEditingGoal(null); }} onClose={() => setEditingGoal(null)} />}

      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </>
  );
}