import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, Clock, MoreVertical, Pause, Play } from 'lucide-react-native';

interface ActiveWorkoutHeaderProps {
  workoutName: string;
  elapsedTime: string;
  isPaused?: boolean;
  onClose: () => void;
  onPauseToggle?: () => void;
  onMore?: () => void;
}

export function ActiveWorkoutHeader({
  workoutName,
  elapsedTime,
  isPaused = false,
  onClose,
  onPauseToggle,
  onMore,
}: ActiveWorkoutHeaderProps) {
  return (
    <View className="bg-dark-900 border-b border-dark-800">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity
          onPress={onClose}
          className="w-10 h-10 rounded-xl bg-dark-800 items-center justify-center"
          activeOpacity={0.7}
        >
          <X size={20} color="#ef4444" />
        </TouchableOpacity>

        <View className="flex-1 mx-4">
          <Text className="text-white font-bold text-lg text-center" numberOfLines={1}>
            {workoutName}
          </Text>
        </View>

        <View className="flex-row items-center">
          {onPauseToggle && (
            <TouchableOpacity
              onPress={onPauseToggle}
              className="w-10 h-10 rounded-xl bg-dark-800 items-center justify-center mr-2"
              activeOpacity={0.7}
            >
              {isPaused ? (
                <Play size={18} color="#22c55e" />
              ) : (
                <Pause size={18} color="#eab308" />
              )}
            </TouchableOpacity>
          )}
          
          {onMore && (
            <TouchableOpacity
              onPress={onMore}
              className="w-10 h-10 rounded-xl bg-dark-800 items-center justify-center"
              activeOpacity={0.7}
            >
              <MoreVertical size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Timer Bar */}
      <View className="flex-row items-center justify-center py-2 bg-dark-800/50">
        <Clock size={16} color="#22c55e" />
        <Text className="text-green-500 font-mono font-bold text-lg ml-2">
          {elapsedTime}
        </Text>
      </View>
    </View>
  );
}

