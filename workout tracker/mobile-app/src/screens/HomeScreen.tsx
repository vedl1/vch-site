import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  StyleSheet,
  Modal,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlobalDateScroller } from '../components/GlobalDateScroller';
import { useDate } from '../context/DateContext';
import { WorkoutCard, ExerciseData } from '../components/cards/WorkoutCard';
import { StravaActivityCard } from '../components/cards/StravaActivityCard';
import { WeeklyProgressCard } from '../components/cards/WeeklyProgressCard';
import { QuickLogCard } from '../components/cards/QuickLogCard';
import { WhoopStatsCard } from '../components/cards/WhoopStatsCard';
import { RoutineWorkoutScreen } from './RoutineWorkoutScreen';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';
import { COLORS, SPACING } from '../constants/theme';
import { api } from '../services/api';
import { DayData } from '../types';
import { 
  ROUTINES, 
  getRoutinesForDay, 
  isRestDay,
  RoutineTemplate, 
  formatSetsDisplay, 
  formatRepsDisplay,
  WorkoutType,
  getWorkoutTypeColor,
} from '../data/routines';

export function HomeScreen() {
  const { selectedDate, formattedDate, isToday } = useDate();
  const [refreshing, setRefreshing] = useState(false);
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineTemplate | null>(null);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [stravaActivity, setStravaActivity] = useState<{
    name: string;
    distance: number;
    duration: number;
    pace?: number;
    id?: string;
  } | null>(null);

  // Get day name and routines for selected date
  const dayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[selectedDate.getDay()];
  }, [selectedDate]);

  const routinesForDay = useMemo(() => {
    return getRoutinesForDay(dayName);
  }, [dayName]);

  // Get primary routine (first non-rest routine with exercises)
  const primaryRoutine = useMemo(() => {
    return routinesForDay.find(r => r.workoutType === 'strength' && r.exercises?.length);
  }, [routinesForDay]);

  const isDayRest = useMemo(() => isRestDay(dayName), [dayName]);

  const fetchData = useCallback(async () => {
    try {
      // Get day name from selected date
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = dayNames[selectedDate.getDay()];
      
      // Fetch day data from API
      const data = await api.getDayData(1, dayName);
      setDayData(data);
      
      // Fetch latest Strava activity
      const activity = await api.getLatestStravaActivity();
      if (activity) {
        setStravaActivity({
          name: activity.name,
          distance: activity.distance,
          duration: 1800, // Default duration
          id: activity.id,
        });
      }
    } catch (err) {
      console.log('Error fetching data:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Calculate weekly progress
  const currentDay = new Date();
  const dayOfWeek = currentDay.getDay();
  const workoutsCompleted = dayOfWeek === 0 ? 0 : Math.min(dayOfWeek, 5); // Assuming M-F workouts

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format selected date for display
  const formatSelectedDate = () => {
    if (isToday) return "Today's Workout";
    return formattedDate;
  };

  // Build exercises from routine data for WorkoutCard preview
  const workoutExercises: ExerciseData[] = useMemo(() => {
    if (!primaryRoutine || !primaryRoutine.exercises) return [];
    return primaryRoutine.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroups: exercise.muscleGroups,
      sets: Array.from({ length: exercise.defaultSets }, (_, i) => ({
        id: `${exercise.id}-${i + 1}`,
        setNumber: i + 1,
        type: (exercise.hasWarmupSet && i === 0 ? 'warmup' : 'working') as const,
        weight: exercise.defaultWeight?.toString() || '',
        reps: '',
        previousWeight: exercise.defaultWeight,
        previousReps: parseInt(exercise.defaultReps.split('-')[0]) || undefined,
        isCompleted: false,
      })),
    }));
  }, [primaryRoutine]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cardBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.dateTitle}>{formatSelectedDate()}</Text>
      </View>

      {/* Global Date Scroller */}
      <GlobalDateScroller />

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Today's Workouts Summary */}
        {isDayRest ? (
          <View style={styles.restDayCard}>
            <Text style={styles.restDayEmoji}>🌙</Text>
            <Text style={styles.restDayTitle}>Rest Day</Text>
            <Text style={styles.restDaySubtitle}>
              Optional light walking and mobility
            </Text>
          </View>
        ) : (
          <>
            {/* Show all workouts for the day */}
            {routinesForDay.map((routine) => {
              const typeColor = getWorkoutTypeColor(routine.workoutType);
              const hasExercises = routine.exercises && routine.exercises.length > 0;
              
              // Build exercises for this specific routine
              const routineExercises: ExerciseData[] = hasExercises 
                ? routine.exercises!.map((exercise) => ({
                    id: exercise.id,
                    name: exercise.name,
                    muscleGroups: exercise.muscleGroups,
                    sets: Array.from({ length: exercise.defaultSets }, (_, i) => ({
                      id: `${exercise.id}-${i + 1}`,
                      setNumber: i + 1,
                      type: (exercise.hasWarmupSet && i === 0 ? 'warmup' : 'working') as const,
                      weight: exercise.defaultWeight?.toString() || '',
                      reps: '',
                      previousWeight: exercise.defaultWeight,
                      previousReps: parseInt(exercise.defaultReps.split('-')[0]) || undefined,
                      isCompleted: false,
                    })),
                  }))
                : [];
              
              return (
                <View key={routine.id} style={styles.cardContainer}>
                  {/* Workout Type Badge */}
                  <View style={[styles.workoutTypeBadge, { backgroundColor: typeColor }]}>
                    <Text style={styles.workoutTypeBadgeText}>
                      {routine.workoutType.toUpperCase()}
                      {routine.secondaryType && ` + ${routine.secondaryType.toUpperCase()}`}
                    </Text>
                  </View>
                  
                  {hasExercises ? (
                    <WorkoutCard
                      mode="preview"
                      title={routine.name}
                      duration={routine.estimatedDuration}
                      exercises={routineExercises}
                      muscleHeatmap={{
                        front: routine.muscleGroups || [],
                        back: [],
                      }}
                      onStartWorkout={() => {
                        setSelectedRoutine(routine);
                        setShowActiveWorkout(true);
                      }}
                    />
                  ) : (
                    <View style={styles.runCard}>
                      <Text style={styles.runCardTitle}>{routine.name}</Text>
                      {routine.description && (
                        <Text style={styles.runCardDescription}>{routine.description}</Text>
                      )}
                      {routine.paceNotes && (
                        <View style={[styles.paceNote, { backgroundColor: `${typeColor}15` }]}>
                          <Text style={[styles.paceNoteText, { color: typeColor }]}>
                            {routine.paceNotes}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.runCardDuration}>
                        ⏱️ {routine.estimatedDuration}
                      </Text>
                      <TouchableOpacity
                        style={[styles.startRunButton, { backgroundColor: typeColor }]}
                        onPress={() => {
                          setSelectedRoutine(routine);
                          setShowActiveWorkout(true);
                        }}
                      >
                        <Text style={styles.startRunButtonText}>
                          {routine.workoutType === 'run' ? 'Start Run' : 'Start Workout'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Weekly Progress Card */}
        <WeeklyProgressCard
          workoutsCompleted={workoutsCompleted}
          totalWorkouts={6}
          currentStreak={workoutsCompleted > 0 ? workoutsCompleted : undefined}
        />

        {/* Strava Activity Card */}
        {stravaActivity && (
          <StravaActivityCard
            activityName={stravaActivity.name}
            activityType="Run"
            distance={stravaActivity.distance}
            duration={stravaActivity.duration}
            pace={stravaActivity.distance > 0 ? (stravaActivity.duration / (stravaActivity.distance / 1000)) : undefined}
            activityId={stravaActivity.id}
          />
        )}

        {/* Quick Log Card */}
        <QuickLogCard
          lastExercise={primaryRoutine?.exercises?.[0] ? {
            name: primaryRoutine.exercises[0].name,
            previousWeight: primaryRoutine.exercises[0].defaultWeight,
            previousReps: parseInt(primaryRoutine.exercises[0].defaultReps.split('-')[0]) || 8,
          } : undefined}
          onLogSet={(weight, reps, tag) => {
            console.log('Logged:', { weight, reps, tag });
          }}
        />

        {/* Whoop Stats Card */}
        <WhoopStatsCard />

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
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  cardContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  // Rest Day Card
  restDayCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  restDayEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  restDayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  restDaySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  // Workout Type Badge
  workoutTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  workoutTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Run Card
  runCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  runCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  runCardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  paceNote: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  paceNoteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  runCardDuration: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  startRunButton: {
    paddingVertical: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  startRunButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

