import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image, LayoutAnimation, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

// Global Store & Supabase
import { useDailyStore } from '../../lib/store/dailyStore';
import { supabase } from '../../lib/supabase';

const INJURY_OPTIONS = [
  { id: 'knee', label: 'Knee' },
  { id: 'back', label: 'Lower Back' },
  { id: 'shoulder', label: 'Shoulder' },
  { id: 'wrist', label: 'Wrist' },
  { id: 'neck', label: 'Neck' }
];

const API_BASE_URL = 'https://fitment-brain-production.up.railway.app/api/v2';

export default function WorkoutScreen() {
  const { log, setWorkoutStarted, setWorkoutDone } = useDailyStore();

  // --- CORE STATE ---
  const [fullProtocol, setFullProtocol] = useState<any>(null);
  const [workoutTitle, setWorkoutTitle] = useState("Daily Training");
  const [exercises, setExercises] = useState<any[]>([]);
  const [loggedExercises, setLoggedExercises] = useState<Set<number>>(new Set());
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [lastSessionTime, setLastSessionTime] = useState<string>('Loading...');

  // --- INJURY SYSTEM STATE ---
  const [activeInjuries, setActiveInjuries] = useState<string[]>([]);
  const [tempInjuries, setTempInjuries] = useState<string[]>([]);
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Load Protocol & Profile Data
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          // 1. Load the workout protocol
          const protocolStr = await AsyncStorage.getItem('fitment_protocol');
          if (protocolStr) {
            const data = JSON.parse(protocolStr);
            setFullProtocol(data);
            
            let w = data.workout;
            if (typeof w === 'string') w = JSON.parse(w);
            if (w && w.workout) w = w.workout;

            if (w) {
              setWorkoutTitle(w.split_name || w.title || "Daily Training");
              if (w.exercises && Array.isArray(w.exercises)) setExercises(w.exercises);
            }
          }

          // 2. Load logged progress
          const savedLogs = await AsyncStorage.getItem('logged_exercise_indices');
          if (savedLogs) setLoggedExercises(new Set(JSON.parse(savedLogs)));
          else setLoggedExercises(new Set());

          // 3. Load active injuries & Dynamic Last Session Time from Supabase
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            // Fetch Injuries
            const { data: profile } = await supabase.from('profiles').select('active_injuries').eq('id', authData.user.id).single();
            if (profile && profile.active_injuries) {
              setActiveInjuries(profile.active_injuries);
            }

            // Fetch Last Logged Session Time
            const { data: logs } = await supabase
              .from('daily_logs')
              .select('updated_at')
              .eq('user_id', authData.user.id)
              .order('updated_at', { ascending: false })
              .limit(1);

            if (logs && logs.length > 0 && logs[0].updated_at) {
              const lastDate = new Date(logs[0].updated_at);
              const formattedTime = lastDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              const now = new Date();
              const diffMs = now.getTime() - lastDate.getTime();
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
              
              if (diffHrs < 1) {
                setLastSessionTime(`Last session: Just now`);
              } else if (diffHrs < 24) {
                setLastSessionTime(`Last session: ${diffHrs} hours ago`);
              } else if (diffHrs < 48) {
                setLastSessionTime(`Last session: Yesterday at ${formattedTime}`);
              } else {
                const diffDays = Math.floor(diffHrs / 24);
                setLastSessionTime(`Last session: ${diffDays} days ago at ${formattedTime}`);
              }
            } else {
              setLastSessionTime('No previous sessions');
            }
          }
        } catch (e) { console.error("Failed to load workout", e); }
      };
      loadData();
    }, [log.workout_done, log.workout_started])
  );

  // --- INJURY SYSTEM LOGIC ---
  const handleOpenInjuryMode = () => {
    setInfoMessage(null);
    if (loggedExercises.size > 0 && !log.workout_done) {
      Alert.alert(
        "Workout in Progress",
        "You've already logged exercises. Starting injury mode will replace today's remaining exercises.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => {
              setTempInjuries([...activeInjuries]);
              setShowInjuryModal(true);
          }}
        ]
      );
    } else {
      setTempInjuries([...activeInjuries]);
      setShowInjuryModal(true);
    }
  };

  const toggleInjury = (id: string) => {
    if (tempInjuries.includes(id)) {
      setTempInjuries(tempInjuries.filter(i => i !== id));
    } else {
      setTempInjuries([...tempInjuries, id]);
    }
  };

  const handleRegenerate = async (clearing = false) => {
    const targetInjuries = clearing ? [] : tempInjuries;
    setShowInjuryModal(false);
    setIsRegenerating(true);
    setInfoMessage(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) throw new Error("No user found");
      const userId = authData.user.id;

      // 1. Save injuries to Supabase Profiles (so tomorrow works automatically)
      await supabase.from('profiles').update({ active_injuries: targetInjuries }).eq('id', userId);
      setActiveInjuries(targetInjuries);

      // 2. Fetch User Profile for the ML Payload
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (!profile) throw new Error("Profile not found");

      // Extract existing day_index
      let currentWorkout = fullProtocol?.workout;
      if (typeof currentWorkout === 'string') currentWorkout = JSON.parse(currentWorkout);
      if (currentWorkout?.workout) currentWorkout = currentWorkout.workout;
      const dayIndex = currentWorkout?.day_index || 0;

      // 3. Call Brain /regenerate endpoint
      const payload = {
        user: {
          goal: profile.goal,
          gender: profile.gender,
          age: profile.age,
          weight_kg: profile.weight_kg,
          height_cm: profile.height_cm,
          diet_type: profile.diet_type,
          activity_level: profile.activity_lvl,
          equipment: profile.equipment,
          frequency: profile.workouts_pw,
          experience_level: profile.experience_level,
          region: profile.region,
          active_injuries: targetInjuries
        },
        day_index: dayIndex,
        freshness_context: { recent_exercise_ids: [], recent_rotation_groups: {} } // Uses baseline freshness
      };

      console.log("🚀 Firing Regen Payload:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_BASE_URL}/workout/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Brain API Error (${response.status}):`, errorText);
        throw new Error("Failed to regenerate from Brain");
      }
      
      const result = await response.json();

      // 4. Compare old vs new exercises to check if anything actually changed
      const oldIds = exercises.map(e => e.id).sort().join(',');
      const newIds = result.workout.exercises.map((e: any) => e.id).sort().join(',');

      if (oldIds === newIds && targetInjuries.length > 0 && !clearing) {
        // Edge Case: Injury didn't affect today's split
        setInfoMessage(`Good news — today's ${result.workout.split_name} isn't affected by your selected injuries. Your plan stays the same.`);
      } else {
        // 5. Update local state & phone memory
        const updatedProtocol = { ...fullProtocol, workout: result.workout };
        setFullProtocol(updatedProtocol);
        setExercises(result.workout.exercises);
        setWorkoutTitle(result.workout.split_name || "Daily Training");
        
        // Reset progress
        setLoggedExercises(new Set());
        await AsyncStorage.removeItem('logged_exercise_indices');
        await AsyncStorage.setItem('fitment_protocol', JSON.stringify(updatedProtocol));

        // 6. Overwrite user_protocols in Supabase
        const logicalToday = new Date().toISOString().split('T')[0];
        await supabase.from('user_protocols').update({ 
          workout: result.workout, 
          trigger_source: 'injury_regen',
          updated_at: new Date().toISOString()
        }).eq('user_id', userId).eq('date', logicalToday);

        if (!clearing && targetInjuries.length > 0) {
          setInfoMessage(`✅ Workout successfully adjusted for your recovery.`);
        }
      }
    } catch (err) {
      console.error("Regeneration Error:", err);
      Alert.alert("Error", "Failed to update workout. Please check your connection.");
    } finally {
      setIsRegenerating(false);
    }
  };

  // --- WORKOUT LOGIC ---
  const handleStartWorkout = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWorkoutStarted(); 
  };

  const handleLogExercise = async (index: number) => {
    if (loggedExercises.has(index)) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newLogged = new Set(loggedExercises).add(index);
    setLoggedExercises(newLogged);
    await AsyncStorage.setItem('logged_exercise_indices', JSON.stringify(Array.from(newLogged)));

    if (newLogged.size === exercises.length) {
      setWorkoutDone(); 
    }
  };

  const hasInjuries = activeInjuries.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.pageTitle}>YOUR DAY</Text>
          <Pressable 
            style={[styles.injuryToggle, hasInjuries && styles.injuryToggleActive]} 
            onPress={handleOpenInjuryMode}
          >
            <Text style={[styles.injuryText, hasInjuries && styles.injuryTextActive]}>
              {hasInjuries ? '🩹 INJURIES ACTIVE' : '⚠️ INJURY MODE'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Feather name="zap" size={16} color="#0A0F1E" />
              <Text style={styles.actionBadge}>AI GENERATED</Text>
            </View>
            <Text style={styles.lastSession}>{log.workout_done ? 'Completed Today' : lastSessionTime}</Text>
          </View>
          <Text style={styles.actionTitle}>{workoutTitle}</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>HYPERTROPHY</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>STRENGTH</Text></View>
          </View>

          {!log.workout_started ? (
            <Pressable style={styles.actionButton} onPress={handleStartWorkout}>
              <Text style={styles.actionButtonText}>START WORKOUT</Text>
              <Feather name="arrow-right" size={16} color="#FFF" />
            </Pressable>
          ) : !log.workout_done ? (
            <View style={[styles.actionButton, { backgroundColor: 'rgba(10, 15, 30, 0.5)' }]}>
               <Text style={styles.actionButtonText}>SESSION IN PROGRESS...</Text>
            </View>
          ) : (
            <View style={[styles.actionButton, { backgroundColor: '#00C896', borderWidth: 1, borderColor: '#FFF' }]}>
               <Text style={[styles.actionButtonText, { color: '#FFF' }]}>WORKOUT COMPLETE 🏆</Text>
            </View>
          )}
        </View>

        {infoMessage && (
          <View style={styles.infoBanner}>
            <Feather name="info" size={16} color="#00A07A" />
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>EXERCISE BREAKDOWN</Text>
        
        {/* IN-PLACE LOADING ANIMATION */}
        {isRegenerating ? (
          <BlurView intensity={80} tint="light" style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#00C896" />
            <Text style={styles.loadingText}>🔄 Adjusting your workout...</Text>
          </BlurView>
        ) : (
          <View style={styles.exerciseList}>
            {exercises.map((ex, index) => {
              const isLogged = loggedExercises.has(index);
              return (
                <BlurView intensity={80} tint="light" style={[styles.exerciseCard, isLogged && styles.exerciseCardLogged]} key={index}>
                  <View style={styles.exHeader}>
                    <Text style={[styles.exName, isLogged && styles.textMuted]}>{ex.name}</Text>
                    <Pressable onPress={() => setSelectedExercise(ex)} style={{ padding: 4 }}>
                      <Feather name="info" size={18} color={isLogged ? "#94A3B8" : "#00C896"} />
                    </Pressable>
                  </View>
                  
                  <View style={styles.exDetails}>
                    <View style={styles.exStat}><Text style={[styles.exStatText, isLogged && styles.textMuted]}>{ex.sets} SETS</Text></View>
                    <View style={styles.exStat}><Text style={[styles.exStatText, isLogged && styles.textMuted]}>{ex.reps} REPS</Text></View>
                    
                    {!log.workout_started ? (
                       <View style={styles.exStat}><Text style={styles.exStatText}>⏱️ {ex.rest_sec || ex.rest || "60"}s</Text></View>
                    ) : isLogged ? (
                       <View style={[styles.logBtn, styles.logBtnDone]}><Text style={styles.logBtnTextDone}>LOGGED ✓</Text></View>
                    ) : (
                       <Pressable style={styles.logBtn} onPress={() => handleLogExercise(index)}><Text style={styles.logBtnText}>LOG ✅</Text></Pressable>
                    )}
                  </View>
                </BlurView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* EXERCISE INFO MODAL */}
      <Modal animationType="slide" transparent={true} visible={!!selectedExercise} onRequestClose={() => setSelectedExercise(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <Pressable onPress={() => setSelectedExercise(null)} style={styles.modalCloseBtn}><Feather name="x" size={20} color="#0A0F1E" /></Pressable>
            </View>
            <View style={styles.gifContainer}>
              <Image source={{ uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGpmZW95bDFiY241b21sdmJndGJhZncwcGIwcTN6cXl0MWMwcmltaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TquJq7Xg520mGha/giphy.gif' }} style={styles.gifImage} resizeMode="cover" />
            </View>
            <Text style={styles.modalDesc}>{selectedExercise?.notes || "Keep your core tight and control the eccentric motion."}</Text>
          </View>
        </View>
      </Modal>

      {/* INJURY MODE BOTTOM SHEET */}
      <Modal animationType="slide" transparent={true} visible={showInjuryModal} onRequestClose={() => setShowInjuryModal(false)}>
        <View style={styles.modalOverlay}>
          <BlurView intensity={90} tint="light" style={styles.injurySheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Injury Mode 🩹</Text>
                <Text style={styles.modalSubtitle}>Any discomfort today? We'll adjust your plan.</Text>
              </View>
              <Pressable onPress={() => setShowInjuryModal(false)} style={styles.modalCloseBtn}><Feather name="x" size={20} color="#0A0F1E" /></Pressable>
            </View>

            <View style={styles.checkboxList}>
              {INJURY_OPTIONS.map((opt) => {
                const isSelected = tempInjuries.includes(opt.id);
                return (
                  <Pressable key={opt.id} style={[styles.checkboxRow, isSelected && styles.checkboxRowActive]} onPress={() => toggleInjury(opt.id)}>
                    <Text style={[styles.checkboxLabel, isSelected && styles.checkboxLabelActive]}>{opt.label}</Text>
                    <View style={[styles.checkboxSquare, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.injuryActions}>
              <Pressable style={styles.regenBtn} onPress={() => handleRegenerate(false)}>
                <Text style={styles.regenBtnText}>REGENERATE WORKOUT</Text>
              </Pressable>
              {hasInjuries && (
                <Pressable style={styles.clearBtn} onPress={() => handleRegenerate(true)}>
                  <Text style={styles.clearBtnText}>Mark all as healed</Text>
                </Pressable>
              )}
            </View>
          </BlurView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5 },
  
  injuryToggle: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  injuryToggleActive: { backgroundColor: 'rgba(0, 200, 150, 0.15)' },
  injuryText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  injuryTextActive: { color: '#00A07A' },
  
  actionCard: { backgroundColor: '#00C896', padding: 20, borderRadius: 24, shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, marginBottom: 24 },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionBadge: { fontSize: 11, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1 },
  lastSession: { fontSize: 10, fontWeight: '700', color: 'rgba(10,15,30,0.6)' },
  actionTitle: { fontSize: 22, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: 'rgba(10, 15, 30, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  chipText: { fontSize: 9, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.5 },
  actionButton: { backgroundColor: '#0A0F1E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 200, 150, 0.1)', padding: 12, borderRadius: 12, marginBottom: 24, gap: 10 },
  infoText: { flex: 1, fontSize: 12, color: '#00A07A', fontWeight: '600', lineHeight: 18 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 16 },
  exerciseList: { gap: 12 },
  exerciseCard: { overflow: 'hidden', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.75)' },
  exerciseCardLogged: { backgroundColor: 'rgba(255,255,255,0.4)', borderColor: '#E2EAF4' },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '800', color: '#0A0F1E' },
  exDetails: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  exStat: { backgroundColor: 'rgba(226,234,244,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  exStatText: { fontSize: 10, fontWeight: '800', color: '#4A5568', letterSpacing: 0.5 },
  textMuted: { color: '#94A3B8', textDecorationLine: 'line-through' },
  logBtn: { backgroundColor: '#00C896', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginLeft: 'auto' },
  logBtnText: { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  logBtnDone: { backgroundColor: '#E2EAF4' },
  logBtnTextDone: { color: '#64748B' },

  loadingCard: { alignItems: 'center', justifyContent: 'center', padding: 40, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)' },
  loadingText: { marginTop: 16, fontSize: 13, fontWeight: '700', color: '#00C896', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 15, 30, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0A0F1E' },
  modalSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500' },
  modalCloseBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 100 },
  gifContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 16 },
  gifImage: { width: '100%', height: '100%' },
  modalDesc: { fontSize: 14, color: '#4A5568', lineHeight: 22, fontWeight: '500' },

  injurySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.85)' },
  checkboxList: { gap: 12, marginBottom: 24 },
  checkboxRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#E2EAF4' },
  checkboxRowActive: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.05)' },
  checkboxLabel: { fontSize: 15, fontWeight: '700', color: '#4A5568' },
  checkboxLabelActive: { color: '#0A0F1E' },
  checkboxSquare: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D9E6', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#00C896', borderColor: '#00C896' },
  injuryActions: { gap: 12 },
  regenBtn: { backgroundColor: '#0A0F1E', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  regenBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  clearBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' }
});