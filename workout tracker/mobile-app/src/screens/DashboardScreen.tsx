import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  RefreshControl, 
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Play } from 'lucide-react-native';
import { DayData } from '../types';
import { api } from '../services/api';
import { getCurrentWeekAndDay, formatDate, getGreeting, getWeekDays } from '../utils/date';
import { WorkoutCard } from '../components/WorkoutCard';
import { ChecklistCard } from '../components/ChecklistCard';
import { WhoopCard } from '../components/WhoopCard';
import { ProgressRing } from '../components/ProgressRing';
import { MetricsBar } from '../components/MetricsBar';
import { EffortRatingModal } from '../components/EffortRatingModal';
import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { WeeklyCalendar } from '../components/WeeklyCalendar';
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';

export function DashboardScreen() {
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Strava activity state
  const [stravaActivity, setStravaActivity] = useState<{
    name: string;
    distance: number;
  } | null>(null);
  
  // Modal states
  const [showEffortModal, setShowEffortModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEffortRating, setLastEffortRating] = useState<number | undefined>();
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  
  // Current week/day selection
  const { week: currentWeek, day: currentDay } = getCurrentWeekAndDay();
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [selectedDay, setSelectedDay] = useState(currentDay);
  
  // Track completed days (mock - would come from API in real app)
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  
  // Generate week days for calendar
  const weekDays = useMemo(() => {
    const days = getWeekDays(selectedWeek);
    return days.map(d => ({
      ...d,
      isSelected: d.day === selectedDay,
      isComplete: completedDays.has(`${selectedWeek}-${d.day}`),
      hasWorkout: true, // In real app, check if day has workout in plan
    }));
  }, [selectedWeek, selectedDay, completedDays]);
  
  const handleDayPress = useCallback((day: string) => {
    setSelectedDay(day);
  }, []);

  const fetchDayData = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getDayData(selectedWeek, selectedDay);
      setDayData(data);
    } catch (err: any) {
      console.error('Error fetching day data:', err);
      setError(err.message || 'Failed to load workout data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedWeek, selectedDay]);

  const fetchStravaActivity = useCallback(async () => {
    try {
      const activity = await api.getLatestStravaActivity();
      if (activity) {
        setStravaActivity({
          name: activity.name,
          distance: activity.distance,
        });
      }
    } catch (err) {
      console.log('Could not fetch Strava activity:', err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDayData();
    fetchStravaActivity();
  }, [fetchDayData, fetchStravaActivity]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDayData();
    fetchStravaActivity();
  }, [fetchDayData, fetchStravaActivity]);

  const handleToggleChecklist = async (id: string) => {
    if (!dayData) return;
    
    // Optimistic update
    setDayData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        checklist: prev.checklist.map(item =>
          item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
        ),
      };
    });

    try {
      await api.toggleChecklistItem(id);
    } catch (err) {
      // Revert on error
      fetchDayData();
    }
  };

  const handleCompleteDay = () => {
    setShowEffortModal(true);
  };

  const handleSubmitEffort = async (rating: number) => {
    setShowEffortModal(false);
    setLastEffortRating(rating);
    
    if (dayData?.plan?.id) {
      try {
        await api.completeDay(dayData.plan.id, rating);
        // Mark day as complete
        setCompletedDays(prev => new Set([...prev, `${selectedWeek}-${selectedDay}`]));
        // Show celebration animation
        setShowCelebration(true);
        // Refresh data after completion
        setTimeout(() => {
          fetchDayData();
        }, 500);
      } catch (err) {
        console.error('Failed to complete day:', err);
      }
    } else {
      // Still show celebration even if no plan
      setCompletedDays(prev => new Set([...prev, `${selectedWeek}-${selectedDay}`]));
      setShowCelebration(true);
    }
  };

  const handleCloseCelebration = () => {
    setShowCelebration(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-dark-400 mt-4">Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-dark-950">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-400 text-center text-lg mb-2">Oops!</Text>
          <Text className="text-dark-400 text-center">{error}</Text>
          <Text className="text-dark-500 text-center mt-4 text-sm">
            Make sure the backend is running on localhost:3000
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = dayData?.summary?.checklistProgress?.percentage || 0;
  const allExercisesComplete = dayData?.checklist?.length 
    ? dayData.checklist.every(item => item.isCompleted) 
    : false;
  const isDayAlreadyComplete = dayData?.summary?.isDayComplete || false;
  const canCompleteDay = allExercisesComplete && !isDayAlreadyComplete;

  return (
    <SafeAreaView className="flex-1 bg-dark-950">
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22c55e"
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-dark-400 text-base">{getGreeting()}</Text>
          <Text className="text-white text-2xl font-bold mt-1">
            {formatDate()}
          </Text>
        </View>

        {/* Weekly Calendar Strip */}
        <WeeklyCalendar
          weekNumber={selectedWeek}
          days={weekDays}
          onDayPress={handleDayPress}
        />
        
        {/* Current Day Summary */}
        <View className="flex-row items-center mx-5 mb-4 bg-dark-800 rounded-xl p-3">
          <View className="flex-1">
            <Text className="text-white font-semibold">
              {selectedDay}
            </Text>
            <Text className="text-dark-400 text-sm">
              {dayData?.summary?.workoutType || 'Rest Day'}
            </Text>
          </View>
          <ProgressRing progress={progress} size={50} strokeWidth={5}>
            <Text className="text-white text-xs font-bold">{Math.round(progress)}%</Text>
          </ProgressRing>
        </View>

        {/* Top Metrics Bar - Whoop Recovery & Strava Distance */}
        <MetricsBar
          whoopRecovery={dayData?.whoop?.recoveryScore || null}
          stravaDistance={stravaActivity?.distance || null}
          stravaActivityName={stravaActivity?.name || null}
        />

        {/* Content */}
        <View className="px-5">
          {/* Start Workout Button */}
          {dayData?.plan && !isDayAlreadyComplete && (
            <TouchableOpacity
              className="bg-green-500 rounded-2xl py-4 mb-4 flex-row items-center justify-center"
              onPress={() => setShowActiveWorkout(true)}
              activeOpacity={0.8}
            >
              <Play size={22} color="#ffffff" fill="#ffffff" />
              <Text className="text-white text-lg font-bold ml-2">
                Start Workout
              </Text>
            </TouchableOpacity>
          )}

          {/* Workout Details */}
          <View className="mb-4">
            <WorkoutCard plan={dayData?.plan || null} />
          </View>
          
          {/* Exercise Checklist */}
          <View className="mb-4">
            <ChecklistCard 
              items={dayData?.checklist || []} 
              onToggle={handleToggleChecklist}
            />
          </View>

          {/* Whoop Recovery Details */}
          <View className="mb-4">
            <WhoopCard data={dayData?.whoop || null} />
          </View>

          {/* Day Status */}
          {isDayAlreadyComplete && (
            <View className="bg-green-500/20 rounded-2xl p-4 border border-green-500/30 mb-4">
              <Text className="text-green-400 text-center font-semibold text-lg">
                🎉 Day Complete!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Complete Day Button - Fixed at bottom */}
      {canCompleteDay && (
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-dark-950">
          <TouchableOpacity
            className="bg-green-500 rounded-2xl py-4 flex-row items-center justify-center"
            onPress={handleCompleteDay}
            activeOpacity={0.8}
          >
            <Star size={22} color="#ffffff" fill="#ffffff" />
            <Text className="text-white text-lg font-bold ml-2">
              Complete Day
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Effort Rating Modal */}
      <EffortRatingModal
        visible={showEffortModal}
        onClose={() => setShowEffortModal(false)}
        onSubmit={handleSubmitEffort}
      />

      {/* Celebration Overlay */}
      <CelebrationOverlay
        visible={showCelebration}
        onClose={handleCloseCelebration}
        effortRating={lastEffortRating}
      />

      {/* Active Workout Modal */}
      <Modal
        visible={showActiveWorkout}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ActiveWorkoutScreen onClose={() => setShowActiveWorkout(false)} />
      </Modal>
    </SafeAreaView>
  );
}
