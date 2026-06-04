import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const logoImg = require('../assets/logo.png');

export default function LandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Video hook configuration
  const player = useVideoPlayer(require('../assets/videos/background.mp4'), p => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    // Fallback background color in case the video takes a second to load
    <View style={[styles.container, { backgroundColor: '#0D2A20' }]}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* Full-screen video with no safe area gaps */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VideoView
          style={StyleSheet.absoluteFill}
          player={player}
          contentFit="cover"
          nativeControls={false}
        />
        {/* Overlay to simulate the hue-rotate and saturate CSS filter */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(13, 42, 32, 0.4)' }]} />
      </View>

      {/* Custom gradient stops precisely matching the designer's overlay specs */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.12)',
          'rgba(0, 0, 0, 0.04)',
          'rgba(0, 0, 0, 0.68)',
          'rgba(0, 0, 0, 0.88)'
        ]}
        locations={[0, 0.4, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Top-left Logo: Small, white, tinted dynamically */}
      <Image
        source={logoImg}
        style={[styles.logo, { top: Math.max(insets.top, 20) + 16 }]}
        resizeMode="contain"
      />

      {/* Top-right 'Online' Brand Glow Dot */}
      <View style={[styles.glowDot, { top: Math.max(insets.top, 20) + 24 }]} />

      {/* Bottom Content Container: Pinned to bottom using safe area insets */}
      <View style={[styles.content, { paddingBottom: 32 + insets.bottom }]}>
        <Text style={styles.title}>Fitment</Text>
        <Text style={styles.tagline}>
          Your strength starts here.{'\n'}Train smarter, not harder.
        </Text>

        <View style={styles.buttonRow}>
          {/* Filled Pill Button */}
          <Pressable
            style={[styles.button, styles.btnPrimary]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </Pressable>

          {/* Outlined Pill Button */}
          <Pressable
            style={[styles.button, styles.btnSecondary]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.btnSecondaryText}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    position: 'absolute',
    left: 24,
    width: 32, 
    height: 32,
    tintColor: '#FFFFFF', // Forces any existing logo asset to render purely white
    zIndex: 10,
  },
  glowDot: {
    position: 'absolute',
    right: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C896',
    shadowColor: '#00C896',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end', // Pins text and buttons to the bottom
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    // fontFamily: 'PlusJakartaSans-ExtraBold', // Uncomment once fonts are loaded globally
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.60)',
    fontSize: 15,
    lineHeight: 21.75, // 15px font size * 1.45 line height
    marginBottom: 32,
    // fontFamily: 'PlusJakartaSans-Regular', 
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 52,
    borderRadius: 100, // Full pill radius
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#FFFFFF',
  },
  btnPrimaryText: {
    color: '#0A0F1E',
    fontSize: 14,
    fontWeight: '700',
    // fontFamily: 'PlusJakartaSans-Bold',
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    // fontFamily: 'PlusJakartaSans-Bold',
  },
});