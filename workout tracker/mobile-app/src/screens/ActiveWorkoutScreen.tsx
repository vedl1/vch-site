import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, CheckCircle } from 'lucide-react-native';
import { ActiveWorkoutHeader } from '../components/ActiveWorkoutHeader';
import { ExerciseLoggingCard } from '../components/ExerciseLoggingCard';
import { RestTimerModal } from '../components/RestTimerModal';

type SetTag = 'none' | 'W' | 'F' | 'D';

interface SetData {
  id: string;
  weight: string;
  reps: string;
  tag: SetTag;
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: SetData[];
  isSuperset?: boolean;
  supersetGroupId?: string;
}

// Demo data
const initialExercises: Exercise[] = [
  {
    id: '1',
    name: 'Bench Press',
    muscleGroup: 'Chest',
    isSuperset: true,
    supersetGroupId: 'ss1',
    sets: [
      { id: '1-1', weight: '', reps: '', tag: 'W', isCompleted: false, previousWeight: 60, previousReps: 12 },
      { id: '1-2', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 80, previousReps: 10 },
      { id: '1-3', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 80, previousReps: 8 },
      { id: '1-4', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 85, previousReps: 6 },
    ],
  },
  {
    id: '2',
    name: 'Incline Dumbbell Fly',
    muscleGroup: 'Chest',
    isSuperset: true,
    supersetGroupId: 'ss1',
    sets: [
      { id: '2-1', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 14, previousReps: 12 },
      { id: '2-2', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 14, previousReps: 12 },
      { id: '2-3', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 14, previousReps: 10 },
    ],
  },
  {
    id: '3',
    name: 'Overhead Tricep Extension',
    muscleGroup: 'Triceps',
    sets: [
      { id: '3-1', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 25, previousReps: 12 },
      { id: '3-2', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 25, previousReps: 10 },
      { id: '3-3', weight: '', reps: '', tag: 'D', isCompleted: false, previousWeight: 20, previousReps: 12 },
    ],
  },
  {
    id: '4',
    name: 'Lateral Raises',
    muscleGroup: 'Shoulders',
    sets: [
      { id: '4-1', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 10, previousReps: 15 },
      { id: '4-2', weight: '', reps: '', tag: 'none', isCompleted: false, previousWeight: 10, previousReps: 15 },
      { id: '4-3', weight: '', reps: '', tag: 'F', isCompleted: false, previousWeight: 10, previousReps: 12 },
    ],
  },
];

interface ActiveWorkoutScreenProps {
  onClose?: () => void;
}

export function ActiveWorkoutScreen({ onClose }: ActiveWorkoutScreenProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(90);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Workout timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused]);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetUpdate = (exerciseId: string, setId: string, field: string, value: any) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map((set) => {
              if (set.id === setId) {
                const updated = { ...set, [field]: value };
                // Auto-trigger rest timer when completing a set
                if (field === 'isCompleted' && value === true) {
                  setTimeout(() => setShowRestTimer(true), 300);
                }
                return updated;
              }
              return set;
            }),
          };
        }
        return ex;
      })
    );
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const newSetId = `${exerciseId}-${ex.sets.length + 1}`;
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: newSetId,
                weight: '',
                reps: '',
                tag: 'none' as SetTag,
                isCompleted: false,
                previousWeight: lastSet?.previousWeight,
                previousReps: lastSet?.previousReps,
              },
            ],
          };
        }
        return ex;
      })
    );
  };

  const getSupersetPosition = (exercise: Exercise, index: number): 'first' | 'middle' | 'last' | 'only' => {
    if (!exercise.isSuperset) return 'only';
    
    const supersetExercises = exercises.filter(e => e.supersetGroupId === exercise.supersetGroupId);
    const posInSuperset = supersetExercises.findIndex(e => e.id === exercise.id);
    
    if (supersetExercises.length === 1) return 'only';
    if (posInSuperset === 0) return 'first';
    if (posInSuperset === supersetExercises.length - 1) return 'last';
    return 'middle';
  };

  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isCompleted).length,
    0
  );

  return (
    <SafeAreaView className="flex-1 bg-dark-950" edges={['top']}>
      <ActiveWorkoutHeader
        workoutName="Push Day"
        elapsedTime={formatElapsedTime(elapsedSeconds)}
        isPaused={isPaused}
        onClose={onClose || (() => {})}
        onPauseToggle={() => setIsPaused(!isPaused)}
        onMore={() => {}}
      />

      <ScrollView 
        className="flex-1 px-4 pt-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {exercises.map((exercise, index) => (
          <View key={exercise.id} className="mb-4">
            <ExerciseLoggingCard
              exerciseName={exercise.name}
              muscleGroup={exercise.muscleGroup}
              sets={exercise.sets}
              isSuperset={exercise.isSuperset}
              supersetPosition={getSupersetPosition(exercise, index)}
              unit="kg"
              onSetUpdate={(setId, field, value) => 
                handleSetUpdate(exercise.id, setId, field, value)
              }
              onAddSet={() => handleAddSet(exercise.id)}
              restTimerSeconds={restDuration}
              onStartRestTimer={() => setShowRestTimer(true)}
            />
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-4 bg-dark-800 rounded-2xl border-2 border-dashed border-dark-600 mb-8"
          activeOpacity={0.7}
        >
          <Plus size={20} color="#22c55e" />
          <Text className="text-green-500 font-semibold ml-2">Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Finish Workout Button */}
      <View className="px-4 py-4 bg-dark-900 border-t border-dark-800">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-dark-400">Progress</Text>
          <Text className="text-white font-semibold">{completedSets}/{totalSets} sets</Text>
        </View>
        <TouchableOpacity
          className="bg-green-500 py-4 rounded-xl flex-row items-center justify-center"
          activeOpacity={0.8}
          onPress={onClose}
        >
          <CheckCircle size={22} color="#ffffff" />
          <Text className="text-white font-bold text-lg ml-2">Finish Workout</Text>
        </TouchableOpacity>
      </View>

      {/* Rest Timer Modal */}
      <RestTimerModal
        visible={showRestTimer}
        initialSeconds={restDuration}
        onClose={() => setShowRestTimer(false)}
        onComplete={() => setShowRestTimer(false)}
      />
    </SafeAreaView>
  );
}

