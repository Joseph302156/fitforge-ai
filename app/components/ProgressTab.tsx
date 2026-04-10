"use client";
import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import {
  getBodyMetrics, saveBodyMetric, BodyMetricRow,
  getAllWorkoutLogs, WorkoutLogFull,
} from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

type ChartPoint = { date: Date; value: number };
type VolCat = "push" | "pull" | "legs" | "cardio" | "other";
type WeekVol = { weekKey: string; push: number; pull: number; legs: number; cardio: number; other: number; total: number };
type PREntry = { name: string; best: number; unit: string; isWeight: boolean; history: number[]; improvement: number };
type ConsData = { streak: number; bestStreak: number; thisMonthCount: number; thisMonthTarget: number; totalCount: number; firstDate: string | null };

// ── Date helpers ──────────────────────────────────────────────────────────────

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

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function xAxisLabels(start: Date, end: Date): Date[] {
  const span = end.getTime() - start.getTime();
  return [0, 1/3, 2/3, 1].map(f => new Date(start.getTime() + span * f));
}

function dateToWeekKey(ds: string): string {
  const d = new Date(ds + "T12:00:00");
  const day = d.getDay();
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysFromMonday);
  return `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,"0")}-${String(monday.getDate()).padStart(2,"0")}`;
}

// ── Body metric chart helpers ─────────────────────────────────────────────────

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

// ── Workout data helpers ──────────────────────────────────────────────────────

function normEx(name: string): string {
  return name.replace(/\s*\d+\s*[xX×]\s*\d+.*$/, "").trim().toLowerCase();
}

function categorize(name: string): VolCat {
  const n = name.toLowerCase();
  if (/run|jog|bike|cycl|swim|treadmill|elliptical|cardio|sprint/.test(n)) return "cardio";
  if (/squat|lunge|leg press|deadlift|rdl|hip thrust|glute|calf|hamstring|quad|leg curl|leg extension/.test(n)) return "legs";
  if (/bench|chest press|push.?up|dip|\bfly\b|pec|tricep|shoulder press|overhead press|incline|decline|lateral raise|front raise/.test(n)) return "push";
  if (/row|pull.?up|chin.?up|lat pulldown|lat pull|curl|back|bicep|shrug|face pull/.test(n)) return "pull";
  return "other";
}

function isWeightEx(sets: Array<{ v1: string; v2: string }>): boolean {
  return sets.some(s => s.v2 && s.v2.trim() !== "");
}

function computePRs(logs: WorkoutLogFull[]): PREntry[] {
  const exMap: Record<string, { sessions: Array<{ date: string; maxVal: number }>; isWeight: boolean; displayName: string }> = {};
  for (const log of logs) {
    if (!log.setData) continue;
    for (const [rawName, sets] of Object.entries(log.setData)) {
      const key = normEx(rawName);
      const displayName = rawName.replace(/\s*\d+\s*[xX×]\s*\d+.*$/, "").trim();
      const weight = isWeightEx(sets);
      const maxVal = Math.max(...sets.map(s => { const v = parseFloat(s.v1); return isNaN(v) ? 0 : v; }));
      if (maxVal <= 0) continue;
      if (!exMap[key]) exMap[key] = { sessions: [], isWeight: weight, displayName };
      exMap[key].sessions.push({ date: log.logDate, maxVal });
    }
  }
  const entries: PREntry[] = [];
  for (const data of Object.values(exMap)) {
    if (data.sessions.length < 2) continue;
    const sorted = [...data.sessions].sort((a, b) => a.date.localeCompare(b.date));
    const history = sorted.map(s => s.maxVal);
    const best = Math.max(...history);
    entries.push({ name: data.displayName, best, unit: data.isWeight ? "lbs" : "reps", isWeight: data.isWeight, history, improvement: best - history[0] });
  }
  return entries
    .sort((a, b) => a.isWeight !== b.isWeight ? (a.isWeight ? -1 : 1) : b.history.length - a.history.length)
    .slice(0, 6);
}

function computeVolume(logs: WorkoutLogFull[]): WeekVol[] {
  const map: Record<string, WeekVol> = {};
  for (const log of logs) {
    if (!log.setData) continue;
    const wk = dateToWeekKey(log.logDate);
    if (!map[wk]) map[wk] = { weekKey: wk, push: 0, pull: 0, legs: 0, cardio: 0, other: 0, total: 0 };
    for (const [rawName, sets] of Object.entries(log.setData)) {
      const cat = categorize(normEx(rawName));
      const vol = sets.length;
      map[wk][cat] += vol;
      map[wk].total += vol;
    }
  }
  return Object.values(map).sort((a, b) => a.weekKey.localeCompare(b.weekKey)).slice(-8);
}

function computeConsistency(logs: WorkoutLogFull[]): ConsData {
  if (!logs.length) return { streak: 0, bestStreak: 0, thisMonthCount: 0, thisMonthTarget: 0, totalCount: 0, firstDate: null };
  const today = new Date();
  const todayS = toDateStr(today);
  const dates = new Set(logs.map(l => l.logDate));
  const monthStart = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-01`;
  const thisMonthCount = logs.filter(l => l.logDate >= monthStart).length;
  const thisMonthTarget = Math.max(Math.ceil(today.getDate() / 7) * 3, 1);

  let streak = 0;
  const d = new Date(today);
  if (!dates.has(todayS)) d.setDate(d.getDate() - 1);
  while (true) {
    const ds = toDateStr(d);
    if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }

  const sorted = [...dates].sort();
  let best = streak, cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round((new Date(sorted[i]+"T12:00:00").getTime() - new Date(sorted[i-1]+"T12:00:00").getTime()) / 86400000);
    if (diff === 1) { cur++; best = Math.max(best, cur); }
    else cur = 1;
  }

  return { streak, bestStreak: best, thisMonthCount, thisMonthTarget, totalCount: dates.size, firstDate: logs[0].logDate };
}

// ── SVG Charts ────────────────────────────────────────────────────────────────

interface LineChartProps { points: ChartPoint[]; unit: string; color: string; decimals?: number }

function LineChart({ points, unit, color, decimals = 1 }: LineChartProps) {
  if (points.length < 2) {
    return (
      <div style={{ height: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "11px", color: "#9ca3af", textAlign: "center" }}>Log at least 2 weeks to see your chart</p>
      </div>
    );
  }
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
  const pathD = pts.map((p, i) => { const { x, y } = px(p); return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");
  const yTicks = [0, 0.5, 1].map(f => yMin + f * (yMax - yMin));
  const xLabels = xAxisLabels(pts[0].date, pts[pts.length - 1].date);
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
      {yTicks.map((v, i) => {
        const y = PAD.top + (1 - (v - yMin) / (yMax - yMin)) * chartH;
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">{v.toFixed(decimals)}</text>
          </g>
        );
      })}
      {trendPath && <path d={trendPath} stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.35" fill="none" />}
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
      <path d={pathD} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const { x, y } = px(p);
        return <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 4 : 3} fill={i === pts.length - 1 ? color : "white"} stroke={color} strokeWidth="2" />;
      })}
      {(() => { const last = pts[pts.length - 1]; const { x, y } = px(last); return <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill={color} fontWeight="600">{last.value.toFixed(decimals)}{unit}</text>; })()}
      {xLabels.map((d, i) => {
        const xPos = PAD.left + ((d.getTime() - minT) / tSpan) * chartW;
        const anchor = i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle";
        return <text key={i} x={xPos} y={H - 4} textAnchor={anchor} fontSize="9" fill="#9ca3af">{formatDate(d)}</text>;
      })}
    </svg>
  );
}

function ActivityHeatmap({ logs }: { logs: WorkoutLogFull[] }) {
  const today = new Date();
  const todayDow = today.getDay();
  const daysFromMonday = todayDow === 0 ? 6 : todayDow - 1;
  const curMonday = new Date(today);
  curMonday.setDate(today.getDate() - daysFromMonday);
  curMonday.setHours(0, 0, 0, 0);

  const logMap: Record<string, number> = {};
  for (const log of logs) logMap[log.logDate] = log.exerciseCount;

  const COLS = 13, ROWS = 7, CELL = 14, GAP = 3, LABEL_H = 14;
  const W = COLS * (CELL + GAP) - GAP;
  const H = ROWS * (CELL + GAP) - GAP;
  const COLORS = ["#f3f4f6", "#c7d2fe", "#818cf8", "#4f46e5"];

  const monthLabels: Array<{ x: number; text: string }> = [];
  let prevMonth = -1;
  for (let col = 0; col < COLS; col++) {
    const monday = new Date(curMonday);
    monday.setDate(curMonday.getDate() - (COLS - 1 - col) * 7);
    if (monday.getMonth() !== prevMonth) {
      monthLabels.push({ x: col * (CELL + GAP), text: monday.toLocaleDateString("en-US", { month: "short" }) });
      prevMonth = monday.getMonth();
    }
  }

  const cells: Array<{ x: number; y: number; color: string; future: boolean }> = [];
  for (let col = 0; col < COLS; col++) {
    const monday = new Date(curMonday);
    monday.setDate(curMonday.getDate() - (COLS - 1 - col) * 7);
    for (let row = 0; row < ROWS; row++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + row);
      const ds = toDateStr(d);
      const future = d > today;
      const count = future ? 0 : (logMap[ds] ?? 0);
      const intensity = future ? -1 : count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : 3;
      cells.push({ x: col * (CELL + GAP), y: LABEL_H + row * (CELL + GAP), color: intensity < 0 ? "#fafafa" : COLORS[intensity], future });
    }
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H + LABEL_H}`} width="100%" style={{ display: "block" }}>
        {monthLabels.map(({ x, text }) => (
          <text key={x} x={x} y={11} fontSize="9" fill="#9ca3af">{text}</text>
        ))}
        {cells.map(({ x, y, color, future }, i) => (
          <rect key={i} x={x} y={y} width={CELL} height={CELL} rx={3} fill={color} opacity={future ? 0.3 : 1} />
        ))}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end", marginTop: "6px" }}>
        <span style={{ fontSize: "9px", color: "#9ca3af" }}>Less</span>
        {COLORS.map((c, i) => <div key={i} style={{ width: "11px", height: "11px", borderRadius: "2px", background: c }} />)}
        <span style={{ fontSize: "9px", color: "#9ca3af" }}>More</span>
      </div>
    </div>
  );
}

function PRBoard({ prs }: { prs: PREntry[] }) {
  if (!prs.length) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.6 }}>
          Complete the same exercises across 2+ sessions to see your personal records.
        </p>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {prs.map(pr => {
        const spark = pr.history.slice(-7);
        const sMin = Math.min(...spark), sMax = Math.max(...spark);
        const sSpread = sMax - sMin || 1;
        const SW = 80, SH = 28;
        const pts = spark.map((v, i) => {
          const x = spark.length === 1 ? SW / 2 : (i / (spark.length - 1)) * SW;
          const y = SH - 4 - ((v - sMin) / sSpread) * (SH - 8);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(" ");
        const lastX = spark.length === 1 ? SW / 2 : SW;
        const lastY = SH - 4 - ((spark[spark.length-1] - sMin) / sSpread) * (SH - 8);
        const improved = pr.improvement > 0;
        return (
          <div key={pr.name} style={{ background: "#f9fafb", borderRadius: "14px", padding: "12px", border: "1px solid #f3f4f6" }}>
            <p style={{ fontSize: "11px", fontWeight: 500, color: "#6b7280", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pr.name}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "22px", fontWeight: 700, color: "#1f2937", lineHeight: 1 }}>
                {pr.best % 1 === 0 ? pr.best : pr.best.toFixed(1)}
              </span>
              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{pr.unit}</span>
            </div>
            {Math.abs(pr.improvement) >= 1 && (
              <p style={{ fontSize: "10px", color: improved ? "#22c55e" : "#9ca3af", fontWeight: 500, margin: "2px 0 0" }}>
                {improved ? "↑ +" : "↓ "}{Math.abs(Math.round(pr.improvement))} {pr.unit}
              </p>
            )}
            {spark.length >= 2 && (
              <svg viewBox={`0 0 ${SW} ${SH}`} width="100%" height="28" style={{ marginTop: "8px", display: "block" }}>
                <polyline points={pts} fill="none" stroke="#c7d2fe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx={lastX} cy={lastY} r="3" fill="#4f46e5" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

const VOL_CATS: Array<{ key: VolCat; color: string; label: string }> = [
  { key: "push",   color: "#4f46e5", label: "Push" },
  { key: "pull",   color: "#0ea5e9", label: "Pull" },
  { key: "legs",   color: "#22c55e", label: "Legs" },
  { key: "cardio", color: "#f59e0b", label: "Cardio" },
  { key: "other",  color: "#d1d5db", label: "Other" },
];

function WeeklyVolumeChart({ weeks }: { weeks: WeekVol[] }) {
  if (!weeks.length || weeks.every(w => w.total === 0)) {
    return (
      <div style={{ padding: "20px 0", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "#9ca3af" }}>Volume data builds up as you log more workouts.</p>
      </div>
    );
  }
  const maxTotal = Math.max(...weeks.map(w => w.total), 1);
  const W = 320, CHART_H = 100, LABEL_H = 22, PAD_L = 28, PAD_R = 8;
  const chartW = W - PAD_L - PAD_R;
  const colW = chartW / weeks.length;
  const barW = Math.max(Math.floor(colW - 6), 8);
  const barPad = (colW - barW) / 2;

  function fv(v: number): string {
    return v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${Math.round(v)}`;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${CHART_H + LABEL_H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        {[1/3, 2/3, 1].map((f, i) => {
          const v = maxTotal * f;
          const y = CHART_H * (1 - f);
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f3f4f6" strokeWidth="1" />
              <text x={PAD_L - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#d1d5db">{fv(v)}</text>
            </g>
          );
        })}
        {weeks.map((wk, i) => {
          const isLast = i === weeks.length - 1;
          const x0 = PAD_L + i * colW + barPad;
          let stackY = CHART_H;
          const bars = VOL_CATS.filter(c => wk[c.key] > 0).map(cat => {
            const h = (wk[cat.key] / maxTotal) * CHART_H;
            stackY -= h;
            return { cat, y: stackY, h };
          });
          const topY = CHART_H - (wk.total / maxTotal) * CHART_H;
          return (
            <g key={i}>
              {bars.map(({ cat, y, h }) => (
                <rect key={cat.key} x={x0} y={y} width={barW} height={Math.max(h, 0)} fill={cat.color} rx={2} />
              ))}
              {isLast && wk.total > 0 && (
                <rect x={x0 - 1} y={topY - 1} width={barW + 2} height={(wk.total / maxTotal) * CHART_H + 1} rx={3} fill="none" stroke="#e0e7ff" strokeWidth="1.5" />
              )}
              <text x={x0 + barW / 2} y={CHART_H + LABEL_H - 6} textAnchor="middle" fontSize="8"
                fill={isLast ? "#4f46e5" : "#9ca3af"} fontWeight={isLast ? "bold" : "normal"}>
                {`W${i + 1}`}
              </text>
            </g>
          );
        })}
        <line x1={PAD_L} y1={CHART_H} x2={W - PAD_R} y2={CHART_H} stroke="#e5e7eb" strokeWidth="1" />
      </svg>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px" }}>
        {VOL_CATS.filter(c => weeks.some(w => w[c.key] > 0)).map(cat => (
          <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: cat.color }} />
            <span style={{ fontSize: "10px", color: "#6b7280" }}>{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsistencyGauge({ data }: { data: ConsData }) {
  const pct = data.thisMonthTarget > 0 ? Math.min(data.thisMonthCount / data.thisMonthTarget, 1) : 0;
  const r = 50;
  const circ = 2 * Math.PI * r;
  const arc = pct * circ;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <svg viewBox="0 0 130 130" width="110" height="110" style={{ flexShrink: 0 }}>
        <defs>
          <linearGradient id="cg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
        </defs>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        {arc > 0 && (
          <circle cx="65" cy="65" r={r} fill="none" stroke="url(#cg-grad)" strokeWidth="12"
            strokeDasharray={`${arc.toFixed(1)} ${(circ - arc).toFixed(1)}`}
            strokeLinecap="round" transform="rotate(-90 65 65)" />
        )}
        <text x="65" y="58" textAnchor="middle" fontSize="22" fontWeight="700" fill="#1f2937">{Math.round(pct * 100)}%</text>
        <text x="65" y="72" textAnchor="middle" fontSize="9" fill="#9ca3af">this month</text>
        <text x="65" y="84" textAnchor="middle" fontSize="9" fill="#6b7280">{data.thisMonthCount} of {data.thisMonthTarget}</text>
      </svg>
      <div style={{ display: "flex", gap: "8px", flex: 1 }}>
        <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: data.streak > 0 ? "18px" : "22px", fontWeight: 700, color: "#4f46e5", margin: 0 }}>
            {data.streak > 0 ? `🔥 ${data.streak}` : "0"}
          </p>
          <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0" }}>day streak</p>
          {data.bestStreak > data.streak && data.bestStreak > 0 && (
            <p style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 500, margin: "6px 0 0" }}>Best: {data.bestStreak}</p>
          )}
        </div>
        <div style={{ flex: 1, background: "#f9fafb", borderRadius: "12px", padding: "12px", textAlign: "center", border: "1px solid #f3f4f6" }}>
          <p style={{ fontSize: "22px", fontWeight: 700, color: "#22c55e", margin: 0 }}>{data.totalCount}</p>
          <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0" }}>total workouts</p>
          {data.firstDate && (
            <p style={{ fontSize: "10px", color: "#9ca3af", margin: "6px 0 0" }}>
              since {formatDate(new Date(data.firstDate + "T12:00:00"))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: "12px", marginTop: "8px" }}>
      <p style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", margin: 0 }}>{title}</p>
      <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0" }}>{sub}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProgressTab({ isDesktop }: { isDesktop?: boolean }) {
  const { data: session } = useSession();
  const userId = session?.user?.id || session?.user?.email || "";

  const [metrics, setMetrics] = useState<BodyMetricRow[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogFull[]>([]);
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
    Promise.all([
      getBodyMetrics(userId),
      getAllWorkoutLogs(userId),
    ]).then(([bodyData, logs]) => {
      setMetrics(bodyData);
      setWorkoutLogs(logs);
      setMounted(true);
    });
  }, [userId]);

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

  // Computed workout progress data
  const prs = computePRs(workoutLogs);
  const weeklyVolume = computeVolume(workoutLogs);
  const consistency = computeConsistency(workoutLogs);
  const hasWorkouts = workoutLogs.length > 0;

  // Body metric chart data
  const weightPoints: ChartPoint[] = metrics
    .filter(m => m.weightLbs != null)
    .map(m => ({ date: weekKeyToDate(m.weekKey), value: m.weightLbs! }));
  const fatPoints: ChartPoint[] = metrics
    .filter(m => m.bodyFatPct != null)
    .map(m => ({ date: weekKeyToDate(m.weekKey), value: m.bodyFatPct! }));
  const latestWeight = weightPoints.length ? weightPoints[weightPoints.length - 1].value : null;
  const latestFat    = fatPoints.length    ? fatPoints[fatPoints.length - 1].value    : null;

  function trendBadge(pts: ChartPoint[], unit: string, decimals = 1): React.ReactNode {
    if (pts.length < 2) return null;
    const recent = pts[pts.length - 1].value;
    const prev   = pts[Math.max(0, pts.length - 5)].value;
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
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>Track your body metrics and workout performance</p>
    </div>
  );

  const checkInCard = (
    <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", overflow: "hidden", marginBottom: "16px" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937", margin: 0 }}>Weekly check-in</p>
          <p style={{ fontSize: "10px", color: "#9ca3af", margin: "2px 0 0" }}>Week of {formatDate(weekKeyToDate(weekKey))}</p>
        </div>
        {hasLoggedThisWeek && (
          <button onClick={() => setEditing(true)} style={{ fontSize: "11px", color: "#6366f1", background: "#eef2ff", border: "none", borderRadius: "8px", padding: "4px 10px", cursor: "pointer" }}>Edit</button>
        )}
      </div>
      {hasLoggedThisWeek ? (
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
        <div style={{ padding: "14px 16px" }}>
          <div style={{ background: "#f9fafb", borderRadius: "10px", padding: "10px 12px", marginBottom: "14px", display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>💡</span>
            <p style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.6, margin: 0 }}>
              <strong>Completely optional.</strong> Your data is private and only visible to you. You can skip this anytime — it&apos;s only needed to see your body composition charts.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", fontWeight: 500, marginBottom: "5px" }}>Weight (lbs)</label>
              <input type="number" inputMode="decimal" placeholder="e.g. 165" value={weightInput} onChange={e => setWeightInput(e.target.value)}
                style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "#374151", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "10px", color: "#9ca3af", fontWeight: 500, marginBottom: "5px" }}>Body fat % <span style={{ fontWeight: 400, color: "#d1d5db" }}>(optional)</span></label>
              <input type="number" inputMode="decimal" placeholder="e.g. 18" value={fatInput} onChange={e => setFatInput(e.target.value)}
                style={{ width: "100%", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "9px 12px", fontSize: "13px", color: "#374151", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || (!weightInput.trim() && !fatInput.trim())}
            style={{ width: "100%", background: saving || (!weightInput.trim() && !fatInput.trim()) ? "#f3f4f6" : "#1a1a2e", color: saving || (!weightInput.trim() && !fatInput.trim()) ? "#9ca3af" : "white", border: "none", borderRadius: "12px", padding: "11px", fontSize: "13px", fontWeight: 500, cursor: saving || (!weightInput.trim() && !fatInput.trim()) ? "default" : "pointer" }}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Log this week"}
          </button>
        </div>
      )}
    </div>
  );

  const bodyCharts = (
    <>
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
      {weightPoints.length === 0 && fatPoints.length === 0 && (
        <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "32px 20px", textAlign: "center", marginBottom: "12px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p style={{ fontSize: "13px", fontWeight: 500, color: "#374151", margin: "0 0 4px" }}>No body data yet</p>
          <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Log your first week above to start your progress chart</p>
        </div>
      )}
    </>
  );

  const workoutCharts = hasWorkouts ? (
    <>
      {/* Activity Heatmap */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
        <SectionHeader title="Activity" sub="Last 13 weeks · darker = more exercises" />
        <ActivityHeatmap logs={workoutLogs} />
      </div>

      {/* Personal Records */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
        <SectionHeader title="Personal Records" sub="Best performance per exercise · all time" />
        <PRBoard prs={prs} />
      </div>

      {/* Weekly Volume */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
        <SectionHeader title="Weekly Training Volume" sub="Total sets completed · last 8 weeks" />
        <WeeklyVolumeChart weeks={weeklyVolume} />
      </div>

      {/* Consistency */}
      <div style={{ background: "white", borderRadius: "16px", border: "1px solid #f3f4f6", padding: "14px 16px", marginBottom: "12px" }}>
        <SectionHeader title="Consistency" sub={`${new Date().toLocaleDateString("en-US", { month: "long" })} · planned vs completed`} />
        <ConsistencyGauge data={consistency} />
      </div>
    </>
  ) : null;

  if (isDesktop) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {header}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 48px" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            {checkInCard}
            {bodyCharts}
            {workoutCharts}
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
        {bodyCharts}
        {workoutCharts}
      </div>
    </>
  );
}
