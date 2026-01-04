import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, Text, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Check, X, Clock, MoreVertical, Pause, Play, ChevronDown, ChevronUp, Activity } from 'lucide-react-native';
import { RoutineTemplate, generateSetsFromTemplate, ExerciseTemplate, RunSegment, getWorkoutTypeColor } from '../data/routines';
import { RestTimerModal } from '../components/RestTimerModal';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from '../components/cards/WorkoutCard/constants';
import { SetType } from '../components/cards/WorkoutCard/types';
import { api, WorkoutLogInput, ExerciseLog, SetLog } from '../services/api';

interface SetData {
  id: string;
  setNumber: number;
  type: SetType;
  weight: string;
  reps: string;
  previousWeight?: number;
  previousReps?: number;
  isCompleted: boolean;
  isTimedSet?: boolean;
}

interface ExerciseState {
  id: string;
  name: string;
  template: ExerciseTemplate;
  sets: SetData[];
  isExpanded: boolean;
}

interface RoutineWorkoutScreenProps {
  routine: RoutineTemplate;
  onClose: () => void;
}

const SET_TYPE_CONFIG: Record<SetType, { label: string; color: string; bgColor: string }> = {
  warmup: { label: 'W', color: HEVY_COLORS.warmup, bgColor: '#FFF8E8' },
  working: { label: '', color: HEVY_COLORS.textPrimary, bgColor: HEVY_COLORS.background },
  failure: { label: 'F', color: HEVY_COLORS.failure, bgColor: '#FFEBEA' },
  drop: { label: 'D', color: '#5856D6', bgColor: '#EEEEFF' },
};

const TYPE_CYCLE: SetType[] = ['working', 'warmup', 'failure', 'drop'];

interface RunSegmentState extends RunSegment {
  isCompleted: boolean;
}

export function RoutineWorkoutScreen({ routine, onClose }: RoutineWorkoutScreenProps) {
  const isRunWorkout = routine.workoutType === 'run' || routine.workoutType === 'hyrox';
  const hasExercises = routine.exercises && routine.exercises.length > 0;
  const hasRunSegments = routine.runSegments && routine.runSegments.length > 0;
  const workoutColor = getWorkoutTypeColor(routine.workoutType);

  // Initialize exercises from routine template (for strength workouts)
  const [exercises, setExercises] = useState<ExerciseState[]>(() => 
    hasExercises 
      ? routine.exercises!.map(template => ({
          id: template.id,
          name: template.name,
          template,
          sets: generateSetsFromTemplate(template, template.id),
          isExpanded: true,
        }))
      : []
  );

  // Initialize run segments (for run workouts)
  const [runSegments, setRunSegments] = useState<RunSegmentState[]>(() =>
    hasRunSegments
      ? routine.runSegments!.map(segment => ({
          ...segment,
          isCompleted: false,
        }))
      : []
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // Workout timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetUpdate = (exerciseId: string, setId: string, field: string, value: any) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              const updated = { ...set, [field]: value };
              // Auto-trigger rest timer when completing a set
              if (field === 'isCompleted' && value === true) {
                setTimeout(() => setShowRestTimer(true), 300);
              }
              return updated;
            }
            return set;
          }),
        };
      }
      return ex;
    }));
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const newSetNumber = ex.sets.length + 1;
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, {
            id: `${exerciseId}-set-${newSetNumber}`,
            setNumber: newSetNumber,
            type: 'working' as SetType,
            weight: lastSet?.weight || '',
            reps: '',
            previousWeight: lastSet?.previousWeight,
            previousReps: lastSet?.previousReps,
            isCompleted: false,
            isTimedSet: ex.template.isTimedExercise,
          }],
        };
      }
      return ex;
    }));
  };

  const toggleExpanded = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, isExpanded: !ex.isExpanded } : ex
    ));
  };

  const cycleSetType = (exerciseId: string, setId: string, currentType: SetType) => {
    const currentIndex = TYPE_CYCLE.indexOf(currentType);
    const nextType = TYPE_CYCLE[(currentIndex + 1) % TYPE_CYCLE.length];
    handleSetUpdate(exerciseId, setId, 'type', nextType);
  };

  // Calculate progress
  const totalSets = hasExercises 
    ? exercises.reduce((acc, ex) => acc + ex.sets.length, 0)
    : runSegments.length;
  const completedSets = hasExercises
    ? exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.isCompleted).length, 0)
    : runSegments.filter(s => s.isCompleted).length;

  // Toggle run segment completion
  const toggleSegmentComplete = (index: number) => {
    setRunSegments(prev => prev.map((seg, i) => 
      i === index ? { ...seg, isCompleted: !seg.isCompleted } : seg
    ));
  };

  // Save workout to backend
  const handleFinishWorkout = async () => {
    // Check if any sets were completed
    const hasCompletedWork = hasExercises 
      ? exercises.some(ex => ex.sets.some(s => s.isCompleted))
      : runSegments.some(s => s.isCompleted);

    if (!hasCompletedWork) {
      Alert.alert(
        'No Progress',
        'You haven\'t completed any sets yet. Are you sure you want to discard this workout?',
        [
          { text: 'Keep Working', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
      return;
    }

    setIsSaving(true);

    try {
      // Build exercise logs from state
      const exerciseLogs: ExerciseLog[] = exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets.map(set => ({
          setNumber: set.setNumber,
          type: set.type,
          weight: set.weight,
          reps: set.reps,
          isCompleted: set.isCompleted,
        })),
      }));

      const workoutData: WorkoutLogInput = {
        routineId: routine.id,
        routineName: routine.name,
        workoutType: routine.workoutType,
        startedAt: startedAtRef.current,
        completedAt: new Date().toISOString(),
        durationSeconds: elapsedSeconds,
        exercises: exerciseLogs,
      };

      const result = await api.saveWorkout(workoutData);

      if (result.success) {
        // Calculate stats for display
        const volume = exercises.reduce((acc, ex) => 
          acc + ex.sets.reduce((setAcc, set) => {
            if (set.isCompleted && set.weight && set.reps) {
              return setAcc + (parseFloat(set.weight) * parseInt(set.reps));
            }
            return setAcc;
          }, 0), 0);

        Alert.alert(
          '🎉 Workout Complete!',
          `Great job! You completed ${completedSets} sets in ${formatElapsedTime(elapsedSeconds)}.\n\nTotal volume: ${volume.toFixed(0)} kg`,
          [{ text: 'Done', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Save Error',
          result.message || 'Failed to save workout. Would you like to try again?',
          [
            { text: 'Try Again', onPress: handleFinishWorkout },
            { text: 'Discard', style: 'destructive', onPress: onClose },
          ]
        );
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Error',
        'Something went wrong while saving your workout. Would you like to try again?',
        [
          { text: 'Try Again', onPress: handleFinishWorkout },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color={HEVY_COLORS.failure} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.title} numberOfLines={1}>{routine.name}</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setIsPaused(!isPaused)}
              style={styles.pauseButton}
            >
              {isPaused ? (
                <Play size={18} color={HEVY_COLORS.success} />
              ) : (
                <Pause size={18} color={HEVY_COLORS.warmup} />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.moreButton}>
              <MoreVertical size={20} color={HEVY_COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerBar}>
          <Clock size={16} color={HEVY_COLORS.primary} />
          <Text style={styles.timerText}>{formatElapsedTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Run Segments (for run workouts) */}
        {hasRunSegments && (
          <View style={styles.runSegmentsContainer}>
            {/* Pace Notes */}
            {routine.paceNotes && (
              <View style={[styles.paceNoteBanner, { backgroundColor: `${workoutColor}15` }]}>
                <Activity size={16} color={workoutColor} />
                <Text style={[styles.paceNoteText, { color: workoutColor }]}>
                  {routine.paceNotes}
                </Text>
              </View>
            )}

            {runSegments.map((segment, index) => {
              const segmentLabel = segment.type.charAt(0).toUpperCase() + segment.type.slice(1);
              const segmentDetail = segment.reps 
                ? `${segment.reps}× ${segment.duration}` 
                : segment.duration || segment.distance || '';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.runSegmentCard,
                    segment.isCompleted && styles.runSegmentCardCompleted,
                  ]}
                  onPress={() => toggleSegmentComplete(index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.runSegmentLeft}>
                    <View style={[
                      styles.runSegmentIcon,
                      { backgroundColor: segment.isCompleted ? HEVY_COLORS.success : `${workoutColor}20` }
                    ]}>
                      {segment.isCompleted ? (
                        <Check size={20} color="#FFF" />
                      ) : (
                        <Activity size={20} color={workoutColor} />
                      )}
                    </View>
                    <View style={styles.runSegmentInfo}>
                      <Text style={[
                        styles.runSegmentLabel,
                        segment.isCompleted && styles.runSegmentLabelCompleted,
                      ]}>
                        {segmentLabel}
                      </Text>
                      <Text style={styles.runSegmentDetail}>{segmentDetail}</Text>
                    </View>
                  </View>
                  {segment.pace && (
                    <View style={[styles.paceBadge, { backgroundColor: `${workoutColor}15` }]}>
                      <Text style={[styles.paceBadgeText, { color: workoutColor }]}>
                        {segment.pace}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Rest Note */}
            {routine.runSegments?.some(s => s.rest) && (
              <View style={styles.restNote}>
                <Text style={styles.restNoteText}>
                  💡 Rest between intervals: {routine.runSegments?.find(s => s.rest)?.rest}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Exercises (for strength workouts) */}
        {hasExercises && exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            {/* Exercise Header */}
            <TouchableOpacity
              style={styles.exerciseHeader}
              onPress={() => toggleExpanded(exercise.id)}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets.filter(s => s.isCompleted).length}/{exercise.sets.length} sets
                  {exercise.template.isTimedExercise && ' • Timed'}
                  {exercise.template.isUnilateral && ' • Per side'}
                </Text>
              </View>
              {exercise.isExpanded ? (
                <ChevronUp size={20} color={HEVY_COLORS.textTertiary} />
              ) : (
                <ChevronDown size={20} color={HEVY_COLORS.textTertiary} />
              )}
            </TouchableOpacity>

            {/* Sets */}
            {exercise.isExpanded && (
              <View style={styles.setsContainer}>
                {/* Column Headers */}
                <View style={styles.columnHeaders}>
                  <Text style={[styles.columnLabel, { width: 44 }]}>SET</Text>
                  <Text style={[styles.columnLabel, { flex: 1 }]}>PREVIOUS</Text>
                  <Text style={[styles.columnLabel, { flex: 1 }]}>
                    {exercise.template.isTimedExercise ? 'SEC' : 'KG'}
                  </Text>
                  <Text style={[styles.columnLabel, { flex: 1 }]}>
                    {exercise.template.isTimedExercise ? 'TIME' : 'REPS'}
                  </Text>
                  <Text style={[styles.columnLabel, { width: 44 }]}>✓</Text>
                </View>

                {/* Set Rows */}
                {exercise.sets.map((set) => {
                  const typeConfig = SET_TYPE_CONFIG[set.type];
                  const displayLabel = set.type === 'working' ? set.setNumber.toString() : typeConfig.label;

                  return (
                    <View
                      key={set.id}
                      style={[
                        styles.setRow,
                        set.isCompleted && styles.setRowCompleted,
                      ]}
                    >
                      {/* Set Type Button */}
                      <TouchableOpacity
                        style={[styles.setTypeButton, { backgroundColor: typeConfig.bgColor }]}
                        onPress={() => cycleSetType(exercise.id, set.id, set.type)}
                      >
                        <Text style={[
                          styles.setTypeText,
                          { color: set.type === 'working' ? HEVY_COLORS.textSecondary : typeConfig.color }
                        ]}>
                          {displayLabel}
                        </Text>
                      </TouchableOpacity>

                      {/* Previous */}
                      <View style={styles.previousCell}>
                        <Text style={styles.previousText}>
                          {set.previousWeight && set.previousReps
                            ? `${set.previousWeight} × ${set.previousReps}`
                            : '—'}
                        </Text>
                      </View>

                      {/* Weight Input */}
                      <View style={styles.inputCell}>
                        <TextInput
                          style={styles.input}
                          value={set.weight}
                          onChangeText={(v) => handleSetUpdate(exercise.id, set.id, 'weight', v)}
                          keyboardType="decimal-pad"
                          placeholder={set.previousWeight?.toString() || '—'}
                          placeholderTextColor={HEVY_COLORS.textTertiary}
                          editable={!set.isCompleted}
                          selectTextOnFocus
                        />
                      </View>

                      {/* Reps/Time Input */}
                      <View style={styles.inputCell}>
                        <TextInput
                          style={styles.input}
                          value={set.reps}
                          onChangeText={(v) => handleSetUpdate(exercise.id, set.id, 'reps', v)}
                          keyboardType="number-pad"
                          placeholder={set.previousReps?.toString() || '—'}
                          placeholderTextColor={HEVY_COLORS.textTertiary}
                          editable={!set.isCompleted}
                          selectTextOnFocus
                        />
                      </View>

                      {/* Complete Checkbox */}
                      <TouchableOpacity
                        style={[
                          styles.checkButton,
                          set.isCompleted && styles.checkButtonCompleted,
                        ]}
                        onPress={() => handleSetUpdate(exercise.id, set.id, 'isCompleted', !set.isCompleted)}
                      >
                        {set.isCompleted && <Check size={18} color="#FFF" strokeWidth={3} />}
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Add Set Button */}
                <TouchableOpacity
                  style={styles.addSetButton}
                  onPress={() => handleAddSet(exercise.id)}
                >
                  <Plus size={16} color={HEVY_COLORS.primary} />
                  <Text style={styles.addSetText}>Add Set</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressValue}>{completedSets}/{totalSets} sets</Text>
        </View>
        <TouchableOpacity 
          style={[styles.finishButton, isSaving && styles.finishButtonDisabled]}
          onPress={handleFinishWorkout}
          activeOpacity={0.8}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Check size={22} color="#FFF" />
          )}
          <Text style={styles.finishButtonText}>
            {isSaving ? 'Saving...' : 'Finish Workout'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer */}
      <RestTimerModal
        visible={showRestTimer}
        initialSeconds={restDuration}
        onClose={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />
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
    borderBottomWidth: 1,
    borderBottomColor: HEVY_COLORS.border,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HEVY_SPACING.md,
    paddingVertical: HEVY_SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: HEVY_RADIUS.md,
    backgroundColor: HEVY_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: HEVY_SPACING.md,
  },
  title: {
    ...HEVY_TYPOGRAPHY.title,
    color: HEVY_COLORS.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  pauseButton: {
    width: 40,
    height: 40,
    borderRadius: HEVY_RADIUS.md,
    backgroundColor: HEVY_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: HEVY_SPACING.xs,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: HEVY_RADIUS.md,
    backgroundColor: HEVY_COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HEVY_SPACING.sm,
    backgroundColor: HEVY_COLORS.background,
  },
  timerText: {
    ...HEVY_TYPOGRAPHY.title,
    color: HEVY_COLORS.primary,
    marginLeft: HEVY_SPACING.sm,
    fontFamily: 'monospace',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HEVY_SPACING.md,
  },
  exerciseCard: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    marginBottom: HEVY_SPACING.md,
    ...HEVY_SHADOWS.card,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: HEVY_SPACING.lg,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  exerciseMeta: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  setsContainer: {
    paddingHorizontal: HEVY_SPACING.md,
    paddingBottom: HEVY_SPACING.md,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xs,
    paddingHorizontal: HEVY_SPACING.xs,
    marginBottom: HEVY_SPACING.xs,
  },
  columnLabel: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.textTertiary,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.sm,
    paddingHorizontal: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.sm,
    marginBottom: HEVY_SPACING.xs,
  },
  setRowCompleted: {
    backgroundColor: HEVY_COLORS.background,
    opacity: 0.7,
  },
  setTypeButton: {
    width: 36,
    height: 36,
    borderRadius: HEVY_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeText: {
    ...HEVY_TYPOGRAPHY.setNumber,
  },
  previousCell: {
    flex: 1,
    alignItems: 'center',
  },
  previousText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
  },
  inputCell: {
    flex: 1,
    marginHorizontal: HEVY_SPACING.xs,
  },
  input: {
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.sm,
    paddingVertical: HEVY_SPACING.sm,
    paddingHorizontal: HEVY_SPACING.sm,
    ...HEVY_TYPOGRAPHY.inputLarge,
    color: HEVY_COLORS.textPrimary,
    textAlign: 'center',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: HEVY_RADIUS.sm,
    backgroundColor: HEVY_COLORS.background,
    borderWidth: 2,
    borderColor: HEVY_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: HEVY_COLORS.success,
    borderColor: HEVY_COLORS.success,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HEVY_SPACING.md,
    marginTop: HEVY_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  addSetText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.primary,
    fontWeight: '600',
    marginLeft: HEVY_SPACING.xs,
  },
  bottomBar: {
    backgroundColor: HEVY_COLORS.cardBg,
    padding: HEVY_SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: HEVY_SPACING.md,
  },
  progressLabel: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
  progressValue: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  finishButton: {
    backgroundColor: HEVY_COLORS.success,
    borderRadius: HEVY_RADIUS.md,
    paddingVertical: HEVY_SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonDisabled: {
    opacity: 0.7,
  },
  finishButtonText: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: '#FFF',
    marginLeft: HEVY_SPACING.sm,
  },
  // Run Segments
  runSegmentsContainer: {
    marginBottom: HEVY_SPACING.lg,
  },
  paceNoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: HEVY_SPACING.md,
    borderRadius: HEVY_RADIUS.md,
    marginBottom: HEVY_SPACING.md,
  },
  paceNoteText: {
    ...HEVY_TYPOGRAPHY.small,
    fontWeight: '600',
    marginLeft: HEVY_SPACING.sm,
    flex: 1,
  },
  runSegmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    marginBottom: HEVY_SPACING.sm,
    ...HEVY_SHADOWS.card,
  },
  runSegmentCardCompleted: {
    opacity: 0.7,
    backgroundColor: HEVY_COLORS.background,
  },
  runSegmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  runSegmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runSegmentInfo: {
    marginLeft: HEVY_SPACING.md,
    flex: 1,
  },
  runSegmentLabel: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  runSegmentLabelCompleted: {
    textDecorationLine: 'line-through',
    color: HEVY_COLORS.textSecondary,
  },
  runSegmentDetail: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  paceBadge: {
    paddingHorizontal: HEVY_SPACING.md,
    paddingVertical: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.sm,
  },
  paceBadgeText: {
    ...HEVY_TYPOGRAPHY.small,
    fontWeight: '600',
  },
  restNote: {
    backgroundColor: HEVY_COLORS.background,
    padding: HEVY_SPACING.md,
    borderRadius: HEVY_RADIUS.md,
    marginTop: HEVY_SPACING.sm,
  },
  restNoteText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
});

