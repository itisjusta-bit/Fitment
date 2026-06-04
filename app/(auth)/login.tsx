import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
// Supabase client import
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    setErrorMsg('');
    
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      triggerShake();
      return;
    }
    
    setLoading(true);
    
    // Supabase me user ko authenticate karne ke liye
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      // Agar email/password galat hai toh error message show karo
      setErrorMsg('Invalid login credentials.');
      triggerShake();
    } else {
      // Login success hone par user ko direct home tabs pe bhejna hai
      console.log("Login Success:", data);
      router.replace('/(tabs)'); // Abhi tabs bane nahi hain isliye commented hai
     // alert("Login Successful! (Dashboard coming soon)");
    }
    
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <LinearGradient 
        colors={['#E8FAF4', '#E3F2FD', '#F3E5F5']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={StyleSheet.absoluteFill} 
      />

      <View style={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
          <BlurView intensity={80} tint="light" style={styles.glassCard}>
            <View style={styles.cardInner}>
              
              <Text style={styles.headline}>Welcome Back</Text>
              <Text style={styles.subheadline}>Sign in to continue your journey</Text>

              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Email" 
                  placeholderTextColor="#94A3B8" 
                  autoCapitalize="none" 
                  keyboardType="email-address"
                  onChangeText={setEmail} 
                  value={email}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input} 
                  placeholder="Password" 
                  placeholderTextColor="#94A3B8" 
                  secureTextEntry 
                  onChangeText={setPassword} 
                  value={password}
                />
                <Pressable style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </Pressable>
              </View>

              {errorMsg ? (
                <Text style={styles.errorText}>{errorMsg}</Text>
              ) : null}

              <Pressable style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                <Text style={styles.primaryButtonText}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Text>
              </Pressable>

            </View>
          </BlurView>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New here? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  backButton: { position: 'absolute', top: 60, left: 24, zIndex: 10 },
  backText: { color: '#4A5568', fontWeight: '600', fontSize: 14 },
  glassCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)', backgroundColor: 'rgba(255,255,255,0.75)' },
  cardInner: { padding: 24 },
  headline: { color: '#0A0F1E', fontSize: 26, fontWeight: '700', letterSpacing: -0.3, marginBottom: 4 },
  subheadline: { color: '#94A3B8', fontSize: 14, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  input: { height: 52, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(200,220,240,0.5)', borderRadius: 14, paddingHorizontal: 16, color: '#0A0F1E', fontSize: 14 },
  forgotPassword: { alignSelf: 'flex-end', marginTop: 8 },
  forgotPasswordText: { color: '#00C896', fontSize: 13, fontWeight: '600' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: -4, marginBottom: 12, fontWeight: '500', textAlign: 'center' },
  primaryButton: { height: 56, backgroundColor: '#00C896', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#4A5568', fontSize: 14 },
  footerLink: { color: '#00C896', fontSize: 14, fontWeight: '700' }
});