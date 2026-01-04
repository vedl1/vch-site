import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  Keyboard,
} from 'react-native';
import { Check } from 'lucide-react-native';

type SetTag = 'none' | 'W' | 'F' | 'D';

interface SetLoggingRowProps {
  setNumber: number;
  previousWeight?: number;
  previousReps?: number;
  weight: string;
  reps: string;
  tag: SetTag;
  isCompleted: boolean;
  unit?: 'kg' | 'lbs';
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onTagChange: (tag: SetTag) => void;
  onToggleComplete: () => void;
}

const TAG_LABELS: Record<SetTag, { label: string; color: string; bgColor: string }> = {
  none: { label: '', color: '#64748b', bgColor: '#1e293b' },
  W: { label: 'W', color: '#eab308', bgColor: '#422006' },
  F: { label: 'F', color: '#ef4444', bgColor: '#450a0a' },
  D: { label: 'D', color: '#a855f7', bgColor: '#3b0764' },
};

const TAG_CYCLE: SetTag[] = ['none', 'W', 'F', 'D'];

export function SetLoggingRow({
  setNumber,
  previousWeight,
  previousReps,
  weight,
  reps,
  tag,
  isCompleted,
  unit = 'kg',
  onWeightChange,
  onRepsChange,
  onTagChange,
  onToggleComplete,
}: SetLoggingRowProps) {
  const [weightFocused, setWeightFocused] = useState(false);
  const [repsFocused, setRepsFocused] = useState(false);

  const cycleTag = () => {
    const currentIndex = TAG_CYCLE.indexOf(tag);
    const nextIndex = (currentIndex + 1) % TAG_CYCLE.length;
    onTagChange(TAG_CYCLE[nextIndex]);
  };

  const tagInfo = TAG_LABELS[tag];
  const hasPrevious = previousWeight !== undefined && previousReps !== undefined;

  return (
    <View 
      className={`flex-row items-center py-3 px-2 rounded-xl mb-2 ${
        isCompleted ? 'bg-dark-800/50' : 'bg-dark-800'
      }`}
      style={{ opacity: isCompleted ? 0.6 : 1 }}
    >
      {/* Set Number & Tag */}
      <View className="w-12 items-center">
        <TouchableOpacity
          onPress={cycleTag}
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ 
            backgroundColor: tag !== 'none' ? tagInfo.bgColor : '#334155',
          }}
          activeOpacity={0.7}
        >
          {tag !== 'none' ? (
            <Text 
              className="text-sm font-bold"
              style={{ color: tagInfo.color }}
            >
              {tagInfo.label}
            </Text>
          ) : (
            <Text className="text-dark-400 text-sm font-semibold">
              {setNumber}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Previous (if available) */}
      {hasPrevious && (
        <View className="flex-1 px-2">
          <Text className="text-dark-500 text-xs text-center">
            {previousWeight} × {previousReps}
          </Text>
        </View>
      )}

      {/* Weight Input */}
      <View className="flex-1 px-1">
        <TouchableOpacity
          onPress={() => {
            // Focus will be handled by TextInput
          }}
          activeOpacity={1}
        >
          <View 
            className={`rounded-xl px-3 py-2.5 ${
              weightFocused ? 'bg-green-500/20 border border-green-500' : 'bg-dark-700'
            }`}
          >
            <Text className="text-dark-500 text-[10px] text-center mb-0.5">
              {unit.toUpperCase()}
            </Text>
            <TextInput
              value={weight}
              onChangeText={onWeightChange}
              keyboardType="decimal-pad"
              placeholder="—"
              placeholderTextColor="#475569"
              className="text-white text-lg font-bold text-center"
              style={{ padding: 0, minHeight: 24 }}
              onFocus={() => setWeightFocused(true)}
              onBlur={() => setWeightFocused(false)}
              selectTextOnFocus
              editable={!isCompleted}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Reps Input */}
      <View className="flex-1 px-1">
        <TouchableOpacity
          onPress={() => {
            // Focus will be handled by TextInput
          }}
          activeOpacity={1}
        >
          <View 
            className={`rounded-xl px-3 py-2.5 ${
              repsFocused ? 'bg-green-500/20 border border-green-500' : 'bg-dark-700'
            }`}
          >
            <Text className="text-dark-500 text-[10px] text-center mb-0.5">
              REPS
            </Text>
            <TextInput
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="number-pad"
              placeholder="—"
              placeholderTextColor="#475569"
              className="text-white text-lg font-bold text-center"
              style={{ padding: 0, minHeight: 24 }}
              onFocus={() => setRepsFocused(true)}
              onBlur={() => setRepsFocused(false)}
              selectTextOnFocus
              editable={!isCompleted}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Complete Checkbox */}
      <View className="w-12 items-center">
        <TouchableOpacity
          onPress={onToggleComplete}
          className={`w-10 h-10 rounded-xl items-center justify-center ${
            isCompleted ? 'bg-green-500' : 'bg-dark-700 border-2 border-dark-600'
          }`}
          activeOpacity={0.7}
        >
          {isCompleted && <Check size={20} color="#ffffff" strokeWidth={3} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

