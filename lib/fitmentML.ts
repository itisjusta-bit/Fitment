// lib/fitmentML.ts
import { supabase } from './supabase';

// Make sure your custom Railway URL is still here!
const API_BASE_URL = 'https://fitment-brain-production.up.railway.app/api/v2';

export interface UserOnboarding {
  goal: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  diet: string;
  activity: string;
  equipment: string;
  frequency: number;
  region: string;
  experience_level: string; 
  active_injuries: string[]; 
}

export async function generateDailyPlan(onboardingData: UserOnboarding) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) throw new Error("No active Supabase user found.");
    const userId = authData.user.id;

    // 1. Build Stateless Context 
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: recentProtocols } = await supabase
      .from('user_protocols')
      .select('date, workout, diet')
      .eq('user_id', userId)
      .gte('date', threeDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    let recent_exercise_ids: string[] = [];
    let recent_rotation_groups: Record<string, number> = {};
    let recent_food_ids: string[] = [];
    let is_first_day = true;

    if (recentProtocols && recentProtocols.length > 0) {
      is_first_day = false;
      recentProtocols.forEach(p => {
        if (p.workout?.exercise_ids_used) recent_exercise_ids.push(...p.workout.exercise_ids_used);
        if (p.workout?.rotation_groups_used) {
          p.workout.rotation_groups_used.forEach((rg: string) => {
            recent_rotation_groups[rg] = (recent_rotation_groups[rg] || 0) + 1;
          });
        }
        if (p.date >= twoDaysAgo.toISOString().split('T')[0] && p.diet?.food_ids_used) {
          recent_food_ids.push(...p.diet.food_ids_used);
        }
      });
    }

    const { data: streakData } = await supabase.from('streak_state').select('current_streak').eq('user_id', userId).single();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: yesterdayLog } = await supabase.from('daily_logs').select('discipline_score').eq('user_id', userId).eq('date', yesterday.toISOString().split('T')[0]).single();

    // 2. Assemble Payload
    const mlPayload = {
      user: {
        goal: onboardingData.goal, 
        gender: onboardingData.gender,
        age: Number(onboardingData.age),
        weight_kg: Number(onboardingData.weight),
        height_cm: Number(onboardingData.height),
        diet_type: mapDietType(onboardingData.diet),
        activity_level: mapActivityLevel(onboardingData.activity),
        equipment: mapEquipment(onboardingData.equipment),
        frequency: Number(onboardingData.frequency),
        region: mapRegion(onboardingData.region),
        experience_level: onboardingData.experience_level, 
        active_injuries: onboardingData.active_injuries || [] 
      },
      day_index: 0,
      fasting: null,
      freshness_context: { recent_exercise_ids, recent_rotation_groups, recent_food_ids },
      coach_context: {
        is_first_day,
        current_streak: streakData?.current_streak || 0,
        streak_just_hit_milestone: false,
        protection_token_used: false,
        streak_was_reset: false,
        yesterday_score: yesterdayLog?.discipline_score || null,
        user_id: userId
      }
    };

    console.log("🚀 Firing Stateless Payload to Brain v2:", mlPayload);

    // 3. Fire to Railway
    const response = await fetch(`${API_BASE_URL}/protocol/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mlPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Brain v2 Error (${response.status}):`, errorText);
      throw new Error(`ML Engine returned status ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Fitment ML Engine Error:", error);
    return null;
  }
}

function mapDietType(diet: string) {
  const d = diet.toLowerCase();
  if (d.includes('veg') && !d.includes('vegan')) return 'vegetarian';
  if (d.includes('vegan')) return 'vegan';
  if (d.includes('egg')) return 'eggetarian';
  if (d.includes('jain')) return 'jain';
  return 'standard'; 
}
function mapActivityLevel(activity: string) {
  const a = activity.toLowerCase();
  if (a.includes('low') || a.includes('sedentary')) return 'sedentary';
  if (a.includes('high') || a.includes('very')) return 'very_active';
  if (a.includes('active')) return 'active';
  return 'moderate';
}
function mapEquipment(equip: string) {
  const e = equip.toLowerCase();
  if (e.includes('gym')) return 'full_gym';
  if (e.includes('dumbbells') || e.includes('home')) return 'dumbbells';
  return 'no_equipment';
}
function mapRegion(region: string) {
  const r = region.toLowerCase();
  if (r.includes('west')) return 'western';
  if (r.includes('global')) return 'global';
  return 'indian'; 
}