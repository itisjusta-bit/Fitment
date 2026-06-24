import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// 🌟 Import your global store!
import { useOnboardingStore } from '../../../lib/store/onboardingStore';

export default function ExperienceScreen() {
  const router = useRouter();
  
  // Read and Write directly to your global memory backpack
  const { experience, setExperience } = useOnboardingStore();

  const levels = [
    { id: 'newbie', icon: '🌱', title: 'Newbie', desc: 'Less than 6 months or just starting' },
    { id: 'intermediate', icon: '⚡', title: 'Intermediate', desc: '6 months to 2 years, know the basics' },
    { id: 'pro', icon: '🔥', title: 'Pro', desc: '2+ years, know all major lifts' }
  ];

  const handleNext = () => {
    // The state is already saved in Zustand via the onPress below!
    // Change this to whatever your next screen is (e.g., 'frequency' or '6')
    router.push('/(auth)/onboarding/6'); 
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          {/* Top Bar for Back Navigation */}
          <View style={styles.topBar}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← BACK</Text>
            </Pressable>
            <Text style={styles.stepNum}>05 / 07</Text>
          </View>

          <Text style={styles.header}>How experienced are you?</Text>
          
          <View style={styles.cardContainer}>
            {levels.map((level) => {
              const isActive = experience === level.id;
              return (
                <Pressable 
                  key={level.id}
                  onPress={() => setExperience(level.id)}
                  style={[styles.card, isActive && styles.activeCard]}
                >
                  <Text style={styles.emoji}>{level.icon}</Text>
                  <View style={styles.textStack}>
                    <Text style={[styles.title, isActive && styles.activeText]}>{level.title}</Text>
                    <Text style={[styles.desc, isActive && styles.activeText]}>{level.desc}</Text>
                  </View>
                  <View style={[styles.radio, isActive && styles.activeRadio]}>
                    {isActive && <Feather name="check" size={14} color="#FFF" />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* The Next Button */}
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>CONTINUE</Text>
          <Feather name="arrow-right" size={20} color="#FFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
  backBtn: { paddingVertical: 8, paddingRight: 16 },
  backText: { fontSize: 12, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  stepNum: { fontSize: 12, fontWeight: '700', color: '#94A3B8', letterSpacing: 2 },
  header: { fontSize: 28, fontWeight: '900', color: '#0A0F1E', marginBottom: 24 },
  cardContainer: { gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 2, borderColor: '#E2EAF4' },
  activeCard: { borderColor: '#00C896', backgroundColor: '#E8FAF4' },
  emoji: { fontSize: 32, marginRight: 16 },
  textStack: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: '#0A0F1E', marginBottom: 4 },
  desc: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  activeText: { color: '#007A5A' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  activeRadio: { backgroundColor: '#00C896', borderColor: '#00C896' },
  nextButton: { backgroundColor: '#0A0F1E', paddingVertical: 18, borderRadius: 100, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  nextButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 }
});