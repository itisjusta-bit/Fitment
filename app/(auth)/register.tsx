import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 🌟 ADDED IMPORT

// Supabase client ko import kar rahe hain backend connection ke liye
import { supabase } from '../../lib/supabase';

export default function RegisterScreen() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 

  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthColor = (index: number) => {
    if (strength <= index) return 'rgba(200,220,240,0.5)'; 
    if (strength === 1) return '#EF4444'; 
    if (strength === 2) return '#F59E0B'; 
    if (strength === 3) return '#EAB308'; 
    return '#00C896'; 
  };

  const handleRegister = async () => {
    setErrorMsg('');
    
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('⚠️ All fields are required');
      triggerShake();
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('⚠️ Passwords do not match');
      triggerShake();
      return;
    }
    
    setLoading(true);
    
    // Supabase me naya user create karne ke liye API call
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: name, // User ka naam metadata mein save kar rahe hain
        }
      }
    });

    if (error) {
      // Agar email already exist karta hai ya password weak hai toh error dikhao
      setErrorMsg(`⚠️ ${error.message}`);
      triggerShake();
    } else {
      console.log("Account Created:", data);
      
      // 🌟 THE FIX: Purge the ghost cache before they start the onboarding quiz
      await AsyncStorage.multiRemove([
        'fitment_protocol',
        'logged_exercise_indices',
        'logged_meal_indices',
        'program_start_date'
      ]);

      // Success! Account ban gaya, ab user ko onboarding quiz pe bhejo
      router.push('/(auth)/onboarding/1');
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      
      <LinearGradient 
        colors={['#E8FAF4', '#E3F2FD', '#F3E5F5']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={StyleSheet.absoluteFill} 
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.headerContainer}>
          <Text style={styles.headline}>Create your account</Text>
          <Text style={styles.subheadline}>Let's get you started on your fitness journey</Text>
        </View>

        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          <BlurView intensity={80} tint="light" style={styles.glassCard}>
            <View style={styles.cardInner}>
              
              <TextInput 
                style={styles.input} 
                placeholder="Full Name" 
                placeholderTextColor="#94A3B8" 
                onChangeText={setName} 
                value={name}
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Email" 
                placeholderTextColor="#94A3B8" 
                autoCapitalize="none" 
                keyboardType="email-address"
                onChangeText={setEmail} 
                value={email}
              />
              
              <TextInput 
                style={styles.input} 
                placeholder="Password" 
                placeholderTextColor="#94A3B8" 
                secureTextEntry 
                onChangeText={setPassword} 
                value={password}
              />
              
              <View style={styles.strengthContainer}>
                {[0, 1, 2, 3].map((index) => (
                  <View 
                    key={index} 
                    style={[styles.strengthBar, { backgroundColor: getStrengthColor(index) }]} 
                  />
                ))}
              </View>

              <TextInput 
                style={styles.input} 
                placeholder="Confirm Password" 
                placeholderTextColor="#94A3B8" 
                secureTextEntry 
                onChangeText={setConfirmPassword} 
                value={confirmPassword}
              />

              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              <Pressable style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </Pressable>

            </View>
          </BlurView>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 24 },
  backText: { color: '#4A5568', fontWeight: '600', fontSize: 14 },
  headerContainer: { marginBottom: 28 },
  headline: { color: '#0A0F1E', fontSize: 26, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  subheadline: { color: '#94A3B8', fontSize: 14, lineHeight: 22 },
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)', backgroundColor: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  cardInner: { padding: 24 },
  input: { height: 52, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(200,220,240,0.5)', borderRadius: 14, paddingHorizontal: 16, color: '#0A0F1E', fontSize: 14, marginBottom: 12 },
  strengthContainer: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: '500' },
  primaryButton: { height: 56, backgroundColor: '#00C896', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 'auto' },
  footerText: { color: '#4A5568', fontSize: 14 },
  footerLink: { color: '#00C896', fontSize: 14, fontWeight: '700' }
});