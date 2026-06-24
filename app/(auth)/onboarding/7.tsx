import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboardingStore } from '../../../lib/store/onboardingStore';

const FREQUENCY_OPTIONS = [
  { id: '2_3', title: '2 - 3 DAYS', desc: 'Minimalist approach. Focus on full body.' },
  { id: '4_5', title: '4 - 5 DAYS', desc: 'Standard split. Balanced volume and recovery.' },
  { id: '6', title: '6 DAYS', desc: 'Advanced. High volume and strict scheduling.' }
];

export default function OnboardingStep6() {
  const router = useRouter();
  const updateField = useOnboardingStore((state) => state.updateField);
  const [selectedFreq, setSelectedFreq] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(5)).current;

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: 6, duration: 600, useNativeDriver: false }).start();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedFreq(id);
    
    // Map ID to correct Number for Python Engine
    let freqNumber = 4;
    if (id === '2_3') freqNumber = 3;
    if (id === '4_5') freqNumber = 4;
    if (id === '6') freqNumber = 6;
    
    updateField('frequency', freqNumber);

    setTimeout(() => { router.push('/(auth)/onboarding/8'); }, 400);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.progressBarBg}>
        <Animated.View style={[styles.progressBarFill, { width: progressAnim.interpolate({ inputRange: [0, 7], outputRange: ['0%', '100%'] }) }]} />
      </View>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>
          <Text style={styles.stepIndicator}>06 / 07</Text>
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.headline}>COMMITMENT</Text>
          <Text style={styles.headlineHighlight}>LEVEL?</Text>
          <Text style={styles.subheadline}>How many days per week can you train?</Text>
        </View>
        <View style={styles.listContainer}>
          {FREQUENCY_OPTIONS.map((option) => {
            const isSelected = selectedFreq === option.id;
            return (
              <Pressable key={option.id} style={[styles.card, isSelected && styles.cardSelected]} onPress={() => handleSelect(option.id)}>
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>{option.title}</Text>
                  <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>{option.desc}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBarBg: { height: 4, backgroundColor: '#E2EAF4', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#00C896' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  stepIndicator: { fontSize: 12, color: '#94A3B8', fontWeight: '700', letterSpacing: 2 },
  headerContainer: { marginBottom: 48 },
  headline: { fontSize: 34, fontWeight: '900', color: '#0A0F1E', letterSpacing: -1 },
  headlineHighlight: { fontSize: 34, fontWeight: '900', color: '#00C896', letterSpacing: -1, marginTop: -4 },
  subheadline: { fontSize: 14, color: '#4A5568', marginTop: 12, fontWeight: '500' },
  listContainer: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.75)', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  cardSelected: { borderColor: '#00C896', backgroundColor: 'rgba(0, 200, 150, 0.08)' },
  cardTextContainer: { flex: 1, paddingRight: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.5, marginBottom: 6 },
  cardTitleSelected: { color: '#0A0F1E' },
  cardDesc: { fontSize: 13, color: '#4A5568', lineHeight: 18 },
  cardDescSelected: { color: '#0A0F1E' },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E2EAF4', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#00C896' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#00C896' }
});