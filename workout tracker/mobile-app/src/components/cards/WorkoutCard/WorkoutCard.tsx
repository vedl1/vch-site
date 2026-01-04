import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Play, Clock, Dumbbell, Trophy, ExternalLink } from 'lucide-react-native';
import { WorkoutCardProps, SetType } from './types';
import { ExerciseBlock } from './ExerciseBlock';
import { MuscleHeatmap } from './MuscleHeatmap';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from './constants';

export function WorkoutCard({
  mode,
  title,
  lastPerformed,
  duration,
  exercises,
  stats,
  isStravaLinked,
  stravaActivityId,
  muscleHeatmap,
  onStartWorkout,
  onExercisePress,
  onSetUpdate,
  onAddSet,
}: WorkoutCardProps) {
  const isPreview = mode === 'preview';
  const isHistory = mode === 'history';
  const isActive = mode === 'active';

  // Get active muscle groups from exercises
  const activeMuscles = exercises
    .flatMap(e => e.muscleGroups || [])
    .filter((v, i, a) => a.indexOf(v) === i);

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}k`;
    }
    return kg.toString();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {lastPerformed && (
              <View style={styles.metaRow}>
                <Clock size={12} color={HEVY_COLORS.textSecondary} />
                <Text style={styles.metaText}>{lastPerformed}</Text>
              </View>
            )}
            {duration && !lastPerformed && (
              <View style={styles.metaRow}>
                <Clock size={12} color={HEVY_COLORS.textSecondary} />
                <Text style={styles.metaText}>{duration}</Text>
              </View>
            )}
          </View>

          {/* Strava Badge */}
          {isStravaLinked && (
            <View style={styles.stravaBadge}>
              <Text style={styles.stravaText}>Strava</Text>
              <ExternalLink size={10} color={HEVY_COLORS.strava} />
            </View>
          )}
        </View>

        {/* Muscle Heatmap */}
        {muscleHeatmap && (
          <View style={styles.heatmapContainer}>
            <MuscleHeatmap 
              activeMuscles={muscleHeatmap.front} 
              size={50} 
              view="front" 
            />
          </View>
        )}
      </View>

      {/* Stats Row (History Mode) */}
      {isHistory && stats && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Dumbbell size={16} color={HEVY_COLORS.primary} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{formatVolume(stats.volume)}</Text>
              <Text style={styles.statLabel}>KG</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Clock size={16} color={HEVY_COLORS.primary} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.duration}</Text>
              <Text style={styles.statLabel}>MIN</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Trophy size={16} color={HEVY_COLORS.warmup} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{stats.prs}</Text>
              <Text style={styles.statLabel}>PRs</Text>
            </View>
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      {/* Exercise List */}
      <View style={styles.exerciseList}>
        {isPreview ? (
          // Preview Mode: Show first 3-4 exercises compactly
          exercises.slice(0, 4).map((exercise, index) => (
            <View key={exercise.id} style={styles.previewExercise}>
              <View style={styles.previewDot} />
              <Text style={styles.previewName} numberOfLines={1}>
                {exercise.name}
              </Text>
              <Text style={styles.previewSets}>
                {exercise.sets.length}×
              </Text>
            </View>
          ))
        ) : (
          // History/Active Mode: Show expandable exercise blocks
          <ScrollView 
            style={styles.exerciseScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {exercises.map((exercise, index) => {
              // Check if next exercise is part of same superset
              const nextExercise = exercises[index + 1];
              const showConnector = exercise.isSuperset && 
                nextExercise?.isSuperset && 
                exercise.supersetWith === nextExercise.id;

              return (
                <ExerciseBlock
                  key={exercise.id}
                  exercise={exercise}
                  mode={mode}
                  onSetUpdate={(setId, field, value) => 
                    onSetUpdate?.(exercise.id, setId, field, value)
                  }
                  onAddSet={() => onAddSet?.(exercise.id)}
                  showSupersetConnector={showConnector}
                />
              );
            })}
          </ScrollView>
        )}

        {/* "More exercises" indicator */}
        {isPreview && exercises.length > 4 && (
          <Text style={styles.moreText}>
            +{exercises.length - 4} more exercises
          </Text>
        )}
      </View>

      {/* Action Button (Preview Mode) */}
      {isPreview && onStartWorkout && (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStartWorkout}
          activeOpacity={0.8}
        >
          <Play size={18} color={HEVY_COLORS.white} fill={HEVY_COLORS.white} />
          <Text style={styles.startButtonText}>Start Routine</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    ...HEVY_SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...HEVY_TYPOGRAPHY.title,
    color: HEVY_COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: HEVY_SPACING.xs,
  },
  metaText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginLeft: HEVY_SPACING.xs,
  },
  stravaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${HEVY_COLORS.strava}15`,
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.pill,
    alignSelf: 'flex-start',
    marginTop: HEVY_SPACING.sm,
  },
  stravaText: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.strava,
    marginRight: HEVY_SPACING.xs,
  },
  heatmapContainer: {
    marginLeft: HEVY_SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.md,
    padding: HEVY_SPACING.md,
    marginTop: HEVY_SPACING.lg,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    marginLeft: HEVY_SPACING.sm,
  },
  statValue: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  statLabel: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.textTertiary,
    fontSize: 10,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: HEVY_COLORS.border,
  },
  divider: {
    height: 1,
    backgroundColor: HEVY_COLORS.border,
    marginVertical: HEVY_SPACING.lg,
  },
  exerciseList: {
    minHeight: 80,
  },
  exerciseScroll: {
    maxHeight: 400,
  },
  previewExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.sm,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HEVY_COLORS.primary,
    marginRight: HEVY_SPACING.md,
  },
  previewName: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
    flex: 1,
  },
  previewSets: {
    ...HEVY_TYPOGRAPHY.setNumber,
    color: HEVY_COLORS.primary,
    marginLeft: HEVY_SPACING.sm,
  },
  moreText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.sm,
  },
  startButton: {
    backgroundColor: HEVY_COLORS.primary,
    borderRadius: HEVY_RADIUS.md,
    paddingVertical: HEVY_SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: HEVY_SPACING.lg,
  },
  startButtonText: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.white,
    marginLeft: HEVY_SPACING.sm,
  },
});

