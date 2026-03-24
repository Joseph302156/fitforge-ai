"use client";
import { useState } from "react";

const dayColors = {
  Monday:    { bg: "bg-indigo-50",  text: "text-indigo-700",  badge: "MON" },
  Tuesday:   { bg: "bg-green-50",   text: "text-green-700",   badge: "TUE" },
  Wednesday: { bg: "bg-orange-50",  text: "text-orange-700",  badge: "WED" },
  Thursday:  { bg: "bg-purple-50",  text: "text-purple-700",  badge: "THU" },
  Friday:    { bg: "bg-rose-50",    text: "text-rose-700",    badge: "FRI" },
  Saturday:  { bg: "bg-sky-50",     text: "text-sky-700",     badge: "SAT" },
  Sunday:    { bg: "bg-stone-50",   text: "text-stone-500",   badge: "SUN" },
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
    >
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
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors mb-4"
            placeholder="e.g. Upper body strength"
          />

          <label className="block text-xs text-gray-400 font-medium mb-1.5">Duration</label>
          <input
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-400 transition-colors mb-4"
            placeholder="e.g. 40 min"
          />

          <label className="block text-xs text-gray-400 font-medium mb-2">
            Exercises ({exercises.length})
          </label>
          <div className="flex flex-col gap-2 mb-3">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                <input
                  value={ex}
                  onChange={e => updateExercise(i, e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 outline-none focus:border-indigo-400 transition-colors"
                />
                <button onClick={() => removeExercise(i)}
                  className="text-gray-300 hover:text-rose-400 transition-colors text-sm w-6 text-center flex-shrink-0">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <input
              value={newExercise}
              onChange={e => setNewExercise(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addExercise()}
              className="flex-1 bg-gray-50 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-500 outline-none focus:border-indigo-400 transition-colors"
              placeholder="Add an exercise... (press Enter)"
            />
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

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, onEdit }) {
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
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 group">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-medium flex items-center justify-center flex-shrink-0`}>
          {colors.badge}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{day.name}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{day.duration} · {day.exercises?.length} exercises</p>
        </div>
        <button
          onClick={() => onEdit(day)}
          className="flex-shrink-0 w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-300 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
          title="Edit this day">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>
      <div className="border-l-2 border-gray-200 pl-3 ml-1 flex flex-col gap-1">
        {day.exercises?.map((ex, i) => (
          <p key={i} className="text-[10px] text-gray-500">{ex}</p>
        ))}
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

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
      `}</style>

      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f3f4f6" }}>
        <div className="w-full max-w-sm">

          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">

            {/* Dark navy header */}
            <div className="px-5 py-6" style={{ background: "#1a1a2e" }}>
              <h1 className="text-white text-lg font-medium">
                {plan ? "Your weekly plan" : "Build your week"}
              </h1>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                {plan
                  ? `${goal} · ${level} · hover a day to edit`
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
                          goal === g
                            ? "text-white border-[#1a1a2e]"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
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
                          level === l
                            ? "text-white border-[#1a1a2e]"
                            : "border-gray-200 text-gray-500 hover:border-gray-400"
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
                      Day updated successfully!
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
                        <DayCard day={day} onEdit={setEditingDay} />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => { setPlan(null); setError(null); setUserPrompt(""); }}
                    className="w-full mt-4 border border-gray-200 text-gray-400 text-xs py-2.5 rounded-xl hover:border-gray-300 transition-colors">
                    ← Rebuild my plan
                  </button>
                </>
              )}

            </div>
          </div>
        </div>
      </main>

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