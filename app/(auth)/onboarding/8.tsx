import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateDailyPlan } from '../../../lib/fitmentML';
import { useOnboardingStore } from '../../../lib/store/onboardingStore'; 
import { supabase } from '../../../lib/supabase'; 

const { width: SW } = Dimensions.get('window');
const BAR_WIDTH = SW - 64;

const REGION_OPTIONS = [
  { id: 'indian', title: 'INDIAN / ASIAN', desc: 'Focus on regional spices, grains, and curries.' },
  { id: 'western', title: 'WESTERN', desc: 'Standard macros, Mediterranean, and European bases.' },
  { id: 'global', title: 'GLOBAL', desc: 'No preference. Give me the best of everything.' },
];

const LOADING_STEPS = [
  { id: 0, label: 'ANALYZING BIOMETRICS',    revealAt: 0    },
  { id: 1, label: 'CALCULATING MACRO TARGETS', revealAt: 1500 },
  { id: 2, label: 'BUILDING TRAINING SPLIT',  revealAt: 3000 },
  { id: 3, label: 'FINALIZING PROTOCOL',      revealAt: 4500 },
];

type StepItemProps = { label: string; revealAt: number; isActive: boolean; isDone: boolean; };

const StepItem = ({ label, revealAt, isActive, isDone }: StepItemProps) => {
  const slide    = useRef(new Animated.Value(18)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dotScale = useRef(new Animated.Value(0.6)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const badgeOpac  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slide,   { toValue: 0,   duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 500, useNativeDriver: true }),
        Animated.spring(dotScale,{ toValue: 1,   friction: 6, useNativeDriver: true }),
      ]).start();
    }, revealAt);
    return () => clearTimeout(t);
  }, [revealAt, slide, opacity, dotScale]);

  useEffect(() => {
    if (isActive) Animated.timing(badgeOpac, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    else Animated.timing(badgeOpac, { toValue: 0, duration: 200, useNativeDriver: true }).start();
  }, [isActive, badgeOpac]);

  useEffect(() => {
    if (isDone) Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start();
  }, [isDone, checkScale]);

  const dotBg = isDone ? '#00C896' : isActive ? 'rgba(0,200,150,0.10)' : 'rgba(226,234,244,0.6)';
  const dotBorder = isDone || isActive ? '#00C896' : '#D1D9E6';

  return (
    <Animated.View style={[styles.stepRow, { opacity, transform: [{ translateY: slide }] }]}>
      <Animated.View style={[styles.stepDot, { backgroundColor: dotBg, borderColor: dotBorder, transform: [{ scale: isDone ? checkScale : dotScale }] }]}>
        {isDone && <Text style={styles.stepCheck}>✓</Text>}
        {isActive && !isDone && <View style={styles.stepPip} />}
      </Animated.View>
      <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isDone && styles.stepLabelDone]}>{label}</Text>
      <Animated.View style={[styles.runBadge, { opacity: badgeOpac }]}><Text style={styles.runBadgeText}>RUNNING</Text></Animated.View>
    </Animated.View>
  );
};

export default function OnboardingStep8() {
  const router = useRouter();
  const onboardingData = useOnboardingStore(); 
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [activeStep,     setActiveStep]     = useState(0);

  const stepBarAnim = useRef(new Animated.Value(7)).current; 
  const overlayOpac = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const breathe  = useRef(new Animated.Value(1)).current;
  const glowOpac = useRef(new Animated.Value(0.3)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { Animated.timing(stepBarAnim, { toValue: 8, duration: 600, useNativeDriver: false }).start(); }, [stepBarAnim]);

  const startAnimations = useCallback(() => {
    let index = 0;
    const tick = setInterval(() => {
      index = Math.min(index + 1, LOADING_STEPS.length - 1);
      setActiveStep(index);
    }, 1500);

    Animated.timing(fillAnim, { toValue: 1, duration: 6500, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    const sonar = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    sonar(ring1, 0); sonar(ring2, 800); sonar(ring3, 1600);

    Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1.13, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 1.0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowOpac, { toValue: 0.65, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowOpac, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    return tick;
  }, [fillAnim, ring1, ring2, ring3, breathe, glowOpac]);

  const handleFinish = async () => {
    if (!selectedRegion) return;

    setIsSubmitting(true);
    setActiveStep(0);
    Animated.timing(overlayOpac, { toValue: 1, duration: 380, useNativeDriver: true }).start();
    const tick = startAnimations();

    const realStats = {
      goal: onboardingData.goal,
      gender: onboardingData.gender,
      age: Number(onboardingData.age),
      weight: Number(onboardingData.weight),
      height: Number(onboardingData.height),
      diet: onboardingData.diet,
      activity: onboardingData.activity,
      equipment: onboardingData.equipment,
      frequency: Number(onboardingData.frequency), 
      experience_level: onboardingData.experience, 
      active_injuries: onboardingData.active_injuries || [], 
      region: selectedRegion, 
    };

    try {
      const { data: authData } = await supabase.auth.getUser();
      const logicalToday = new Date().toISOString().split('T')[0];

      // 🛑 STEP 1: CREATE THE PROFILE FIRST (Fixes Foreign Key Error!)
      if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: authData.user.id,
          goal: realStats.goal,
          gender: realStats.gender,
          age: realStats.age,
          weight_kg: realStats.weight,
          height_cm: realStats.height,
          diet_type: realStats.diet,
          activity_lvl: realStats.activity,
          equipment: realStats.equipment,
          workouts_pw: realStats.frequency,
          experience_level: realStats.experience_level, 
          active_injuries: realStats.active_injuries, 
          region: realStats.region,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (profileError) console.error("⚠️ Failed to save profile biology:", profileError);
      }

      // 🧠 STEP 2: ASK THE BRAIN FOR THE PLAN
      const mlResponse = await generateDailyPlan(realStats);
      
      // 💾 STEP 3: SAVE THE PLAN SECURELY
      if (mlResponse && mlResponse.success) {
        if (authData?.user) {
          const { error: dbError } = await supabase.from('user_protocols').upsert({ 
            user_id: authData.user.id,
            date: logicalToday,
            workout: mlResponse.workout,
            diet: mlResponse.diet,
            coach_tip: mlResponse.coach_tip,
            status: 'ready',
            trigger_source: 'fallback', 
            generated_at: new Date().toISOString()
          }, { onConflict: 'user_id, date' }); 

          if (dbError) console.error("⚠️ Failed to write v2 protocol to Supabase:", dbError);
        }

        // Cache Locally & Navigate
        await AsyncStorage.setItem('fitment_protocol', JSON.stringify(mlResponse));
        router.replace('/(tabs)');  
      } else {
        alert('Failed to generate protocol. Try again.');
      }
    } catch (err) {
      console.error("ML Engine Request Failed:", err);
      alert('Error contacting ML Engine. Check your connection!');
    } finally {
      clearInterval(tick);
      Animated.timing(overlayOpac, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setIsSubmitting(false);
        fillAnim.setValue(0);
      });
    }
  };

  const mkRing = (anim: Animated.Value) => ({ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 3.0] }), opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }) });
  const r1 = mkRing(ring1); const r2 = mkRing(ring2); const r3 = mkRing(ring3);
  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_WIDTH] });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.stepBarBg}><Animated.View style={[styles.stepBarFill, { width: stepBarAnim.interpolate({ inputRange: [0, 8], outputRange: ['0%', '100%'] }) }]} /></View>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} disabled={isSubmitting}><Text style={styles.backText}>← BACK</Text></Pressable>
          <Text style={styles.stepNum}>08 / 08</Text>
        </View>
        <View style={styles.header}>
          <Text style={styles.headline}>DIETARY</Text>
          <Text style={styles.headlineGreen}>REGION?</Text>
          <Text style={styles.subheadline}>Help us tailor your meals to foods you love.</Text>
        </View>
        <View style={styles.optionList}>
          {REGION_OPTIONS.map((opt) => {
            const sel = selectedRegion === opt.id;
            return (
              <Pressable key={opt.id} style={[styles.optionCard, sel && styles.optionCardSel]} onPress={() => setSelectedRegion(opt.id)} disabled={isSubmitting}>
                <View style={styles.optionText}><Text style={[styles.optionTitle, sel && styles.optionTitleSel]}>{opt.title}</Text><Text style={[styles.optionDesc, sel && styles.optionDescSel]}>{opt.desc}</Text></View>
                <View style={[styles.radio, sel && styles.radioSel]}>{sel && <View style={styles.radioFill} />}</View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Pressable style={[styles.ctaBtn, (!selectedRegion || isSubmitting) && styles.ctaBtnDisabled]} onPress={handleFinish} disabled={!selectedRegion || isSubmitting}>
            <Text style={styles.ctaBtnText}>{isSubmitting ? 'GENERATING...' : 'GENERATE PROTOCOL'}</Text>
          </Pressable>
        </View>
      </View>
      {isSubmitting && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpac }]}>
          <LinearGradient colors={['rgba(232,250,244,0.97)', 'rgba(239,246,255,0.98)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.iconHub}>
            {[r1, r2, r3].map((r, i) => <Animated.View key={i} style={[styles.ring, { opacity: r.opacity, transform: [{ scale: r.scale }] }]} />)}
            <Animated.View style={[styles.iconGlow, { opacity: glowOpac }]} />
            <Animated.View style={[styles.iconCircle, { transform: [{ scale: breathe }] }]}><Text style={styles.iconEmoji}>💪</Text></Animated.View>
          </View>
          <Text style={styles.overlayTitle}>AI ARCHITECT AT WORK</Text>
          <Text style={styles.overlaySub}>Building your personalised Fitment protocol</Text>
          <View style={styles.stepList}>{LOADING_STEPS.map((step, i) => <StepItem key={step.id} label={step.label} revealAt={step.revealAt} isActive={activeStep === i} isDone={activeStep > i} />)}</View>
          <View style={styles.barWrap}><View style={styles.barTrack}><Animated.View style={[styles.barFill, { width: fillWidth }]}><View style={styles.barDot} /></Animated.View></View><Text style={styles.barLabel}>GENERATING YOUR PROTOCOL</Text></View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stepBarBg:   { height: 4, backgroundColor: '#E2EAF4' },
  stepBarFill: { height: '100%', backgroundColor: '#00C896', borderRadius: 2 },
  content:       { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  topBar:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backBtn:       { paddingVertical: 8, paddingRight: 16 },
  backText:      { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  stepNum:       { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 2 },
  header:        { marginBottom: 44 },
  headline:      { fontSize: 34, fontWeight: '900', color: '#0A0F1E', letterSpacing: -1 },
  headlineGreen: { fontSize: 34, fontWeight: '900', color: '#00C896', letterSpacing: -1, marginTop: -4 },
  subheadline:   { fontSize: 14, fontWeight: '500', color: '#4A5568', marginTop: 12 },
  optionList: { gap: 14 },
  optionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.75)', padding: 22, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  optionCardSel: { borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.07)' },
  optionText:    { flex: 1, paddingRight: 16 },
  optionTitle:   { fontSize: 15, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.4, marginBottom: 5 },
  optionTitleSel:{ color: '#00A07A' },
  optionDesc:    { fontSize: 13, color: '#4A5568', lineHeight: 18 },
  optionDescSel: { color: '#0A0F1E' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D9E6', alignItems: 'center', justifyContent: 'center' },
  radioSel:  { borderColor: '#00C896' },
  radioFill: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C896' },
  footer: { position: 'absolute', bottom: 0, left: 24, right: 24, paddingBottom: 36, paddingTop: 16 },
  ctaBtn: { height: 56, backgroundColor: '#00C896', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#00C896', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 },
  ctaBtnDisabled: { backgroundColor: '#DDE5F0', shadowOpacity: 0, elevation: 0 },
  ctaBtnText:    { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.2 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconHub: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  ring: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 1.5, borderColor: '#00C896' },
  iconGlow: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: '#00C896' },
  iconCircle: { width: 82, height: 82, borderRadius: 41, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.40, shadowRadius: 20, elevation: 14, zIndex: 10 },
  iconEmoji: { fontSize: 36 },
  overlayTitle: { fontSize: 19, fontWeight: '900', color: '#0A0F1E', letterSpacing: 0.6, textAlign: 'center' },
  overlaySub: { fontSize: 13, fontWeight: '500', color: '#94A3B8', textAlign: 'center', marginTop: 6, marginBottom: 36, lineHeight: 20 },
  stepList: { width: '100%', gap: 18, marginBottom: 40 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepPip:   { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00C896' },
  stepCheck: { fontSize: 13, color: '#FFFFFF', fontWeight: '900' },
  stepLabel:      { flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 0.5, color: '#C2CDD8' },
  stepLabelActive:{ color: '#0A0F1E' },
  stepLabelDone:  { color: '#64748B' },
  runBadge: { backgroundColor: 'rgba(0,200,150,0.12)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  runBadgeText: { fontSize: 9, fontWeight: '800', color: '#00A07A', letterSpacing: 0.6 },
  barWrap:  { width: '100%', alignItems: 'center', gap: 10 },
  barTrack: { width: BAR_WIDTH, height: 5, backgroundColor: '#E2EAF4', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#00C896', borderRadius: 3, position: 'absolute', left: 0, top: 0, alignItems: 'flex-end', justifyContent: 'center' },
  barDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C896', right: -5, position: 'absolute', shadowColor: '#00C896', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6, elevation: 6 },
  barLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1.2, textAlign: 'center' },
});