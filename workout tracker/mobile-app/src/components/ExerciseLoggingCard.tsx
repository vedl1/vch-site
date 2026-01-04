import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Plus, MoreHorizontal, ChevronDown, Timer, RotateCcw } from 'lucide-react-native';
import { SetLoggingRow } from './SetLoggingRow';

type SetTag = 'none' | 'W' | 'F' | 'D';

interface SetData {
  id: string;
  weight: string;
  reps: string;
  tag: SetTag;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
}

interface ExerciseLoggingCardProps {
  exerciseName: string;
  muscleGroup?: string;
  sets: SetData[];
  isSuperset?: boolean;
  supersetPosition?: 'first' | 'middle' | 'last' | 'only';
  supersetColor?: string;
  unit?: 'kg' | 'lbs';
  onSetUpdate: (setId: string, field: 'weight' | 'reps' | 'tag' | 'isCompleted', value: any) => void;
  onAddSet: () => void;
  onRemoveSet?: (setId: string) => void;
  restTimerSeconds?: number;
  onStartRestTimer?: () => void;
}

export function ExerciseLoggingCard({
  exerciseName,
  muscleGroup,
  sets,
  isSuperset = false,
  supersetPosition = 'only',
  supersetColor = '#a855f7',
  unit = 'kg',
  onSetUpdate,
  onAddSet,
  onRemoveSet,
  restTimerSeconds,
  onStartRestTimer,
}: ExerciseLoggingCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const completedSets = sets.filter(s => s.isCompleted).length;
  const totalSets = sets.length;

  // Determine if we should show superset connector lines
  const showTopConnector = isSuperset && (supersetPosition === 'middle' || supersetPosition === 'last');
  const showBottomConnector = isSuperset && (supersetPosition === 'first' || supersetPosition === 'middle');

  return (
    <View className="relative">
      {/* Superset Vertical Connector Line */}
      {isSuperset && (
        <View 
          className="absolute left-3 w-1 rounded-full"
          style={{ 
            backgroundColor: supersetColor,
            top: showTopConnector ? 0 : 20,
            bottom: showBottomConnector ? 0 : 20,
          }}
        />
      )}

      <View 
        className={`bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 ${
          isSuperset ? 'ml-6' : ''
        }`}
      >
        {/* Superset Badge */}
        {isSuperset && (supersetPosition === 'first' || supersetPosition === 'only') && (
          <View 
            className="px-3 py-1.5 flex-row items-center"
            style={{ backgroundColor: `${supersetColor}20` }}
          >
            <View 
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: supersetColor }}
            />
            <Text 
              className="text-xs font-semibold"
              style={{ color: supersetColor }}
            >
              SUPERSET
            </Text>
          </View>
        )}

        {/* Exercise Header */}
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="p-4 flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <View className="flex-1">
            <Text className="text-white font-semibold text-base">{exerciseName}</Text>
            {muscleGroup && (
              <Text className="text-dark-400 text-sm mt-0.5">{muscleGroup}</Text>
            )}
          </View>

          <View className="flex-row items-center">
            {/* Progress Badge */}
            <View className="bg-dark-700 px-2.5 py-1 rounded-lg mr-3">
              <Text className="text-dark-300 text-sm font-medium">
                {completedSets}/{totalSets}
              </Text>
            </View>

            {/* Expand/Collapse */}
            <ChevronDown 
              size={20} 
              color="#64748b" 
              style={{ 
                transform: [{ rotate: isExpanded ? '0deg' : '-90deg' }] 
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Sets List */}
        {isExpanded && (
          <View className="px-3 pb-3">
            {/* Header Row */}
            <View className="flex-row items-center py-2 px-2 mb-1">
              <View className="w-12">
                <Text className="text-dark-500 text-xs text-center font-medium">SET</Text>
              </View>
              {sets[0]?.previousWeight !== undefined && (
                <View className="flex-1 px-2">
                  <Text className="text-dark-500 text-xs text-center font-medium">PREV</Text>
                </View>
              )}
              <View className="flex-1 px-1">
                <Text className="text-dark-500 text-xs text-center font-medium">{unit.toUpperCase()}</Text>
              </View>
              <View className="flex-1 px-1">
                <Text className="text-dark-500 text-xs text-center font-medium">REPS</Text>
              </View>
              <View className="w-12">
                <Text className="text-dark-500 text-xs text-center">✓</Text>
              </View>
            </View>

            {/* Set Rows */}
            {sets.map((set, index) => (
              <SetLoggingRow
                key={set.id}
                setNumber={index + 1}
                previousWeight={set.previousWeight}
                previousReps={set.previousReps}
                weight={set.weight}
                reps={set.reps}
                tag={set.tag}
                isCompleted={set.isCompleted}
                unit={unit}
                onWeightChange={(value) => onSetUpdate(set.id, 'weight', value)}
                onRepsChange={(value) => onSetUpdate(set.id, 'reps', value)}
                onTagChange={(tag) => onSetUpdate(set.id, 'tag', tag)}
                onToggleComplete={() => onSetUpdate(set.id, 'isCompleted', !set.isCompleted)}
              />
            ))}

            {/* Action Buttons */}
            <View className="flex-row items-center mt-2 pt-2 border-t border-dark-700">
              <TouchableOpacity
                onPress={onAddSet}
                className="flex-row items-center flex-1 justify-center py-2"
                activeOpacity={0.7}
              >
                <Plus size={18} color="#22c55e" />
                <Text className="text-green-500 font-medium ml-1.5">Add Set</Text>
              </TouchableOpacity>

              {onStartRestTimer && (
                <>
                  <View className="w-px h-6 bg-dark-700" />
                  <TouchableOpacity
                    onPress={onStartRestTimer}
                    className="flex-row items-center flex-1 justify-center py-2"
                    activeOpacity={0.7}
                  >
                    <Timer size={18} color="#64748b" />
                    <Text className="text-dark-400 font-medium ml-1.5">
                      {restTimerSeconds ? `${restTimerSeconds}s` : 'Rest'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

