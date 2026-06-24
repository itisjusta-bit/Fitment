import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// --- Global Stores & Utils ---
import { useDailyStore } from '../../lib/store/dailyStore';
import { getScoreLabel } from '../../lib/disciplineScore';
import { supabase } from '../../lib/supabase'; 

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {
  const router = useRouter();
  
  // --- ZUSTAND GLOBAL STATE ---
  const { log, score, streak, addWater, loadTodayData } = useDailyStore();
  
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const [protocol, setProtocol] = useState<any>(null); 
  const [nextMealName, setNextMealName] = useState("Loading...");
  const [workoutTitle, setWorkoutTitle] = useState("Loading...");
  const [programTime, setProgramTime] = useState("Week 1 • Day 1");
  const [refreshing, setRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // 🌟 Bulletproof Data Fetching with Date Check
  const fetchProtocolData = async (forceCloud = false) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0]; 
      const savedDate = await AsyncStorage.getItem('last_fetch_date');

      if (savedDate !== todayStr) {
        forceCloud = true;
        await AsyncStorage.multiRemove([
          'logged_exercise_indices',
          'logged_meal_indices'
        ]);
        await AsyncStorage.setItem('last_fetch_date', todayStr);
      }

      if (forceCloud) await AsyncStorage.removeItem('fitment_protocol');

      let currentProtocol = null;

      if (!forceCloud) {
        const localStr = await AsyncStorage.getItem('fitment_protocol');
        if (localStr) {
          const parsed = JSON.parse(localStr);
          if (parsed.workout) currentProtocol = parsed;
        }
      }

      if (!currentProtocol) {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          const { data, error } = await supabase
            .from('user_protocols')
            .select('workout, diet, coach_tip')
            .eq('user_id', authData.user.id)
            .eq('date', todayStr)
            .single();

          if (data) {
            currentProtocol = { success: true, ...data };
            await AsyncStorage.setItem('fitment_protocol', JSON.stringify(currentProtocol));
          } else {
            const { data: fallbackData } = await supabase
              .from('user_protocols')
              .select('workout, diet, coach_tip')
              .eq('user_id', authData.user.id)
              .order('generated_at', { ascending: false }) 
              .limit(1)
              .single();
              
            if (fallbackData) {
              currentProtocol = { success: true, ...fallbackData };
              await AsyncStorage.setItem('fitment_protocol', JSON.stringify(currentProtocol));
            }
          }
        }
      }

      if (currentProtocol) setProtocol(currentProtocol);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchProtocolData();
    loadTodayData();
  }, []);

  // 🌟 Indestructible JSON Unwrapper
  useEffect(() => {
    if (!protocol) return;

    try {
      let w = protocol.workout;
      if (typeof w === 'string') w = JSON.parse(w); 
      if (w && w.workout) w = w.workout;            

      if (w) {
        const title = w.split_name || w.title || "Daily Training";
        const duration = w.estimated_minutes || w.duration || 45;
        setWorkoutTitle(`${title} (${duration}m)`);
      }

      let d = protocol.diet;
      if (typeof d === 'string') d = JSON.parse(d); 
      if (d && d.diet) d = d.diet;

      if (d && d.meals && Array.isArray(d.meals)) {
        AsyncStorage.getItem('logged_meal_indices').then(str => {
          const loggedIndices = str ? JSON.parse(str) : [];
          let foundNext = false;
          for (let i = 0; i < d.meals.length; i++) {
            if (!loggedIndices.includes(i)) {
              const mealLabel = d.meals[i].label || d.meals[i].name || d.meals[i].meal_name || `Meal ${i + 1}`;
              const mealEmoji = d.meals[i].emoji || "🍽️";
              setNextMealName(`Next: ${mealLabel} ${mealEmoji}`);
              foundNext = true;
              break; 
            }
          }
          if (!foundNext) setNextMealName("All meals completed! 🎉");
        });
      } else {
        setNextMealName("Fuel up for the day! ⚡");
      }
    } catch (err) {
      console.error("UI Parsing Error:", err);
    }
  }, [protocol]);

  // 🌟 Cloud-Synced Date UI
  useEffect(() => {
    const loadDates = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData?.user) return;

        const joinedDate = new Date(authData.user.created_at);
        joinedDate.setHours(0, 0, 0, 0);

        const todayDate = new Date();
        todayDate.setHours(todayDate.getHours() - 4); 
        todayDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((todayDate.getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
        const totalDays = Math.max(1, diffDays + 1); 

        const week = Math.ceil(totalDays / 7);
        const dayOfWeek = totalDays % 7 === 0 ? 7 : totalDays % 7;

        setProgramTime(`Week ${week} • Day ${dayOfWeek}`);
      } catch (e) {
        console.error("Date error:", e);
      }
    };
    loadDates();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProtocolData(true);
    await loadTodayData(); // Added this to safely refresh gamification UI
    setTimeout(() => { setRefreshing(false); }, 800);
  }, []);

  // 🌟 Official Cloud Gamification Updater
  const handleCompleteWorkout = async () => {
    if (!protocol || isSyncing) return;
    setIsSyncing(true);

    try {
      const updatedProtocol = { ...protocol, workout: { ...protocol.workout, is_completed: true } };
      setProtocol(updatedProtocol);
      await AsyncStorage.setItem('fitment_protocol', JSON.stringify(updatedProtocol));

      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        const logicalToday = new Date().toISOString().split('T')[0];
        
        // 1. Save the workout as completed
        await supabase
          .from('user_protocols')
          .update({ workout: updatedProtocol.workout, updated_at: new Date().toISOString() })
          .eq('user_id', authData.user.id)
          .eq('date', logicalToday);

        // 2. Fetch the advanced streak data
        const { data: streakData } = await supabase
          .from('streaks')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        let newCurrentStreak = 1;
        let newBestStreak = 1;

        if (streakData) {
           // Only add +1 if they haven't already locked in a streak for today
           if (streakData.last_active_date !== logicalToday) {
               newCurrentStreak = (streakData.current_streak || 0) + 1;
           } else {
               newCurrentStreak = streakData.current_streak; 
           }
           
           newBestStreak = Math.max(newCurrentStreak, streakData.best_streak || 0);

           await supabase
             .from('streaks')
             .upsert({
               user_id: authData.user.id,
               current_streak: newCurrentStreak,
               best_streak: newBestStreak,
               last_active_date: logicalToday,
               protection_tokens: streakData.protection_tokens || 1
             }, { onConflict: 'user_id' });
        } else {
           await supabase
             .from('streaks')
             .insert({
               user_id: authData.user.id,
               current_streak: 1,
               best_streak: 1,
               last_active_date: logicalToday,
               protection_tokens: 1
             });
        }

        // 3. Tell the global store to fetch the fresh numbers from Supabase
        await loadTodayData();
      }
    } catch (err) {
      console.error("Error completing workout:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    Animated.timing(scoreAnim, { toValue: score, duration: 800, useNativeDriver: false }).start();
  }, [score, scoreAnim]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning ☀️' : hour < 18 ? 'Good Afternoon ☁️' : 'Good Evening 🌙';

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = scoreAnim.interpolate({ inputRange: [0, 100], outputRange: [circumference, 0] });
  const waterProgress = Math.min((log.water_glasses / log.water_goal) * 100, 100);
  const scoreDetails = getScoreLabel(score);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00C896" colors={['#00C896']} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateText}>{programTime}</Text> 
          </View>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={20} color="#0A0F1E" />
          </View>
        </View>

        <BlurView intensity={80} tint="light" style={styles.scoreCard}>
          <Text style={styles.cardHeader}>DISCIPLINE SCORE</Text>
          <View style={styles.ringContainer}>
            <Svg width="160" height="160" viewBox="0 0 160 160">
              <Defs>
                <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor={scoreDetails.color} />
                  <Stop offset="100%" stopColor="#1D4ED8" /> 
                </SvgGradient>
              </Defs>
              <Circle cx="80" cy="80" r={radius} stroke="#E2EAF4" strokeWidth="18" fill="none" />
              <AnimatedCircle 
                cx="80" cy="80" r={radius} 
                stroke="url(#scoreGrad)" strokeWidth="18" fill="none" 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                rotation="-90" origin="80, 80"
              />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreNum}>{score}</Text>
              <Text style={[styles.scoreSub, { color: scoreDetails.color }]}>{scoreDetails.emoji} {scoreDetails.label.toUpperCase()}</Text>
            </View>
          </View>
        </BlurView>

        <Text style={styles.sectionTitle}>TODAY'S METRICS</Text>
        <View style={styles.kpiRow}>
          {[
            {emoji: "🔥", val: `${streak}`, lbl: "STREAK"}, 
            {emoji: "💧", val: `${log.water_glasses}/${log.water_goal}`, lbl: "WATER"}, 
            {emoji: "🍛", val: `${log.meals_logged}/5`, lbl: "MEALS"}, 
            {emoji: "⚡", val: "0", lbl: "STEPS"}
          ].map((kpi, i) => (
            <BlurView intensity={80} tint="light" style={styles.kpiCard} key={i}>
              <Text style={styles.kpiEmoji}>{kpi.emoji}</Text>
              <Text style={styles.kpiValue}>{kpi.val}</Text>
              <Text style={styles.kpiLabel}>{kpi.lbl}</Text>
            </BlurView>
          ))}
        </View>

        <View style={{ gap: 16, marginTop: 24 }}>
          <BlurView intensity={80} tint="light" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>🎯 TODAY'S PLAN</Text>
              <Pressable onPress={() => router.push('/workout')}><Text style={styles.previewLink}>View All</Text></Pressable>
            </View>
            <View style={styles.previewContent}>
              
              <View style={styles.workoutSyncRow}>
                <View style={styles.previewItem}>
                  {/* Safely unwrap the workout flag for UI display */}
                  <Feather name={protocol?.workout?.is_completed || (protocol?.workout?.workout?.is_completed) ? "check-circle" : "zap"} size={16} color={protocol?.workout?.is_completed || (protocol?.workout?.workout?.is_completed) ? "#00C896" : "#4A5568"} />
                  <Text style={[styles.previewItemText, (protocol?.workout?.is_completed || protocol?.workout?.workout?.is_completed) && { color: '#00C896', textDecorationLine: 'line-through' }]}>
                    {protocol?.workout?.is_completed || protocol?.workout?.workout?.is_completed ? "Workout Completed!" : workoutTitle}
                  </Text>
                </View>
                {!(protocol?.workout?.is_completed || protocol?.workout?.workout?.is_completed) && (
                  <Pressable style={styles.markDoneBtn} onPress={handleCompleteWorkout} disabled={isSyncing}>
                     <Text style={styles.markDoneText}>{isSyncing ? "..." : "DONE"}</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.previewItem}>
                <Feather name="coffee" size={16} color="#F59E0B" />
                <Text style={styles.previewItemText}>{nextMealName}</Text>
              </View>
            </View>
          </BlurView>

          <BlurView intensity={80} tint="light" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>💧 HYDRATION</Text>
              <Text style={styles.waterCount}>{log.water_glasses} of {log.water_goal} glasses</Text>
            </View>
            <View style={styles.waterBarBg}>
               <View style={[styles.waterBarFill, { width: `${waterProgress}%` as any }]} />
            </View>
          </BlurView>
        </View>
      </ScrollView>

      <BlurView intensity={90} tint="light" style={styles.quickLogBar}>
        <Pressable style={styles.quickLogBtn} onPress={() => addWater(1)}>
          <Text style={styles.quickLogEmoji}>💧</Text>
          <Text style={styles.quickLogText}>Water</Text>
        </Pressable>
        <View style={styles.quickLogDivider} />
        <Pressable style={styles.quickLogBtn} onPress={() => router.push('/diet')}>
          <Text style={styles.quickLogEmoji}>🍛</Text>
          <Text style={styles.quickLogText}>Meal</Text>
        </Pressable>
        <View style={styles.quickLogDivider} />
        <Pressable style={styles.quickLogBtn} onPress={handleCompleteWorkout}>
          <Text style={styles.quickLogEmoji}>✅</Text>
          <Text style={styles.quickLogText}>Done</Text>
        </Pressable>
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 }, 
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5 },
  dateText: { fontSize: 13, color: '#4A5568', fontWeight: '700', marginTop: 4 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 2, borderColor: '#00C896', alignItems: 'center', justifyContent: 'center' },
  scoreCard: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.75)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, marginBottom: 28, alignItems: 'center' },
  cardHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16 },
  ringContainer: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  scoreTextContainer: { position: 'absolute', alignItems: 'center' },
  scoreNum: { fontSize: 42, fontWeight: '900', color: '#0A0F1E', letterSpacing: -1 },
  scoreSub: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  kpiCard: { overflow: 'hidden', flex: 1, backgroundColor: 'rgba(255,255,255,0.75)', paddingVertical: 14, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,1)', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
  kpiEmoji: { fontSize: 18, marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: '900', color: '#0A0F1E' },
  kpiLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginTop: 4 },
  previewCard: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.75)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  previewTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.5 },
  previewLink: { fontSize: 11, fontWeight: '700', color: '#00C896' },
  previewContent: { gap: 14 },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewItemText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  workoutSyncRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  markDoneBtn: { backgroundColor: 'rgba(0, 200, 150, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 200, 150, 0.2)'},
  markDoneText: { fontSize: 10, fontWeight: '800', color: '#00A07A', letterSpacing: 0.5 },
  waterCount: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  waterBarBg: { height: 12, backgroundColor: '#E2EAF4', borderRadius: 100, overflow: 'hidden' },
  waterBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 100 },
  quickLogBar: { position: 'absolute', bottom: 16, left: 24, right: 24, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 100, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, overflow: 'hidden' },
  quickLogBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickLogEmoji: { fontSize: 16 },
  quickLogText: { fontSize: 12, fontWeight: '800', color: '#0A0F1E' },
  quickLogDivider: { width: 1, height: '100%', backgroundColor: '#E2EAF4' }
});