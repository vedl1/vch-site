import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { SetData, SetType } from './types';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS } from './constants';

interface SetRowProps {
  set: SetData;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onTypeChange: (type: SetType) => void;
  onToggleComplete: () => void;
  isEditable?: boolean;
}

const SET_TYPE_CONFIG: Record<SetType, { label: string; color: string; bgColor: string }> = {
  warmup: { label: 'W', color: HEVY_COLORS.warmup, bgColor: HEVY_COLORS.warmupBg },
  working: { label: '', color: HEVY_COLORS.textPrimary, bgColor: HEVY_COLORS.background },
  failure: { label: 'F', color: HEVY_COLORS.failure, bgColor: HEVY_COLORS.failureBg },
  drop: { label: 'D', color: HEVY_COLORS.drop, bgColor: HEVY_COLORS.dropBg },
};

const TYPE_CYCLE: SetType[] = ['working', 'warmup', 'failure', 'drop'];

export function SetRow({
  set,
  onWeightChange,
  onRepsChange,
  onTypeChange,
  onToggleComplete,
  isEditable = true,
}: SetRowProps) {
  const [weightFocused, setWeightFocused] = useState(false);
  const [repsFocused, setRepsFocused] = useState(false);

  const typeConfig = SET_TYPE_CONFIG[set.type];
  const isWarmup = set.type === 'warmup';
  const displayLabel = set.type === 'working' ? set.setNumber.toString() : typeConfig.label;

  const cycleSetType = () => {
    if (!isEditable) return;
    const currentIndex = TYPE_CYCLE.indexOf(set.type);
    const nextIndex = (currentIndex + 1) % TYPE_CYCLE.length;
    onTypeChange(TYPE_CYCLE[nextIndex]);
  };

  return (
    <View style={[
      styles.container,
      set.isCompleted && styles.containerCompleted,
    ]}>
      {/* Set Number/Type */}
      <TouchableOpacity
        style={[styles.setTypeButton, { backgroundColor: typeConfig.bgColor }]}
        onPress={cycleSetType}
        activeOpacity={0.7}
        disabled={!isEditable}
      >
        <Text style={[
          styles.setTypeText,
          { color: set.type === 'working' ? HEVY_COLORS.textSecondary : typeConfig.color },
        ]}>
          {displayLabel}
        </Text>
      </TouchableOpacity>

      {/* Previous */}
      <View style={styles.previousColumn}>
        {set.previousWeight !== undefined && set.previousReps !== undefined ? (
          <Text style={styles.previousText}>
            {set.previousWeight} × {set.previousReps}
          </Text>
        ) : (
          <Text style={styles.previousText}>—</Text>
        )}
      </View>

      {/* Weight Input */}
      <View style={[
        styles.inputContainer,
        weightFocused && styles.inputContainerFocused,
      ]}>
        <TextInput
          style={styles.input}
          value={set.weight}
          onChangeText={onWeightChange}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={HEVY_COLORS.textTertiary}
          onFocus={() => setWeightFocused(true)}
          onBlur={() => setWeightFocused(false)}
          selectTextOnFocus
          editable={isEditable && !set.isCompleted}
        />
      </View>

      {/* Reps Input */}
      <View style={[
        styles.inputContainer,
        repsFocused && styles.inputContainerFocused,
      ]}>
        <TextInput
          style={styles.input}
          value={set.reps}
          onChangeText={onRepsChange}
          keyboardType="number-pad"
          placeholder="—"
          placeholderTextColor={HEVY_COLORS.textTertiary}
          onFocus={() => setRepsFocused(true)}
          onBlur={() => setRepsFocused(false)}
          selectTextOnFocus
          editable={isEditable && !set.isCompleted}
        />
      </View>

      {/* Checkmark */}
      <TouchableOpacity
        style={[
          styles.checkButton,
          set.isCompleted && styles.checkButtonCompleted,
        ]}
        onPress={onToggleComplete}
        activeOpacity={0.7}
        disabled={!isEditable}
      >
        {set.isCompleted && <Check size={18} color={HEVY_COLORS.white} strokeWidth={3} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.sm,
    paddingHorizontal: HEVY_SPACING.sm,
    borderRadius: HEVY_RADIUS.sm,
    marginBottom: HEVY_SPACING.xs,
  },
  containerCompleted: {
    backgroundColor: HEVY_COLORS.completed,
    opacity: 0.7,
  },
  setTypeButton: {
    width: 36,
    height: 36,
    borderRadius: HEVY_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTypeText: {
    ...HEVY_TYPOGRAPHY.setNumber,
  },
  previousColumn: {
    flex: 1,
    paddingHorizontal: HEVY_SPACING.sm,
  },
  previousText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    textAlign: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.sm,
    marginHorizontal: HEVY_SPACING.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputContainerFocused: {
    borderColor: HEVY_COLORS.primary,
    backgroundColor: HEVY_COLORS.primaryLight,
  },
  input: {
    ...HEVY_TYPOGRAPHY.inputLarge,
    color: HEVY_COLORS.textPrimary,
    textAlign: 'center',
    paddingVertical: HEVY_SPACING.sm,
    paddingHorizontal: HEVY_SPACING.sm,
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: HEVY_RADIUS.sm,
    backgroundColor: HEVY_COLORS.background,
    borderWidth: 2,
    borderColor: HEVY_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: HEVY_SPACING.xs,
  },
  checkButtonCompleted: {
    backgroundColor: HEVY_COLORS.success,
    borderColor: HEVY_COLORS.success,
  },
});

