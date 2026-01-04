import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { WorkoutHistoryCard } from '../components/WorkoutHistoryCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface WorkoutHistory {
  id: string;
  week: number;
  day: string;
  date: string;
  primaryType: string;
  secondaryType?: string | null;
  duration: string;
  exercisesCompleted: number;
  exercisesTotal: number;
  effortRating?: number | null;
  whoopRecovery?: number | null;
  isComplete: boolean;
}

// Generate workout schedule - stats will be populated from API when available
const generateWeekSchedule = (weekNum: number): WorkoutHistory[] => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const workoutTypes = [
    { primary: 'Zone 2 Run', secondary: null },
    { primary: 'Upper Body', secondary: 'Core' },
    { primary: 'Hyrox Simulation', secondary: null },
    { primary: 'Lower Body', secondary: 'Mobility' },
    { primary: 'Interval Run', secondary: null },
    { primary: 'Full Body', secondary: 'Cardio' },
    { primary: 'Rest', secondary: 'Active Recovery' },
  ];

  // Calculate the Monday of the current week
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayOfCurrentWeek = new Date(now);
  mondayOfCurrentWeek.setDate(now.getDate() - daysFromMonday);
  
  // Offset by week number (week 1 = current week)
  const weekOffset = (weekNum - 1) * 7;

  return days.map((day, index) => {
    const dayDate = new Date(mondayOfCurrentWeek);
    dayDate.setDate(mondayOfCurrentWeek.getDate() + weekOffset + index);
    
    const formattedDate = dayDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });

    return {
      id: `${weekNum}-${day}`,
      week: weekNum,
      day,
      date: formattedDate,
      primaryType: workoutTypes[index].primary,
      secondaryType: workoutTypes[index].secondary,
      duration: ['45', '60', '90', '50', '40', '75', '30'][index],
      // Stats left empty - will be populated from real data
      exercisesCompleted: 0,
      exercisesTotal: 0,
      effortRating: null,
      whoopRecovery: null,
      isComplete: false,
    };
  });
};

export function HistoryScreen() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  
  const totalWeeks = 12;
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);
  
  const handleWeekChange = useCallback((direction: 'prev' | 'next') => {
    setSelectedWeek(prev => {
      if (direction === 'prev' && prev > 1) return prev - 1;
      if (direction === 'next' && prev < totalWeeks) return prev + 1;
      return prev;
    });
  }, []);

  const handlePageChange = useCallback((event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setSelectedWeek(pageIndex + 1);
  }, []);

  const goToWeek = useCallback((week: number) => {
    setSelectedWeek(week);
    flatListRef.current?.scrollToIndex({ index: week - 1, animated: true });
  }, []);

  const renderWeekPage = useCallback(({ item: weekNum }: { item: number }) => {
    const workouts = generateWeekSchedule(weekNum);
    
    return (
      <View style={{ width: SCREEN_WIDTH }}>
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutHistoryCard
              week={item.week}
              day={item.day}
              date={item.date}
              primaryType={item.primaryType}
              secondaryType={item.secondaryType}
              duration={item.duration}
              exercisesCompleted={item.exercisesCompleted}
              exercisesTotal={item.exercisesTotal}
              effortRating={item.effortRating}
              whoopRecovery={item.whoopRecovery}
              isComplete={item.isComplete}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-dark-950" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-4">
        <Text className="text-white text-2xl font-bold">History</Text>
        <Text className="text-dark-400 text-sm mt-1">Your workout journey</Text>
      </View>

      {/* Week Navigation */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <TouchableOpacity
          onPress={() => handleWeekChange('prev')}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            selectedWeek === 1 ? 'bg-dark-800/50' : 'bg-dark-800'
          }`}
          disabled={selectedWeek === 1}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={selectedWeek === 1 ? '#475569' : '#94a3b8'} />
        </TouchableOpacity>

        <TouchableOpacity 
          className="flex-row items-center bg-dark-800 px-4 py-2 rounded-xl"
          activeOpacity={0.7}
        >
          <Calendar size={16} color="#22c55e" />
          <Text className="text-white font-semibold ml-2">Week {selectedWeek}</Text>
          <Text className="text-dark-400 text-sm ml-1">of {totalWeeks}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleWeekChange('next')}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            selectedWeek === totalWeeks ? 'bg-dark-800/50' : 'bg-dark-800'
          }`}
          disabled={selectedWeek === totalWeeks}
          activeOpacity={0.7}
        >
          <ChevronRight size={20} color={selectedWeek === totalWeeks ? '#475569' : '#94a3b8'} />
        </TouchableOpacity>
      </View>

      {/* Week Dots */}
      <View className="flex-row justify-center mb-4 px-5">
        {weeks.map((week) => (
          <TouchableOpacity
            key={week}
            onPress={() => goToWeek(week)}
            className={`w-2 h-2 rounded-full mx-1 ${
              week === selectedWeek ? 'bg-green-500' : 'bg-dark-700'
            }`}
          />
        ))}
      </View>

      {/* Horizontal Paging Content */}
      <FlatList
        ref={flatListRef}
        data={weeks}
        keyExtractor={(item) => item.toString()}
        renderItem={renderWeekPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePageChange}
        initialScrollIndex={selectedWeek - 1}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-dark-950/80">
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      )}
    </SafeAreaView>
  );
}

