import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useOnboardingStore } from '../../../lib/store/onboardingStore';

export default function OnboardingStep2() {
  const router = useRouter();
  const updateField = useOnboardingStore((state) => state.updateField);
  
  const [gender, setGender] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 2, 
      duration: 600,
      useNativeDriver: false, 
    }).start();
  }, []);

  const handleNext = () => {
    if (!gender || !age || !weight || !height) {
      alert('Please fill out all fields to continue.');
      return;
    }
    
    updateField('gender', gender);
    updateField('age', Number(age));
    updateField('weight', Number(weight));
    updateField('height', Number(height));
    
    router.push('/(auth)/onboarding/3');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
            <Text style={styles.stepIndicator}>02 / 07</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerContainer}>
              <Text style={styles.headline}>WHAT ARE YOUR</Text>
              <Text style={styles.headlineHighlight}>BODY STATS?</Text>
              <Text style={styles.subheadline}>This helps us calculate your macros and baseline.</Text>
            </View>
            <Text style={styles.inputLabel}>GENDER</Text>
            <View style={styles.row}>
              {['Male', 'Female'].map((g) => {
                const isSelected = gender === g;
                return (
                  <Pressable key={g} style={[styles.glassCard, styles.flexCard, isSelected && styles.glassCardSelected]} onPress={() => setGender(g)}>
                    <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{g}</Text>
                  </Pressable>
                )
              })}
            </View>
            <Text style={styles.inputLabel}>AGE</Text>
            <View style={styles.glassCard}>
              <TextInput style={styles.input} placeholder="e.g. 24" placeholderTextColor="#94A3B8" keyboardType="numeric" maxLength={3} value={age} onChangeText={setAge} />
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>WEIGHT (KG)</Text>
                <View style={styles.glassCard}>
                  <TextInput style={styles.input} placeholder="75" placeholderTextColor="#94A3B8" keyboardType="numeric" maxLength={3} value={weight} onChangeText={setWeight} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>HEIGHT (CM)</Text>
                <View style={styles.glassCard}>
                  <TextInput style={styles.input} placeholder="180" placeholderTextColor="#94A3B8" keyboardType="numeric" maxLength={3} value={height} onChangeText={setHeight} />
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={styles.footer}>
            <Pressable style={[styles.primaryButton, (!gender || !age || !weight || !height) && styles.primaryButtonDisabled]} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>CONTINUE</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  progressBarBg: { height: 4, backgroundColor: '#E2EAF4', width: '100%' },
  progressBarFill: { height: '100%', backgroundColor: '#00C896' },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  backButton: { paddingVertical: 8, paddingRight: 16 },
  backText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  stepIndicator: { fontSize: 12, color: '#94A3B8', fontWeight: '700', letterSpacing: 2 },
  scrollContent: { paddingBottom: 100 },
  headerContainer: { marginBottom: 40 },
  headline: { fontSize: 34, fontWeight: '900', color: '#0A0F1E', letterSpacing: -1 },
  headlineHighlight: { fontSize: 34, fontWeight: '900', color: '#00C896', letterSpacing: -1, marginTop: -4 },
  subheadline: { fontSize: 14, color: '#4A5568', marginTop: 12, fontWeight: '500' },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.75)', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  glassCardSelected: { borderColor: '#00C896', backgroundColor: 'rgba(0, 200, 150, 0.08)' },
  flexCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  cardText: { fontSize: 16, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5 },
  cardTextSelected: { color: '#0A0F1E' },
  input: { fontSize: 20, fontWeight: '700', color: '#0A0F1E', textAlign: 'center' },
  footer: { position: 'absolute', bottom: 0, left: 24, right: 24, paddingBottom: 32, paddingTop: 16 },
  primaryButton: { height: 56, backgroundColor: '#00C896', borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#00C896', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  primaryButtonDisabled: { backgroundColor: '#E2EAF4', shadowOpacity: 0, elevation: 0 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});