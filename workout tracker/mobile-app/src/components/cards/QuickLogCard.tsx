import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Zap, ChevronRight, Check } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

type SetTag = 'none' | 'W' | 'S';

interface QuickLogCardProps {
  lastExercise?: {
    name: string;
    previousWeight: number;
    previousReps: number;
  };
  onLogSet?: (weight: string, reps: string, tag: SetTag) => void;
  onViewHistory?: () => void;
}

const TAG_CONFIG: Record<SetTag, { label: string; color: string; bg: string }> = {
  none: { label: '', color: COLORS.textSecondary, bg: COLORS.background },
  W: { label: 'W', color: '#FF9500', bg: '#FFF3E0' },
  S: { label: 'S', color: '#9C27B0', bg: '#F3E5F5' },
};

export function QuickLogCard({ lastExercise, onLogSet, onViewHistory }: QuickLogCardProps) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [tag, setTag] = useState<SetTag>('none');
  const [isLogged, setIsLogged] = useState(false);

  const cycleTag = () => {
    const tags: SetTag[] = ['none', 'W', 'S'];
    const currentIndex = tags.indexOf(tag);
    setTag(tags[(currentIndex + 1) % tags.length]);
  };

  const handleLog = () => {
    if (weight && reps) {
      onLogSet?.(weight, reps, tag);
      setIsLogged(true);
      setTimeout(() => {
        setIsLogged(false);
        setWeight('');
        setReps('');
        setTag('none');
      }, 1500);
    }
  };

  if (!lastExercise) {
    return (
      <View style={styles.card}>
        <View style={styles.emptyState}>
          <Zap size={24} color={COLORS.textTertiary} />
          <Text style={styles.emptyText}>No recent exercises</Text>
          <Text style={styles.emptySubtext}>Start a workout to quick log</Text>
        </View>
      </View>
    );
  }

  const tagInfo = TAG_CONFIG[tag];

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Zap size={20} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.label}>Quick Log</Text>
            <Text style={styles.exerciseName}>{lastExercise.name}</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={onViewHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.historyText}>History</Text>
          <ChevronRight size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Previous Stats */}
      <View style={styles.previousRow}>
        <Text style={styles.previousLabel}>Previous:</Text>
        <Text style={styles.previousValue}>
          {lastExercise.previousWeight} kg × {lastExercise.previousReps} reps
        </Text>
      </View>

      {/* Input Row */}
      <View style={styles.inputRow}>
        {/* Tag Button */}
        <TouchableOpacity
          style={[
            styles.tagButton,
            { backgroundColor: tagInfo.bg }
          ]}
          onPress={cycleTag}
          activeOpacity={0.7}
        >
          <Text style={[styles.tagText, { color: tagInfo.color }]}>
            {tag === 'none' ? '#' : tagInfo.label}
          </Text>
        </TouchableOpacity>

        {/* Weight Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>KG</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={COLORS.textTertiary}
            selectTextOnFocus
          />
        </View>

        {/* Reps Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>REPS</Text>
          <TextInput
            style={styles.input}
            value={reps}
            onChangeText={setReps}
            keyboardType="number-pad"
            placeholder="—"
            placeholderTextColor={COLORS.textTertiary}
            selectTextOnFocus
          />
        </View>

        {/* Log Button */}
        <TouchableOpacity
          style={[
            styles.logButton,
            isLogged && styles.logButtonSuccess,
            (!weight || !reps) && styles.logButtonDisabled,
          ]}
          onPress={handleLog}
          disabled={!weight || !reps || isLogged}
          activeOpacity={0.8}
        >
          {isLogged ? (
            <Check size={20} color="#FFFFFF" />
          ) : (
            <Text style={styles.logButtonText}>Log</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tag Legend */}
      <View style={styles.tagLegend}>
        <View style={styles.tagLegendItem}>
          <View style={[styles.tagDot, { backgroundColor: TAG_CONFIG.W.color }]} />
          <Text style={styles.tagLegendText}>Warmup</Text>
        </View>
        <View style={styles.tagLegendItem}>
          <View style={[styles.tagDot, { backgroundColor: TAG_CONFIG.S.color }]} />
          <Text style={styles.tagLegendText}>Superset</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  previousRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  previousLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  previousValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tagButton: {
    width: 44,
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagText: {
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textTertiary,
    marginBottom: 2,
  },
  input: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    minWidth: 50,
    padding: 0,
  },
  logButton: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  logButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  logButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.xl,
  },
  tagLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  tagLegendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
});

