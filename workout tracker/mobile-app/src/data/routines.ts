import { SetType } from '../components/cards/WorkoutCard/types';

export type WorkoutType = 'strength' | 'run' | 'hyrox' | 'rest' | 'core' | 'race';

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroups: string[];
  defaultSets: number;
  minSets?: number;
  maxSets?: number;
  defaultReps: string; // Can be "8-10" or "20" or "20-30s" for timed
  defaultWeight?: number; // in kg
  isTimedExercise?: boolean; // For exercises measured in seconds
  isUnilateral?: boolean; // For exercises done per side
  hasWarmupSet?: boolean; // Primary compound lifts get warmup tag
  notes?: string; // Additional instructions
}

export interface RunSegment {
  type: 'warmup' | 'tempo' | 'interval' | 'easy' | 'cooldown' | 'stride';
  duration?: string; // e.g., "2 min", "10 min"
  distance?: string; // e.g., "200m", "1km"
  pace?: string; // e.g., "7:10-7:25/km"
  reps?: number; // e.g., 6 for "6x2 min"
  rest?: string; // e.g., "2 min easy jog"
}

export interface RoutineTemplate {
  id: string;
  name: string;
  day: string;
  workoutType: WorkoutType;
  secondaryType?: WorkoutType;
  muscleGroups: string[];
  exercises?: ExerciseTemplate[];
  runSegments?: RunSegment[];
  description?: string;
  paceNotes?: string;
  estimatedDuration: string;
  lastPerformed?: string;
  week?: number; // For week-specific progressions
  isDeload?: boolean;
  isTaper?: boolean;
}

// Generate sets from template
export function generateSetsFromTemplate(
  exercise: ExerciseTemplate,
  exerciseId: string
): Array<{
  id: string;
  setNumber: number;
  type: SetType;
  weight: string;
  reps: string;
  previousWeight?: number;
  previousReps?: number;
  isCompleted: boolean;
  isTimedSet?: boolean;
}> {
  const sets = [];
  const numSets = exercise.defaultSets;
  
  // Parse default reps (handle ranges like "8-10")
  const defaultReps = exercise.defaultReps.split('-')[0].replace('s', ''); // Take lower bound
  
  for (let i = 0; i < numSets; i++) {
    sets.push({
      id: `${exerciseId}-set-${i + 1}`,
      setNumber: i + 1,
      type: (exercise.hasWarmupSet && i === 0 ? 'warmup' : 'working') as SetType,
      weight: exercise.defaultWeight?.toString() || '',
      reps: exercise.isTimedExercise ? '' : '',
      previousWeight: exercise.defaultWeight,
      previousReps: parseInt(defaultReps) || undefined,
      isCompleted: false,
      isTimedSet: exercise.isTimedExercise,
    });
  }
  
  return sets;
}

// ============================================
// ROUTINE DEFINITIONS FROM CSV
// ============================================

export const ROUTINES: RoutineTemplate[] = [
  // ----------------------------------------
  // MONDAY - REST DAY
  // ----------------------------------------
  {
    id: 'monday-rest',
    name: 'Rest Day',
    day: 'Monday',
    workoutType: 'rest',
    muscleGroups: [],
    description: 'Rest day; optional light walking and mobility',
    estimatedDuration: '20-40 min',
  },

  // ----------------------------------------
  // TUESDAY - RUN + CORE
  // ----------------------------------------
  {
    id: 'tuesday-run',
    name: 'Tempo Intervals',
    day: 'Tuesday',
    workoutType: 'run',
    secondaryType: 'core',
    muscleGroups: ['cardio', 'legs'],
    runSegments: [
      { type: 'warmup', duration: '10 min', pace: '8:15-8:45/km' },
      { type: 'tempo', duration: '2 min', reps: 6, pace: '7:10-7:25/km', rest: '2 min easy jog' },
      { type: 'cooldown', duration: '8-10 min', pace: '8:15-8:45/km' },
    ],
    paceNotes: 'Tempo @ 7:10–7:25/km; Easy @ 8:00–8:45/km',
    estimatedDuration: '45-50 min',
    description: '6×2 min at Tempo with 2 min easy jog between',
  },
  {
    id: 'tuesday-core',
    name: 'Core Circuit',
    day: 'Tuesday',
    workoutType: 'core',
    muscleGroups: ['abs', 'lowerBack'],
    exercises: [
      {
        id: 'dead-bugs',
        name: 'Dead Bugs',
        muscleGroups: ['abs'],
        defaultSets: 3,
        defaultReps: '10',
        isUnilateral: true,
      },
      {
        id: 'side-planks',
        name: 'Side Planks',
        muscleGroups: ['abs', 'obliques'],
        defaultSets: 2,
        defaultReps: '30s',
        isTimedExercise: true,
        isUnilateral: true,
      },
      {
        id: 'bird-dogs',
        name: 'Bird Dogs',
        muscleGroups: ['abs', 'lowerBack'],
        defaultSets: 3,
        defaultReps: '10',
        isUnilateral: true,
      },
    ],
    estimatedDuration: '10-15 min',
    description: 'Bodyweight core work, RPE 6–7/10',
  },

  // ----------------------------------------
  // WEDNESDAY - LOWER STRENGTH + HYROX STATIONS
  // ----------------------------------------
  {
    id: 'lower-day',
    name: 'Lower Day',
    day: 'Wednesday',
    workoutType: 'strength',
    secondaryType: 'hyrox',
    muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'],
    estimatedDuration: '45-55 min',
    exercises: [
      {
        id: 'back-squat',
        name: 'Back Squat (Barbell)',
        muscleGroups: ['quads', 'glutes'],
        defaultSets: 3,
        minSets: 3,
        maxSets: 4,
        defaultReps: '6-8',
        hasWarmupSet: true,
      },
      {
        id: 'romanian-deadlift',
        name: 'Romanian Deadlift (Barbell)',
        muscleGroups: ['hamstrings', 'glutes', 'lowerBack'],
        defaultSets: 3,
        defaultReps: '8-10',
        hasWarmupSet: true,
      },
      {
        id: 'walking-lunges',
        name: 'Walking Lunges',
        muscleGroups: ['quads', 'glutes'],
        defaultSets: 3,
        defaultReps: '20',
        isUnilateral: true,
        notes: '20 steps total',
      },
      {
        id: 'calf-raises',
        name: 'Calf Raises',
        muscleGroups: ['calves'],
        defaultSets: 3,
        defaultReps: '12-15',
      },
    ],
    paceNotes: 'Strength RPE 7-8/10',
  },
  {
    id: 'wednesday-hyrox',
    name: 'Hyrox Stations',
    day: 'Wednesday',
    workoutType: 'hyrox',
    muscleGroups: ['fullBody', 'cardio'],
    exercises: [
      {
        id: 'skierg',
        name: 'SkiErg',
        muscleGroups: ['back', 'shoulders', 'cardio'],
        defaultSets: 3,
        defaultReps: '200m',
        notes: '200 meters per round',
      },
      {
        id: 'sled-push',
        name: 'Sled Push',
        muscleGroups: ['quads', 'glutes'],
        defaultSets: 3,
        defaultReps: '15-20m',
        notes: 'Light to moderate load',
      },
      {
        id: 'sled-pull',
        name: 'Sled Pull',
        muscleGroups: ['back', 'biceps'],
        defaultSets: 3,
        defaultReps: '15-20m',
        notes: 'Light to moderate load',
      },
      {
        id: 'farmer-carry',
        name: 'Farmer Carry',
        muscleGroups: ['forearms', 'core'],
        defaultSets: 3,
        defaultReps: '20-30m',
        notes: '2 carries per round',
      },
    ],
    estimatedDuration: '15-20 min',
    description: '2-3 rounds of Hyrox stations',
    paceNotes: 'Easy-moderate effort',
  },

  // ----------------------------------------
  // THURSDAY - RUN + UPPER STRENGTH
  // ----------------------------------------
  {
    id: 'thursday-run',
    name: 'Tempo Run',
    day: 'Thursday',
    workoutType: 'run',
    muscleGroups: ['cardio', 'legs'],
    runSegments: [
      { type: 'warmup', duration: '10-12 min', pace: '8:15-8:45/km' },
      { type: 'tempo', duration: '10 min', reps: 2, pace: '7:10-7:25/km', rest: '3 min easy jog' },
      { type: 'cooldown', duration: '8-10 min', pace: '8:15-8:45/km' },
    ],
    paceNotes: 'Tempo @ 7:10–7:25/km; Easy @ 8:00–8:45/km',
    estimatedDuration: '45-55 min',
    description: '2×10 min Tempo with 3 min easy jog between',
  },
  {
    id: 'upper-day',
    name: 'Upper Day',
    day: 'Thursday',
    workoutType: 'strength',
    muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
    estimatedDuration: '40-50 min',
    exercises: [
      {
        id: 'bench-press',
        name: 'Bench Press (Barbell)',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        defaultSets: 3,
        defaultReps: '6-8',
        hasWarmupSet: true,
      },
      {
        id: 'lat-pulldown',
        name: 'Pull-ups / Lat Pulldown',
        muscleGroups: ['lats', 'back', 'biceps'],
        defaultSets: 3,
        defaultReps: '6-10',
      },
      {
        id: 'single-arm-db-row',
        name: 'Single-arm Dumbbell Row',
        muscleGroups: ['lats', 'back'],
        defaultSets: 3,
        defaultReps: '8-10',
        isUnilateral: true,
      },
      {
        id: 'overhead-press',
        name: 'Overhead Press (Barbell)',
        muscleGroups: ['shoulders', 'triceps'],
        defaultSets: 3,
        defaultReps: '6-8',
      },
      {
        id: 'face-pulls',
        name: 'Face Pulls',
        muscleGroups: ['shoulders', 'back'],
        defaultSets: 3,
        minSets: 2,
        maxSets: 3,
        defaultReps: '12-15',
      },
    ],
    paceNotes: 'Strength RPE 7-8/10',
  },

  // ----------------------------------------
  // FRIDAY - REST DAY
  // ----------------------------------------
  {
    id: 'friday-rest',
    name: 'Rest Day',
    day: 'Friday',
    workoutType: 'rest',
    muscleGroups: [],
    description: 'Rest day; optional light walking, stretching or yoga',
    estimatedDuration: '20-40 min',
  },

  // ----------------------------------------
  // SATURDAY - UPPER & CORE + HYROX COMPROMISED
  // ----------------------------------------
  {
    id: 'saturday-upper-core',
    name: 'Saturday: Upper & Core',
    day: 'Saturday',
    workoutType: 'strength',
    secondaryType: 'hyrox',
    muscleGroups: ['chest', 'back', 'shoulders', 'abs'],
    estimatedDuration: '40-50 min',
    exercises: [
      {
        id: 'incline-db-press',
        name: 'Incline Dumbbell Press',
        muscleGroups: ['chest', 'shoulders'],
        defaultSets: 3,
        defaultReps: '8-10',
        defaultWeight: 22,
      },
      {
        id: 'seated-row',
        name: 'Seated Row (Cable)',
        muscleGroups: ['back', 'lats'],
        defaultSets: 3,
        defaultReps: '10-12',
        defaultWeight: 30,
      },
      {
        id: 'db-shoulder-press',
        name: 'Dumbbell Shoulder Press',
        muscleGroups: ['shoulders'],
        defaultSets: 3,
        minSets: 2,
        maxSets: 3,
        defaultReps: '8-10',
        defaultWeight: 14,
      },
      {
        id: 'pallof-press',
        name: 'Pallof Press',
        muscleGroups: ['abs'],
        defaultSets: 2,
        defaultReps: '10',
        isUnilateral: true,
      },
      {
        id: 'hollow-hold',
        name: 'Hollow Hold',
        muscleGroups: ['abs'],
        defaultSets: 2,
        defaultReps: '20-30s',
        isTimedExercise: true,
      },
    ],
  },
  {
    id: 'saturday-hyrox',
    name: 'Hyrox Compromised',
    day: 'Saturday',
    workoutType: 'hyrox',
    muscleGroups: ['fullBody', 'cardio'],
    exercises: [
      {
        id: 'hyrox-run',
        name: 'Run',
        muscleGroups: ['cardio', 'legs'],
        defaultSets: 3,
        defaultReps: '1km',
        notes: 'Target pace: 7:00-7:30/km',
      },
      {
        id: 'hyrox-row',
        name: 'Row',
        muscleGroups: ['back', 'cardio'],
        defaultSets: 3,
        defaultReps: '500m',
      },
      {
        id: 'hyrox-lunges',
        name: 'Walking Lunges',
        muscleGroups: ['quads', 'glutes'],
        defaultSets: 3,
        defaultReps: '20',
      },
      {
        id: 'hyrox-wall-balls',
        name: 'Wall Balls',
        muscleGroups: ['quads', 'shoulders'],
        defaultSets: 3,
        defaultReps: '15',
      },
    ],
    estimatedDuration: '25-30 min',
    description: '3 rounds with 2-3 min rest between',
    paceNotes: 'Run @ 7:00-7:30/km; Stations RPE ~7/10',
  },

  // ----------------------------------------
  // SUNDAY - LONG RUN
  // ----------------------------------------
  {
    id: 'sunday-long-run',
    name: 'Long Run',
    day: 'Sunday',
    workoutType: 'run',
    muscleGroups: ['cardio', 'legs'],
    runSegments: [
      { type: 'warmup', duration: '10 min', pace: '8:15-8:45/km' },
      { type: 'easy', duration: '45-50 min', pace: '8:00-8:45/km' },
      { type: 'cooldown', duration: '5-10 min', pace: '8:30-9:00/km' },
    ],
    paceNotes: 'Easy @ 8:00–8:45/km; optional gentle pick-up last 10-15 min',
    estimatedDuration: '55-70 min',
    description: 'Long run continuous easy',
  },
];

// Get routine by ID
export function getRoutineById(id: string): RoutineTemplate | undefined {
  return ROUTINES.find(r => r.id === id);
}

// Get routines for a specific day
export function getRoutinesForDay(day: string): RoutineTemplate[] {
  return ROUTINES.filter(r => r.day.toLowerCase() === day.toLowerCase());
}

// Get only strength routines
export function getStrengthRoutines(): RoutineTemplate[] {
  return ROUTINES.filter(r => r.workoutType === 'strength');
}

// Get only run routines
export function getRunRoutines(): RoutineTemplate[] {
  return ROUTINES.filter(r => r.workoutType === 'run');
}

// Get only hyrox routines
export function getHyroxRoutines(): RoutineTemplate[] {
  return ROUTINES.filter(r => r.workoutType === 'hyrox');
}

// Check if day is rest day
export function isRestDay(day: string): boolean {
  const routines = getRoutinesForDay(day);
  return routines.length === 1 && routines[0].workoutType === 'rest';
}

// Format reps display (e.g., "8-10" or "20 steps" or "30s")
export function formatRepsDisplay(exercise: ExerciseTemplate): string {
  if (exercise.isTimedExercise) {
    return exercise.defaultReps;
  }
  if (exercise.isUnilateral && exercise.name.includes('Lunge')) {
    return `${exercise.defaultReps} steps`;
  }
  if (exercise.isUnilateral) {
    return `${exercise.defaultReps}/side`;
  }
  return exercise.defaultReps;
}

// Format sets display (e.g., "3x" or "3-4x")
export function formatSetsDisplay(exercise: ExerciseTemplate): string {
  if (exercise.minSets && exercise.maxSets && exercise.minSets !== exercise.maxSets) {
    return `${exercise.minSets}-${exercise.maxSets}×`;
  }
  return `${exercise.defaultSets}×`;
}

// Get workout type icon name
export function getWorkoutTypeIcon(type: WorkoutType): string {
  switch (type) {
    case 'run': return 'running';
    case 'strength': return 'dumbbell';
    case 'hyrox': return 'flame';
    case 'core': return 'target';
    case 'rest': return 'moon';
    case 'race': return 'trophy';
    default: return 'activity';
  }
}

// Get workout type color
export function getWorkoutTypeColor(type: WorkoutType): string {
  switch (type) {
    case 'run': return '#34C759'; // Green
    case 'strength': return '#007AFF'; // Blue
    case 'hyrox': return '#FF9500'; // Orange
    case 'core': return '#AF52DE'; // Purple
    case 'rest': return '#8E8E93'; // Gray
    case 'race': return '#FFD700'; // Gold
    default: return '#007AFF';
  }
}
