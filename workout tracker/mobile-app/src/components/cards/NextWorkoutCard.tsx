import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Dumbbell, ChevronRight } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface Exercise {
  name: string;
  sets: number;
}

interface NextWorkoutCardProps {
  routineName: string;
  exercises: Exercise[];
  duration?: string;
  onStartWorkout: () => void;
  onViewDetails?: () => void;
}

export function NextWorkoutCard({
  routineName,
  exercises,
  duration,
  onStartWorkout,
  onViewDetails,
}: NextWorkoutCardProps) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Dumbbell size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.label}>Next Workout</Text>
            <Text style={styles.routineName}>{routineName}</Text>
          </View>
        </View>
        {duration && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}
      </View>

      {/* Exercise List */}
      <View style={styles.exerciseList}>
        {exercises.slice(0, 3).map((exercise, index) => (
          <View key={index} style={styles.exerciseRow}>
            <View style={styles.exerciseDot} />
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            <Text style={styles.exerciseSets}>{exercise.sets}x</Text>
          </View>
        ))}
        {exercises.length > 3 && (
          <TouchableOpacity 
            style={styles.moreRow}
            onPress={onViewDetails}
            activeOpacity={0.7}
          >
            <Text style={styles.moreText}>+{exercises.length - 3} more exercises</Text>
            <ChevronRight size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={onStartWorkout}
        activeOpacity={0.8}
      >
        <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
        <Text style={styles.startButtonText}>Start Workout</Text>
      </TouchableOpacity>
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
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  durationBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  exerciseList: {
    marginBottom: SPACING.lg,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.md,
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  exerciseSets: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  moreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  startButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

