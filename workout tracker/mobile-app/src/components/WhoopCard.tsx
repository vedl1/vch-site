import React from 'react';
import { View, Text } from 'react-native';
import { Heart, Activity, Zap } from 'lucide-react-native';
import { WhoopData } from '../types';

interface WhoopCardProps {
  data: WhoopData | null;
}

export function WhoopCard({ data }: WhoopCardProps) {
  if (!data || !data.connected) {
    return (
      <View className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
        <View className="flex-row items-center mb-3">
          <View className="w-8 h-8 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
            <Activity size={18} color="#00bcd4" />
          </View>
          <Text className="text-white font-semibold text-lg">Whoop</Text>
        </View>
        <Text className="text-dark-400 text-sm">
          {data?.error || 'Not connected'}
        </Text>
      </View>
    );
  }

  const recoveryScore = data.recoveryScore;
  const getRecoveryColor = (score: number | null) => {
    if (!score) return 'text-dark-400';
    if (score >= 67) return 'text-green-400';
    if (score >= 34) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRecoveryBg = (score: number | null) => {
    if (!score) return 'bg-dark-700';
    if (score >= 67) return 'bg-green-500/20';
    if (score >= 34) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  return (
    <View className="bg-dark-800 rounded-2xl p-4 border border-dark-700">
      <View className="flex-row items-center mb-4">
        <View className="w-8 h-8 rounded-full bg-cyan-500/20 items-center justify-center mr-3">
          <Activity size={18} color="#00bcd4" />
        </View>
        <Text className="text-white font-semibold text-lg">Whoop Recovery</Text>
      </View>

      {recoveryScore !== null ? (
        <View className="flex-row items-center justify-between">
          <View className={`px-4 py-3 rounded-xl ${getRecoveryBg(recoveryScore)}`}>
            <Text className={`text-3xl font-bold ${getRecoveryColor(recoveryScore)}`}>
              {recoveryScore}%
            </Text>
            <Text className="text-dark-400 text-xs mt-1">Recovery</Text>
          </View>

          <View className="flex-1 ml-4">
            {data.restingHeartRate && (
              <View className="flex-row items-center mb-2">
                <Heart size={14} color="#ef4444" />
                <Text className="text-dark-300 text-sm ml-2">
                  {data.restingHeartRate} bpm RHR
                </Text>
              </View>
            )}
            {data.hrvRmssd && (
              <View className="flex-row items-center">
                <Zap size={14} color="#22c55e" />
                <Text className="text-dark-300 text-sm ml-2">
                  {Math.round(data.hrvRmssd)} ms HRV
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <Text className="text-dark-400 text-sm">
          {data.message || 'No recovery data yet'}
        </Text>
      )}
    </View>
  );
}
