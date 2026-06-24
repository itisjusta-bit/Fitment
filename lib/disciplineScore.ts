// ─── TYPES ───────────────────────────────────────────────────────────
export interface DailyLog {
  workout_done:     boolean;
  workout_started:  boolean;
  meals_logged:     number;   // 0–5
  water_glasses:    number;   // 0–8 (or user's goal)
  water_goal:       number;   // default 8
  sleep_hours:      number | null;
  steps:            number | null;
}

export interface ScoreBreakdown {
  workout:  number;  // 0 | 15 | 35
  meals:    number;  // 0–25
  water:    number;  // 0 | 5 | 10 | 15 | 20
  sleep:    number;  // 0 | 3 | 6 | 10
  steps:    number;  // 0 | 3 | 6 | 10
  total:    number;  // 0–100
}

// ─── PURE SCORE CALCULATION (no network, runs instantly) ─────────────
export const computeScore = (log: DailyLog): ScoreBreakdown => {
  // WORKOUT — 35 pts (Highest weight to prevent gaming the system)
  const workout =
    log.workout_done    ? 35 :
    log.workout_started ? 15 : 0;

  // MEALS — 5 pts each, max 25
  const meals = Math.min(log.meals_logged, 5) * 5;

  // WATER — tiered by percentage of goal
  const waterPct = log.water_goal > 0
    ? log.water_glasses / log.water_goal
    : 0;
  const water =
    waterPct >= 1.0  ? 20 :
    waterPct >= 0.75 ? 15 :
    waterPct >= 0.5  ? 10 :
    waterPct >= 0.25 ? 5  : 0;

  // SLEEP — 10 pts, optional
  const sleep =
    log.sleep_hours === null ? 0 :
    log.sleep_hours >= 7   ? 10 :
    log.sleep_hours >= 6   ? 6  :
    log.sleep_hours >= 5   ? 3  : 0;

  // STEPS — 10 pts, optional (wearable or manual)
  const steps =
    log.steps === null ? 0 :
    log.steps >= 8000 ? 10 :
    log.steps >= 5000 ? 6  :
    log.steps >= 3000 ? 3  : 0;

  const total = Math.min(workout + meals + water + sleep + steps, 100);

  return { workout, meals, water, sleep, steps, total };
};

// ─── SCORE LABEL + EMOJI + COLOR ─────────────────────────────────────
export const getScoreLabel = (score: number) => {
  if (score === 100) return { label: 'Perfect Day',   emoji: '💯', color: '#F59E0B' };
  if (score >= 86)   return { label: 'Beast Mode',    emoji: '🏆', color: '#00C896' };
  if (score >= 71)   return { label: 'Excellent',     emoji: '🔥', color: '#00C896' };
  if (score >= 51)   return { label: 'On Track',      emoji: '⚡', color: '#3B82F6' };
  if (score >= 31)   return { label: 'Getting Going', emoji: '💤', color: '#F59E0B' };
  return               { label: 'Cold Start',    emoji: '❄️', color: '#94A3B8' };
};

// ─── STREAK CALCULATION (runs at 4AM) ─────────────────────
export const STREAK_THRESHOLD = 40; // 40 points minimum for an active day

export const calculateDailyStreak = (
  yesterdayScore:  number,
  currentStreak:   number,
  bestStreak:      number,
  protectionTokens:number,
): {
  newStreak:       number;
  newBest:         number;
  tokensRemaining: number;
  protectionUsed:  boolean;
  streakBroke:     boolean;
} => {
  const wasActiveDay = yesterdayScore >= STREAK_THRESHOLD;

  if (wasActiveDay) {
    // Normal increment
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newBest: Math.max(bestStreak, newStreak),
      tokensRemaining: protectionTokens,
      protectionUsed: false,
      streakBroke: false,
    };
  }

  if (protectionTokens > 0) {
    // Token saves the streak
    const newStreak = currentStreak + 1;
    return {
      newStreak,
      newBest: Math.max(bestStreak, newStreak),
      tokensRemaining: 0,
      protectionUsed: true,
      streakBroke: false,
    };
  }

  // Streak breaks
  return {
    newStreak: 0,
    newBest: bestStreak,
    tokensRemaining: 0,
    protectionUsed: false,
    streakBroke: true,
  };
};

// ─── XP EARNED FROM DAILY LOG ─────────────────────────────────────────
export const calculateDailyXP = (log: DailyLog): number => {
  let xp = 0;
  if (log.workout_done)    xp += 50;
  if (log.workout_started) xp += 10; // partial credit
  xp += log.meals_logged * 10;        // 10 XP per meal
  if (log.water_glasses >= log.water_goal) xp += 15;
  if (log.sleep_hours && log.sleep_hours >= 7) xp += 15;
  if (log.steps && log.steps >= 8000) xp += 10;
  return xp;
};