"use client";
import { useState, useEffect } from "react";

type LogEntry = {
  dayName: string;
  duration: string;
  exerciseCount: number;
  timeElapsed: number;
};

type SavedPlan = {
  weekKey: string;
  plan: {
    days: { day: string; type: string; name: string; duration?: string }[];
  };
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const DOT_COLORS: Record<string, string> = {
  Monday: "#4f46e5", Tuesday: "#16a34a", Wednesday: "#ea580c",
  Thursday: "#9333ea", Friday: "#e11d48", Saturday: "#0284c7", Sunday: "#78716c",
};

const BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  Monday:    { bg: "#eef2ff", text: "#4338ca", label: "MON" },
  Tuesday:   { bg: "#f0fdf4", text: "#15803d", label: "TUE" },
  Wednesday: { bg: "#fff7ed", text: "#c2410c", label: "WED" },
  Thursday:  { bg: "#faf5ff", text: "#7e22ce", label: "THU" },
  Friday:    { bg: "#fff1f2", text: "#be123c", label: "FRI" },
  Saturday:  { bg: "#f0f9ff", text: "#0369a1", label: "SAT" },
  Sunday:    { bg: "#fafaf9", text: "#57534e", label: "SUN" },
};

function localDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function getDayName(date: Date): string {
  return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][date.getDay()];
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sc).padStart(2,"0")}`;
}

function getWeekKey(date: Date): string {
  const jan4 = new Date(date.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const weekNum = Math.ceil((dayOfYear + jan4.getDay()) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2,"0")}`;
}

function loadCurrentPlan(): SavedPlan | null {
  try {
    const raw = localStorage.getItem("fitforge_plan");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function buildScheduledDaysMap(plan: SavedPlan | null, today: Date): Map<string, { name: string; dayName: string }> {
  const map = new Map<string, { name: string; dayName: string }>();
  if (!plan?.plan?.days) return map;

  const currentWeekKey = getWeekKey(today);
  if (plan.weekKey !== currentWeekKey) return map;

  // Find Monday of current week using local date math
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + mondayOffset);

  const daysOfWeek = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  plan.plan.days.forEach((d, i) => {
    if (d.type === "workout") {
      const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const ds = localDateStr(dayDate);
      map.set(ds, { name: d.name || "", dayName: daysOfWeek[i] });
    }
  });

  return map;
}

type CellType = "completed" | "today-completed" | "today-scheduled" | "today-empty" | "upcoming" | "missed" | "past-empty" | "future-empty";

export default function CalendarTab({ workoutLog }: { workoutLog: Record<string, LogEntry> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = localDateStr(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

  // Load plan after mount so localStorage is available
  const [scheduledDaysMap, setScheduledDaysMap] = useState<Map<string, { name: string; dayName: string }>>(new Map());

  useEffect(() => {
    const plan = loadCurrentPlan();
    const map = buildScheduledDaysMap(plan, today);
    setScheduledDaysMap(map);
  }, []);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
    setSelectedDate(null);
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  function cellDateStr(day: number): string {
    return `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }

  function getCellType(day: number): CellType {
    const ds = cellDateStr(day);
    const cellDate = new Date(viewYear, viewMonth, day);
    const hasLog = !!workoutLog[ds];
    const isScheduled = scheduledDaysMap.has(ds);
    const isToday = ds === todayStr;
    const isPast = cellDate < today;
    const isFuture = cellDate > today;

    if (isToday) {
      if (hasLog) return "today-completed";
      if (isScheduled) return "today-scheduled";
      return "today-empty";
    }
    if (hasLog) return "completed";
    if (isPast && isScheduled) return "missed";
    if (isPast) return "past-empty";
    if (isFuture && isScheduled) return "upcoming";
    return "future-empty";
  }

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2,"0")}`;
  const totalMonthWorkouts = Object.keys(workoutLog).filter(d => d.startsWith(monthPrefix)).length;

  const upcomingCount = Array.from(scheduledDaysMap.keys()).filter(ds => {
    const d = new Date(ds + "T00:00:00");
    return d > today;
  }).length;

  let streak = 0;
  const check = new Date(today);
  while (true) {
    const ds = localDateStr(check);
    if (workoutLog[ds]) { streak++; check.setDate(check.getDate() - 1); }
    else break;
  }

  const selectedEntry = selectedDate ? workoutLog[selectedDate] : null;
  const selectedScheduled = selectedDate ? scheduledDaysMap.get(selectedDate) : null;
  const selectedCellDate = selectedDate ? new Date(
    parseInt(selectedDate.split("-")[0]),
    parseInt(selectedDate.split("-")[1]) - 1,
    parseInt(selectedDate.split("-")[2])
  ) : null;
  const selectedDayName = selectedDate
    ? getDayName(new Date(
        parseInt(selectedDate.split("-")[0]),
        parseInt(selectedDate.split("-")[1]) - 1,
        parseInt(selectedDate.split("-")[2])
      ))
    : null;
  const selectedBadge = selectedDayName ? BADGE_COLORS[selectedDayName] : null;
  const selectedIsMissed = !!(selectedDate && !selectedEntry && scheduledDaysMap.has(selectedDate) && selectedCellDate && selectedCellDate < today);
  const selectedIsUpcoming = !!(selectedDate && !selectedEntry && scheduledDaysMap.has(selectedDate) && selectedCellDate && selectedCellDate > today);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function getCellStyle(type: CellType): { bg: string; numColor: string } {
    switch (type) {
      case "completed":        return { bg: "#eef2ff", numColor: "#4338ca" };
      case "today-completed":  return { bg: "#1a1a2e", numColor: "white" };
      case "today-scheduled":  return { bg: "#1a1a2e", numColor: "white" };
      case "today-empty":      return { bg: "#1a1a2e", numColor: "white" };
      case "upcoming":         return { bg: "#f5f3ff", numColor: "#7c3aed" };
      case "missed":           return { bg: "#fef2f2", numColor: "#dc2626" };
      case "past-empty":       return { bg: "#f9fafb", numColor: "#d1d5db" };
      case "future-empty":     return { bg: "#f9fafb", numColor: "#d1d5db" };
    }
  }

  return (
    <>
      <div style={{ background: "#1a1a2e", padding: "20px" }}>
        <h1 style={{ color: "white", fontSize: "18px", fontWeight: 500, margin: 0 }}>Monthly calendar</h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "4px 0 0" }}>
          {MONTH_NAMES[viewMonth]} {viewYear} · {totalMonthWorkouts} completed · {upcomingCount} upcoming
        </p>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Month navigator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <button onClick={prevMonth} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#6b7280" }}>‹</button>
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937" }}>{MONTH_NAMES[viewMonth]} {viewYear}</span>
          <button onClick={nextMonth} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: "#6b7280" }}>›</button>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: "10px", color: "#9ca3af", fontWeight: 500, padding: "4px 0" }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const ds = cellDateStr(day);
            const type = getCellType(day);
            const { bg, numColor } = getCellStyle(type);
            const isSelected = selectedDate === ds;
            const dotColor = workoutLog[ds] ? DOT_COLORS[getDayName(new Date(viewYear, viewMonth, day))] : null;

            return (
              <div key={ds} onClick={() => setSelectedDate(isSelected ? null : ds)}
                style={{ aspectRatio: "1", borderRadius: "8px", background: bg, border: isSelected ? "2px solid #4f46e5" : "1.5px solid transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", cursor: "pointer", transition: "border 0.15s" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, color: numColor, lineHeight: 1 }}>{day}</span>
                {type === "completed" && dotColor && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: dotColor }} />
                )}
                {type === "today-completed" && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
                )}
                {type === "today-scheduled" && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)", borderRadius: "50%" }} />
                )}
                {type === "upcoming" && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#7c3aed", opacity: 0.6 }} />
                )}
                {type === "missed" && (
                  <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fca5a5" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          {[
            { bg: "#eef2ff", dot: "#4f46e5", label: "Completed" },
            { bg: "#f5f3ff", dot: "#7c3aed", label: "Upcoming" },
            { bg: "#fef2f2", dot: "#fca5a5", label: "Missed" },
            { bg: "#f9fafb", dot: "#d1d5db", label: "Rest / none" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: item.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: item.dot }} />
              </div>
              <span style={{ fontSize: "10px", color: "#9ca3af" }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedDate && (
          <div style={{ marginTop: "12px", background: "#f9fafb", borderRadius: "12px", padding: "12px 14px", border: "1px solid #f3f4f6", animation: "fadeIn 0.2s ease" }}>

            {selectedEntry && selectedBadge && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: selectedBadge.bg, color: selectedBadge.text, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 700, flexShrink: 0 }}>
                    {selectedBadge.label}
                  </div>
                  <div>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#1f2937", margin: 0 }}>{selectedEntry.dayName}</p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "1px 0 0" }}>
                      {MONTH_NAMES[parseInt(selectedDate.split("-")[1]) - 1]} {parseInt(selectedDate.split("-")[2])} · completed
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { val: formatTime(selectedEntry.timeElapsed), lbl: "Duration" },
                    { val: String(selectedEntry.exerciseCount), lbl: "Exercises" },
                    { val: "100%", lbl: "Completed" },
                  ].map(s => (
                    <div key={s.lbl} style={{ flex: 1, background: "white", border: "1px solid #f3f4f6", borderRadius: "8px", padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>{s.val}</div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedIsUpcoming && selectedScheduled && !selectedEntry && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#7c3aed", margin: 0 }}>{selectedScheduled.name}</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "1px 0 0" }}>
                    {MONTH_NAMES[parseInt(selectedDate.split("-")[1]) - 1]} {parseInt(selectedDate.split("-")[2])} · scheduled
                  </p>
                </div>
              </div>
            )}

            {selectedIsMissed && !selectedEntry && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#dc2626", margin: 0 }}>Missed workout</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "1px 0 0" }}>
                    {MONTH_NAMES[parseInt(selectedDate.split("-")[1]) - 1]} {parseInt(selectedDate.split("-")[2])} · scheduled but not completed
                  </p>
                </div>
              </div>
            )}

            {!selectedEntry && !selectedIsMissed && !selectedIsUpcoming && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#6b7280", margin: 0 }}>Rest day</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", margin: "1px 0 0" }}>
                    {MONTH_NAMES[parseInt(selectedDate.split("-")[1]) - 1]} {parseInt(selectedDate.split("-")[2])} · no workout scheduled
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Streak + monthly count */}
        <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
          <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "12px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 500, color: "#1f2937", lineHeight: 1 }}>{streak}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>day streak</div>
            </div>
          </div>
          <div style={{ flex: 1, background: "#f9fafb", border: "1px solid #f3f4f6", borderRadius: "12px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 500, color: "#1f2937", lineHeight: 1 }}>{totalMonthWorkouts}</div>
              <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>this month</div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}