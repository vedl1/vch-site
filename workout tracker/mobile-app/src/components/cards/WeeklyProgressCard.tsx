import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy, CheckCircle2 } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface WeeklyProgressCardProps {
  workoutsCompleted: number;
  totalWorkouts: number;
  currentStreak?: number;
}

export function WeeklyProgressCard({
  workoutsCompleted,
  totalWorkouts,
  currentStreak,
}: WeeklyProgressCardProps) {
  const progressPercentage = totalWorkouts > 0 
    ? Math.round((workoutsCompleted / totalWorkouts) * 100) 
    : 0;

  const daysOfWeek = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  
  // Get current day index (0 = Monday)
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Trophy size={20} color={COLORS.success} />
          </View>
          <View>
            <Text style={styles.label}>Weekly Progress</Text>
            <Text style={styles.title}>
              {workoutsCompleted} of {totalWorkouts} workouts
            </Text>
          </View>
        </View>
        <View style={styles.percentageBadge}>
          <Text style={styles.percentageText}>{progressPercentage}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill,
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
      </View>

      {/* Day Indicators */}
      <View style={styles.daysRow}>
        {daysOfWeek.map((day, index) => {
          const isComplete = index < workoutsCompleted;
          const isToday = index === todayIndex;
          
          return (
            <View key={index} style={styles.dayItem}>
              <View style={[
                styles.dayCircle,
                isComplete && styles.dayCircleComplete,
                isToday && !isComplete && styles.dayCircleToday,
              ]}>
                {isComplete ? (
                  <CheckCircle2 size={16} color="#FFFFFF" />
                ) : (
                  <Text style={[
                    styles.dayText,
                    isToday && styles.dayTextToday,
                  ]}>
                    {day}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Streak */}
      {currentStreak && currentStreak > 0 && (
        <View style={styles.streakRow}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{currentStreak} day streak!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.success}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  percentageBadge: {
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  progressBarContainer: {
    marginBottom: SPACING.lg,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.full,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleComplete: {
    backgroundColor: COLORS.success,
  },
  dayCircleToday: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dayTextToday: {
    color: COLORS.primary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.warning,
  },
});

