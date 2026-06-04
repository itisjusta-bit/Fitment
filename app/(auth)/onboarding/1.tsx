import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const GOAL_OPTIONS = [
  { id: 'lose_weight', title: 'LOSE WEIGHT', desc: 'Burn fat and maximize definition.' },
  { id: 'build_muscle', title: 'BUILD MUSCLE', desc: 'Increase volume, mass, and raw strength.' },
  { id: 'stay_active', title: 'STAY ACTIVE', desc: 'Maintain daily movement and mobility.' },
  { id: 'stamina', title: 'IMPROVE STAMINA', desc: 'Elevate cardiovascular endurance.' }
];

export default function OnboardingStep1() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1, 
      duration: 600,
      useNativeDriver: false, 
    }).start();
  }, []);

  const handleSelect = (id: string) => {
    setSelectedGoal(id);
    
    // Auto-advance after 400ms to let the user see the selection animation
    setTimeout(() => {
      console.log("Selected Goal:", id);
      router.push('/(auth)/onboarding/2');
    }, 400);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Blueprint Light Background Gradient */}
      <LinearGradient 
        colors={['#E8FAF4', '#EFF6FF']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={StyleSheet.absoluteFill} 
      />

      {/* Premium Thin Progress Bar */}
      <View style={styles.progressBarBg}>
        <Animated.View 
          style={[
            styles.progressBarFill, 
            {
              width: progressAnim.interpolate({
                inputRange: [0, 7],
                outputRange: ['0%', '100%']
              })
            }
          ]} 
        />
      </View>

      <View style={styles.content}>
        {/* Minimalist Top Nav */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← BACK</Text>
          </Pressable>
          <Text style={styles.stepIndicator}>01 / 07</Text>
        </View>

        {/* Bold, Left-Aligned Typography in Blueprint Navy */}
        <View style={styles.headerContainer}>
          <Text style={styles.headline}>WHAT IS YOUR</Text>
          <Text style={styles.headlineHighlight}>PRIMARY GOAL?</Text>
          <Text style={styles.subheadline}>Your training protocol will adapt to this target.</Text>
        </View>

        {/* Sleek Horizontal List using White Glassmorphism */}
        <View style={styles.listContainer}>
          {GOAL_OPTIONS.map((option) => {
            const isSelected = selectedGoal === option.id;
            return (
              <Pressable 
                key={option.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected 
                ]}
                onPress={() => handleSelect(option.id)}
              >
                <View style={styles.cardTextContainer}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.cardDesc, isSelected && styles.cardDescSelected]}>
                    {option.desc}
                  </Text>
                </View>
                
                {/* Minimalist Selection Indicator */}
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
  container: { 
    flex: 1,
  },
  progressBarBg: {
    height: 4, 
    backgroundColor: '#E2EAF4', 
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00C896', 
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8', 
    letterSpacing: 1,
  },
  stepIndicator: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerContainer: {
    marginBottom: 48,
  },
  headline: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0A0F1E', 
    letterSpacing: -1,
  },
  headlineHighlight: {
    fontSize: 34,
    fontWeight: '900',
    color: '#00C896', 
    letterSpacing: -1,
    marginTop: -4,
  },
  subheadline: {
    fontSize: 14,
    color: '#4A5568', 
    marginTop: 12,
    fontWeight: '500',
  },
  listContainer: {
    gap: 16,
    paddingBottom: 20, // Small buffer at the bottom
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.75)', 
    padding: 24,
    borderRadius: 16, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#00C896', 
    backgroundColor: 'rgba(0, 200, 150, 0.08)', 
  },
  cardTextContainer: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A0F1E', 
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  cardTitleSelected: {
    color: '#0A0F1E', 
  },
  cardDesc: {
    fontSize: 13,
    color: '#4A5568', 
    lineHeight: 18,
  },
  cardDescSelected: {
    color: '#0A0F1E',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2EAF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00C896', 
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00C896', 
  }
});