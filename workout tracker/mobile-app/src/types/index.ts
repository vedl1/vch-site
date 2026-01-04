export interface Plan {
  id: string;
  week: number;
  day: string;
  primaryType: string;
  secondaryType: string | null;
  description: string;
  targetPaceLoad: string;
  durationMin: string;
}

export interface ChecklistItem {
  id: string;
  exerciseName: string;
  isCompleted: boolean;
}

export interface DailyLog {
  id: string;
  effortRating: number | null;
  whoopRecoveryScore: number | null;
  stravaActivityId: string | null;
  isDayComplete: boolean;
  createdAt: string;
}

export interface WhoopData {
  connected: boolean;
  recoveryScore: number | null;
  restingHeartRate?: number | null;
  hrvRmssd?: number | null;
  message?: string;
  error?: string;
}

export interface StravaData {
  activityId: string;
  linked: boolean;
}

export interface Summary {
  workoutType: string;
  duration: string;
  checklistProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  isDayComplete: boolean;
  hasStravaActivity: boolean;
  whoopRecovery: number | null;
}

export interface DayData {
  success: boolean;
  week: number;
  day: string;
  plan: Plan | null;
  checklist: ChecklistItem[];
  dailyLog: DailyLog | null;
  whoop: WhoopData | null;
  strava: StravaData | null;
  summary: Summary;
  fetchedAt: string;
}
