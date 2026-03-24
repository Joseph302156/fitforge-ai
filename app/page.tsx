"use client";
import { useState, useRef, useEffect } from "react";

const dayColors = {
  Monday:    { bg: "bg-indigo-50",  text: "text-indigo-700",  badge: "MON", accent: "#4f46e5" },
  Tuesday:   { bg: "bg-green-50",   text: "text-green-700",   badge: "TUE", accent: "#16a34a" },
  Wednesday: { bg: "bg-orange-50",  text: "text-orange-700",  badge: "WED", accent: "#ea580c" },
  Thursday:  { bg: "bg-purple-50",  text: "text-purple-700",  badge: "THU", accent: "#9333ea" },
  Friday:    { bg: "bg-rose-50",    text: "text-rose-700",    badge: "FRI", accent: "#e11d48" },
  Saturday:  { bg: "bg-sky-50",     text: "text-sky-700",     badge: "SAT", accent: "#0284c7" },
  Sunday:    { bg: "bg-stone-50",   text: "text-stone-500",   badge: "SUN", accent: "#78716c" },
};

const hints = [
  "Bad knee, avoid high impact",
  "Only 20 minutes per session",
  "No equipment, bodyweight only",
  "I travel a lot, hotel workouts",
  "Pregnancy safe workouts",
  "Night shift worker",
  "Lower back pain",
  "Weekends only",
];

const chatSuggestions = [
  "Make Monday easier",
  "Add more cardio",
  "I only have 20 min per day",
  "Make it harder overall",
  "Remove all leg exercises",
  "Add a rest day on Wednesday",
];

// ─── Workout Session Modal ────────────────────────────────────────────────────
function WorkoutSession({ day, onClose }) {
  const colors = dayColors[day.day] || { bg: "bg-gray-50", text: "text-gray-500", badge: "DAY", accent: "#6366f1" };
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [checked, setChecked] = useState(Array(day.exercises?.length || 0).fill(false));
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);

  const allDone = checked.every(Boolean) && checked.length > 0;
  const completedCount = checked.filter(Boolean).length;

  useEffect(() => {
    if (allDone && started && !finished) {
      setTimeout(() => finishWorkout(), 600);
    }
  }, [checked]);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function startWorkout() {
    setStarted(true);
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
  }

  function finishWorkout() {
    clearInterval(intervalRef.current);
    setFinished(true);
  }

  function toggleCheck(i) {
    if (!started || finished) return;
    setChecked(prev => {
      const updated = [...prev];
      updated[i] = !updated[i];
      return updated;
    });
  }

  function formatTime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
        style={{ animation: "slideUp 0.3s ease forwards", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-4 flex-shrink-0" style={{ background: "#1a1a2e" }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
                {colors.badge}
              </div>
              <div>
                <p className="text-white text-sm font-medium">{day.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {day.duration} · {day.exercises?.length} exercises
                </p>
              </div>
            </div>
            {!started && (
              <button onClick={onClose} className="text-lg" style={{ color: "rgba(255,255,255,0.35)" }}>✕</button>
            )}
          </div>

          {/* Timer */}
          <div className="text-center py-3">
            <div className="text-4xl font-mono font-bold text-white tracking-widest">
              {formatTime(seconds)}
            </div>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
              {!started ? "Ready to start" : finished ? "Workout complete" : "Time elapsed"}
            </p>
          </div>

          {/* Progress bar */}
          {started && !finished && (
            <div className="mt-2 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(completedCount / checked.length) * 100}%`,
                  background: colors.accent,
                }}
              />
            </div>
          )}
          {started && !finished && (
            <p className="text-[10px] text-center mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {completedCount} of {checked.length} exercises done
            </p>
          )}
        </div>

        {/* Exercise checklist */}
        {!finished && (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Exercises</p>
            <div className="flex flex-col gap-2">
              {day.exercises?.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => toggleCheck(i)}
                  disabled={!started || finished}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    checked[i]
                      ? "border-green-200 bg-green-50"
                      : started
                      ? "border-gray-100 bg-gray-50 hover:border-gray-200 active:scale-[0.99]"
                      : "border-gray-100 bg-gray-50 opacity-60 cursor-default"
                  }`}>
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    checked[i] ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                    {checked[i] && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs flex-1 transition-all ${
                    checked[i] ? "text-green-600 line-through" : "text-gray-700"
                  }`}>
                    {ex}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Finished state */}
        {finished && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4"
              style={{ animation: "popIn 0.4s ease forwards" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {allDone ? "Workout complete!" : "Good effort!"}
            </h3>
            <p className="text-xs text-gray-400 mb-1">
              {allDone
                ? `You crushed all ${day.exercises?.length} exercises`
                : `You completed ${completedCount} of ${day.exercises?.length} exercises`}
            </p>
            <p className="text-2xl font-mono font-bold text-gray-700 mt-2">{formatTime(seconds)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Total time</p>
          </div>
        )}

        {/* CTA buttons */}
        <div className="px-5 pb-5 pt-2 flex-shrink-0 flex flex-col gap-2">
          {!started && (
            <button onClick={startWorkout}
              className="w-full text-white text-sm font-medium py-3.5 rounded-2xl transition-all"
              style={{ background: colors.accent, boxShadow: `0 4px 20px ${colors.accent}40` }}>
              Start workout
            </button>
          )}
          {started && !finished && (
            <button onClick={finishWorkout}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium py-3.5 rounded-2xl transition-all">
              End workout
            </button>
          )}
          {finished && (
            <button onClick={onClose}
              className="w-full text-white text-sm font-medium py-3.5 rounded-2xl transition-all"
              style={{ background: colors.accent }}>
              Done
            </button>
          )}
          {!finished && (
            <button onClick={onClose}
              className="w-full border border-gray-200 text-gray-400 text-xs py-2.5 rounded-2xl hover:border-gray-300 transition-colors">
              {started ? "Minimize" : "Cancel"}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ day, onSave, onClose }) {
  const [name, setName] = useState(day.name || "");
  const [duration, setDuration] = useState(day.duration || "");
  const [exercises, setExercises] = useState([...(day.exercises || [])]);
  const [newExercise, setNewExercise] = useState("");

  function updateExercise(i, val) {
    const updated = [...exercises];
    updated[i] = val;
    setExercises(updated);
  }

  function removeExercise(i) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  function addExercise() {
    if (!newExercise.trim()) return;
    setExercises([...exercises, newExercise.trim()]);
    setNewExercise("");
  }

  function handleSave() {
    onSave({ ...day, name, duration, exercises });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-xl"
        style={{ animation: "slideUp 0.25s ease forwards" }}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100"
          style={{ background: "#1a1a2e" }}>
          <div>
            <p className="text-white text-sm font-medium">Edit {day.day}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Customize your workout</p>
          </div>
          <button onClick={onClose} className="text-lg" style={{ color: "rgba(255,255,255,0.4)" }}>✕</button>
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: "70vh" }}>
          <label className="block text-xs text-gray-400 font-medium mb-1.5">Workout name</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors mb-4"
            placeholder="e.g. Upper body strength" />

          <label className="block text-xs text-gray-400 font-medium mb-1.5">Duration</label>
          <input value={duration} onChange={e => setDuration(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors mb-4"
            placeholder="e.g. 40 min" />

          <label className="block text-xs text-gray-400 font-medium mb-2">Exercises ({exercises.length})</label>
          <div className="flex flex-col gap-2 mb-3">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                <input value={ex} onChange={e => updateExercise(i, e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 outline-none focus:border-indigo-400 transition-colors" />
                <button onClick={() => removeExercise(i)}
                  className="text-gray-300 hover:text-rose-400 transition-colors text-sm w-6 text-center flex-shrink-0">✕</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <input value={newExercise} onChange={e => setNewExercise(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExercise()}
              className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-500 outline-none focus:border-indigo-400 transition-colors"
              placeholder="Add an exercise... (press Enter)" />
            <button onClick={addExercise}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 rounded-lg transition-colors font-medium">
              + Add
            </button>
          </div>

          <button onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl transition-colors mb-2">
            Save changes
          </button>
          <button onClick={onClose}
            className="w-full border border-gray-200 text-gray-400 text-xs py-2.5 rounded-xl hover:border-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, onEdit, onStartWorkout }) {
  const colors = dayColors[day.day] || { bg: "bg-gray-50", text: "text-gray-500", badge: day.day.slice(0, 3).toUpperCase() };

  if (day.type === "rest") {
    return (
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 opacity-50">
        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-medium flex items-center justify-center flex-shrink-0`}>
          {colors.badge}
        </div>
        <p className="text-xs text-gray-400">Rest day — recovery</p>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-50 rounded-xl border border-gray-100 group cursor-pointer hover:border-gray-200 transition-all active:scale-[0.99]"
      onClick={() => onStartWorkout(day)}>
      <div className="flex items-center gap-3 p-3 pb-2">
        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-medium flex items-center justify-center flex-shrink-0`}>
          {colors.badge}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{day.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{day.duration} · {day.exercises?.length} exercises</p>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Edit button */}
          <button
            onClick={e => { e.stopPropagation(); onEdit(day); }}
            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          {/* Arrow */}
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 group-hover:text-gray-500 transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>
      <div className="border-l-2 border-gray-200 pl-3 ml-4 pb-3 flex flex-col gap-1">
        {day.exercises?.map((ex, i) => (
          <p key={i} className="text-[10px] text-gray-500">{ex}</p>
        ))}
      </div>
    </div>
  );
}

// ─── AI Chat Box ──────────────────────────────────────────────────────────────
function ChatBox({ plan, goal, level, onPlanUpdate }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    text: "Hey! I'm your AI trainer. Ask me anything about your plan — I can adjust workouts, swap exercises, add rest days, or rebuild around any restrictions you have.",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function sendMessage(text) {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setLoading(true);

    const newMessages = [...messages, { role: "user", text: userText }];
    setMessages(newMessages);

    const planSummary = plan.days
      .map(d => d.type === "rest"
        ? `${d.day}: Rest day`
        : `${d.day}: ${d.name} (${d.duration}) — ${d.exercises?.join(", ")}`)
      .join("\n");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal, level, planSummary,
          messages: newMessages.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text })),
        }),
      });
      const data = await res.json();

      if (data.updatedPlan) {
        onPlanUpdate(data.updatedPlan);
        setMessages(prev => [...prev, { role: "assistant", text: data.message || "I've updated your plan!", planUpdated: true }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", text: data.message || "Let me know if you'd like any changes!" }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all"
        style={{ background: open ? "#1a1a2e" : "white", borderColor: open ? "#1a1a2e" : "#e5e7eb" }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span className="text-xs font-medium" style={{ color: open ? "white" : "#374151" }}>Ask your AI trainer</span>
          {messages.length > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: open ? "rgba(255,255,255,0.15)" : "#eef2ff", color: open ? "white" : "#4f46e5" }}>
              {messages.length - 1}
            </span>
          )}
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? "white" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="mt-2 border border-gray-100 rounded-2xl overflow-hidden bg-white"
          style={{ animation: "fadeUp 0.2s ease forwards" }}>
          <div className="flex flex-col gap-3 p-4 overflow-y-auto" style={{ maxHeight: "260px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[80%]">
                  <div className="text-xs leading-relaxed px-3 py-2 rounded-2xl"
                    style={{
                      background: msg.role === "user" ? "#1a1a2e" : "#f3f4f6",
                      color: msg.role === "user" ? "white" : "#374151",
                      borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                      borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                    }}>
                    {msg.text}
                  </div>
                  {msg.planUpdated && (
                    <span className="text-[10px] text-green-500 font-medium px-1">✓ Plan updated above</span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mr-2">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className="px-3 py-2 rounded-2xl bg-gray-100" style={{ borderBottomLeftRadius: "4px" }}>
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animation: "bounce 1s infinite 0s" }}/>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animation: "bounce 1s infinite 0.2s" }}/>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" style={{ animation: "bounce 1s infinite 0.4s" }}/>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-3 flex gap-2 flex-wrap">
              {chatSuggestions.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about your plan..."
              className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none focus:border-indigo-400 transition-colors"
              disabled={loading} />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{ background: input.trim() && !loading ? "#4f46e5" : "#f3f4f6" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke={input.trim() && !loading ? "white" : "#9ca3af"}
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [goal, setGoal] = useState("Lose weight");
  const [level, setLevel] = useState("Beginner");
  const [userPrompt, setUserPrompt] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [sessionDay, setSessionDay] = useState(null);
  const [savedMessage, setSavedMessage] = useState(false);

  const goals = ["Lose weight", "Build muscle", "Stay fit"];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  async function generatePlan() {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, level, userPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addHint(hint) {
    setUserPrompt(prev => prev.trim() ? prev.trimEnd() + ". " + hint : hint);
  }

  function handleEditSave(updatedDay) {
    setPlan(prev => ({
      ...prev,
      days: prev.days.map(d => d.day === updatedDay.day ? updatedDay : d),
    }));
    setEditingDay(null);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }

  function handlePlanUpdate(newPlan) {
    setPlan(newPlan);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f3f4f6" }}>
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">

            {/* Header */}
            <div className="px-5 py-6" style={{ background: "#1a1a2e" }}>
              <h1 className="text-white text-lg font-medium">
                {plan ? "Your weekly plan" : "Build your week"}
              </h1>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {plan
                  ? `${goal} · ${level} · tap a day to start`
                  : "Powered by AI — just describe your situation"}
              </p>
            </div>

            <div className="p-5">

              {/* ── FORM ── */}
              {!plan && !loading && (
                <>
                  <p className="text-xs text-gray-400 font-medium mb-2">Your goal</p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {goals.map(g => (
                      <button key={g} onClick={() => setGoal(g)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          goal === g ? "text-white border-[#1a1a2e]" : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                        style={goal === g ? { background: "#1a1a2e" } : {}}>
                        {g}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-gray-400 font-medium mb-2">Fitness level</p>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {levels.map(l => (
                      <button key={l} onClick={() => setLevel(l)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          level === l ? "text-white border-[#1a1a2e]" : "border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                        style={level === l ? { background: "#1a1a2e" } : {}}>
                        {l}
                      </button>
                    ))}
                  </div>

                  <hr className="border-gray-100 mb-5" />

                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium text-gray-700">Tell the AI your situation</p>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">AI</span>
                  </div>
                  <textarea
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                    placeholder="e.g. I have a bad knee so no running. I'm free Mon, Wed, Fri. I only have dumbbells at home and want to focus on upper body..."
                    rows={4}
                    className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-700 bg-gray-50 resize-none outline-none focus:border-indigo-400 transition-colors leading-relaxed"
                  />

                  <div className="flex gap-2 flex-wrap mt-2 mb-5">
                    {hints.map(h => (
                      <button key={h} onClick={() => addHint(h)}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                        {h}
                      </button>
                    ))}
                  </div>

                  <button onClick={generatePlan}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl transition-colors">
                    Generate my weekly plan →
                  </button>

                  {error && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-500">
                      {error}
                    </div>
                  )}
                </>
              )}

              {/* ── LOADING ── */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="spin w-8 h-8 rounded-full"
                    style={{ border: "2px solid #e5e7eb", borderTopColor: "#6366f1" }} />
                  <p className="text-xs text-gray-400">Building your personalized plan...</p>
                </div>
              )}

              {/* ── PLAN ── */}
              {plan && !loading && (
                <>
                  {savedMessage && (
                    <div className="mb-3 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5 text-xs text-green-600 text-center font-medium fade-up">
                      Plan updated!
                    </div>
                  )}

                  {plan.tip && (
                    <div className="bg-indigo-50 rounded-xl p-3 mb-4 fade-up">
                      <p className="text-[10px] text-indigo-500 font-medium mb-1">AI tip for you</p>
                      <p className="text-xs text-indigo-800 leading-relaxed">{plan.tip}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {plan.days.map((day, i) => (
                      <div key={day.day} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                        <DayCard
                          day={day}
                          onEdit={setEditingDay}
                          onStartWorkout={setSessionDay}
                        />
                      </div>
                    ))}
                  </div>

                  <ChatBox plan={plan} goal={goal} level={level} onPlanUpdate={handlePlanUpdate} />

                  <button onClick={() => { setPlan(null); setError(null); setUserPrompt(""); }}
                    className="w-full mt-3 border border-gray-200 text-gray-400 text-xs py-2.5 rounded-xl hover:border-gray-300 transition-colors">
                    ← Start over
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingDay && (
        <EditModal day={editingDay} onSave={handleEditSave} onClose={() => setEditingDay(null)} />
      )}

      {/* Workout Session Modal */}
      {sessionDay && (
        <WorkoutSession day={sessionDay} onClose={() => setSessionDay(null)} />
      )}
    </>
  );
}