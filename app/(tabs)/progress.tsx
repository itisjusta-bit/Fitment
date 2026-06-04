import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProgressScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Text style={styles.pageTitle}>PROGRESS</Text>
        <Text style={styles.placeholder}>Analytics coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5, marginBottom: 24 },
  placeholder: { color: '#94A3B8', fontWeight: '600' }
});