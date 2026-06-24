import { create } from 'zustand';

export interface OnboardingState {
  goal: string;
  gender: string;
  age: number;
  weight: number;
  height: number;
  diet: string;
  activity: string;
  equipment: string;
  frequency: number;
  experience: string;
  active_injuries: string[]; // 🌟 ADDED: Required by v2 Brain
  updateField: (field: keyof OnboardingState, value: any) => void;
  setExperience: (level: string) => void; 
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  goal: 'build_muscle',
  gender: 'Male',
  age: 25,
  weight: 70,
  height: 175,
  diet: 'standard',
  activity: 'moderate',
  equipment: 'no_equipment',
  frequency: 4,
  experience: 'newbie', 
  active_injuries: [], // 🌟 Default empty state
  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
  setExperience: (level) => set({ experience: level }), 
}));