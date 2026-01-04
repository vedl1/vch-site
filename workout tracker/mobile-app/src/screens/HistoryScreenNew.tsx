import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Clock, 
  Dumbbell, 
  Trophy, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Calendar,
} from 'lucide-react-native';
import { GlobalDateScroller } from '../components/GlobalDateScroller';
import { useDate } from '../context/DateContext';
import { MuscleHeatmap } from '../components/cards/WorkoutCard/MuscleHeatmap';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from '../components/cards/WorkoutCard/constants';
import { api, WorkoutLog } from '../services/api';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function HistoryScreenNew() {
  const { selectedDate, formattedDate } = useDate();
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  // Fetch workout history
  const fetchWorkouts = useCallback(async () => {
    try {
      const result = await api.getWorkoutHistory({ limit: 50 });
      if (result) {
        setWorkouts(result.workouts);
      }
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkouts();
  }, [fetchWorkouts]);

  // Toggle workout expansion
  const toggleWorkoutExpanded = (workoutId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  // Format date
  const formatWorkoutDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format time
  const formatWorkoutTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true 
    });
  };

  // Render individual workout card
  const renderWorkoutCard = (workout: WorkoutLog) => {
    const isExpanded = expandedWorkouts.has(workout.id);
    const exerciseLogs = workout.exercise_logs || [];
    
    // Count PRs in this workout
    const prCount = exerciseLogs.reduce((acc, ex) => 
      acc + (ex.set_logs?.filter(s => s.is_pr).length || 0), 0
    );

    return (
      <TouchableOpacity
        key={workout.id}
        style={styles.workoutCard}
        onPress={() => toggleWorkoutExpanded(workout.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.titleRow}>
              <Text style={styles.workoutName}>{workout.routine_name}</Text>
              {workout.strava_activity_id && (
                <View style={styles.stravaBadge}>
                  <Text style={styles.stravaText}>STRAVA</Text>
                  <ExternalLink size={10} color={HEVY_COLORS.strava} />
                </View>
              )}
            </View>
            <Text style={styles.workoutDate}>
              {formatWorkoutDate(workout.completed_at)} • {formatWorkoutTime(workout.completed_at)}
            </Text>
          </View>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Dumbbell size={16} color={HEVY_COLORS.primary} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>
                {workout.total_volume >= 1000 
                  ? `${(workout.total_volume / 1000).toFixed(1)}k` 
                  : workout.total_volume.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>KG</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Clock size={16} color={HEVY_COLORS.primary} />
            <View style={styles.statContent}>
              <Text style={styles.statValue}>{formatDuration(workout.duration_seconds)}</Text>
              <Text style={styles.statLabel}>TIME</Text>
            </View>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Trophy size={16} color={prCount > 0 ? HEVY_COLORS.warmup : HEVY_COLORS.textTertiary} />
            <View style={styles.statContent}>
              <Text style={[
                styles.statValue,
                prCount > 0 && { color: HEVY_COLORS.warmup }
              ]}>
                {prCount}
              </Text>
              <Text style={styles.statLabel}>PRs</Text>
            </View>
          </View>
        </View>

        {/* Exercise List (Compact) */}
        {!isExpanded && (
          <View style={styles.exerciseListCompact}>
            {exerciseLogs.slice(0, 3).map((exercise, index) => (
              <View key={exercise.id || index} style={styles.exerciseCompactRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseCompactName} numberOfLines={1}>
                  {exercise.exercise_name}
                </Text>
                <Text style={styles.exerciseCompactSets}>
                  {exercise.set_logs?.length || 0} sets
                </Text>
              </View>
            ))}
            {exerciseLogs.length > 3 && (
              <Text style={styles.moreExercises}>
                +{exerciseLogs.length - 3} more exercises
              </Text>
            )}
          </View>
        )}

        {/* Expanded Exercise Details */}
        {isExpanded && (
          <View style={styles.exerciseListExpanded}>
            {exerciseLogs.map((exercise, exerciseIndex) => (
              <View key={exercise.id || exerciseIndex} style={styles.exerciseBlock}>
                <Text style={styles.exerciseExpandedName}>{exercise.exercise_name}</Text>
                
                {/* Set Header */}
                <View style={styles.setHeader}>
                  <Text style={styles.setHeaderText}>SET</Text>
                  <Text style={styles.setHeaderText}>KG</Text>
                  <Text style={styles.setHeaderText}>REPS</Text>
                </View>
                
                {/* Sets */}
                {exercise.set_logs?.map((set, setIndex) => (
                  <View key={set.id || setIndex} style={styles.setRow}>
                    <Text style={[
                      styles.setNumber,
                      set.set_type === 'warmup' && { color: HEVY_COLORS.warmup }
                    ]}>
                      {set.set_type === 'warmup' ? 'W' : set.set_number}
                    </Text>
                    <Text style={styles.setValue}>{set.weight || '-'}</Text>
                    <View style={styles.repsCell}>
                      <Text style={styles.setValue}>{set.reps || '-'}</Text>
                      {set.is_pr && (
                        <Trophy size={12} color={HEVY_COLORS.warmup} style={{ marginLeft: 4 }} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Expand Indicator */}
        <View style={styles.expandIndicator}>
          {isExpanded ? (
            <ChevronUp size={20} color={HEVY_COLORS.textTertiary} />
          ) : (
            <ChevronDown size={20} color={HEVY_COLORS.textTertiary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={HEVY_COLORS.cardBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your workout journey</Text>
      </View>

      {/* Global Date Scroller */}
      <GlobalDateScroller />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={HEVY_COLORS.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={HEVY_COLORS.primary} />
            <Text style={styles.loadingText}>Loading workouts...</Text>
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={HEVY_COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No workouts yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete a workout to see your history here
            </Text>
          </View>
        ) : (
          workouts.map(renderWorkoutCard)
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
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
  workoutCard: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    marginBottom: HEVY_SPACING.md,
    ...HEVY_SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutName: {
    ...HEVY_TYPOGRAPHY.title,
    color: HEVY_COLORS.textPrimary,
  },
  stravaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${HEVY_COLORS.strava}15`,
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.pill,
    marginLeft: HEVY_SPACING.sm,
  },
  stravaText: {
    fontSize: 10,
    fontWeight: '600',
    color: HEVY_COLORS.strava,
    marginRight: 2,
  },
  workoutDate: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.xs,
  },
  statsBar: {
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
  exerciseListCompact: {
    marginTop: HEVY_SPACING.lg,
    paddingTop: HEVY_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  exerciseCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xs,
  },
  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: HEVY_COLORS.primary,
    marginRight: HEVY_SPACING.sm,
  },
  exerciseCompactName: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textPrimary,
    flex: 1,
  },
  exerciseCompactSets: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
  moreExercises: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    marginTop: HEVY_SPACING.xs,
  },
  exerciseListExpanded: {
    marginTop: HEVY_SPACING.lg,
    paddingTop: HEVY_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  exerciseBlock: {
    marginBottom: HEVY_SPACING.lg,
  },
  exerciseExpandedName: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
    marginBottom: HEVY_SPACING.sm,
  },
  setHeader: {
    flexDirection: 'row',
    paddingVertical: HEVY_SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: HEVY_COLORS.border,
  },
  setHeaderText: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.textTertiary,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: HEVY_SPACING.sm,
  },
  setNumber: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  setValue: {
    ...HEVY_TYPOGRAPHY.setNumber,
    color: HEVY_COLORS.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: HEVY_SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xxl * 2,
  },
  emptyTitle: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.lg,
  },
  emptySubtitle: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    marginTop: HEVY_SPACING.xs,
    textAlign: 'center',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xxl * 2,
  },
  loadingText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.md,
  },
  repsCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

