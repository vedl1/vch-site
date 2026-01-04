import { DayData, ChecklistItem } from '../types';
import { Platform } from 'react-native';

// Use your machine's IP for iOS Simulator, localhost for web
const getApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3000/api';
  }
  // For iOS Simulator and Android Emulator
  return 'http://192.168.1.100:3000/api';
};

const API_BASE_URL = getApiUrl();

// Types for workout logs
export interface SetLog {
  setNumber: number;
  type: 'warmup' | 'working' | 'failure' | 'drop';
  weight: string;
  reps: string;
  durationSeconds?: number;
  isCompleted: boolean;
  rpe?: number;
  notes?: string;
}

export interface ExerciseLog {
  id: string;
  name: string;
  sets: SetLog[];
  isSuperset?: boolean;
  supersetGroupId?: string;
  notes?: string;
}

export interface WorkoutLogInput {
  routineId?: string;
  routineName: string;
  workoutType?: 'strength' | 'run' | 'hyrox' | 'core';
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  exercises: ExerciseLog[];
  notes?: string;
  effortRating?: number;
  stravaActivityId?: string;
  whoopWorkoutId?: string;
}

export interface WorkoutLog {
  id: string;
  routine_id: string;
  routine_name: string;
  workout_type: string;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  total_volume: number;
  total_sets: number;
  total_reps: number;
  effort_rating?: number;
  strava_activity_id?: string;
  exercise_logs?: Array<{
    id: string;
    exercise_name: string;
    exercise_order: number;
    is_superset: boolean;
    set_logs?: Array<{
      id: string;
      set_number: number;
      set_type: string;
      weight: number;
      reps: number;
      is_completed: boolean;
      is_pr: boolean;
    }>;
  }>;
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalDuration: number;
  avgDuration: number;
  avgEffort: number;
  workoutsByType: Record<string, number>;
}

export interface PersonalRecord {
  id: string;
  exercise_name: string;
  record_type: string;
  value: number;
  reps?: number;
  achieved_at: string;
  previous_value?: number;
}

export interface WhoopMetrics {
  recovery: {
    recoveryScore: number | null;
    restingHeartRate: number | null;
    hrvRmssd: number | null;
    spo2Percentage: number | null;
  } | null;
  sleep: {
    qualityDuration: number | null;
    sleepEfficiency: number | null;
    respiratoryRate: number | null;
  } | null;
  workouts: Array<{
    strain: number | null;
    averageHeartRate: number | null;
    maxHeartRate: number | null;
    caloriesBurned: number | null;
  }>;
  fetchedAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async getDayData(week: number, day: string): Promise<DayData> {
    const response = await fetch(`${this.baseUrl}/day/${week}/${day}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch day data: ${response.statusText}`);
    }
    return response.json();
  }

  async toggleChecklistItem(id: string): Promise<ChecklistItem> {
    const response = await fetch(`${this.baseUrl}/checklist/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to toggle checklist: ${response.statusText}`);
    }
    const data = await response.json();
    return data.data;
  }

  async completeDay(planId: string, effortRating: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/daily-log/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        effort_rating: effortRating,
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to complete day: ${response.statusText}`);
    }
  }

  async syncMetrics(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/metrics/sync`);
    if (!response.ok) {
      throw new Error(`Failed to sync metrics: ${response.statusText}`);
    }
    return response.json();
  }

  async getLatestStravaActivity(): Promise<{
    id: string;
    name: string;
    distance: number;
    type: string;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/strava/today`);
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      if (data.activities && data.activities.length > 0) {
        const activity = data.activities[0];
        return {
          id: activity.id?.toString(),
          name: activity.name,
          distance: activity.distance,
          type: activity.type,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getStravaActivities(limit: number = 10): Promise<{
    activities: Array<{
      id: string;
      name: string;
      type: string;
      distance: number;
      moving_time: number;
      total_elevation_gain?: number;
      average_speed?: number;
      start_date: string;
      calories?: number;
    }>;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/strava/activities?limit=${limit}`);
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      // Backend returns { success: true, data: [...] }, transform to expected format
      if (result.success && result.data) {
        return { activities: result.data };
      }
      return null;
    } catch {
      return null;
    }
  }

  // ============================================
  // WORKOUT LOGS API
  // ============================================

  /**
   * Save a completed workout
   */
  async saveWorkout(workout: WorkoutLogInput): Promise<{ success: boolean; data?: WorkoutLog; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/workouts/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workout),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, message: data.message || 'Failed to save workout' };
      }
      
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error saving workout:', error);
      return { success: false, message: 'Network error while saving workout' };
    }
  }

  /**
   * Get workout history
   */
  async getWorkoutHistory(options: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    routineId?: string;
    workoutType?: string;
  } = {}): Promise<{ workouts: WorkoutLog[]; total?: number } | null> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.routineId) params.append('routineId', options.routineId);
      if (options.workoutType) params.append('workoutType', options.workoutType);

      const response = await fetch(`${this.baseUrl}/workouts/history?${params.toString()}`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return { workouts: data.workouts || [], total: data.total };
    } catch (error) {
      console.error('Error fetching workout history:', error);
      return null;
    }
  }

  /**
   * Get a single workout by ID
   */
  async getWorkoutById(id: string): Promise<WorkoutLog | null> {
    try {
      const response = await fetch(`${this.baseUrl}/workouts/${id}`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching workout:', error);
      return null;
    }
  }

  /**
   * Delete a workout
   */
  async deleteWorkout(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/workouts/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting workout:', error);
      return false;
    }
  }

  /**
   * Get workout statistics
   */
  async getWorkoutStats(startDate?: string, endDate?: string): Promise<WorkoutStats | null> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${this.baseUrl}/stats/workouts?${params.toString()}`);
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching workout stats:', error);
      return null;
    }
  }

  /**
   * Get personal records
   */
  async getPersonalRecords(exercise?: string): Promise<PersonalRecord[]> {
    try {
      const params = new URLSearchParams();
      if (exercise) params.append('exercise', exercise);

      const response = await fetch(`${this.baseUrl}/prs?${params.toString()}`);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching PRs:', error);
      return [];
    }
  }

  /**
   * Get recent personal records
   */
  async getRecentPRs(days: number = 30): Promise<PersonalRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/prs/recent?days=${days}`);
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching recent PRs:', error);
      return [];
    }
  }

  // ============================================
  // WHOOP METRICS API
  // ============================================

  /**
   * Get Whoop daily metrics (recovery, sleep, strain)
   */
  async getWhoopMetrics(): Promise<WhoopMetrics | null> {
    try {
      const response = await fetch(`${this.baseUrl}/whoop/metrics`);
      
      if (!response.ok) {
        return null;
      }
      
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error fetching Whoop metrics:', error);
      return null;
    }
  }

  /**
   * Get Whoop recovery score
   */
  async getWhoopRecovery(): Promise<{ recoveryScore: number | null; restingHeartRate: number | null } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/whoop/recovery`);
      
      if (!response.ok) {
        return null;
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        return {
          recoveryScore: result.data.recoveryScore,
          restingHeartRate: result.data.restingHeartRate,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching Whoop recovery:', error);
      return null;
    }
  }
}

export const api = new ApiService();
export default api;
