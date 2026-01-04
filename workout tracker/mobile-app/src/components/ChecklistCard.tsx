import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, ListChecks } from 'lucide-react-native';
import { ChecklistItem } from '../types';

interface ChecklistCardProps {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
}

export function ChecklistCard({ items, onToggle }: ChecklistCardProps) {
  const completedCount = items.filter(item => item.isCompleted).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  if (items.length === 0) {
    return null;
  }

  return (
    <View className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-green-500/20 items-center justify-center mr-3">
            <ListChecks size={18} color="#22c55e" />
          </View>
          <Text className="text-white font-semibold text-lg">Exercises</Text>
        </View>
        <Text className="text-dark-400 text-sm">
          {completedCount}/{items.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View className="h-2 bg-dark-700 rounded-full mb-4 overflow-hidden">
        <View 
          className="h-full bg-green-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>

      {/* Checklist Items */}
      <View>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => onToggle(item.id)}
            className={`flex-row items-center p-3 rounded-xl mb-2 ${
              item.isCompleted ? 'bg-green-500/10' : 'bg-dark-700/50'
            }`}
            activeOpacity={0.7}
          >
            {item.isCompleted ? (
              <CheckCircle2 size={22} color="#22c55e" />
            ) : (
              <Circle size={22} color="#64748b" />
            )}
            <Text 
              className={`ml-3 flex-1 ${
                item.isCompleted 
                  ? 'text-dark-400 line-through' 
                  : 'text-dark-200'
              }`}
            >
              {item.exerciseName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
