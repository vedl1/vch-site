import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

interface DayStatus {
  day: string;
  dayShort: string;
  date: number;
  isToday: boolean;
  isSelected: boolean;
  isComplete: boolean;
  hasWorkout: boolean;
}

interface WeeklyCalendarProps {
  weekNumber: number;
  days: DayStatus[];
  onDayPress: (day: string) => void;
}

const DAY_SHORTS: Record<string, string> = {
  Monday: 'M',
  Tuesday: 'T',
  Wednesday: 'W',
  Thursday: 'T',
  Friday: 'F',
  Saturday: 'S',
  Sunday: 'S',
};

export function WeeklyCalendar({ weekNumber, days, onDayPress }: WeeklyCalendarProps) {
  return (
    <View className="mb-4">
      {/* Week Label */}
      <View className="flex-row items-center justify-between px-5 mb-3">
        <Text className="text-dark-400 text-sm font-medium">Week {weekNumber}</Text>
        <View className="flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
          <Text className="text-dark-500 text-xs">Completed</Text>
        </View>
      </View>
      
      {/* Days Strip */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <View className="flex-row">
          {days.map((dayInfo, index) => (
            <TouchableOpacity
              key={dayInfo.day}
              onPress={() => onDayPress(dayInfo.day)}
              className={`w-12 h-16 rounded-xl mr-2 items-center justify-center ${
                dayInfo.isSelected
                  ? 'bg-green-500'
                  : dayInfo.isToday
                  ? 'bg-dark-700 border-2 border-green-500/50'
                  : 'bg-dark-800'
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-xs mb-1 ${
                  dayInfo.isSelected ? 'text-white' : 'text-dark-400'
                }`}
              >
                {DAY_SHORTS[dayInfo.day] || dayInfo.day.charAt(0)}
              </Text>
              <Text
                className={`text-lg font-bold ${
                  dayInfo.isSelected ? 'text-white' : 'text-dark-200'
                }`}
              >
                {dayInfo.date}
              </Text>
              
              {/* Completion Indicator */}
              {dayInfo.isComplete && !dayInfo.isSelected && (
                <View className="absolute -bottom-1">
                  <CheckCircle2 size={14} color="#22c55e" fill="#22c55e" />
                </View>
              )}
              {dayInfo.isComplete && dayInfo.isSelected && (
                <View className="absolute -bottom-1">
                  <CheckCircle2 size={14} color="#ffffff" fill="#ffffff" />
                </View>
              )}
              
              {/* Has Workout Dot (not complete) */}
              {dayInfo.hasWorkout && !dayInfo.isComplete && (
                <View className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-dark-400" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

