// Hevy Design System Colors
export const HEVY_COLORS = {
  // Primary
  primary: '#007AFF',
  primaryLight: '#E8F4FF',
  
  // Set Types
  warmup: '#FF9500',
  warmupBg: '#FFF8E8',
  superset: '#AF52DE',
  supersetBg: '#F8EEFF',
  failure: '#FF3B30',
  failureBg: '#FFEBEA',
  drop: '#5856D6',
  dropBg: '#EEEEFF',
  
  // Neutrals
  white: '#FFFFFF',
  background: '#F2F2F7',
  cardBg: '#FFFFFF',
  
  // Text
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  
  // Borders
  border: '#E5E5EA',
  divider: '#C6C6C8',
  
  // States
  success: '#34C759',
  completed: '#F2F2F7',
  
  // Brand
  strava: '#FC4C02',
};

export const HEVY_TYPOGRAPHY = {
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  setNumber: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  inputLarge: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
  },
  small: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
};

export const HEVY_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const HEVY_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 100,
};

export const HEVY_SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

