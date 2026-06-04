import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const EXERCISES = [
  { id: 1, name: "Barbell Bench Press", sets: "4", reps: "10", rest: "60s" },
  { id: 2, name: "Incline Dumbbell Press", sets: "3", reps: "12", rest: "60s" },
  { id: 3, name: "Cable Crossovers", sets: "3", reps: "15", rest: "45s" },
  { id: 4, name: "Overhead Tricep Extension", sets: "4", reps: "12", rest: "60s" },
];

export default function WorkoutScreen() {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.pageTitle}>YOUR PROTOCOL</Text>
          <Pressable style={styles.injuryToggle}>
            <Text style={styles.injuryText}>⚠️ INJURY MODE</Text>
          </Pressable>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionHeader}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Feather name="zap" size={16} color="#0A0F1E" />
              <Text style={styles.actionBadge}>AI GENERATED</Text>
            </View>
            <Text style={styles.lastSession}>Last session: 3 days ago</Text>
          </View>
          <Text style={styles.actionTitle}>Upper Body Hypertrophy</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>CHEST</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>SHOULDERS</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>TRICEPS</Text></View>
          </View>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>START WORKOUT</Text>
            <Feather name="arrow-right" size={16} color="#FFF" />
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>EXERCISE BREAKDOWN</Text>
        <View style={styles.exerciseList}>
          {EXERCISES.map((ex) => (
            <BlurView intensity={80} tint="light" style={styles.exerciseCard} key={ex.id}>
              <View style={styles.exHeader}>
                <Text style={styles.exName}>{ex.name}</Text>
                <Pressable onPress={() => setSelectedExercise(ex.name)} style={{ padding: 4 }}>
                  <Feather name="info" size={18} color="#00C896" />
                </Pressable>
              </View>
              <View style={styles.exDetails}>
                <View style={styles.exStat}><Text style={styles.exStatText}>{ex.sets} SETS</Text></View>
                <View style={styles.exStat}><Text style={styles.exStatText}>{ex.reps} REPS</Text></View>
                <View style={styles.exStat}><Text style={styles.exStatText}>⏱️ {ex.rest}</Text></View>
              </View>
            </BlurView>
          ))}
        </View>
      </ScrollView>

      {/* EXERCISE DB MODAL BOTTOM SHEET */}
      <Modal animationType="slide" transparent={true} visible={!!selectedExercise} onRequestClose={() => setSelectedExercise(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise}</Text>
              <Pressable onPress={() => setSelectedExercise(null)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color="#0A0F1E" />
              </Pressable>
            </View>
            
            {/* Mocking the ExerciseDB GIF Response */}
            <View style={styles.gifContainer}>
              <Image 
                source={{ uri: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcGpmZW95bDFiY241b21sdmJndGJhZncwcGIwcTN6cXl0MWMwcmltaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TquJq7Xg520mGha/giphy.gif' }} 
                style={styles.gifImage} 
                resizeMode="cover" 
              />
              <View style={styles.gifOverlay}>
                <Text style={styles.gifOverlayText}>ExerciseDB Mock</Text>
              </View>
            </View>

            <Text style={styles.modalDesc}>Keep your core tight and control the eccentric motion. Do not lock out your elbows completely at the top of the movement.</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5 },
  injuryToggle: { backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  injuryText: { fontSize: 10, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 },
  
  actionCard: { backgroundColor: '#00C896', padding: 20, borderRadius: 24, shadowColor: '#00C896', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, marginBottom: 32 },
  actionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  actionBadge: { fontSize: 11, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1 },
  lastSession: { fontSize: 10, fontWeight: '700', color: 'rgba(10,15,30,0.6)' },
  actionTitle: { fontSize: 22, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5, marginBottom: 12 },
  chipRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  chip: { backgroundColor: 'rgba(10, 15, 30, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  chipText: { fontSize: 9, fontWeight: '800', color: '#0A0F1E', letterSpacing: 0.5 },
  actionButton: { backgroundColor: '#0A0F1E', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  actionButtonText: { color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },

  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 16 },
  exerciseList: { gap: 12 },
  exerciseCard: { overflow: 'hidden', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.75)' },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  exName: { fontSize: 15, fontWeight: '800', color: '#0A0F1E' },
  exDetails: { flexDirection: 'row', gap: 8 },
  exStat: { backgroundColor: 'rgba(226,234,244,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  exStatText: { fontSize: 10, fontWeight: '800', color: '#4A5568', letterSpacing: 0.5 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 15, 30, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#0A0F1E' },
  modalCloseBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 100 },
  gifContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 16, position: 'relative' },
  gifImage: { width: '100%', height: '100%' },
  gifOverlay: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  gifOverlayText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  modalDesc: { fontSize: 14, color: '#4A5568', lineHeight: 22, fontWeight: '500' }
});