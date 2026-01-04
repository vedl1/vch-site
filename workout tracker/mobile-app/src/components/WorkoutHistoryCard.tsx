import React from 'react';
import { View, Text } from 'react-native';
import { Dumbbell, Clock, Star, CheckCircle2, Activity } from 'lucide-react-native';

interface WorkoutHistoryCardProps {
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

export function WorkoutHistoryCard({
  week,
  day,
  date,
  primaryType,
  secondaryType,
  duration,
  exercisesCompleted,
  exercisesTotal,
  effortRating,
  whoopRecovery,
  isComplete,
}: WorkoutHistoryCardProps) {
  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('run')) return '#3b82f6';
    if (lowerType.includes('strength')) return '#a855f7';
    if (lowerType.includes('hyrox')) return '#f97316';
    if (lowerType.includes('rest')) return '#22c55e';
    return '#22c55e';
  };

  const getRecoveryColor = (score: number | null) => {
    if (!score) return '#64748b';
    if (score >= 67) return '#22c55e';
    if (score >= 34) return '#eab308';
    return '#ef4444';
  };

  return (
    <View className="bg-dark-800 rounded-2xl p-4 mb-3 border border-dark-700">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View 
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${getTypeColor(primaryType)}20` }}
          >
            <Dumbbell size={20} color={getTypeColor(primaryType)} />
          </View>
          <View>
            <Text className="text-white font-semibold text-base">{primaryType}</Text>
            {secondaryType && (
              <Text className="text-dark-400 text-xs">+ {secondaryType}</Text>
            )}
          </View>
        </View>
        
        {isComplete && (
          <View className="bg-green-500/20 rounded-full p-1.5">
            <CheckCircle2 size={18} color="#22c55e" />
          </View>
        )}
      </View>

      {/* Date & Week */}
      <View className="flex-row items-center mb-3">
        <Text className="text-dark-400 text-sm">{day}, {date}</Text>
        <View className="w-1 h-1 rounded-full bg-dark-600 mx-2" />
        <Text className="text-dark-500 text-sm">Week {week}</Text>
      </View>

      {/* Stats Row - Only show if there's data */}
      {(duration || (exercisesTotal > 0) || effortRating || whoopRecovery) && (
        <View className="flex-row items-center justify-between bg-dark-700/50 rounded-xl p-3">
          {/* Duration */}
          {duration && (
            <View className="flex-row items-center">
              <Clock size={14} color="#64748b" />
              <Text className="text-dark-300 text-sm ml-1.5">{duration} min</Text>
            </View>
          )}

          {/* Exercises - only show if total > 0 */}
          {exercisesTotal > 0 && (
            <View className="flex-row items-center">
              <CheckCircle2 size={14} color="#64748b" />
              <Text className="text-dark-300 text-sm ml-1.5">
                {exercisesCompleted}/{exercisesTotal}
              </Text>
            </View>
          )}

          {/* Effort Rating */}
          {effortRating && (
            <View className="flex-row items-center">
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text className="text-dark-300 text-sm ml-1.5">{effortRating}/10</Text>
            </View>
          )}

          {/* Whoop Recovery */}
          {whoopRecovery && (
            <View className="flex-row items-center">
              <Activity size={14} color={getRecoveryColor(whoopRecovery)} />
              <Text 
                className="text-sm ml-1.5"
                style={{ color: getRecoveryColor(whoopRecovery) }}
              >
                {whoopRecovery}%
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

