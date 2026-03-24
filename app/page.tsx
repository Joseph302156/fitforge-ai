import dynamic from "next/dynamic";

const WorkoutTab = dynamic(() => import("./components/WorkoutTab"), { ssr: false });
const CalendarTab = dynamic(() => import("./components/CalendarTab"), { ssr: false });
const NutritionTab = dynamic(() => import("./components/NutritionTab"), { ssr: false });

const tabs = [
  {
    id: "workout",
    label: "Workout",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#4f46e5" : "#9ca3af"} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#4f46e5" : "#9ca3af"} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={active ? "#4f46e5" : "#9ca3af"} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
      </svg>
    ),
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("workout");
  const [workoutLog, setWorkoutLog] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("fitforge_workoutLog") || "{}");
    } catch { return {}; }
  });

  function saveWorkoutLog(log) {
    setWorkoutLog(log);
    localStorage.setItem("fitforge_workoutLog", JSON.stringify(log));
  }

  function logCompletedWorkout(dayName, duration, exerciseCount, timeElapsed) {
    const today = new Date().toISOString().split("T")[0];
    const updated = {
      ...workoutLog,
      [today]: { dayName, duration, exerciseCount, timeElapsed },
    };
    saveWorkoutLog(updated);
  }

  return (
    <>
      <style>{`
        body { background: #f3f4f6 !important; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.3s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes popIn { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
      `}</style>

      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: "#f3f4f6" }}>
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">

            {/* ── Tab bar ── */}
            <div className="flex border-b border-gray-100 bg-white">
              {tabs.map(tab => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex flex-col items-center gap-1 pt-3 pb-2 transition-all relative"
                    style={{ background: "transparent", border: "none" }}>
                    {tab.icon(active)}
                    <span className="text-[10px] font-medium transition-colors"
                      style={{ color: active ? "#4f46e5" : "#9ca3af" }}>
                      {tab.label}
                    </span>
                    {/* Active underline */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all"
                      style={{
                        width: active ? "24px" : "0px",
                        background: "#4f46e5",
                      }} />
                  </button>
                );
              })}
            </div>

            {/* ── Tab content ── */}
            <div>
              {activeTab === "workout" && (
                <WorkoutTab onWorkoutComplete={logCompletedWorkout} />
              )}
              {activeTab === "calendar" && (
                <CalendarTab workoutLog={workoutLog} />
              )}
              {activeTab === "nutrition" && (
                <NutritionTab />
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
}