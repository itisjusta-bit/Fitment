import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HomeScreen() {
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const targetScore = 85; 

  useEffect(() => {
    Animated.timing(scoreAnim, {
      toValue: targetScore,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [scoreAnim, targetScore]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning ☀️' : hour < 18 ? 'Good Afternoon ☁️' : 'Good Evening 🌙';

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = scoreAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.dateText}>Week 1 • Day 1</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={20} color="#0A0F1E" />
          </View>
        </View>

        {/* Discipline Score Ring - Now with thick gradient stroke */}
        <BlurView intensity={80} tint="light" style={styles.scoreCard}>
          <Text style={styles.cardHeader}>DISCIPLINE SCORE</Text>
          <View style={styles.ringContainer}>
            <Svg width="160" height="160" viewBox="0 0 160 160">
              <Defs>
                <SvgGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0%" stopColor="#00C896" />
                  <Stop offset="100%" stopColor="#1D4ED8" /> 
                </SvgGradient>
              </Defs>
              <Circle cx="80" cy="80" r={radius} stroke="#E2EAF4" strokeWidth="16" fill="none" />
              <AnimatedCircle 
                cx="80" cy="80" r={radius} 
                stroke="url(#scoreGrad)" strokeWidth="16" fill="none" 
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
                rotation="-90" origin="80, 80"
              />
            </Svg>
            <View style={styles.scoreTextContainer}>
              <Text style={styles.scoreNum}>{targetScore}</Text>
              <Text style={styles.scoreSub}>🔥 EXCELLENT</Text>
            </View>
          </View>
        </BlurView>

        {/* KPI Mini-Cards - Thinner borders, softer shadow */}
        <Text style={styles.sectionTitle}>TODAY'S METRICS</Text>
        <View style={styles.kpiRow}>
          {[{emoji: "🔥", val: "3", lbl: "STREAK"}, {emoji: "💧", val: "4/8", lbl: "WATER"}, {emoji: "🍛", val: "1/5", lbl: "MEALS"}, {emoji: "⚡", val: "4.2k", lbl: "STEPS"}].map((kpi, i) => (
            <BlurView intensity={80} tint="light" style={styles.kpiCard} key={i}>
              <Text style={styles.kpiEmoji}>{kpi.emoji}</Text>
              <Text style={styles.kpiValue}>{kpi.val}</Text>
              <Text style={styles.kpiLabel}>{kpi.lbl}</Text>
            </BlurView>
          ))}
        </View>

        {/* Filling the Empty Space: Plan Preview & Water Tracker */}
        <View style={{ gap: 16, marginTop: 24 }}>
          
          <BlurView intensity={80} tint="light" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>🎯 TODAY'S PLAN</Text>
              <Text style={styles.previewLink}>View All</Text>
            </View>
            <View style={styles.previewContent}>
              <View style={styles.previewItem}>
                <Feather name="zap" size={16} color="#00C896" />
                <Text style={styles.previewItemText}>Upper Body Hypertrophy (60m)</Text>
              </View>
              <View style={styles.previewItem}>
                <Feather name="coffee" size={16} color="#F59E0B" />
                <Text style={styles.previewItemText}>Next Meal: Mid-Morning Snack</Text>
              </View>
            </View>
          </BlurView>

          <BlurView intensity={80} tint="light" style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>💧 HYDRATION</Text>
              <Text style={styles.waterCount}>4 of 8 glasses</Text>
            </View>
            <View style={styles.waterBarBg}>
               <View style={[styles.waterBarFill, { width: '50%' }]} />
            </View>
          </BlurView>

        </View>
      </ScrollView>

      {/* The Floating Quick Log Bar */}
      <BlurView intensity={90} tint="light" style={styles.quickLogBar}>
        <Pressable style={styles.quickLogBtn}>
          <Text style={styles.quickLogEmoji}>💧</Text>
          <Text style={styles.quickLogText}>Water</Text>
        </Pressable>
        <View style={styles.quickLogDivider} />
        <Pressable style={styles.quickLogBtn}>
          <Text style={styles.quickLogEmoji}>🍛</Text>
          <Text style={styles.quickLogText}>Meal</Text>
        </Pressable>
        <View style={styles.quickLogDivider} />
        <Pressable style={styles.quickLogBtn}>
          <Text style={styles.quickLogEmoji}>✅</Text>
          <Text style={styles.quickLogText}>Done</Text>
        </Pressable>
      </BlurView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 160 }, // Extra padding for quick log bar
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 22, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5 },
  dateText: { fontSize: 13, color: '#4A5568', fontWeight: '700', marginTop: 4 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', borderWidth: 2, borderColor: '#00C896', alignItems: 'center', justifyContent: 'center' },
  
  scoreCard: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, marginBottom: 28, alignItems: 'center' },
  cardHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1.5, marginBottom: 16 },
  ringContainer: { position: 'relative', width: 160, height: 160, alignItems: 'center', justifyContent: 'center' },
  scoreTextContainer: { position: 'absolute', alignItems: 'center' },
  scoreNum: { fontSize: 42, fontWeight: '900', color: '#0A0F1E', letterSpacing: -1 },
  scoreSub: { fontSize: 10, fontWeight: '800', color: '#00C896', letterSpacing: 1, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 14 },
  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  kpiCard: { overflow: 'hidden', flex: 1, backgroundColor: 'rgba(255,255,255,0.6)', paddingVertical: 14, borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(255,255,255,1)', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 },
  kpiEmoji: { fontSize: 18, marginBottom: 6 },
  kpiValue: { fontSize: 16, fontWeight: '900', color: '#0A0F1E' },
  kpiLabel: { fontSize: 8, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginTop: 4 },

  previewCard: { overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
  previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  previewTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.5 },
  previewLink: { fontSize: 11, fontWeight: '700', color: '#00C896' },
  previewContent: { gap: 10 },
  previewItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewItemText: { fontSize: 13, fontWeight: '600', color: '#4A5568' },
  waterCount: { fontSize: 12, fontWeight: '700', color: '#4A5568' },
  waterBarBg: { height: 12, backgroundColor: '#E2EAF4', borderRadius: 100, overflow: 'hidden' },
  waterBarFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 100 },

  quickLogBar: { position: 'absolute', bottom: 16, left: 24, right: 24, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.75)', borderRadius: 100, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,1)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, overflow: 'hidden' },
  quickLogBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  quickLogEmoji: { fontSize: 16 },
  quickLogText: { fontSize: 12, fontWeight: '800', color: '#0A0F1E' },
  quickLogDivider: { width: 1, height: '100%', backgroundColor: '#E2EAF4' }
});