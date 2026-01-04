import React from 'react';
import { View, Text } from 'react-native';
import { Activity, MapPin } from 'lucide-react-native';

interface MetricsBarProps {
  whoopRecovery: number | null;
  stravaDistance: number | null; // in meters
  stravaActivityName?: string | null;
}

export function MetricsBar({ whoopRecovery, stravaDistance, stravaActivityName }: MetricsBarProps) {
  const getRecoveryColor = (score: number | null) => {
    if (!score) return '#64748b';
    if (score >= 67) return '#22c55e';
    if (score >= 34) return '#eab308';
    return '#ef4444';
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '--';
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  return (
    <View className="flex-row mx-5 mb-4">
      {/* Whoop Recovery */}
      <View className="flex-1 bg-dark-800 rounded-xl p-3 mr-2 flex-row items-center">
        <View 
          className="w-10 h-10 rounded-lg items-center justify-center mr-3"
          style={{ backgroundColor: `${getRecoveryColor(whoopRecovery)}20` }}
        >
          <Activity size={20} color={getRecoveryColor(whoopRecovery)} />
        </View>
        <View className="flex-1">
          <Text className="text-dark-400 text-xs">Recovery</Text>
          <Text 
            className="text-lg font-bold"
            style={{ color: getRecoveryColor(whoopRecovery) }}
          >
            {whoopRecovery !== null ? `${whoopRecovery}%` : '--'}
          </Text>
        </View>
      </View>

      {/* Strava Last Run */}
      <View className="flex-1 bg-dark-800 rounded-xl p-3 ml-2 flex-row items-center">
        <View className="w-10 h-10 rounded-lg bg-orange-500/20 items-center justify-center mr-3">
          <MapPin size={20} color="#f97316" />
        </View>
        <View className="flex-1">
          <Text className="text-dark-400 text-xs" numberOfLines={1}>
            {stravaActivityName || 'Last Run'}
          </Text>
          <Text className="text-orange-400 text-lg font-bold">
            {formatDistance(stravaDistance)}
          </Text>
        </View>
      </View>
    </View>
  );
}

