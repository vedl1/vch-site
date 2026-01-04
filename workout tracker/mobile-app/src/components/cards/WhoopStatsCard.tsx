import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Heart, Moon, Flame, RefreshCw, Activity } from 'lucide-react-native';
import { api, WhoopMetrics } from '../../services/api';
import { HEVY_COLORS, HEVY_TYPOGRAPHY, HEVY_SPACING, HEVY_RADIUS, HEVY_SHADOWS } from '../cards/WorkoutCard/constants';

// Whoop brand color
const WHOOP_GREEN = '#00D46A';
const WHOOP_YELLOW = '#F5A623';
const WHOOP_RED = '#E53935';

// Get recovery color based on score
function getRecoveryColor(score: number | null): string {
  if (score === null) return HEVY_COLORS.textTertiary;
  if (score >= 67) return WHOOP_GREEN;
  if (score >= 34) return WHOOP_YELLOW;
  return WHOOP_RED;
}

// Format sleep duration from milliseconds
function formatSleepDuration(ms: number | null): string {
  if (!ms) return '--';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

export function WhoopStatsCard() {
  const [metrics, setMetrics] = useState<WhoopMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWhoopMetrics();
      setMetrics(data);
      if (!data) {
        setError('Connect Whoop to see your data');
      }
    } catch (err) {
      setError('Failed to load Whoop data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const recoveryScore = metrics?.recovery?.recoveryScore ?? null;
  const recoveryColor = getRecoveryColor(recoveryScore);
  const totalStrain = metrics?.workouts?.reduce((sum, w) => sum + (w.strain || 0), 0) || 0;
  const sleepDuration = metrics?.sleep?.qualityDuration ?? null;
  const sleepEfficiency = metrics?.sleep?.sleepEfficiency ?? null;
  const restingHR = metrics?.recovery?.restingHeartRate ?? null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.whoopBadge}>
            <Text style={styles.whoopText}>WHOOP</Text>
          </View>
          <Text style={styles.headerTitle}>Daily Metrics</Text>
        </View>
        <TouchableOpacity 
          onPress={fetchMetrics} 
          style={styles.refreshButton}
          disabled={loading}
        >
          <RefreshCw 
            size={16} 
            color={HEVY_COLORS.textSecondary} 
            style={loading ? { opacity: 0.5 } : undefined}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={WHOOP_GREEN} />
          <Text style={styles.loadingText}>Loading metrics...</Text>
        </View>
      ) : error && !metrics ? (
        <View style={styles.errorContainer}>
          <Activity size={24} color={HEVY_COLORS.textTertiary} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.metricsGrid}>
          {/* Recovery Score - Main metric */}
          <View style={[styles.recoveryCard, { borderColor: recoveryColor }]}>
            <View style={styles.recoveryHeader}>
              <Heart size={16} color={recoveryColor} />
              <Text style={styles.metricLabel}>Recovery</Text>
            </View>
            <Text style={[styles.recoveryScore, { color: recoveryColor }]}>
              {recoveryScore !== null ? `${Math.round(recoveryScore)}%` : '--'}
            </Text>
            {restingHR && (
              <Text style={styles.subMetric}>
                {Math.round(restingHR)} bpm resting
              </Text>
            )}
          </View>

          {/* Secondary Metrics */}
          <View style={styles.secondaryMetrics}>
            {/* Sleep */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Moon size={14} color="#6366F1" />
                <Text style={styles.metricLabel}>Sleep</Text>
              </View>
              <Text style={styles.metricValue}>
                {formatSleepDuration(sleepDuration)}
              </Text>
              {sleepEfficiency && (
                <Text style={styles.subMetric}>
                  {Math.round(sleepEfficiency)}% efficiency
                </Text>
              )}
            </View>

            {/* Strain */}
            <View style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Flame size={14} color="#F97316" />
                <Text style={styles.metricLabel}>Strain</Text>
              </View>
              <Text style={styles.metricValue}>
                {totalStrain > 0 ? totalStrain.toFixed(1) : '--'}
              </Text>
              {metrics?.workouts && metrics.workouts.length > 0 && (
                <Text style={styles.subMetric}>
                  {metrics.workouts.length} workout{metrics.workouts.length !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Last Updated */}
      {metrics?.fetchedAt && (
        <Text style={styles.lastUpdated}>
          Updated {new Date(metrics.fetchedAt).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: HEVY_COLORS.cardBg,
    borderRadius: HEVY_RADIUS.lg,
    padding: HEVY_SPACING.lg,
    marginHorizontal: HEVY_SPACING.lg,
    marginBottom: HEVY_SPACING.md,
    ...HEVY_SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  whoopBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: HEVY_SPACING.sm,
    paddingVertical: 2,
    borderRadius: HEVY_RADIUS.sm,
    marginRight: HEVY_SPACING.sm,
  },
  whoopText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    ...HEVY_TYPOGRAPHY.subtitle,
    color: HEVY_COLORS.textSecondary,
  },
  refreshButton: {
    padding: HEVY_SPACING.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xl,
  },
  loadingText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textSecondary,
    marginTop: HEVY_SPACING.sm,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: HEVY_SPACING.xl,
  },
  errorText: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    marginTop: HEVY_SPACING.sm,
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
  },
  recoveryCard: {
    flex: 1,
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.md,
    padding: HEVY_SPACING.md,
    marginRight: HEVY_SPACING.sm,
    borderLeftWidth: 3,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.xs,
  },
  recoveryScore: {
    fontSize: 32,
    fontWeight: '800',
    marginVertical: HEVY_SPACING.xs,
  },
  secondaryMetrics: {
    flex: 1,
    marginLeft: HEVY_SPACING.xs,
  },
  metricCard: {
    backgroundColor: HEVY_COLORS.background,
    borderRadius: HEVY_RADIUS.md,
    padding: HEVY_SPACING.md,
    marginBottom: HEVY_SPACING.sm,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: HEVY_SPACING.xs,
  },
  metricLabel: {
    ...HEVY_TYPOGRAPHY.label,
    color: HEVY_COLORS.textSecondary,
    marginLeft: HEVY_SPACING.xs,
    textTransform: 'uppercase',
    fontSize: 10,
  },
  metricValue: {
    ...HEVY_TYPOGRAPHY.exerciseName,
    color: HEVY_COLORS.textPrimary,
    fontSize: 18,
  },
  subMetric: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  lastUpdated: {
    ...HEVY_TYPOGRAPHY.small,
    color: HEVY_COLORS.textTertiary,
    textAlign: 'center',
    marginTop: HEVY_SPACING.md,
    fontSize: 10,
  },
});

