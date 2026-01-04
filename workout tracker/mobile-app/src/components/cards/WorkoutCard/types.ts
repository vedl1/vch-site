export type SetType = 'warmup' | 'working' | 'failure' | 'drop';
export type CardMode = 'preview' | 'history' | 'active';

export interface SetData {
  id: string;
  setNumber: number;
  type: SetType;
  weight: string;
  reps: string;
  previousWeight?: number;
  previousReps?: number;
  isCompleted: boolean;
}

export interface ExerciseData {
  id: string;
  name: string;
  sets: SetData[];
  isSuperset?: boolean;
  supersetWith?: string;
  muscleGroups?: string[];
}

export interface WorkoutStats {
  volume: number; // in KG
  duration: number; // in minutes
  prs: number; // personal records count
}

export interface WorkoutCardProps {
  mode: CardMode;
  title: string;
  lastPerformed?: string;
  duration?: string;
  exercises: ExerciseData[];
  stats?: WorkoutStats;
  isStravaLinked?: boolean;
  stravaActivityId?: string;
  muscleHeatmap?: {
    front: string[];
    back: string[];
  };
  onStartWorkout?: () => void;
  onExercisePress?: (exerciseId: string) => void;
  onSetUpdate?: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'type' | 'isCompleted', value: any) => void;
  onAddSet?: (exerciseId: string) => void;
}

