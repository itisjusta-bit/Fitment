// Yeh file app ki saari styling (colors, spacing) control karegi
// Document ke Page 4, 5, aur 6 ke hisaab se exact values daali hain

export const Colors = {
  // Brand Colors
  green: '#00C896', // Primary brand color (buttons, active states)
  greenDark: '#00A07A',
  greenLight: '#E6FAF5',
  greenMid: '#B2EED8',
  
  // Secondary Colors
  blue: '#3B82F6', // AI chat
  blueLight: '#EFF6FF',
  purple: '#8B5CF6', // Gamification
  purpleLight: '#F5F3FF',
  orange: '#F59E0B', // Warnings
  orangeLight: '#FFFBEB',
  red: '#EF4444', // Danger/Errors
  redLight: '#FEF2F2',
  teal: '#14B8A6', // Wearable data
  pink: '#EC4899', // Community
  
  // UI Colors
  card: '#FFFFFF', // Glass card base
  text: '#0A0F1E', // Primary text
  text2: '#4A5568', // Secondary text
  text3: '#94A3B8', // Placeholder/captions
  indigo: '#6366F1', // Reports
  bg: '#F0F6FF', // Default page background
};

export const Spacing = {
  xs: 4,   // Icon gaps
  sm: 8,   // Inner card padding
  md: 12,  // Standard gap
  lg: 16,  // Card default padding
  xl: 20,  // Section spacing
  xxl: 24, // Major section breaks
  xxxl: 32 // Screen padding on large phones
};

export const Layout = {
  screenPadH: 16, // Screen horizontal padding default
  screenPadT: 8,  // Top padding
  bottomNavH: 72, // Tab bar height
  tabIconSize: 24,
  
  // Glassmorphism border radius
  radiusLg: 24, // Hero cards
  radiusMd: 20, // Standard cards
  radiusSm: 14, // Compact cards
  radiusXs: 10, // Badges
};

export const Shadows = {
  // iOS shadow properties glassmorphism ke liye
  cardDrop: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4, // Android equivalent
  }
};