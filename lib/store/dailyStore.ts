import { create } from 'zustand';
import { DailyLog, ScoreBreakdown, computeScore } from '../disciplineScore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase'; 
import { subHours, format } from 'date-fns';

const getLogicalToday = () => format(subHours(new Date(), 4), 'yyyy-MM-dd');

interface DailyState {
  log: DailyLog;
  score: number;
  breakdown: ScoreBreakdown;
  streak: number;
  protectionTokens: number;
  
  logMeal: () => Promise<void>;
  unlogMeal: () => Promise<void>;
  addWater: (glasses: number) => Promise<void>;
  setWorkoutStarted: () => Promise<void>;
  setWorkoutDone: () => Promise<void>;
  logSleep: (hours: number) => Promise<void>;
  loadTodayData: () => Promise<void>;
}

const defaultLog: DailyLog = {
  workout_done: false,
  workout_started: false,
  meals_logged: 0,
  water_glasses: 0,
  water_goal: 8,
  sleep_hours: null,
  steps: null,
};

// --- CLOUD SYNC ENGINE (Industry Standard) ---
const syncToSupabase = async (log: DailyLog, score: number) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; 

    const today = getLogicalToday();
    
    // Backup exactly *which* meals were eaten
    const indicesStr = await AsyncStorage.getItem('logged_meal_indices');
    const loggedIndices = indicesStr ? JSON.parse(indicesStr) : [];

    // 1. Sync ONLY Daily Logs (Water, Meals, Workout, Score)
    // We intentionally removed the Streak sync from here so logging water doesn't fake a workout streak!
    const { error: dailyError } = await supabase
      .from('daily_logs')
      .upsert({
        user_id: user.id,
        log_date: today,
        workout_started: log.workout_started,
        workout_done: log.workout_done,
        meals_logged: log.meals_logged,
        water_glasses: log.water_glasses,
        water_goal: log.water_goal,
        sleep_hours: log.sleep_hours,
        steps: log.steps,
        score: score, 
        logged_meal_indices: loggedIndices
      }, { onConflict: 'user_id, log_date' }); 

    if (dailyError) console.error("Daily Logs sync error:", dailyError.message);

  } catch (e) {
    console.error("Failed to reach Supabase:", e);
  }
};

export const useDailyStore = create<DailyState>((set, get) => ({
  log: defaultLog,
  score: 0,
  breakdown: computeScore(defaultLog),
  streak: 0,
  protectionTokens: 1, 

  logMeal: async () => {
    const currentLog = get().log;
    if (currentLog.meals_logged >= 5) return; 

    const newLog = { ...currentLog, meals_logged: currentLog.meals_logged + 1 };
    const newScore = computeScore(newLog);

    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await AsyncStorage.setItem('meals_logged_count', newLog.meals_logged.toString());
    await syncToSupabase(newLog, newScore.total);
  },

  unlogMeal: async () => {
    const currentLog = get().log;
    if (currentLog.meals_logged <= 0) return;

    const newLog = { ...currentLog, meals_logged: currentLog.meals_logged - 1 };
    const newScore = computeScore(newLog);

    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await AsyncStorage.setItem('meals_logged_count', newLog.meals_logged.toString());
    await syncToSupabase(newLog, newScore.total);
  },

  addWater: async (glasses: number) => {
    const currentLog = get().log;
    const newLog = { ...currentLog, water_glasses: currentLog.water_glasses + glasses };
    const newScore = computeScore(newLog);

    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await AsyncStorage.setItem('water_count', newLog.water_glasses.toString());
    await syncToSupabase(newLog, newScore.total);
  },

  setWorkoutStarted: async () => {
    const newLog = { ...get().log, workout_started: true };
    const newScore = computeScore(newLog);
    
    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await syncToSupabase(newLog, newScore.total);
  },

  setWorkoutDone: async () => {
    const newLog = { ...get().log, workout_started: true, workout_done: true };
    const newScore = computeScore(newLog);
    
    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await AsyncStorage.setItem('workout_done', 'true');
    await syncToSupabase(newLog, newScore.total);
  },

  logSleep: async (hours: number) => {
    const newLog = { ...get().log, sleep_hours: hours };
    const newScore = computeScore(newLog);
    
    set({ log: newLog, breakdown: newScore, score: newScore.total });
    await syncToSupabase(newLog, newScore.total);
  },

  // --- CLOUD RECOVERY SYSTEM ---
  loadTodayData: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const today = getLogicalToday();

      if (user) {
        // 1. Fetch today's DAILY data from the cloud
        const { data: cloudLog } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', user.id)
          .eq('log_date', today)
          .single();

        // 2. Fetch STREAK data from the cloud
        const { data: streakData } = await supabase
          .from('streaks')
          .select('current_streak, protection_tokens')
          .eq('user_id', user.id)
          .single();

        // 3. RESTORE EVERYTHING TO THE PHONE!
        if (cloudLog) {
          
          if (cloudLog.logged_meal_indices) {
            await AsyncStorage.setItem('logged_meal_indices', JSON.stringify(cloudLog.logged_meal_indices));
          }

          const restoredLog: DailyLog = {
            workout_done: cloudLog.workout_done || false,
            workout_started: cloudLog.workout_started || false,
            meals_logged: cloudLog.meals_logged || 0,
            water_glasses: cloudLog.water_glasses || 0,
            water_goal: cloudLog.water_goal || 8,
            sleep_hours: cloudLog.sleep_hours,
            steps: cloudLog.steps,
          };

          const loadedScore = computeScore(restoredLog);
          
          set({
            log: restoredLog,
            breakdown: loadedScore,
            score: loadedScore.total,
            streak: streakData?.current_streak || 0, 
            protectionTokens: streakData?.protection_tokens || 1
          });
          
          return; 
        } else {
          // If brand new day, sync a fresh slate so it exists in cloud instantly
          await syncToSupabase(defaultLog, 0);
        }
      }
    } catch (e) {
      console.error("Failed to load daily metrics into store", e);
    }
  }
}));