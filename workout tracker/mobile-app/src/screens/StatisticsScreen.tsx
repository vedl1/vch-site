import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  TrendingUp, 
  Flame, 
  Target, 
  Calendar,
  Activity,
  Dumbbell,
  Clock,
  Award,
} from 'lucide-react-native';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: string;
}

function StatCard({ icon, label, value, subValue, color }: StatCardProps) {
  return (
    <View className="bg-dark-800 rounded-2xl p-4 flex-1 min-w-[45%] m-1.5">
      <View 
        className="w-10 h-10 rounded-xl items-center justify-center mb-3"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </View>
      <Text className="text-dark-400 text-xs mb-1">{label}</Text>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      {subValue && (
        <Text className="text-dark-500 text-xs mt-0.5">{subValue}</Text>
      )}
    </View>
  );
}

export function StatisticsScreen() {
  // Mock statistics - replace with real API data
  const stats = {
    totalWorkouts: 24,
    currentStreak: 5,
    totalMinutes: 1840,
    avgEffort: 7.2,
    completionRate: 86,
    avgRecovery: 62,
    bestStreak: 12,
    totalExercises: 142,
  };

  return (
    <SafeAreaView className="flex-1 bg-dark-950" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 pt-4 pb-6">
          <Text className="text-white text-2xl font-bold">Statistics</Text>
          <Text className="text-dark-400 text-sm mt-1">Your performance insights</Text>
        </View>

        {/* Streak Banner */}
        <View className="mx-5 mb-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-5 border border-orange-500/30">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-dark-300 text-sm">Current Streak</Text>
              <View className="flex-row items-baseline mt-1">
                <Text className="text-white text-4xl font-bold">{stats.currentStreak}</Text>
                <Text className="text-dark-400 text-lg ml-1">days</Text>
              </View>
              <Text className="text-dark-500 text-xs mt-1">Best: {stats.bestStreak} days</Text>
            </View>
            <View className="w-16 h-16 rounded-full bg-orange-500/20 items-center justify-center">
              <Flame size={32} color="#f97316" />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-3.5">
          <View className="flex-row flex-wrap">
            <StatCard
              icon={<Dumbbell size={20} color="#22c55e" />}
              label="Total Workouts"
              value={stats.totalWorkouts.toString()}
              subValue="This program"
              color="#22c55e"
            />
            <StatCard
              icon={<Clock size={20} color="#3b82f6" />}
              label="Total Time"
              value={`${Math.floor(stats.totalMinutes / 60)}h`}
              subValue={`${stats.totalMinutes % 60} min`}
              color="#3b82f6"
            />
            <StatCard
              icon={<Target size={20} color="#a855f7" />}
              label="Completion"
              value={`${stats.completionRate}%`}
              subValue="Workout completion"
              color="#a855f7"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#eab308" />}
              label="Avg Effort"
              value={stats.avgEffort.toFixed(1)}
              subValue="Out of 10"
              color="#eab308"
            />
            <StatCard
              icon={<Activity size={20} color="#00bcd4" />}
              label="Avg Recovery"
              value={`${stats.avgRecovery}%`}
              subValue="Whoop recovery"
              color="#00bcd4"
            />
            <StatCard
              icon={<Award size={20} color="#f97316" />}
              label="Exercises"
              value={stats.totalExercises.toString()}
              subValue="Completed"
              color="#f97316"
            />
          </View>
        </View>

        {/* Weekly Progress Chart Placeholder */}
        <View className="mx-5 mt-4 mb-6 bg-dark-800 rounded-2xl p-5 border border-dark-700">
          <View className="flex-row items-center mb-4">
            <Calendar size={18} color="#22c55e" />
            <Text className="text-white font-semibold text-lg ml-2">Weekly Progress</Text>
          </View>
          
          {/* Simple bar chart */}
          <View className="flex-row items-end justify-between h-24">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const height = [60, 80, 45, 100, 70, 90, 30][index];
              const isToday = index === 4; // Friday
              return (
                <View key={index} className="items-center flex-1">
                  <View
                    className={`w-6 rounded-t-md ${isToday ? 'bg-green-500' : 'bg-dark-600'}`}
                    style={{ height: `${height}%` }}
                  />
                  <Text className={`text-xs mt-2 ${isToday ? 'text-green-500' : 'text-dark-500'}`}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

