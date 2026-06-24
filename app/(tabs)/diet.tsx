import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useDailyStore } from '../../lib/store/dailyStore';

export default function DietScreen() {
  const { logMeal } = useDailyStore();

  const [meals, setMeals] = useState<any[]>([]);
  const [expandedMeals, setExpandedMeals] = useState<Record<number, boolean>>({});
  const [loggedMeals, setLoggedMeals] = useState<Set<number>>(new Set());
  const [targets, setTargets] = useState({ cals: 2800, p: 185, c: 300, f: 70 });
  const [consumed, setConsumed] = useState({ cals: 0, p: 0, c: 0, f: 0 });

  useEffect(() => {
    const loadData = async () => {
      try {
        const protocolStr = await AsyncStorage.getItem('fitment_protocol');
        if (!protocolStr) return; 
        
        const data = JSON.parse(protocolStr);
        
        // 🌟 THE FIX: Indestructible Diet Unwrapper
        let d = data.diet;
        if (typeof d === 'string') d = JSON.parse(d); 
        if (d && d.diet) d = d.diet; // Catches double nesting

        const loadedMeals = d?.meals || [];
        setMeals(loadedMeals);
        
        // Grab the macro targets from the new v2 structure
        if (d?.targets) {
          setTargets({
            cals: d.targets.calories || 2800,
            p: d.targets.protein_g || 185,
            c: d.targets.carbs_g || 300,
            f: d.targets.fat_g || 70
          });
        }

        const loggedStr = await AsyncStorage.getItem('logged_meal_indices');
        if (loggedStr) {
          const indices = JSON.parse(loggedStr) as number[];
          setLoggedMeals(new Set(indices));
          
          let cals = 0, p = 0, c = 0, f = 0;
          indices.forEach(idx => {
            const m = loadedMeals[idx];
            if (m) {
              cals += m.calories || 0;
              p += m.protein_g || 0; 
              c += m.carbs_g || 0;  
              f += m.fat_g || 0;     
            }
          });
          setConsumed({ cals, p, c, f });
        }
      } catch (e) {
        console.error("Failed to load diet memory", e);
      }
    };
    
    loadData();
  }, []);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedMeals(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleLogMeal = async (index: number, meal: any) => {
    if (loggedMeals.has(index)) return; 

    const newLogged = new Set(loggedMeals).add(index);
    setLoggedMeals(newLogged);

    setConsumed(prev => ({
      cals: prev.cals + (meal.calories || 0),
      p: prev.p + (meal.protein_g || 0), 
      c: prev.c + (meal.carbs_g || 0),  
      f: prev.f + (meal.fat_g || 0)      
    }));

    try {
      await AsyncStorage.setItem('logged_meal_indices', JSON.stringify(Array.from(newLogged)));
      logMeal(); 
    } catch (e) {
      console.error("Failed to save meal log", e);
    }
  };

  const getPct = (current: number, target: number) => {
    if (!target) return '0%' as any;
    const pct = Math.min((current / target) * 100, 100);
    return `${pct}%` as any;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#E8FAF4', '#EFF6FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>🥗 Today's Fuel</Text>

        <BlurView intensity={80} tint="light" style={styles.glassCard}>
          <Text style={styles.cardHeader}>DAILY PROGRESS</Text>
          <View style={styles.macroMain}>
            <Text style={styles.caloriesEaten}>{Math.round(consumed.cals)}</Text>
            <Text style={styles.caloriesTarget}>/ {targets.cals} kcal eaten</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: getPct(consumed.cals, targets.cals) }]} />
          </View>
          <View style={styles.macroSplitRow}>
            <View style={styles.macroCol}>
              <Text style={styles.macroSplitText}>P: {Math.round(consumed.p)}/{targets.p}g</Text>
              <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: getPct(consumed.p, targets.p), backgroundColor: '#3B82F6' }]} /></View>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroSplitText}>C: {Math.round(consumed.c)}/{targets.c}g</Text>
              <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: getPct(consumed.c, targets.c), backgroundColor: '#F59E0B' }]} /></View>
            </View>
            <View style={styles.macroCol}>
              <Text style={styles.macroSplitText}>F: {Math.round(consumed.f)}/{targets.f}g</Text>
              <View style={styles.miniBarBg}><View style={[styles.miniBarFill, { width: getPct(consumed.f, targets.f), backgroundColor: '#8B5CF6' }]} /></View>
            </View>
          </View>
        </BlurView>

        <Text style={styles.sectionTitle}>MEAL PLAN</Text>
        <View style={styles.mealList}>
          {meals.map((meal, index) => {
            const isExpanded = !!expandedMeals[index];
            const isLogged = loggedMeals.has(index);
            
            // Extract the new Python v2 label
            const mealLabel = meal.label || meal.name || meal.meal_name || `Meal ${index + 1}`;
            const mealEmoji = meal.emoji || "🍽️";
            const mealDescription = meal.items ? meal.items.map((i: any) => i.name).join(' • ') : '';

            return (
              <BlurView intensity={80} tint="light" style={[styles.mealCard, isLogged && styles.mealCardLogged]} key={index}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={[styles.mealName, isLogged && { color: '#94A3B8', textDecorationLine: 'line-through' }]}>
                      {mealEmoji} {mealLabel}
                    </Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <Pressable style={styles.swapBtn}><Feather name="refresh-cw" size={14} color="#64748B" /></Pressable>
                </View>
                
                <Text style={styles.mealDesc}>{mealDescription}</Text>
                
                {isExpanded && meal.items && (
                  <View style={styles.ingredientContainer}>
                    <View style={styles.ingredientDivider} />
                    {meal.items.map((item: any, i: number) => (
                      <View key={i} style={styles.ingredientRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ingredientName}>{item.name}</Text>
                          <Text style={styles.ingredientQty}>{item.unit}</Text> 
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.ingredientCals}>{item.calories} kcal</Text>
                          <Text style={styles.ingredientMacros}>P {item.protein_g} • C {item.carbs_g} • F {item.fat_g}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.mealFooter}>
                  <View style={styles.pcfContainer}>
                    <Text style={styles.pcfTotal}>{meal.calories} kcal</Text>
                    <Text style={styles.pcfBreakdown}>P {meal.protein_g}g • C {meal.carbs_g}g • F {meal.fat_g}g</Text>
                  </View>
                  <View style={styles.footerActions}>
                    <Pressable onPress={() => toggleExpand(index)} style={styles.expandBtn}>
                      <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#64748B" />
                    </Pressable>
                    <Pressable onPress={() => handleLogMeal(index, meal)} style={[styles.logBtn, isLogged && styles.logBtnDone]} disabled={isLogged}>
                      <Text style={[styles.logBtnText, isLogged && styles.logBtnTextDone]}>{isLogged ? 'LOGGED ✓' : 'LOG ✅'}</Text>
                    </Pressable>
                  </View>
                </View>
              </BlurView>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 120 },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0A0F1E', letterSpacing: -0.5, marginBottom: 24 },
  glassCard: { overflow: 'hidden', padding: 24, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.75)', marginBottom: 32 },
  cardHeader: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  macroMain: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 12 },
  caloriesEaten: { fontSize: 32, fontWeight: '900', color: '#0A0F1E' },
  caloriesTarget: { fontSize: 14, fontWeight: '700', color: '#64748B', marginLeft: 6 },
  progressBarBg: { height: 8, backgroundColor: '#E2EAF4', borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressBarFill: { height: '100%', backgroundColor: '#00C896', borderRadius: 4 },
  macroSplitRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  macroCol: { flex: 1 },
  macroSplitText: { fontSize: 10, fontWeight: '800', color: '#4A5568', marginBottom: 4 },
  miniBarBg: { height: 4, backgroundColor: '#E2EAF4', borderRadius: 2, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0A0F1E', letterSpacing: 1, marginBottom: 16 },
  mealList: { gap: 14 },
  mealCard: { overflow: 'hidden', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: 'rgba(255,255,255,0.75)' },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  mealName: { fontSize: 16, fontWeight: '800', color: '#0A0F1E' },
  mealTime: { fontSize: 11, fontWeight: '700', color: '#00C896', marginTop: 2 },
  swapBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 100 },
  mealDesc: { fontSize: 13, color: '#4A5568', lineHeight: 20, fontWeight: '600', marginBottom: 16 },
  ingredientContainer: { marginBottom: 16 },
  ingredientDivider: { height: 1, backgroundColor: '#E2EAF4', marginBottom: 12 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  ingredientName: { fontSize: 12, fontWeight: '700', color: '#0A0F1E' },
  ingredientQty: { fontSize: 11, color: '#64748B', marginTop: 2 },
  ingredientCals: { fontSize: 12, fontWeight: '700', color: '#0A0F1E' },
  ingredientMacros: { fontSize: 10, color: '#64748B', marginTop: 2 },
  mealFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(226,234,244,0.5)' },
  pcfContainer: {},
  pcfTotal: { fontSize: 14, fontWeight: '800', color: '#0A0F1E' },
  pcfBreakdown: { fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 2 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  expandBtn: { padding: 4 },
  logBtn: { backgroundColor: '#00C896', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  logBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  mealCardLogged: { borderColor: '#E2EAF4', backgroundColor: 'rgba(255,255,255,0.4)', opacity: 0.7 },
  logBtnDone: { backgroundColor: '#E2EAF4' },
  logBtnTextDone: { color: '#64748B' }
});