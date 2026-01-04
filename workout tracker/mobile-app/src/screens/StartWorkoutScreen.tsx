import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Clock, ChevronRight, Timer, Activity, Dumbbell, Flame, Moon, Target, Trophy } from 'lucide-react-native';
import { GlobalDateScroller } from '../components/GlobalDateScroller';
import { useDate } from '../context/DateContext';
import { MuscleHeatmap } from '../components/cards/WorkoutCard/MuscleHeatmap';
import { RoutineWorkoutScreen } from './RoutineWorkoutScreen';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from '../components/cards/WorkoutCard/constants';
import { 
  ROUTINES, 
  formatSetsDisplay, 
  formatRepsDisplay, 
  RoutineTemplate, 
  getWorkoutTypeColor,
  WorkoutType,
} from '../data/routines';

// Workout type configuration
const WORKOUT_TYPE_CONFIG: Record<WorkoutType, { 
  label: string; 
  color: string; 
  icon: typeof Activity;
  bgColor: string;
}> = {
  run: { label: 'Run', color: '#34C759', icon: Activity, bgColor: '#E8FAE8' },
  strength: { label: 'Strength', color: '#007AFF', icon: Dumbbell, bgColor: '#E8F4FF' },
  hyrox: { label: 'Hyrox', color: '#FF9500', icon: Flame, bgColor: '#FFF4E8' },
  core: { label: 'Core', color: '#AF52DE', icon: Target, bgColor: '#F4E8FF' },
  rest: { label: 'Rest', color: '#8E8E93', icon: Moon, bgColor: '#F2F2F7' },
  race: { label: 'Race', color: '#FFD700', icon: Trophy, bgColor: '#FFFDE8' },
};

export function StartWorkoutScreen() {
  const { selectedDate, formattedDate, isToday, isFuture } = useDate();
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineTemplate | null>(null);

  // Get day name for filtering
  const selectedDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[selectedDate.getDay()];
  }, [selectedDate]);

  // Get routines - show all routines, but highlight the one for the selected day
  const routinesForDisplay = useMemo(() => {
    return ROUTINES.map(routine => ({
      ...routine,
      isRecommended: routine.day === selectedDayName,
    }));
  }, [selectedDayName]);

  const handleStartRoutine = (routine: RoutineTemplate) => {
    setSelectedRoutine(routine);
    setShowActiveWorkout(true);
  };

  const handleStartEmpty = () => {
    setSelectedRoutine(null);
    setShowActiveWorkout(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={HEVY_COLORS.cardBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Start Workout</Text>
        <Text style={styles.subtitle}>
          {isToday ? 'Today' : isFuture ? `Schedule for ${formattedDate}` : formattedDate}
        </Text>
      </View>

      {/* Global Date Scroller */}
      <GlobalDateScroller />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty Workout Card */}
        <TouchableOpacity
          style={styles.emptyWorkoutCard}
          onPress={handleStartEmpty}
          activeOpacity={0.8}
        >
          <View style={styles.emptyWorkoutIcon}>
            <Plus size={32} color={HEVY_COLORS.primary} strokeWidth={2.5} />
          </View>
          <View style={styles.emptyWorkoutContent}>
            <Text style={styles.emptyWorkoutTitle}>Start Empty Workout</Text>
            <Text style={styles.emptyWorkoutSubtitle}>
              Create a workout from scratch
            </Text>
          </View>
          <ChevronRight size={24} color={HEVY_COLORS.textTertiary} />
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Routines</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionAction}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Routine Cards */}
        {routinesForDisplay.map((routine) => {
          const typeConfig = WORKOUT_TYPE_CONFIG[routine.workoutType];
          const IconComponent = typeConfig.icon;
          const isRestDay = routine.workoutType === 'rest';
          const hasExercises = routine.exercises && routine.exercises.length > 0;
          const hasRunSegments = routine.runSegments && routine.runSegments.length > 0;

          return (
            <View key={routine.id} style={[
              styles.routineCard,
              routine.isRecommended && styles.routineCardRecommended,
              routine.isRecommended && { borderColor: typeConfig.color },
            ]}>
              {/* Recommended Badge */}
              {routine.isRecommended && (
                <View style={[styles.recommendedBadge, { backgroundColor: typeConfig.bgColor }]}>
                  <Text style={[styles.recommendedText, { color: typeConfig.color }]}>
                    RECOMMENDED FOR {selectedDayName.toUpperCase()}
                  </Text>
                </View>
              )}

              {/* Routine Header */}
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <View style={styles.routineTitleRow}>
                    <View style={[styles.workoutTypeIcon, { backgroundColor: typeConfig.bgColor }]}>
                      <IconComponent size={16} color={typeConfig.color} />
                    </View>
                    <Text style={styles.routineName}>{routine.name}</Text>
                  </View>
                  <View style={styles.routineMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: typeConfig.bgColor }]}>
                      <Text style={[styles.typeBadgeText, { color: typeConfig.color }]}>
                        {typeConfig.label}
                      </Text>
                    </View>
                    {routine.secondaryType && (
                      <View style={[
                        styles.typeBadge, 
                        { backgroundColor: WORKOUT_TYPE_CONFIG[routine.secondaryType].bgColor, marginLeft: 4 }
                      ]}>
                        <Text style={[
                          styles.typeBadgeText, 
                          { color: WORKOUT_TYPE_CONFIG[routine.secondaryType].color }
                        ]}>
                          +{WORKOUT_TYPE_CONFIG[routine.secondaryType].label}
                        </Text>
                      </View>
                    )}
                    <Clock size={12} color={HEVY_COLORS.textSecondary} style={{ marginLeft: 8 }} />
                    <Text style={styles.routineMetaText}>
                      {routine.estimatedDuration}
                    </Text>
                  </View>
                </View>
                
                {/* Muscle Heatmap (only for strength) */}
                {routine.workoutType === 'strength' && routine.muscleGroups.length > 0 && (
                  <MuscleHeatmap
                    activeMuscles={routine.muscleGroups}
                    size={50}
                    view="front"
                  />
                )}
              </View>

              {/* Description for runs/rest */}
              {routine.description && (
                <Text style={styles.routineDescription}>{routine.description}</Text>
              )}

              {/* Pace notes for runs */}
              {routine.paceNotes && (
                <View style={styles.paceNoteContainer}>
                  <Activity size={14} color={typeConfig.color} />
                  <Text style={[styles.paceNoteText, { color: typeConfig.color }]}>
                    {routine.paceNotes}
                  </Text>
                </View>
              )}

              {/* Run Segments Preview */}
              {hasRunSegments && (
                <View style={styles.exercisePreview}>
                  {routine.runSegments!.slice(0, 4).map((segment, idx) => (
                    <View key={idx} style={styles.exerciseRow}>
                      <View style={[styles.exerciseDot, { backgroundColor: typeConfig.color }]} />
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {segment.type.charAt(0).toUpperCase() + segment.type.slice(1)}
                        {segment.reps ? ` (${segment.reps}×${segment.duration})` : segment.duration ? ` ${segment.duration}` : ''}
                      </Text>
                      {segment.pace && (
                        <Text style={[styles.exerciseReps, { color: typeConfig.color }]}>
                          {segment.pace}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Exercise Preview (for strength/hyrox/core) */}
              {hasExercises && (
                <View style={styles.exercisePreview}>
                  {routine.exercises!.slice(0, 4).map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <View style={[
                        styles.exerciseDot,
                        { backgroundColor: typeConfig.color },
                        exercise.isTimedExercise && styles.exerciseDotTimed,
                      ]} />
                      <Text style={styles.exerciseName} numberOfLines={1}>
                        {exercise.name}
                      </Text>
                      <View style={styles.exerciseDetails}>
                        <Text style={[styles.exerciseSets, { color: typeConfig.color }]}>
                          {formatSetsDisplay(exercise)}
                        </Text>
                        <Text style={styles.exerciseReps}>
                          {formatRepsDisplay(exercise)}
                        </Text>
                      </View>
                    </View>
                  ))}
                  {routine.exercises!.length > 4 && (
                    <Text style={styles.moreExercises}>
                      +{routine.exercises!.length - 4} more exercises
                    </Text>
                  )}
                </View>
              )}

              {/* Default Weights Note */}
              {hasExercises && routine.exercises!.some(e => e.defaultWeight) && (
                <View style={styles.weightNote}>
                  <Text style={styles.weightNoteText}>
                    💡 Default weights pre-filled from your plan
                  </Text>
                </View>
              )}

              {/* Start Button (not for rest days) */}
              {!isRestDay && (
                <TouchableOpacity
                  style={[
                    styles.startButton,
                    { backgroundColor: typeConfig.color },
                  ]}
                  onPress={() => handleStartRoutine(routine)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.startButtonText}>
                    {isFuture ? 'Schedule' : routine.workoutType === 'run' ? 'Start Run' : 'Start Workout'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Active Workout Modal */}
      <Modal
        visible={showActiveWorkout}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        {selectedRoutine ? (
          <RoutineWorkoutScreen
            routine={selectedRoutine}
            onClose={() => {
              setShowActiveWorkout(false);
              setSelectedRoutine(null);
            }}
          />
        ) : (
          <ActiveWorkoutScreen onClose={() => setShowActiveWorkout(false)} />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HEVY_COLORS.background,
  },
  header: {
    backgroundColor: HEVY_COLORS.cardBg,
    paddingHorizontal: HEVY_SPACING.lg,
    paddingTop: HEVY_SPACING.md,
    paddingBottom: HEVY_SPACING.md,
  },
  title: {
    ...HEVY_TYPOGRAPHY.title,
    fontSize: 28,
    color: HEVY_COLORS.textPrimary,
  },
  subtitle: {
    ...HEVY_TYPOGRAPHY.subtitle,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HEVY_SPACING.lg,
  },
  emptyWorkoutCard: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.xl,
    ...HEVY_SHADOWS.card,
  },
  emptyWorkoutIcon: {
    width: 56,
    height: 56,
    borderRadius: HEVY_RADIUS.md,
    backgroundColor: HEVY_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWorkoutContent: {
    flex: 1,
    marginLeft: HEVY_SPACING.lg,
  },
  emptyWorkoutTitle: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  emptyWorkoutSubtitle: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.md,
  },
  sectionTitle: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  sectionAction: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.primary,
    fontWeight: '600',
  },
  routineCard: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    marginBottom: HEVY_SPACING.md,
    ...HEVY_SHADOWS.card,
  },
  routineCardRecommended: {
    borderWidth: 2,
    borderColor: HEVY_COLORS.primary,
  },
  recommendedBadge: {
    backgroundColor: HEVY_COLORS.primaryLight,
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.sm,
    alignSelf: 'flex-start',
    marginBottom: HEVY_SPACING.md,
  },
  recommendedText: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.primary,
    fontSize: 10,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routineInfo: {
    flex: 1,
  },
  routineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: HEVY_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: HEVY_SPACING.sm,
  },
  routineName: {
    ...HEVY_TYPOGRAPHY.title,
    color: HEVY_COLORS.textPrimary,
    flex: 1,
  },
  routineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: HEVY_SPACING.sm,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: 2,
    borderRadius: HEVY_RADIUS.sm,
  },
  typeBadgeText: {
    ...HEVY_TYPOGRAPHY.label,
    fontSize: 10,
    fontWeight: '600',
  },
  routineMetaText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginLeft: HEVY_SPACING.xs,
  },
  routineDescription: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.md,
    lineHeight: 18,
  },
  paceNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: HEVY_SPACING.sm,
    paddingVertical: HEVY_SPACING.sm,
    paddingHorizontal: HEVY_SPACING.md,
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.sm,
  },
  paceNoteText: {
    ...HEVY_TYPOGRAPHY.small,
    marginLeft: HEVY_SPACING.sm,
    fontWeight: '500',
  },
  exercisePreview: {
    marginTop: HEVY_SPACING.lg,
    paddingTop: HEVY_SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.sm,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HEVY_COLORS.primary,
    marginRight: HEVY_SPACING.md,
  },
  exerciseDotTimed: {
    backgroundColor: HEVY_COLORS.warmup,
  },
  exerciseName: {
    ...HEVY_TYPOGRAPHY.subtitle,
    color: HEVY_COLORS.textPrimary,
    flex: 1,
  },
  exerciseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseSets: {
    ...HEVY_TYPOGRAPHY.setNumber,
    color: HEVY_COLORS.primary,
  },
  exerciseReps: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginLeft: HEVY_SPACING.xs,
  },
  moreExercises: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.xs,
  },
  weightNote: {
    backgroundColor: HEVY_COLORS.background,
    paddingHorizontal: HEVY_SPACING.md,
    paddingVertical: HEVY_SPACING.sm,
    borderRadius: HEVY_RADIUS.sm,
    marginTop: HEVY_SPACING.md,
  },
  weightNoteText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
  startButton: {
    backgroundColor: HEVY_COLORS.primary,
    borderRadius: HEVY_RADIUS.md,
    paddingVertical: HEVY_SPACING.md,
    alignItems: 'center',
    marginTop: HEVY_SPACING.lg,
  },
  startButtonRecommended: {
    backgroundColor: HEVY_COLORS.primary,
  },
  startButtonText: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.white,
  },
});

