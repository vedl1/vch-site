import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react-native';
import { ExerciseData, SetType } from './types';
import { SetRow } from './SetRow';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS } from './constants';

interface ExerciseBlockProps {
  exercise: ExerciseData;
  mode: 'preview' | 'history' | 'active';
  onSetUpdate?: (setId: string, field: 'weight' | 'reps' | 'type' | 'isCompleted', value: any) => void;
  onAddSet?: () => void;
  showSupersetConnector?: boolean;
}

export function ExerciseBlock({
  exercise,
  mode,
  onSetUpdate,
  onAddSet,
  showSupersetConnector = false,
}: ExerciseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(mode === 'active');
  
  const completedSets = exercise.sets.filter(s => s.isCompleted).length;
  const totalSets = exercise.sets.length;
  const isPreview = mode === 'preview';

  return (
    <View style={styles.container}>
      {/* Superset Connector Line */}
      {showSupersetConnector && (
        <View style={styles.supersetConnector} />
      )}

      {/* Superset Badge */}
      {exercise.isSuperset && (
        <View style={styles.supersetBadge}>
          <Text style={styles.supersetText}>SUPERSET</Text>
        </View>
      )}

      {/* Exercise Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => !isPreview && setIsExpanded(!isExpanded)}
        activeOpacity={isPreview ? 1 : 0.7}
        disabled={isPreview}
      >
        <View style={styles.headerLeft}>
          {/* Exercise indicator dot */}
          <View style={[
            styles.exerciseDot,
            exercise.isSuperset && { backgroundColor: HEVY_COLORS.superset },
          ]} />
          
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            {isPreview ? (
              <Text style={styles.setCount}>{totalSets} sets</Text>
            ) : (
              <Text style={styles.setCount}>
                {completedSets}/{totalSets} sets
              </Text>
            )}
          </View>
        </View>

        {!isPreview && (
          <View style={styles.headerRight}>
            {isExpanded ? (
              <ChevronUp size={20} color={HEVY_COLORS.textTertiary} />
            ) : (
              <ChevronDown size={20} color={HEVY_COLORS.textTertiary} />
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Sets List (Expanded) */}
      {isExpanded && !isPreview && (
        <View style={styles.setsContainer}>
          {/* Column Headers */}
          <View style={styles.columnHeaders}>
            <View style={styles.setColumn}>
              <Text style={styles.columnLabel}>SET</Text>
            </View>
            <View style={styles.previousColumn}>
              <Text style={styles.columnLabel}>PREVIOUS</Text>
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.columnLabel}>KG</Text>
            </View>
            <View style={styles.inputColumn}>
              <Text style={styles.columnLabel}>REPS</Text>
            </View>
            <View style={styles.checkColumn}>
              <Text style={styles.columnLabel}>✓</Text>
            </View>
          </View>

          {/* Set Rows */}
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              onWeightChange={(value) => onSetUpdate?.(set.id, 'weight', value)}
              onRepsChange={(value) => onSetUpdate?.(set.id, 'reps', value)}
              onTypeChange={(type) => onSetUpdate?.(set.id, 'type', type)}
              onToggleComplete={() => onSetUpdate?.(set.id, 'isCompleted', !set.isCompleted)}
              isEditable={mode === 'active'}
            />
          ))}

          {/* Add Set Button */}
          {mode === 'active' && onAddSet && (
            <TouchableOpacity
              style={styles.addSetButton}
              onPress={onAddSet}
              activeOpacity={0.7}
            >
              <Plus size={16} color={HEVY_COLORS.primary} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Preview Mode: Compact set display */}
      {isPreview && (
        <View style={styles.previewSets}>
          <Text style={styles.previewSetsText}>
            {totalSets}× {exercise.name}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: HEVY_SPACING.sm,
  },
  supersetConnector: {
    position: 'absolute',
    left: 11,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: HEVY_COLORS.superset,
    borderRadius: 2,
  },
  supersetBadge: {
    alignSelf: 'flex-start',
    backgroundColor: HEVY_COLORS.supersetBg,
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: HEVY_SPACING.xs,
    borderRadius: HEVY_RADIUS.sm,
    marginBottom: HEVY_SPACING.xs,
    marginLeft: HEVY_SPACING.xl,
  },
  supersetText: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.superset,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: HEVY_SPACING.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: HEVY_COLORS.primary,
    marginRight: HEVY_SPACING.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  setCount: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    paddingLeft: HEVY_SPACING.md,
  },
  setsContainer: {
    marginTop: HEVY_SPACING.sm,
    paddingLeft: HEVY_SPACING.xl,
  },
  columnHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xs,
    paddingHorizontal: HEVY_SPACING.sm,
    marginBottom: HEVY_SPACING.xs,
  },
  setColumn: {
    width: 36,
  },
  previousColumn: {
    flex: 1,
    paddingHorizontal: HEVY_SPACING.sm,
  },
  inputColumn: {
    flex: 1,
    marginHorizontal: HEVY_SPACING.xs,
  },
  checkColumn: {
    width: 36,
    marginLeft: HEVY_SPACING.xs,
    alignItems: 'center',
  },
  columnLabel: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.textTertiary,
    textAlign: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: HEVY_SPACING.md,
    marginTop: HEVY_SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  addSetText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.primary,
    fontWeight: '600',
    marginLeft: HEVY_SPACING.xs,
  },
  previewSets: {
    paddingLeft: HEVY_SPACING.xl,
  },
  previewSetsText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
});

