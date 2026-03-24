"use client";
import { useState } from "react";

const dayColors = {
  Monday:    { bg: "bg-indigo-950/60",  text: "text-indigo-300",  border: "border-indigo-500/30", badge: "MON" },
  Tuesday:   { bg: "bg-emerald-950/60", text: "text-emerald-300", border: "border-emerald-500/30", badge: "TUE" },
  Wednesday: { bg: "bg-amber-950/60",   text: "text-amber-300",   border: "border-amber-500/30",  badge: "WED" },
  Thursday:  { bg: "bg-purple-950/60",  text: "text-purple-300",  border: "border-purple-500/30", badge: "THU" },
  Friday:    { bg: "bg-rose-950/60",    text: "text-rose-300",    border: "border-rose-500/30",   badge: "FRI" },
  Saturday:  { bg: "bg-sky-950/60",     text: "text-sky-300",     border: "border-sky-500/30",    badge: "SAT" },
  Sunday:    { bg: "bg-stone-900/60",   text: "text-stone-400",   border: "border-stone-500/30",  badge: "SUN" },
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

  const colors = dayColors[day.day] || dayColors.Sunday;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-sm bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-slide-up">

        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/06"
          style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${colors.bg} ${colors.text}`}>
              {colors.badge}
            </div>
            <div>
              <p className="text-white text-sm font-semibold" style={{ fontFamily: "'Syne',sans-serif" }}>Edit {day.day}</p>
              <p className="text-white/30 text-xs">Customize your workout</p>
            </div>
          </div>
          <button onClick={onClose}
            className="text-white/30 hover:text-white/70 text-xl leading-none transition-colors">✕</button>
        </div>

        <div className="p-5 max-h-[70vh] overflow-y-auto">

          {/* Workout name */}
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Workout name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-white/04 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-indigo-500/60 transition-colors mb-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
            placeholder="e.g. Upper body strength"
          />

          {/* Duration */}
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Duration</label>
          <input
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-indigo-500/60 transition-colors mb-4"
            style={{ background: "rgba(255,255,255,0.04)" }}
            placeholder="e.g. 40 min"
          />

          {/* Exercises */}
          <label className="block text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            Exercises ({exercises.length})
          </label>
          <div className="flex flex-col gap-2 mb-3">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/20 w-5 flex-shrink-0">{i + 1}</span>
                <input
                  value={ex}
                  onChange={e => updateExercise(i, e.target.value)}
                  className="flex-1 border border-white/08 rounded-lg px-3 py-2 text-xs text-white/70 outline-none focus:border-indigo-500/50 transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                />
                <button
                  onClick={() => removeExercise(i)}
                  className="text-white/20 hover:text-rose-400 transition-colors text-sm w-7 flex-shrink-0 text-center">
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add exercise */}
          <div className="flex gap-2 mb-5">
            <input
              value={newExercise}
              onChange={e => setNewExercise(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addExercise()}
              className="flex-1 border border-dashed border-white/15 rounded-lg px-3 py-2 text-xs text-white/50 outline-none focus:border-indigo-500/40 transition-colors"
              style={{ background: "rgba(255,255,255,0.02)" }}
              placeholder="Add an exercise... (press Enter)"
            />
            <button
              onClick={addExercise}
              className="bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs px-3 rounded-lg transition-colors font-medium">
              + Add
            </button>
          </div>

          {/* Save / Cancel */}
          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold py-3 rounded-xl transition-all mb-2"
            style={{ fontFamily: "'Syne',sans-serif", boxShadow: "0 4px 24px rgba(79,70,229,0.35)" }}>
            Save changes
          </button>
          <button
            onClick={onClose}
            className="w-full border border-white/08 text-white/30 text-xs py-2.5 rounded-xl hover:border-white/15 transition-colors">
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.25s ease forwards; }
      `}</style>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, onEdit }) {
  const colors = dayColors[day.day] || dayColors.Sunday;

  if (day.type === "rest") {
    return (
      <div className="flex items-center gap-3 rounded-xl p-3 border border-white/05 opacity-40"
        style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
          {colors.badge}
        </div>
        <div className="flex-1">
          <p className="text-xs text-white/40 font-medium">Rest day</p>
          <p className="text-[10px] text-white/20">Recovery &amp; mobility</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border transition-all group ${colors.border}`}
      style={{ background: "rgba(255,255,255,0.03)" }}>
      <div className="flex items-center gap-3 p-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
          {colors.badge}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white/85 truncate" style={{ fontFamily: "'Syne',sans-serif" }}>{day.name}</p>
          <p className="text-[10px] text-white/30 mt-0.5">{day.duration} &middot; {day.exercises?.length} exercises</p>
        </div>
        {/* Edit button */}
        <button
          onClick={() => onEdit(day)}
          className="flex-shrink-0 w-8 h-8 rounded-lg border border-white/08 flex items-center justify-center text-white/25 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100"
          title="Edit this day">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
      {/* Exercise list */}
      <div className="border-t border-white/05 mx-3 pt-2 pb-3">
        <div className="border-l-2 border-white/08 pl-3 flex flex-col gap-1">
          {day.exercises?.map((ex, i) => (
            <p key={i} className="text-[11px] text-white/40 leading-relaxed">{ex}</p>
          ))}
        </div>
      </div>
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
  const [savedMessage, setSavedMessage] = useState(false);

  const goals = ["Lose weight", "Build muscle", "Stay fit"];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  const loadingMessages = [
    "Reading your situation...",
    "Understanding your restrictions...",
    "Designing your workouts...",
    "Putting your week together...",
  ];

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
      days: prev.days.map(d => d.day === updatedDay.day ? updatedDay : d)
    }));
    setEditingDay(null);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  }

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        body { background: #0f0f1a; font-family: 'DM Sans', sans-serif; }
        .border-white\\/05 { border-color: rgba(255,255,255,0.05); }
        .border-white\\/06 { border-color: rgba(255,255,255,0.06); }
        .border-white\\/08 { border-color: rgba(255,255,255,0.08); }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fade-up { animation: fadeUp 0.35s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "radial-gradient(ellipse at top left, rgba(79,70,229,0.12) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(167,139,250,0.08) 0%, transparent 50%), #0f0f1a" }}>

        <div className="w-full max-w-sm relative z-10">

          {/* Brand */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne',sans-serif" }}>
              Fit<span style={{ color: "#a78bfa" }}>Forge</span> AI
            </h1>
            <p className="text-xs text-white/30 mt-1 font-light">Your personal trainer, powered by AI</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl overflow-hidden border border-white/08"
            style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/06"
              style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)" }}>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne',sans-serif" }}>
                {plan ? "Your weekly plan" : "Build your week"}
              </h2>
              <p className="text-xs text-white/35 mt-1 font-light">
                {plan ? `${goal} · ${level} · tap pencil to edit any day` : "Describe your situation — AI does the rest"}
              </p>
            </div>

            <div className="p-5">

              {/* ── FORM ── */}
              {!plan && !loading && (
                <>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Your goal</p>
                  <div className="flex gap-2 flex-wrap mb-4">
                    {goals.map(g => (
                      <button key={g} onClick={() => setGoal(g)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                          goal === g
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                            : "border-white/12 text-white/40 hover:border-white/30 hover:text-white/70"
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">Fitness level</p>
                  <div className="flex gap-2 flex-wrap mb-5">
                    {levels.map(l => (
                      <button key={l} onClick={() => setLevel(l)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                          level === l
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                            : "border-white/12 text-white/40 hover:border-white/30 hover:text-white/70"
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>

                  <hr className="border-white/06 mb-5" />

                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium text-white/70">Tell the AI your situation</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border"
                      style={{ background: "rgba(79,70,229,0.2)", color: "#a78bfa", borderColor: "rgba(167,139,250,0.3)" }}>
                      AI
                    </span>
                  </div>

                  <textarea
                    value={userPrompt}
                    onChange={e => setUserPrompt(e.target.value)}
                    rows={4}
                    placeholder="e.g. I have a bad knee so no running. I'm free Mon, Wed, Fri. I only have dumbbells at home and want to focus on upper body..."
                    className="w-full rounded-2xl px-4 py-3 text-xs text-white/70 outline-none transition-colors resize-none leading-relaxed font-light"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(79,70,229,0.5)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                  />

                  <div className="flex gap-2 flex-wrap mt-2 mb-5">
                    {hints.map(h => (
                      <button key={h} onClick={() => addHint(h)}
                        className="text-[10px] px-2.5 py-1 rounded-lg transition-all font-light"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
                        onMouseEnter={e => { e.target.style.borderColor="rgba(167,139,250,0.4)"; e.target.style.color="#a78bfa"; }}
                        onMouseLeave={e => { e.target.style.borderColor="rgba(255,255,255,0.08)"; e.target.style.color="rgba(255,255,255,0.3)"; }}>
                        {h}
                      </button>
                    ))}
                  </div>

                  <button onClick={generatePlan}
                    className="w-full text-white text-sm font-bold py-3.5 rounded-2xl transition-all"
                    style={{ fontFamily: "'Syne',sans-serif", background: "#4f46e5", boxShadow: "0 4px 24px rgba(79,70,229,0.4)" }}
                    onMouseEnter={e => e.target.style.background="#6366f1"}
                    onMouseLeave={e => e.target.style.background="#4f46e5"}>
                    Generate my weekly plan →
                  </button>

                  {error && (
                    <div className="mt-3 rounded-xl p-3 text-xs font-light"
                      style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", color: "#fca5a5" }}>
                      {error}
                    </div>
                  )}
                </>
              )}

              {/* ── LOADING ── */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-9 h-9 rounded-full spin"
                    style={{ border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#a78bfa" }} />
                  <p className="text-xs text-white/30 font-light">Building your personalized plan...</p>
                </div>
              )}

              {/* ── PLAN ── */}
              {plan && !loading && (
                <>
                  {/* Saved toast */}
                  {savedMessage && (
                    <div className="mb-3 rounded-xl px-4 py-2.5 text-xs font-medium text-center fade-up"
                      style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#6ee7b7" }}>
                      Day updated successfully!
                    </div>
                  )}

                  {plan.tip && (
                    <div className="rounded-2xl p-4 mb-4 fade-up"
                      style={{ background: "rgba(79,70,229,0.12)", border: "1px solid rgba(79,70,229,0.25)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "#a78bfa" }}>AI tip for you</p>
                      <p className="text-xs font-light leading-relaxed" style={{ color: "rgba(167,139,250,0.85)" }}>{plan.tip}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {plan.days.map((day, i) => (
                      <div key={day.day} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <DayCard day={day} onEdit={setEditingDay} />
                      </div>
                    ))}
                  </div>

                  <button onClick={() => { setPlan(null); setError(null); setUserPrompt(""); }}
                    className="w-full mt-4 text-xs py-3 rounded-2xl transition-all font-light"
                    style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}
                    onMouseEnter={e => e.target.style.borderColor="rgba(255,255,255,0.18)"}
                    onMouseLeave={e => e.target.style.borderColor="rgba(255,255,255,0.08)"}>
                    ← Rebuild my plan
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editingDay && (
        <EditModal
          day={editingDay}
          onSave={handleEditSave}
          onClose={() => setEditingDay(null)}
        />
      )}
    </>
  );
}