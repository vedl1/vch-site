import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { 
  MapPin, 
  Clock, 
  Mountain, 
  Footprints,
  Bike,
  Waves,
  Dumbbell,
  ExternalLink,
  TrendingUp,
  Zap,
} from 'lucide-react-native';

// Strava brand color
const STRAVA_ORANGE = '#fc4c02';

interface StravaActivityCardProps {
  id: string;
  name: string;
  type: string;
  distance: number; // in meters
  duration: number; // in seconds
  elevationGain?: number; // in meters
  averagePace?: number; // in seconds per km
  averageSpeed?: number; // in km/h
  calories?: number;
  date: string;
  onViewOnStrava?: () => void;
}

export function StravaActivityCard({
  id,
  name,
  type,
  distance,
  duration,
  elevationGain,
  averagePace,
  averageSpeed,
  calories,
  date,
  onViewOnStrava,
}: StravaActivityCardProps) {
  const getActivityIcon = (activityType: string) => {
    const lowerType = activityType.toLowerCase();
    if (lowerType.includes('run') || lowerType.includes('walk')) {
      return <Footprints size={24} color={STRAVA_ORANGE} />;
    }
    if (lowerType.includes('ride') || lowerType.includes('cycling') || lowerType.includes('bike')) {
      return <Bike size={24} color={STRAVA_ORANGE} />;
    }
    if (lowerType.includes('swim')) {
      return <Waves size={24} color={STRAVA_ORANGE} />;
    }
    if (lowerType.includes('weight') || lowerType.includes('strength')) {
      return <Dumbbell size={24} color={STRAVA_ORANGE} />;
    }
    return <Zap size={24} color={STRAVA_ORANGE} />;
  };

  const formatDistance = (meters: number) => {
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatPace = (secondsPerKm: number) => {
    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  };

  const formatElevation = (meters: number) => {
    return `${Math.round(meters)} m`;
  };

  const handleViewOnStrava = () => {
    if (onViewOnStrava) {
      onViewOnStrava();
    } else {
      // Open Strava activity in browser/app
      Linking.openURL(`https://www.strava.com/activities/${id}`);
    }
  };

  return (
    <View className="bg-dark-800 rounded-2xl overflow-hidden border border-dark-700 mb-3">
      {/* Header with Strava Branding */}
      <View 
        className="px-4 py-3 flex-row items-center justify-between"
        style={{ backgroundColor: `${STRAVA_ORANGE}15` }}
      >
        <View className="flex-row items-center">
          {/* Strava Logo/Icon */}
          <View 
            className="w-10 h-10 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: `${STRAVA_ORANGE}25` }}
          >
            {getActivityIcon(type)}
          </View>
          <View>
            <Text className="text-white font-semibold text-base" numberOfLines={1}>
              {name}
            </Text>
            <Text className="text-dark-400 text-xs">{date}</Text>
          </View>
        </View>
        
        {/* Activity Type Badge */}
        <View 
          className="px-3 py-1.5 rounded-full"
          style={{ backgroundColor: `${STRAVA_ORANGE}20` }}
        >
          <Text style={{ color: STRAVA_ORANGE }} className="text-xs font-semibold">
            {type}
          </Text>
        </View>
      </View>

      {/* Metrics Grid */}
      <View className="p-4">
        <View className="flex-row flex-wrap">
          {/* Distance */}
          <View className="w-1/2 mb-3 pr-2">
            <View className="flex-row items-center mb-1">
              <MapPin size={14} color="#64748b" />
              <Text className="text-dark-400 text-xs ml-1.5">Distance</Text>
            </View>
            <Text className="text-white text-lg font-bold">
              {formatDistance(distance)}
            </Text>
          </View>

          {/* Duration */}
          <View className="w-1/2 mb-3 pl-2">
            <View className="flex-row items-center mb-1">
              <Clock size={14} color="#64748b" />
              <Text className="text-dark-400 text-xs ml-1.5">Time</Text>
            </View>
            <Text className="text-white text-lg font-bold">
              {formatDuration(duration)}
            </Text>
          </View>

          {/* Elevation Gain */}
          {elevationGain !== undefined && elevationGain > 0 && (
            <View className="w-1/2 mb-3 pr-2">
              <View className="flex-row items-center mb-1">
                <Mountain size={14} color="#64748b" />
                <Text className="text-dark-400 text-xs ml-1.5">Elevation</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {formatElevation(elevationGain)}
              </Text>
            </View>
          )}

          {/* Pace (for runs) or Speed (for rides) */}
          {averagePace && (
            <View className="w-1/2 mb-3 pl-2">
              <View className="flex-row items-center mb-1">
                <TrendingUp size={14} color="#64748b" />
                <Text className="text-dark-400 text-xs ml-1.5">Pace</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {formatPace(averagePace)}
              </Text>
            </View>
          )}

          {averageSpeed && !averagePace && (
            <View className="w-1/2 mb-3 pl-2">
              <View className="flex-row items-center mb-1">
                <TrendingUp size={14} color="#64748b" />
                <Text className="text-dark-400 text-xs ml-1.5">Speed</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {averageSpeed.toFixed(1)} km/h
              </Text>
            </View>
          )}

          {/* Calories */}
          {calories && (
            <View className="w-1/2 mb-3">
              <View className="flex-row items-center mb-1">
                <Zap size={14} color="#64748b" />
                <Text className="text-dark-400 text-xs ml-1.5">Calories</Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {calories} kcal
              </Text>
            </View>
          )}
        </View>

        {/* View on Strava Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 rounded-xl mt-2"
          style={{ backgroundColor: STRAVA_ORANGE }}
          onPress={handleViewOnStrava}
          activeOpacity={0.8}
        >
          <Text className="text-white font-semibold mr-2">View on Strava</Text>
          <ExternalLink size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Strava Branding Footer */}
      <View 
        className="px-4 py-2 flex-row items-center justify-center"
        style={{ backgroundColor: `${STRAVA_ORANGE}10` }}
      >
        <Text style={{ color: STRAVA_ORANGE }} className="text-xs font-medium">
          Powered by Strava
        </Text>
      </View>
    </View>
  );
}

