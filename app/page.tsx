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
];

export default function Home() {
  const [goal, setGoal] = useState("Lose weight");
  const [level, setLevel] = useState("Beginner");
  const [userPrompt, setUserPrompt] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      if (data.error) {
        setError(data.error);
      } else {
        setPlan(data);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function addHint(hint) {
    setUserPrompt((prev) => (prev ? prev.trimEnd() + ". " + hint : hint));
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">

        {/* Header */}
        <div className="bg-[#1a1a2e] px-5 py-6">
          <h1 className="text-white text-lg font-medium">Build your week</h1>
          <p className="text-white/50 text-xs mt-1">Powered by AI — just describe your situation</p>
        </div>

        <div className="p-5">
          {!plan && !loading && (
            <>
              {/* Goal pills */}
              <p className="text-xs text-gray-400 font-medium mb-2 tracking-wide">Your goal</p>
              <div className="flex gap-2 flex-wrap mb-4">
                {goals.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      goal === g
                        ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Level pills */}
              <p className="text-xs text-gray-400 font-medium mb-2 tracking-wide">Fitness level</p>
              <div className="flex gap-2 flex-wrap mb-5">
                {levels.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      level === l
                        ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                        : "border-gray-200 text-gray-500 hover:border-gray-400"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <hr className="border-gray-100 mb-5" />

              {/* AI Prompt box */}
              <div className="flex items-center gap-2 mb-2">
                <p className="text-xs font-medium text-gray-700">Tell the AI your situation</p>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">AI</span>
              </div>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="e.g. I have a bad knee so no running. I'm free Mon, Wed, Fri. I only have dumbbells at home and want to focus on upper body..."
                rows={4}
                className="w-full text-xs border border-gray-200 rounded-xl p-3 text-gray-700 bg-gray-50 resize-none outline-none focus:border-indigo-400 transition-colors leading-relaxed"
              />

              {/* Hint chips */}
              <div className="flex gap-2 flex-wrap mt-2 mb-5">
                {hints.map((h) => (
                  <button
                    key={h}
                    onClick={() => addHint(h)}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                  >
                    {h}
                  </button>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={generatePlan}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-3 rounded-xl transition-colors"
              >
                Generate my weekly plan →
              </button>

              {error && (
                <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-600">
                  {error}
                </div>
              )}
            </>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Building your personalized plan...</p>
            </div>
          )}

          {/* Plan output */}
          {plan && !loading && (
            <>
              {plan.tip && (
                <div className="bg-indigo-50 rounded-xl p-3 mb-4">
                  <p className="text-[10px] text-indigo-500 font-medium mb-1">AI tip for you</p>
                  <p className="text-xs text-indigo-800 leading-relaxed">{plan.tip}</p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {plan.days.map((day) => {
                  const colors = dayColors[day.day] || { bg: "bg-gray-50", text: "text-gray-500", badge: day.day.slice(0, 3).toUpperCase() };
                  return day.type === "rest" ? (
                    <div key={day.day} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 opacity-50">
                      <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-medium flex items-center justify-center flex-shrink-0`}>
                        {colors.badge}
                      </div>
                      <p className="text-xs text-gray-400">Rest day — recovery</p>
                    </div>
                  ) : (
                    <div key={day.day} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-9 h-9 rounded-lg ${colors.bg} ${colors.text} text-[10px] font-medium flex items-center justify-center flex-shrink-0`}>
                          {colors.badge}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800">{day.name}</p>
                          <p className="text-[10px] text-gray-400">{day.duration} · {day.exercises?.length} exercises</p>
                        </div>
                      </div>
                      <div className="border-l-2 border-gray-200 pl-3 ml-1 flex flex-col gap-1">
                        {day.exercises?.map((ex, i) => (
                          <p key={i} className="text-[10px] text-gray-500">{ex}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => { setPlan(null); setError(null); }}
                className="w-full mt-4 border border-gray-200 text-gray-400 text-xs py-2.5 rounded-xl hover:border-gray-300 transition-colors"
              >
                ← Rebuild my plan
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}