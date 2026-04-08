import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Workout Plans ─────────────────────────────────────────────────────────────

export async function getWorkoutPlan(userId: string, weekKey: string) {
  const { data, error } = await supabase
    .from("workout_plans")
    .select("plan")
    .eq("user_id", userId)
    .eq("week_key", weekKey)
    .single()
  if (error || !data) return null
  return data.plan
}

export async function saveWorkoutPlan(userId: string, weekKey: string, plan: any) {
  const { error } = await supabase
    .from("workout_plans")
    .upsert({ user_id: userId, week_key: weekKey, plan }, { onConflict: "user_id,week_key" })
  if (error) console.error("saveWorkoutPlan error:", error)
}

export async function deleteWorkoutPlan(userId: string, weekKey: string) {
  const { error } = await supabase
    .from("workout_plans")
    .delete()
    .eq("user_id", userId)
    .eq("week_key", weekKey)
  if (error) console.error("deleteWorkoutPlan error:", error)
}

// ── Workout Logs ──────────────────────────────────────────────────────────────

export async function getWorkoutLogs(userId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("log_date, day_name, duration, exercise_count, time_elapsed")
    .eq("user_id", userId)
  if (error || !data) return {}
  const result: Record<string, any> = {}
  data.forEach(row => {
    result[row.log_date] = {
      dayName: row.day_name,
      duration: row.duration,
      exerciseCount: row.exercise_count,
      timeElapsed: row.time_elapsed,
    }
  })
  return result
}

export async function saveWorkoutLog(
  userId: string,
  logDate: string,
  dayName: string,
  duration: string,
  exerciseCount: number,
  timeElapsed: number,
  setData?: Record<string, Array<{ v1: string; v2: string }>>
) {
  const { error } = await supabase
    .from("workout_logs")
    .upsert(
      { user_id: userId, log_date: logDate, day_name: dayName, duration, exercise_count: exerciseCount, time_elapsed: timeElapsed, set_data: setData ?? null },
      { onConflict: "user_id,log_date" }
    )
  if (error) console.error("saveWorkoutLog error:", error)
}

// ── Set history (most recent logged sets per exercise) ────────────────────────

export async function getLastSetData(
  userId: string,
  exerciseNames: string[]
): Promise<Record<string, Array<{ v1: string; v2: string }>>> {
  if (!exerciseNames.length) return {}
  const { data, error } = await supabase
    .from("workout_logs")
    .select("log_date, set_data")
    .eq("user_id", userId)
    .not("set_data", "is", null)
    .order("log_date", { ascending: false })
    .limit(20)
  if (error || !data) return {}

  // Walk logs newest-first; for each exercise find the first entry that has it
  const result: Record<string, Array<{ v1: string; v2: string }>> = {}
  const normalise = (s: string) => s.toLowerCase().replace(/\s*\d+\s*[xX×]\s*\d+.*$/, "").trim()
  for (const row of data) {
    if (!row.set_data) continue
    for (const exName of exerciseNames) {
      if (result[exName]) continue
      const key = Object.keys(row.set_data).find(k => normalise(k) === normalise(exName))
      if (key) result[exName] = row.set_data[key]
    }
    if (Object.keys(result).length === exerciseNames.length) break
  }
  return result
}

// ── Body Metrics ─────────────────────────────────────────────────────────────

export type BodyMetricRow = { weekKey: string; weightLbs: number | null; bodyFatPct: number | null };

export async function getBodyMetrics(userId: string): Promise<BodyMetricRow[]> {
  const { data, error } = await supabase
    .from("body_metrics")
    .select("week_key, weight_lbs, body_fat_pct")
    .eq("user_id", userId)
    .order("week_key", { ascending: true })
  if (error || !data) return []
  return data.map(r => ({ weekKey: r.week_key, weightLbs: r.weight_lbs, bodyFatPct: r.body_fat_pct }))
}

export async function saveBodyMetric(
  userId: string,
  weekKey: string,
  weightLbs: number | null,
  bodyFatPct: number | null
) {
  const { error } = await supabase
    .from("body_metrics")
    .upsert({ user_id: userId, week_key: weekKey, weight_lbs: weightLbs, body_fat_pct: bodyFatPct }, { onConflict: "user_id,week_key" })
  if (error) console.error("saveBodyMetric error:", error)
}

// ── Nutrition Logs ────────────────────────────────────────────────────────────

export async function getNutritionLogs(userId: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("log_date, meals")
    .eq("user_id", userId)
  if (error || !data) return {}
  const result: Record<string, any> = {}
  data.forEach(row => { result[row.log_date] = { meals: row.meals } })
  return result
}

export async function saveNutritionLog(userId: string, logDate: string, meals: any[]) {
  const { error } = await supabase
    .from("nutrition_logs")
    .upsert({ user_id: userId, log_date: logDate, meals }, { onConflict: "user_id,log_date" })
  if (error) console.error("saveNutritionLog error:", error)
}

// ── Nutrition Goals ───────────────────────────────────────────────────────────

export async function getNutritionGoals(userId: string) {
  const { data, error } = await supabase
    .from("nutrition_goals")
    .select("calories, protein, carbs, fat")
    .eq("user_id", userId)
    .single()
  if (error || !data) return null
  return data
}

export async function saveNutritionGoals(userId: string, goals: { calories: number; protein: number; carbs: number; fat: number }) {
  const { error } = await supabase
    .from("nutrition_goals")
    .upsert({ user_id: userId, ...goals }, { onConflict: "user_id" })
  if (error) console.error("saveNutritionGoals error:", error)
}