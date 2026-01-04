import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { HEVY_COLORS } from './constants';

interface MuscleHeatmapProps {
  activeMuscles?: string[];
  size?: number;
  view?: 'front' | 'back';
}

// Simplified muscle group paths for the figure
const MUSCLE_PATHS = {
  front: {
    chest: 'M35 28 Q40 30 45 28 Q48 32 45 36 Q40 38 35 36 Q32 32 35 28',
    shoulders: 'M28 26 Q32 24 35 26 L35 32 Q32 34 28 32 Z M52 26 Q48 24 45 26 L45 32 Q48 34 52 32 Z',
    biceps: 'M26 32 Q28 36 26 42 Q24 40 24 36 Z M54 32 Q52 36 54 42 Q56 40 56 36 Z',
    abs: 'M36 38 L44 38 L44 54 L36 54 Z',
    quads: 'M32 56 L38 56 L36 72 L30 72 Z M42 56 L48 56 L50 72 L44 72 Z',
  },
  back: {
    traps: 'M35 22 Q40 20 45 22 L45 28 Q40 30 35 28 Z',
    lats: 'M30 30 Q35 32 35 42 L30 42 Z M50 30 Q45 32 45 42 L50 42 Z',
    lowerBack: 'M36 44 L44 44 L44 54 L36 54 Z',
    glutes: 'M32 56 L48 56 L48 64 L32 64 Z',
    hamstrings: 'M32 66 L38 66 L36 78 L30 78 Z M42 66 L48 66 L50 78 L44 78 Z',
  },
};

export function MuscleHeatmap({ activeMuscles = [], size = 60, view = 'front' }: MuscleHeatmapProps) {
  const scale = size / 80;
  const paths = MUSCLE_PATHS[view];

  const getMuscleColor = (muscle: string) => {
    if (activeMuscles.includes(muscle)) {
      return HEVY_COLORS.primary;
    }
    return HEVY_COLORS.border;
  };

  const getMuscleOpacity = (muscle: string) => {
    if (activeMuscles.includes(muscle)) {
      return 0.7;
    }
    return 0.3;
  };

  return (
    <View style={[styles.container, { width: size, height: size * 1.3 }]}>
      <Svg width={size} height={size * 1.3} viewBox="0 0 80 104">
        {/* Body outline */}
        <G transform={`scale(${scale})`}>
          {/* Head */}
          <Path
            d="M40 8 Q48 8 48 16 Q48 24 40 24 Q32 24 32 16 Q32 8 40 8"
            fill={HEVY_COLORS.border}
            opacity={0.3}
          />
          
          {/* Torso */}
          <Path
            d="M30 26 L50 26 L52 56 L28 56 Z"
            fill={HEVY_COLORS.border}
            opacity={0.2}
          />
          
          {/* Arms */}
          <Path
            d="M28 26 L24 48 L26 48 L30 28 Z M52 26 L56 48 L54 48 L50 28 Z"
            fill={HEVY_COLORS.border}
            opacity={0.2}
          />
          
          {/* Legs */}
          <Path
            d="M30 56 L28 88 L34 88 L38 56 Z M50 56 L52 88 L46 88 L42 56 Z"
            fill={HEVY_COLORS.border}
            opacity={0.2}
          />

          {/* Muscle groups */}
          {Object.entries(paths).map(([muscle, path]) => (
            <Path
              key={muscle}
              d={path}
              fill={getMuscleColor(muscle)}
              opacity={getMuscleOpacity(muscle)}
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

