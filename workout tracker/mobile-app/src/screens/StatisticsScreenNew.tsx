import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Trophy, 
  TrendingUp,
  Scale,
  Dumbbell,
} from 'lucide-react-native';
import Svg, { Rect, Line, Circle, Path, G, Text as SvgText } from 'react-native-svg';
import { GlobalDateScroller } from '../components/GlobalDateScroller';
import { useDate } from '../context/DateContext';
import { MuscleHeatmap } from '../components/cards/WorkoutCard/MuscleHeatmap';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from '../components/cards/WorkoutCard/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - (HEVY_SPACING.lg * 2) - (HEVY_SPACING.lg * 2);

// Sample data
const VOLUME_DATA = [
  { day: 'Mon', value: 8500 },
  { day: 'Tue', value: 0 },
  { day: 'Wed', value: 12400 },
  { day: 'Thu', value: 9200 },
  { day: 'Fri', value: 0 },
  { day: 'Sat', value: 15600 },
  { day: 'Sun', value: 0 },
];

const RECENT_PRS = [
  { exercise: 'Bench Press', weight: 100, reps: 5, date: 'Today' },
  { exercise: 'Squat', weight: 140, reps: 3, date: 'Yesterday' },
  { exercise: 'Deadlift', weight: 160, reps: 2, date: '3 days ago' },
];

const BODY_WEIGHT_DATA = [
  { day: 1, value: 82.5 },
  { day: 5, value: 82.2 },
  { day: 10, value: 81.8 },
  { day: 15, value: 81.5 },
  { day: 20, value: 81.9 },
  { day: 25, value: 81.3 },
  { day: 30, value: 81.0 },
];

const MUSCLE_FREQUENCY = ['chest', 'shoulders', 'back', 'lats', 'biceps', 'quads'];

// Bar Chart Component
function VolumeChart({ data }: { data: typeof VOLUME_DATA }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 120;
  const barWidth = (CHART_WIDTH - 40) / data.length - 8;

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={chartHeight + 30}>
        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
          const x = 20 + index * (barWidth + 8);
          const y = chartHeight - barHeight;

          return (
            <G key={index}>
              {/* Bar */}
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.value > 0 ? HEVY_COLORS.primary : HEVY_COLORS.border}
              />
              {/* Day label */}
              <SvgText
                x={x + barWidth / 2}
                y={chartHeight + 20}
                fontSize={10}
                fill={HEVY_COLORS.textTertiary}
                textAnchor="middle"
              >
                {item.day}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

// Line Chart Component
function BodyWeightChart({ data }: { data: typeof BODY_WEIGHT_DATA }) {
  const values = data.map(d => d.value);
  const minValue = Math.min(...values) - 1;
  const maxValue = Math.max(...values) + 1;
  const chartHeight = 100;
  const chartPadding = 20;

  const getX = (index: number) => {
    return chartPadding + (index / (data.length - 1)) * (CHART_WIDTH - chartPadding * 2);
  };

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
  };

  // Generate path
  const pathData = data
    .map((point, index) => {
      const x = getX(index);
      const y = getY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.chartContainer}>
      <Svg width={CHART_WIDTH} height={chartHeight + 30}>
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, index) => (
          <Line
            key={index}
            x1={chartPadding}
            y1={chartHeight * ratio}
            x2={CHART_WIDTH - chartPadding}
            y2={chartHeight * ratio}
            stroke={HEVY_COLORS.border}
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* Line */}
        <Path
          d={pathData}
          fill="none"
          stroke={HEVY_COLORS.primary}
          strokeWidth={2}
        />

        {/* Points */}
        {data.map((point, index) => (
          <Circle
            key={index}
            cx={getX(index)}
            cy={getY(point.value)}
            r={4}
            fill={HEVY_COLORS.cardBg}
            stroke={HEVY_COLORS.primary}
            strokeWidth={2}
          />
        ))}

        {/* Current value label */}
        <SvgText
          x={getX(data.length - 1)}
          y={getY(data[data.length - 1].value) - 10}
          fontSize={12}
          fontWeight="600"
          fill={HEVY_COLORS.primary}
          textAnchor="middle"
        >
          {data[data.length - 1].value} kg
        </SvgText>
      </Svg>
    </View>
  );
}

export function StatisticsScreenNew() {
  const { selectedDate, formattedDate, weekNumber } = useDate();

  // Calculate totals - could be filtered by selectedDate/weekNumber
  const totalVolume = useMemo(() => 
    VOLUME_DATA.reduce((sum, d) => sum + d.value, 0), 
    [selectedDate]
  );
  const workoutDays = useMemo(() => 
    VOLUME_DATA.filter(d => d.value > 0).length,
    [selectedDate]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={HEVY_COLORS.cardBg} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Track your progress</Text>
      </View>

      {/* Global Date Scroller (Time Range Filter) */}
      <GlobalDateScroller />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Volume Chart */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Dumbbell size={20} color={HEVY_COLORS.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Weekly Volume</Text>
              <Text style={styles.cardSubtitle}>Total: {(totalVolume / 1000).toFixed(1)}k kg</Text>
            </View>
          </View>
          <VolumeChart data={VOLUME_DATA} />
        </View>

        {/* Card 2: Muscle Split */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${HEVY_COLORS.superset}15` }]}>
              <TrendingUp size={20} color={HEVY_COLORS.superset} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Muscle Split</Text>
              <Text style={styles.cardSubtitle}>{workoutDays} workouts this week</Text>
            </View>
          </View>
          
          <View style={styles.muscleMapContainer}>
            <View style={styles.muscleMapRow}>
              <MuscleHeatmap
                activeMuscles={MUSCLE_FREQUENCY}
                size={80}
                view="front"
              />
              <MuscleHeatmap
                activeMuscles={['back', 'lats', 'hamstrings', 'glutes']}
                size={80}
                view="back"
              />
            </View>
            
            {/* Legend */}
            <View style={styles.muscleLegend}>
              {['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'].map((muscle, index) => (
                <View key={muscle} style={styles.legendItem}>
                  <View style={[
                    styles.legendDot,
                    { backgroundColor: index < 3 ? HEVY_COLORS.primary : HEVY_COLORS.textTertiary }
                  ]} />
                  <Text style={styles.legendText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Card 3: Personal Records */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${HEVY_COLORS.warmup}15` }]}>
              <Trophy size={20} color={HEVY_COLORS.warmup} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Recent PRs</Text>
              <Text style={styles.cardSubtitle}>{RECENT_PRS.length} personal records</Text>
            </View>
          </View>
          
          <View style={styles.prList}>
            {RECENT_PRS.map((pr, index) => (
              <View key={index} style={styles.prRow}>
                <View style={styles.prIconContainer}>
                  <Trophy size={16} color={HEVY_COLORS.warmup} />
                </View>
                <View style={styles.prContent}>
                  <Text style={styles.prExercise}>{pr.exercise}</Text>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
                <View style={styles.prValue}>
                  <Text style={styles.prWeight}>{pr.weight} kg</Text>
                  <Text style={styles.prReps}>× {pr.reps}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Card 4: Body Weight */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: `${HEVY_COLORS.success}15` }]}>
              <Scale size={20} color={HEVY_COLORS.success} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>Body Weight</Text>
              <Text style={styles.cardSubtitle}>
                {BODY_WEIGHT_DATA[BODY_WEIGHT_DATA.length - 1].value} kg current
              </Text>
            </View>
          </View>
          <BodyWeightChart data={BODY_WEIGHT_DATA} />
          
          {/* Weight change indicator */}
          <View style={styles.weightChange}>
            <Text style={[styles.weightChangeText, { color: HEVY_COLORS.success }]}>
              ↓ {(BODY_WEIGHT_DATA[0].value - BODY_WEIGHT_DATA[BODY_WEIGHT_DATA.length - 1].value).toFixed(1)} kg
            </Text>
            <Text style={styles.weightChangePeriod}>this month</Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HEVY_COLORS.background,
  },
  header: {
    backgroundColor: HEVY_COLORS.cardBg,
    paddingHorizontal: HEVY_SPACING.lg,
    paddingTop: HEVY_SPACING.md,
    paddingBottom: HEVY_SPACING.md,
  },
  title: {
    ...HEVY_TYPOGRAPHY.title,
    fontSize: 28,
    color: HEVY_COLORS.textPrimary,
  },
  subtitle: {
    ...HEVY_TYPOGRAPHY.subtitle,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: HEVY_SPACING.lg,
  },
  card: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    marginBottom: HEVY_SPACING.md,
    ...HEVY_SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.lg,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: HEVY_RADIUS.md,
    backgroundColor: HEVY_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    marginLeft: HEVY_SPACING.md,
  },
  cardTitle: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
  },
  cardSubtitle: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: 2,
  },
  chartContainer: {
    alignItems: 'center',
  },
  muscleMapContainer: {
    alignItems: 'center',
  },
  muscleMapRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: HEVY_SPACING.xl,
  },
  muscleLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: HEVY_SPACING.lg,
    gap: HEVY_SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: HEVY_SPACING.xs,
  },
  legendText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
  prList: {
    gap: HEVY_SPACING.sm,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HEVY_COLORS.background,
    padding: HEVY_SPACING.md,
    borderRadius: HEVY_RADIUS.md,
  },
  prIconContainer: {
    width: 32,
    height: 32,
    borderRadius: HEVY_RADIUS.sm,
    backgroundColor: `${HEVY_COLORS.warmup}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prContent: {
    flex: 1,
    marginLeft: HEVY_SPACING.md,
  },
  prExercise: {
    ...HEVY_TYPOGRAPHY.subtitle,
    fontWeight: '600',
    color: HEVY_COLORS.textPrimary,
  },
  prDate: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
  },
  prValue: {
    alignItems: 'flex-end',
  },
  prWeight: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.warmup,
  },
  prReps: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
  },
  weightChange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: HEVY_SPACING.md,
    paddingTop: HEVY_SPACING.md,
    borderTopWidth: 1,
    borderTopColor: HEVY_COLORS.border,
  },
  weightChangeText: {
    ...HEVY_TYPOGRAPHY.exerciseName,
  },
  weightChangePeriod: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginLeft: HEVY_SPACING.xs,
  },
});

