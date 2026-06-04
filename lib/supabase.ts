import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Yahan aapko apne Supabase project ke actual credentials daalne hain
// Go to Supabase Dashboard -> Project Settings -> API
const supabaseUrl = 'https://qcxfaldzprfyxczwruaf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjeGZhbGR6cHJmeXhjendydWFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzQyMTksImV4cCI6MjA5NjA1MDIxOX0.SBpp6_OgBh8_UnMxSnqGX-1Oi1cwUuxb6u1sL4pCqWI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // React Native mein session persist (save) karne ke liye AsyncStorage use hota hai
    // Taaki user app band karke khole toh login hi rahe
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});