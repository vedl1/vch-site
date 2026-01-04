import supabase from '../config/supabase.js';

/**
 * Service for managing workout logs
 */
class WorkoutLogService {
  /**
   * Save a completed workout with all exercises and sets
   */
  async saveWorkout(workoutData) {
    const {
      routineId,
      routineName,
      workoutType = 'strength',
      startedAt,
      completedAt,
      durationSeconds,
      exercises,
      notes,
      effortRating,
      stravaActivityId,
      whoopWorkoutId,
    } = workoutData;

    // Calculate totals
    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.isCompleted && set.weight && set.reps) {
          totalVolume += parseFloat(set.weight) * parseInt(set.reps);
          totalReps += parseInt(set.reps);
        }
        if (set.isCompleted) {
          totalSets++;
        }
      });
    });

    // Start transaction by inserting workout log
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        routine_id: routineId,
        routine_name: routineName,
        workout_type: workoutType,
        started_at: startedAt,
        completed_at: completedAt || new Date().toISOString(),
        duration_seconds: durationSeconds,
        total_volume: totalVolume,
        total_sets: totalSets,
        total_reps: totalReps,
        notes,
        effort_rating: effortRating,
        strava_activity_id: stravaActivityId,
        whoop_workout_id: whoopWorkoutId,
      })
      .select()
      .single();

    if (workoutError) {
      console.error('Error saving workout log:', workoutError);
      throw new Error(`Failed to save workout: ${workoutError.message}`);
    }

    // Insert exercise logs
    const exerciseLogs = [];
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      
      const { data: exerciseLog, error: exerciseError } = await supabase
        .from('exercise_logs')
        .insert({
          workout_log_id: workoutLog.id,
          exercise_id: exercise.id,
          exercise_name: exercise.name,
          exercise_order: i,
          is_superset: exercise.isSuperset || false,
          superset_group_id: exercise.supersetGroupId,
          notes: exercise.notes,
        })
        .select()
        .single();

      if (exerciseError) {
        console.error('Error saving exercise log:', exerciseError);
        continue;
      }

      // Insert set logs for this exercise
      const setLogs = exercise.sets
        .filter(set => set.isCompleted)
        .map((set, setIndex) => ({
          exercise_log_id: exerciseLog.id,
          set_number: set.setNumber || setIndex + 1,
          set_type: set.type || 'working',
          weight: set.weight ? parseFloat(set.weight) : null,
          reps: set.reps ? parseInt(set.reps) : null,
          duration_seconds: set.durationSeconds,
          is_completed: true,
          rpe: set.rpe,
          notes: set.notes,
        }));

      if (setLogs.length > 0) {
        const { data: insertedSets, error: setsError } = await supabase
          .from('set_logs')
          .insert(setLogs)
          .select();

        if (setsError) {
          console.error('Error saving set logs:', setsError);
        } else {
          // Check for PRs
          await this.checkAndSavePersonalRecords(exercise.name, insertedSets);
        }
      }

      exerciseLogs.push({
        ...exerciseLog,
        sets: setLogs,
      });
    }

    return {
      ...workoutLog,
      exercises: exerciseLogs,
    };
  }

  /**
   * Check for personal records and save them
   */
  async checkAndSavePersonalRecords(exerciseName, sets) {
    for (const set of sets) {
      if (!set.weight || !set.reps) continue;

      // Check if this is a new PR for this exercise at this rep range
      const { data: existingPR } = await supabase
        .from('personal_records')
        .select('*')
        .eq('exercise_name', exerciseName)
        .eq('record_type', 'weight')
        .eq('reps', set.reps)
        .single();

      if (!existingPR || set.weight > existingPR.value) {
        // New PR!
        await supabase
          .from('personal_records')
          .upsert({
            exercise_name: exerciseName,
            record_type: 'weight',
            value: set.weight,
            reps: set.reps,
            set_log_id: set.id,
            achieved_at: new Date().toISOString(),
            previous_value: existingPR?.value,
          }, {
            onConflict: 'exercise_name,record_type,reps',
          });

        // Mark the set as a PR
        await supabase
          .from('set_logs')
          .update({ is_pr: true })
          .eq('id', set.id);
      }
    }
  }

  /**
   * Get workout history with pagination
   */
  async getWorkoutHistory(options = {}) {
    const {
      limit = 20,
      offset = 0,
      startDate,
      endDate,
      routineId,
      workoutType,
    } = options;

    let query = supabase
      .from('workout_logs')
      .select(`
        *,
        exercise_logs (
          *,
          set_logs (*)
        )
      `)
      .order('completed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (startDate) {
      query = query.gte('completed_at', startDate);
    }
    if (endDate) {
      query = query.lte('completed_at', endDate);
    }
    if (routineId) {
      query = query.eq('routine_id', routineId);
    }
    if (workoutType) {
      query = query.eq('workout_type', workoutType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching workout history:', error);
      throw new Error(`Failed to fetch workout history: ${error.message}`);
    }

    return {
      workouts: data || [],
      total: count,
      limit,
      offset,
    };
  }

  /**
   * Get a single workout by ID
   */
  async getWorkoutById(workoutId) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select(`
        *,
        exercise_logs (
          *,
          set_logs (*)
        )
      `)
      .eq('id', workoutId)
      .single();

    if (error) {
      console.error('Error fetching workout:', error);
      throw new Error(`Failed to fetch workout: ${error.message}`);
    }

    return data;
  }

  /**
   * Get workout statistics for a date range
   */
  async getWorkoutStats(startDate, endDate) {
    const { data: workouts, error } = await supabase
      .from('workout_logs')
      .select('*')
      .gte('completed_at', startDate)
      .lte('completed_at', endDate);

    if (error) {
      console.error('Error fetching workout stats:', error);
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }

    const stats = {
      totalWorkouts: workouts.length,
      totalVolume: workouts.reduce((sum, w) => sum + (parseFloat(w.total_volume) || 0), 0),
      totalSets: workouts.reduce((sum, w) => sum + (w.total_sets || 0), 0),
      totalReps: workouts.reduce((sum, w) => sum + (w.total_reps || 0), 0),
      totalDuration: workouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0),
      avgDuration: workouts.length > 0 
        ? workouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) / workouts.length 
        : 0,
      avgEffort: workouts.filter(w => w.effort_rating).length > 0
        ? workouts.reduce((sum, w) => sum + (w.effort_rating || 0), 0) / workouts.filter(w => w.effort_rating).length
        : 0,
      workoutsByType: {},
    };

    // Group by workout type
    workouts.forEach(w => {
      const type = w.workout_type || 'other';
      stats.workoutsByType[type] = (stats.workoutsByType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Get personal records
   */
  async getPersonalRecords(exerciseName = null) {
    let query = supabase
      .from('personal_records')
      .select('*')
      .order('achieved_at', { ascending: false });

    if (exerciseName) {
      query = query.eq('exercise_name', exerciseName);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching personal records:', error);
      throw new Error(`Failed to fetch PRs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get recent PRs (last N days)
   */
  async getRecentPRs(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('personal_records')
      .select('*')
      .gte('achieved_at', startDate.toISOString())
      .order('achieved_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent PRs:', error);
      throw new Error(`Failed to fetch recent PRs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a workout log
   */
  async deleteWorkout(workoutId) {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', workoutId);

    if (error) {
      console.error('Error deleting workout:', error);
      throw new Error(`Failed to delete workout: ${error.message}`);
    }

    return { success: true };
  }
}

export default new WorkoutLogService();

