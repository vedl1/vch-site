import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { MapPin, Clock, TrendingUp, ExternalLink, Footprints } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../constants/theme';

interface StravaActivityCardProps {
  activityName: string;
  activityType: string;
  distance: number; // in meters
  duration: number; // in seconds
  pace?: number; // seconds per km
  activityId?: string;
  date?: string;
}

export function StravaActivityCard({
  activityName,
  activityType,
  distance,
  duration,
  pace,
  activityId,
  date,
}: StravaActivityCardProps) {
  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} min`;
  };

  const formatPace = (secPerKm: number) => {
    const mins = Math.floor(secPerKm / 60);
    const secs = Math.round(secPerKm % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  const handleViewOnStrava = () => {
    if (activityId) {
      Linking.openURL(`https://www.strava.com/activities/${activityId}`);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Footprints size={20} color={COLORS.strava} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.label}>Strava Activity</Text>
            <Text style={styles.activityName} numberOfLines={1}>{activityName}</Text>
          </View>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{activityType}</Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <MapPin size={16} color={COLORS.textSecondary} />
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>{formatDistance(distance)}</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />

        <View style={styles.metric}>
          <Clock size={16} color={COLORS.textSecondary} />
          <View style={styles.metricContent}>
            <Text style={styles.metricValue}>{formatDuration(duration)}</Text>
            <Text style={styles.metricLabel}>Time</Text>
          </View>
        </View>

        {pace && (
          <>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <TrendingUp size={16} color={COLORS.textSecondary} />
              <View style={styles.metricContent}>
                <Text style={styles.metricValue}>{formatPace(pace)}</Text>
                <Text style={styles.metricLabel}>Pace</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* View on Strava */}
      {activityId && (
        <TouchableOpacity
          style={styles.stravaButton}
          onPress={handleViewOnStrava}
          activeOpacity={0.7}
        >
          <Text style={styles.stravaButtonText}>View on Strava</Text>
          <ExternalLink size={14} color={COLORS.strava} />
        </TouchableOpacity>
      )}
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
    marginBottom: SPACING.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: `${COLORS.strava}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  headerText: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  typeBadge: {
    backgroundColor: `${COLORS.strava}15`,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.strava,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  metric: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricContent: {
    marginLeft: SPACING.sm,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.sm,
  },
  stravaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stravaButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.strava,
    marginRight: SPACING.xs,
  },
});

