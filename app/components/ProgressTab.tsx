"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { getBodyMetrics, saveBodyMetric, BodyMetricRow } from "@/lib/supabase";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
}

function weekKeyToDate(wk: string): Date {
  const [y, m, d] = wk.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Chart logic ───────────────────────────────────────────────────────────────

type ChartPoint = { date: Date; value: number };

/** Returns the 4 x-axis label values (start, 1/3, 2/3, end) given a date range */
function xAxisLabels(start: Date, end: Date): Date[] {
  const span = end.getTime() - start.getTime();
  return [0, 1/3, 2/3, 1].map(f => new Date(start.getTime() + span * f));
}

/** Simple linear regression. x/y are already in pixel-space doesn't matter — we use raw indices */
function trendLine(pts: ChartPoint[]): { x1: number; y1: number; x2: number; y2: number } | null {
  if (pts.length < 2) return null;
  const n = pts.length;
  const xs = pts.map((_, i) => i);
  const ys = pts.map(p => p.value);
  const sx = xs.reduce((a, b) => a + b, 0);
  const sy = ys.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sxx = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { x1: 0, y1: intercept, x2: n - 1, y2: slope * (n - 1) + intercept };
}

interface LineChartProps {
  points: ChartPoint[];
  unit: string;
  color: string;
  decimals?: number;
}

function LineChart({ points, unit, color, decimals = 1 }: LineChartProps) {
  if (points.length < 2) {
    return (
      <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>
          Log at least 2 weeks of data to see your chart
        </p>
      </div>
    );
  }

  // Cap at last 90 days
  const now = new Date();
  const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const visible = points.filter(p => p.date >= cutoff);
  const pts = visible.length >= 2 ? visible : points.slice(-2);

  const W = 320, H = 140;
  const PAD = { top: 16, right: 12, bottom: 28, left: 36 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const vals = pts.map(p => p.value);
  const minV = Math.min(...vals), maxV = Math.max(...vals);
  const spread = maxV - minV || 1;
  const vPad = spread * 0.25;
  const yMin = minV - vPad, yMax = maxV + vPad;

  const minT = pts[0].date.getTime(), maxT = pts[pts.length - 1].date.getTime();
  const tSpan = maxT - minT || 1;

  function px(p: ChartPoint) {
    const x = PAD.left + ((p.date.getTime() - minT) / tSpan) * chartW;
    const y = PAD.top + (1 - (p.value - yMin) / (yMax - yMin)) * chartH;
    return { x, y };
  }

  const pathD = pts.map((p, i) => {
    const { x, y } = px(p);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  // Y-axis labels (3 lines)
  const yTicks = [0, 0.5, 1].map(f => yMin + f * (yMax - yMin));

  // X-axis labels (start, 1/3, 2/3, end) — capped at 30-day increments
  const startDate = pts[0].date;
  const endDate = pts[pts.length - 1].date;
  const xLabels = xAxisLabels(startDate, endDate);

  // Trend line
  const trend = trendLine(pts);
  let trendPath: string | null = null;
  if (trend) {
    const x1 = PAD.left + (trend.x1 / (pts.length - 1)) * chartW;
    const x2 = PAD.left + (trend.x2 / (pts.length - 1)) * chartW;
    const y1 = PAD.top + (1 - (trend.y1 - yMin) / (yMax - yMin)) * chartH;
    const y2 = PAD.top + (1 - (trend.y2 - yMin) / (yMax - yMin)) * chartH;
    trendPath = `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = PAD.top + (1 - (v - yMin) / (yMax - yMin)) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {v.toFixed(decimals)}
            </text>
          </g>
        );
      })}

      {/* Trend line */}
      {trendPath && (
        <path d={trendPath} stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" fill="none" />
      )}

      {/* Area fill */}
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L${(PAD.left + chartW).toFixed(1)},${(PAD.top + chartH).toFixed(1)} L${PAD.left.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`}
        fill={`url(#grad-${color.replace("#","")})`}
      />

      {/* Main line */}
      <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {pts.map((p, i) => {
        const { x, y } = px(p);
        const isLast = i === pts.length - 1;
        return (
          <circle key={i} cx={x} cy={y} r={isLast ? 4 : 3}
            fill={isLast ? color : "white"} stroke={color} strokeWidth="2" />
        );
      })}

      {/* Last value label */}
      {(() => {
        const last = pts[pts.length - 1];
        const { x, y } = px(last);
        return (
          <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">
            {last.value.toFixed(decimals)}{unit}
          </text>
        );
      })()}

      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const xPos = PAD.left + ((d.getTime() - minT) / tSpan) * chartW;
        const anchor = i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle";
        return (
          <text key={i} x={xPos} y={H - 4} textAnchor={anchor} fontSize="9" fill="#9ca3af">
            {formatDate(d)}
          </text>
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgressTab({ isDesktop }: { isDesktop?: boolean }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || "";

  const [metrics, setMetrics] = useState<BodyMetricRow[]>([]);
  const [mounted, setMounted] = useState(false);
  const [weightInput, setWeightInput] = useState("");
  const [fatInput, setFatInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);

  const weekKey = getWeekKey();
  const thisWeek = metrics.find(m => m.weekKey === weekKey);
  const hasLoggedThisWeek = !!thisWeek && !editing;

  useEffect(() => {
    if (!userId) return;
    getBodyMetrics(userId).then(data => {
      setMetrics(data);
      setMounted(true);
    });
  }, [userId]);

  // Pre-fill inputs when editing
  useEffect(() => {
    if (editing && thisWeek) {
      setWeightInput(thisWeek.weightLbs != null ? String(thisWeek.weightLbs) : "");
      setFatInput(thisWeek.bodyFatPct != null ? String(thisWeek.bodyFatPct) : "");
    }
  }, [editing]);

  async function handleSave() {
    const w = weightInput.trim() ? parseFloat(weightInput) : null;
    const f = fatInput.trim() ? parseFloat(fatInput) : null;
    if (w === null && f === null) return;
    setSaving(true);
    await saveBodyMetric(userId, weekKey, w, f);
    const updated = await getBodyMetrics(userId);
    setMetrics(updated);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  }

  // Build chart data from metrics
  const weightPoints: ChartPoint[] = metrics
    .filter(m => m.weightLbs != null)
    .map(m => ({ date: weekKeyToDate(m.weekKey), value: m.weightLbs! }));

  const fatPoints: ChartPoint[] = metrics
    .filter(m => m.bodyFatPct != null)
    .map(m => ({ date: weekKeyToDate(m.weekKey), value: m.bodyFatPct! }));

  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1].value : null;
  const latestFat    = fatPoints.length    ? fatPoints[fatPoints.length - 1].value    : null;

  // Weight trend vs 4 weeks ago
  function trendBadge(pts: ChartPoint[], unit: string, decimals = 1): React.ReactNode {
    if (pts.length < 2) return null;
    const recent = pts[pts.length - 1].value;
    const prev   = pts[Math.max(0, pts.length - 5)].value; // up to 4 weeks prior
    const diff   = recent - prev;
    if (Math.abs(diff) < 0.05) return <span style={{ fontSize: "10px", color: "#9ca3af" }}>No change</span>;
    const up = diff > 0;
    return (
      <span style={{ fontSize: "10px", color: up ? "#ef4444" : "#22c55e", fontWeight: 500 }}>
        {up ? "▲" : "▼"} {Math.abs(diff).toFixed(decimals)}{unit} vs ~4 wks ago
      </span>
    );
  }

  if (!mounted) return (
    <div style={{ background: "#1a1a2e", padding: "20px" }}>
      <h1 style={{ color: "white", fontSize: "18px", fontWeight: 500, margin: 0 }}>Progress</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: "4px 0 0" }}>Loading...</p>
    </div>
  );

  const header = (
    <div style={{ background: "#1a1a2e", padding: isDesktop ? "24px 28px 20px" : "20px", flexShrink: 0 }}>
      <h1 style={{ color: "white", fontSize: isDesktop ? "22px" : "18px", fontWeight: 500, margin: "0 0 4px" }}>Progress</h1>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>Body metrics · updated weekly</p>
    </div>
  );

  const checkInCard = (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: "16px" }}>
      {/* Card header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Weekly check-in</p>
          <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0" }}>
            Week of {formatDate(weekKeyToDate(weekKey))}
          </p>
        </div>
        {hasLoggedThisWeek && (
          <button onClick={() => setEditing(true)} style={{ fontSize: "11px", color: "#6366f1", background: "#eef2ff", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}>
            Edit
          </button>
        )}
      </div>

      {hasLoggedThisWeek ? (
        /* Already logged this week */
        <div style={{ padding: "14px 16px", display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, background: "#f9fafb", borderRadius: "10px", padding: "10px 12px" }}>
            <p style={{ fontSize: "10px", color: "#9ca3af", margin: "0 0 2px" }}>Weight</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
              {thisWeek.weightLbs != null ? `${thisWeek.weightLbs}` : "—"}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "#9ca3af", marginLeft: "3px" }}>lbs</span>
            </p>
          </div>
          <div style={{ flex: 1, background: "#f9fafb", borderRadius: "10px", padding: "10px 12px" }}>
            <p style={{ fontSize: "10px", color: "#9ca3af", margin: "0 0 2px" }}>Body fat</p>
            <p style={{ fontSize: "18px", fontWeight: 700, color: "#1f2937", margin: 0 }}>
              {thisWeek.bodyFatPct != null ? `${thisWeek.bodyFatPct}` : "—"}
              <span style={{ fontSize: "11px", fontWeight: 400, color: "#9ca3af", marginLeft: "3px" }}>%</span>
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>
        </div>
      ) : (
        /* Not yet logged — show inputs */
        <div style={{ padding: "14px 16px" }}>
          {/* Disclaimer */}
          <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", marginBottom: "14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>💡</span>
            <p style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
              <strong>Completely optional.</strong> Your data is private and only visible to you. You can skip this anytime — it's only needed to see your progress charts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", fontWeight: 500, marginBottom: "5px" }}>Weight (lbs)</label>
              <input
                type="number" inputMode="decimal" placeholder="e.g. 165"
                value={weightInput} onChange={e => setWeightInput(e.target.value)}
                style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "#374151", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", fontWeight: 500, marginBottom: "5px" }}>Body fat % <span style={{ fontWeight: 400, color: "#d1d5db" }}>(optional)</span></label>
              <input
                type="number" inputMode="decimal" placeholder="e.g. 18"
                value={fatInput} onChange={e => setFatInput(e.target.value)}
                style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "#374151", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || (!weightInput.trim() && !fatInput.trim())}
            style={{ width: "100%", background: saving || (!weightInput.trim() && !fatInput.trim()) ? "#f3f4f6" : "#1a1a2e", color: saving || (!weightInput.trim() && !fatInput.trim()) ? "#9ca3af" : "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 500, cursor: saving || (!weightInput.trim() && !fatInput.trim()) ? "default" : "pointer", transition: "background 0.15s" }}
          >
            {saving ? "Saving…" : saved ? "Saved ✓" : "Log this week"}
          </button>
        </div>
      )}
    </div>
  );

  const charts = (
    <>
      {/* Weight chart */}
      {weightPoints.length > 0 && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Weight</p>
              {latestWeight != null && (
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#4f46e5", margin: "2px 0 0" }}>
                  {latestWeight.toFixed(1)} <span style={{ fontSize: "12px", fontWeight: 400, color: "#9ca3af" }}>lbs</span>
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {trendBadge(weightPoints, " lbs")}
              <p style={{ fontSize: "10px", color: "#d1d5db", margin: "2px 0 0" }}>{weightPoints.length} week{weightPoints.length !== 1 ? "s" : ""} logged</p>
            </div>
          </div>
          <LineChart points={weightPoints} unit=" lbs" color="#4f46e5" decimals={1} />
        </div>
      )}

      {/* Body fat chart */}
      {fatPoints.length > 0 && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
            <div>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Body fat</p>
              {latestFat != null && (
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#f59e0b", margin: "2px 0 0" }}>
                  {latestFat.toFixed(1)} <span style={{ fontSize: "12px", fontWeight: 400, color: "#9ca3af" }}>%</span>
                </p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              {trendBadge(fatPoints, "%")}
              <p style={{ fontSize: "10px", color: "#d1d5db", margin: "2px 0 0" }}>{fatPoints.length} week{fatPoints.length !== 1 ? "s" : ""} logged</p>
            </div>
          </div>
          <LineChart points={fatPoints} unit="%" color="#f59e0b" decimals={1} />
        </div>
      )}

      {/* Empty state — no data at all */}
      {weightPoints.length === 0 && fatPoints.length === 0 && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "32px 20px", textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151", margin: "0 0 4px" }}>No data yet</p>
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Log your first week above to start your progress chart</p>
        </div>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {header}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {checkInCard}
            {charts}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {header}
      <div style={{ padding: "16px" }}>
        {checkInCard}
        {charts}
      </div>
    </>
  );
}
