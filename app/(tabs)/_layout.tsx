import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#00C896',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderTopColor: 'rgba(226,234,244,0.8)',
        height: 72,
        paddingBottom: 12,
        paddingTop: 8,
      },
      headerShown: false,
    }}>
      <Tabs.Screen name="index"
        options={{ title: 'Home',    tabBarIcon: () => <Text style={{fontSize:22}}>🏠</Text> }} />
      <Tabs.Screen name="workout"
        options={{ title: 'Workout', tabBarIcon: () => <Text style={{fontSize:22}}>💪</Text> }} />
      <Tabs.Screen name="diet"
        options={{ title: 'Diet',    tabBarIcon: () => <Text style={{fontSize:22}}>🥗</Text> }} />
      <Tabs.Screen name="progress"
        options={{ title: 'Progress',tabBarIcon: () => <Text style={{fontSize:22}}>📊</Text> }} />
      <Tabs.Screen name="chat"
        options={{ title: 'Chat',    tabBarIcon: () => <Text style={{fontSize:22}}>💬</Text> }} />
    </Tabs>
  );
}