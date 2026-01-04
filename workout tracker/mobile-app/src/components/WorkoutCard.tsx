import React from 'react';
import { View, Text } from 'react-native';
import { Dumbbell, Timer, Target } from 'lucide-react-native';
import { Plan } from '../types';

interface WorkoutCardProps {
  plan: Plan | null;
}

export function WorkoutCard({ plan }: WorkoutCardProps) {
  if (!plan) {
    return (
      <View className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
        <Text className="text-dark-400 text-center">No workout planned</Text>
      </View>
    );
  }

  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('run')) return 'bg-blue-500';
    if (lowerType.includes('strength')) return 'bg-purple-500';
    if (lowerType.includes('hyrox')) return 'bg-orange-500';
    if (lowerType.includes('rest')) return 'bg-green-500';
    return 'bg-primary-500';
  };

  return (
    <View className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-xl ${getTypeColor(plan.primaryType)} items-center justify-center mr-3`}>
            <Dumbbell size={20} color="white" />
          </View>
          <View>
            <Text className="text-white font-bold text-lg">{plan.primaryType}</Text>
            {plan.secondaryType && (
              <Text className="text-dark-400 text-sm">+ {plan.secondaryType}</Text>
            )}
          </View>
        </View>
        <View className="flex-row items-center bg-dark-700 px-3 py-1.5 rounded-full">
          <Timer size={14} color="#94a3b8" />
          <Text className="text-dark-300 text-sm ml-1.5">{plan.durationMin} min</Text>
        </View>
      </View>

      {/* Description */}
      <Text className="text-dark-200 text-base leading-6 mb-4">
        {plan.description}
      </Text>

      {/* Target Pace */}
      {plan.targetPaceLoad && plan.targetPaceLoad !== 'N/A' && (
        <View className="bg-dark-700/50 rounded-xl p-3 flex-row items-center">
          <Target size={16} color="#22c55e" />
          <Text className="text-dark-300 text-sm ml-2 flex-1">
            {plan.targetPaceLoad}
          </Text>
        </View>
      )}
    </View>
  );
}
