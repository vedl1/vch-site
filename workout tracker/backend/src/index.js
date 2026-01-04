import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

import supabase from './config/supabase.js';
import SmartSeeder from './seeders/smartSeeder.js';
import StravaService from './services/stravaService.js';
import WhoopService from './services/whoopService.js';
import TokenManager from './services/tokenManager.js';
import WorkoutLogService from './services/workoutLogService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Temporary state storage for OAuth (in production, use Redis or database)
const oauthStates = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'fitness-tracker-api'
  });
});

// ============================================
// TEST WHOOP INTEGRATION
// ============================================
app.get('/api/test-whoop', async (req, res) => {
  const token = process.env.WHOOP_ACCESS_TOKEN;
  
  console.log('Testing Whoop integration...');
  console.log('Token present:', !!token);
  console.log('Token (first 10 chars):', token ? token.substring(0, 10) + '...' : 'N/A');

  if (!token) {
    return res.status(500).json({
      success: false,
      message: 'WHOOP_ACCESS_TOKEN not found in environment variables',
      debug: {
        envLoaded: !!process.env.PORT,
        tokenPresent: false,
      },
    });
  }

  try {
    // Direct API test without using the service class
    const response = await fetch('https://api.prod.whoop.com/developer/v1/user/profile/basic', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: 'Whoop API request failed',
        status: response.status,
        statusText: response.statusText,
        error: responseData,
        debug: {
          tokenUsed: token.substring(0, 10) + '...' + token.substring(token.length - 5),
          endpoint: 'https://api.prod.whoop.com/developer/v1/user/profile/basic',
        },
      });
    }

    res.json({
      success: true,
      message: 'Whoop connection successful!',
      data: responseData,
    });
  } catch (error) {
    console.error('Whoop test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to Whoop API',
      error: error.message,
    });
  }
});

// Test Whoop using the service class
app.get('/api/test-whoop-service', async (req, res) => {
  try {
    const token = process.env.WHOOP_ACCESS_TOKEN;
    console.log('Creating WhoopService with token:', token ? 'present' : 'missing');
    
    const whoop = new WhoopService(token);
    const profile = await whoop.getProfile();
    const recovery = await whoop.getTodayRecovery();

    res.json({
      success: true,
      profile,
      recovery,
      tokenInfo: {
        present: !!token,
        length: token ? token.length : 0,
      },
    });
  } catch (error) {
    console.error('Whoop service test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test Supabase connection
app.get('/api/db-status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('training_plan')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;

    res.json({
      status: 'connected',
      message: 'Supabase connection successful',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to Supabase',
      error: error.message,
    });
  }
});

// Seed database endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const csvPath = process.env.CSV_PATH || '../highlevel workoutplan  - Sheet1.csv';
    const resolvedPath = path.resolve(__dirname, '../', csvPath);
    
    console.log(`Seeding from: ${resolvedPath}`);
    
    const seeder = new SmartSeeder(resolvedPath);
    const result = await seeder.seed();

    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed database',
      error: error.message,
    });
  }
});

// ============================================
// MASTER DAY ENDPOINT (Phase 3)
// ============================================

// GET /api/day/:week/:day - Unified endpoint combining plan, checklist, Whoop, and Strava data
app.get('/api/day/:week/:day', async (req, res) => {
  const { week, day } = req.params;
  
  console.log(`📅 Fetching master data for Week ${week}, ${day}`);
  
  const result = {
    success: true,
    week: parseInt(week, 10),
    day,
    plan: null,
    checklist: [],
    dailyLog: null,
    whoop: null,
    strava: null,
    summary: {},
    fetchedAt: new Date().toISOString(),
  };

  try {
    // 1. Fetch the training plan for the specified week and day
    const { data: plan, error: planError } = await supabase
      .from('training_plan')
      .select('*')
      .eq('week', parseInt(week, 10))
      .ilike('day', day)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: `No workout found for Week ${week}, ${day}`,
        });
      }
      throw planError;
    }

    result.plan = {
      id: plan.id,
      week: plan.week,
      day: plan.day,
      primaryType: plan.primary_type,
      secondaryType: plan.secondary_type,
      description: plan.description,
      targetPaceLoad: plan.target_pace_load,
      durationMin: plan.duration_min,
    };

    // 2. Fetch the exercise checklist for this plan
    const { data: checklist, error: checklistError } = await supabase
      .from('exercise_checklists')
      .select('*')
      .eq('plan_id', plan.id)
      .order('id');

    if (checklistError) throw checklistError;

    result.checklist = (checklist || []).map(item => ({
      id: item.id,
      exerciseName: item.exercise_name,
      isCompleted: item.is_completed,
    }));

    // Calculate checklist progress
    const completedCount = result.checklist.filter(item => item.isCompleted).length;
    const totalCount = result.checklist.length;

    // 3. Fetch daily log if exists (contains Strava link)
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('plan_id', plan.id)
      .single();

    if (dailyLog) {
      result.dailyLog = {
        id: dailyLog.id,
        effortRating: dailyLog.effort_rating,
        whoopRecoveryScore: dailyLog.whoop_recovery_score,
        stravaActivityId: dailyLog.strava_activity_id,
        isDayComplete: dailyLog.is_day_complete,
        createdAt: dailyLog.created_at,
      };

      // If there's a Strava activity linked
      if (dailyLog.strava_activity_id) {
        result.strava = {
          activityId: dailyLog.strava_activity_id,
          linked: true,
        };
      }
    }

    // 4. Fetch Whoop recovery score (uses auto-refresh if token expired)
    try {
      const whoop = await WhoopService.createWithStoredCredentials();
      const recoveryResult = await whoop.getTodayRecovery();
      
      if (recoveryResult.success && recoveryResult.data) {
        result.whoop = {
          connected: true,
          recoveryScore: recoveryResult.data.recoveryScore,
          restingHeartRate: recoveryResult.data.restingHeartRate,
          hrvRmssd: recoveryResult.data.hrvRmssd,
          spo2Percentage: recoveryResult.data.spo2Percentage,
          updatedAt: recoveryResult.data.updatedAt,
        };
      } else {
        result.whoop = {
          connected: true,
          recoveryScore: null,
          message: recoveryResult.message || 'No recovery data for today',
        };
      }
    } catch (whoopError) {
      console.error('Whoop fetch error:', whoopError.message);
      result.whoop = {
        connected: false,
        error: whoopError.message,
      };
    }

    // 5. Build summary
    result.summary = {
      workoutType: plan.primary_type + (plan.secondary_type ? ` + ${plan.secondary_type}` : ''),
      duration: plan.duration_min,
      checklistProgress: {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
      isDayComplete: dailyLog?.is_day_complete || false,
      hasStravaActivity: !!dailyLog?.strava_activity_id,
      whoopRecovery: result.whoop?.recoveryScore || null,
    };

    res.json(result);

  } catch (error) {
    console.error('Error fetching master day data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch day data',
      error: error.message,
    });
  }
});

// ============================================
// WORKOUT PLAN ENDPOINTS
// ============================================

// GET /api/plan/:week/:day - Fetch workout and checklist for a specific day
app.get('/api/plan/:week/:day', async (req, res) => {
  try {
    const { week, day } = req.params;

    // Fetch the training plan for the specified week and day
    const { data: plan, error: planError } = await supabase
      .from('training_plan')
      .select('*')
      .eq('week', parseInt(week, 10))
      .ilike('day', day)
      .single();

    if (planError) {
      if (planError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: `No workout found for Week ${week}, ${day}`,
        });
      }
      throw planError;
    }

    // Fetch the exercise checklist for this plan
    const { data: checklist, error: checklistError } = await supabase
      .from('exercise_checklists')
      .select('*')
      .eq('plan_id', plan.id)
      .order('id');

    if (checklistError) throw checklistError;

    // Fetch daily log if exists
    const { data: dailyLog } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('plan_id', plan.id)
      .single();

    res.json({
      success: true,
      data: {
        plan,
        checklist: checklist || [],
        dailyLog: dailyLog || null,
      },
    });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout plan',
      error: error.message,
    });
  }
});

// PATCH /api/checklist/:id - Toggle completion status of an exercise
app.patch('/api/checklist/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    // If is_completed is provided, use it; otherwise toggle
    let newStatus = is_completed;

    if (typeof is_completed === 'undefined') {
      // Fetch current status
      const { data: current, error: fetchError } = await supabase
        .from('exercise_checklists')
        .select('is_completed')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      newStatus = !current.is_completed;
    }

    const { data, error } = await supabase
      .from('exercise_checklists')
      .update({ is_completed: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update exercise status',
      error: error.message,
    });
  }
});

// POST /api/daily-log/complete - Finalize the day
app.post('/api/daily-log/complete', async (req, res) => {
  try {
    const { plan_id, effort_rating, whoop_recovery_score, strava_activity_id } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'plan_id is required',
      });
    }

    // Check if a daily log already exists for this plan
    const { data: existingLog } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('plan_id', plan_id)
      .single();

    let result;

    if (existingLog) {
      // Update existing log
      const { data, error } = await supabase
        .from('daily_logs')
        .update({
          effort_rating: effort_rating || null,
          whoop_recovery_score: whoop_recovery_score || null,
          strava_activity_id: strava_activity_id || null,
          is_day_complete: true,
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({
          plan_id,
          effort_rating: effort_rating || null,
          whoop_recovery_score: whoop_recovery_score || null,
          strava_activity_id: strava_activity_id || null,
          is_day_complete: true,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      message: 'Day completed! Great work! 🌟',
      data: result,
      triggerAnimation: 'gold_star', // Signal to frontend to show celebration
    });
  } catch (error) {
    console.error('Error completing day:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete day',
      error: error.message,
    });
  }
});

// GET /api/plan/week/:week - Get all workouts for a specific week
app.get('/api/plan/week/:week', async (req, res) => {
  try {
    const { week } = req.params;

    const { data: plans, error } = await supabase
      .from('training_plan')
      .select(`
        *,
        exercise_checklists (*),
        daily_logs (*)
      `)
      .eq('week', parseInt(week, 10))
      .order('id');

    if (error) throw error;

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching week:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch week data',
      error: error.message,
    });
  }
});

// GET /api/progress - Get overall progress summary
app.get('/api/progress', async (req, res) => {
  try {
    // Get total training days
    const { count: totalDays } = await supabase
      .from('training_plan')
      .select('*', { count: 'exact', head: true });

    // Get completed days
    const { count: completedDays } = await supabase
      .from('daily_logs')
      .select('*', { count: 'exact', head: true })
      .eq('is_day_complete', true);

    // Get total exercises
    const { count: totalExercises } = await supabase
      .from('exercise_checklists')
      .select('*', { count: 'exact', head: true });

    // Get completed exercises
    const { count: completedExercises } = await supabase
      .from('exercise_checklists')
      .select('*', { count: 'exact', head: true })
      .eq('is_completed', true);

    res.json({
      success: true,
      data: {
        totalDays,
        completedDays: completedDays || 0,
        totalExercises,
        completedExercises: completedExercises || 0,
        dayProgress: totalDays ? ((completedDays || 0) / totalDays * 100).toFixed(1) : 0,
        exerciseProgress: totalExercises ? ((completedExercises || 0) / totalExercises * 100).toFixed(1) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress',
      error: error.message,
    });
  }
});

// ============================================
// DEBUG / DIAGNOSTIC ENDPOINTS
// ============================================

// GET /api/debug/auth-status - Check all stored tokens and their status
app.get('/api/debug/auth-status', async (req, res) => {
  try {
    const status = await TokenManager.getAuthStatus();
    
    // Add environment variable check
    status.environment = {
      strava: {
        clientId: process.env.STRAVA_CLIENT_ID ? parseInt(process.env.STRAVA_CLIENT_ID, 10) : null,
        hasSecret: !!process.env.STRAVA_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/api/auth/strava/callback',
      },
      whoop: {
        clientId: process.env.WHOOP_CLIENT_ID || null,
        hasSecret: !!process.env.WHOOP_CLIENT_SECRET,
        redirectUri: 'http://localhost:3000/api/auth/whoop/callback',
        hasEnvAccessToken: !!process.env.WHOOP_ACCESS_TOKEN,
      },
    };

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error fetching auth status:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ============================================
// STRAVA OAUTH ENDPOINTS
// ============================================

// GET /api/strava/auth - Get Strava authorization URL
app.get('/api/strava/auth', (req, res) => {
  const strava = new StravaService();
  const authUrl = strava.getAuthorizationUrl();
  const debugInfo = strava.getDebugInfo();
  
  res.json({
    success: true,
    authUrl,
    message: 'Visit this URL to authorize Strava access',
    debug: debugInfo,
  });
});

// GET /api/auth/strava/callback - OAuth callback handler (matches Strava Dashboard)
app.get('/api/auth/strava/callback', async (req, res) => {
  try {
    const { code, error: oauthError, scope } = req.query;

    console.log('Strava OAuth callback received:');
    console.log('  - code:', code ? 'present' : 'missing');
    console.log('  - error:', oauthError || 'none');
    console.log('  - scope:', scope);

    if (oauthError) {
      return res.status(400).json({
        success: false,
        message: 'Strava authorization denied',
        error: oauthError,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code provided',
      });
    }

    const strava = new StravaService();
    const result = await strava.exchangeCodeForToken(code);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to exchange code for token',
        error: result.error,
      });
    }

    // Tokens are automatically saved to database by the service
    res.json({
      success: true,
      message: 'Strava connected successfully! Tokens saved to database.',
      athlete: result.data.athlete,
    });
  } catch (error) {
    console.error('Strava callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete Strava authorization',
      error: error.message,
    });
  }
});

// Also keep the old callback path for backwards compatibility
app.get('/api/strava/callback', async (req, res) => {
  res.redirect(`/api/auth/strava/callback?${new URLSearchParams(req.query)}`);
});

// POST /api/strava/token - Manually set Strava access token (saves to DB)
app.post('/api/strava/token', async (req, res) => {
  const { access_token, refresh_token, expires_at } = req.body;

  if (!access_token) {
    return res.status(400).json({
      success: false,
      message: 'access_token is required',
    });
  }

  try {
    await TokenManager.saveCredentials(TokenManager.PROVIDERS.STRAVA, {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt: expires_at || null,
    });

    res.json({
      success: true,
      message: 'Strava token saved to database successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save Strava token',
      error: error.message,
    });
  }
});

// GET /api/strava/status - Check Strava connection status (from DB)
app.get('/api/strava/status', async (req, res) => {
  try {
    const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.STRAVA);
    
    if (!credentials || !credentials.accessToken) {
      return res.json({
        success: true,
        connected: false,
        message: 'Strava not connected. Visit /api/strava/auth to connect.',
      });
    }

    const isExpired = TokenManager.isExpired(credentials.expiresAt);

    // Try to get athlete info
    try {
      const strava = await StravaService.createWithStoredCredentials();
      const athlete = await strava.getAthlete();

      res.json({
        success: true,
        connected: true,
        isExpired,
        athlete: athlete.success ? athlete.data : null,
      });
    } catch (error) {
      res.json({
        success: true,
        connected: true,
        isExpired,
        message: 'Token stored but may need refresh',
        error: error.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/strava/activities - Get recent Strava activities (from DB tokens)
app.get('/api/strava/activities', async (req, res) => {
  try {
    const strava = await StravaService.createWithStoredCredentials();
    const result = await strava.getActivities({ perPage: 20 });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Format activities with human-readable values
    const formattedActivities = result.data.map(activity => ({
      ...activity,
      formattedDistance: StravaService.formatDistance(activity.distance),
      formattedPace: StravaService.formatPace(activity.averageSpeed),
      formattedDuration: StravaService.formatDuration(activity.movingTime),
    }));

    res.json({
      success: true,
      data: formattedActivities,
    });
  } catch (error) {
    console.error('Error fetching Strava activities:', error);
    res.status(500).json({
      success: false,
      message: error.message.includes('No Strava credentials') 
        ? 'Strava not connected. Visit /api/strava/auth to connect.'
        : 'Failed to fetch Strava activities',
      error: error.message,
    });
  }
});

// GET /api/strava/today - Get today's run activities (from DB tokens)
app.get('/api/strava/today', async (req, res) => {
  try {
    const strava = await StravaService.createWithStoredCredentials();
    const result = await strava.getTodayRuns();

    if (!result.success) {
      return res.status(500).json(result);
    }

    const formattedRuns = result.data.map(run => ({
      ...run,
      formattedDistance: StravaService.formatDistance(run.distance),
      formattedPace: StravaService.formatPace(run.averageSpeed),
      formattedDuration: StravaService.formatDuration(run.movingTime),
    }));

    res.json({
      success: true,
      data: formattedRuns,
    });
  } catch (error) {
    console.error('Error fetching today\'s runs:', error);
    res.status(500).json({
      success: false,
      message: error.message.includes('No Strava credentials')
        ? 'Strava not connected'
        : 'Failed to fetch runs',
      error: error.message,
    });
  }
});

// ============================================
// WHOOP OAUTH ENDPOINTS
// ============================================

// GET /api/auth/whoop - Get Whoop authorization URL
// Returns a simple URL string you can copy-paste into browser
app.get('/api/auth/whoop', (req, res) => {
  const whoop = new WhoopService();
  
  // Fixed scopes: offline (for refresh token) + recovery + workout
  const scopes = 'offline read:recovery read:workout';
  
  const { url: authUrl, state } = whoop.getAuthorizationUrl(undefined, scopes);
  
  // Store state (but we won't strictly validate it)
  oauthStates.set(state, { provider: 'whoop', createdAt: Date.now() });
  
  // Return plain text URL for easy copy-paste
  if (req.query.format === 'text') {
    res.type('text/plain').send(authUrl);
    return;
  }
  
  res.json({
    success: true,
    authUrl,
    copyPasteUrl: authUrl,
    message: 'Copy this URL and paste it in your browser:',
    scopes,
  });
});

// GET /api/auth/whoop/callback - OAuth callback handler
// State validation BYPASSED for localhost development
app.get('/api/auth/whoop/callback', async (req, res) => {
  try {
    const { code, error: oauthError, error_description } = req.query;

    console.log('Whoop OAuth callback received:');
    console.log('  - code:', code ? 'present' : 'missing');
    console.log('  - error:', oauthError || 'none');

    if (oauthError) {
      return res.status(400).json({
        success: false,
        message: 'Whoop authorization denied',
        error: oauthError,
        errorDescription: error_description,
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code provided',
      });
    }

    // Exchange code for tokens
    const whoop = new WhoopService();
    const result = await whoop.exchangeCodeForToken(code);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to exchange code for token',
        error: result.error,
      });
    }

    // Tokens are saved to auth_credentials table by exchangeCodeForToken()
    // Return detailed token info so user can see their refresh token
    res.json({
      success: true,
      message: '🎉 Whoop connected successfully! Tokens saved to database.',
      tokens: {
        accessToken: result.data.accessToken ? `${result.data.accessToken.substring(0, 20)}...` : null,
        refreshToken: result.data.refreshToken,
        expiresIn: result.data.expiresIn,
        expiresAt: result.data.expiresAt 
          ? new Date(result.data.expiresAt * 1000).toISOString() 
          : null,
        scope: result.data.scope,
      },
      note: 'Your tokens have been saved to the database. The API will now auto-refresh when needed.',
    });
  } catch (error) {
    console.error('Whoop callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete Whoop authorization',
      error: error.message,
    });
  }
});

// ============================================
// WHOOP ENDPOINTS
// ============================================

// POST /api/whoop/token - Manually set Whoop tokens (saves to DB)
app.post('/api/whoop/token', async (req, res) => {
  const { access_token, refresh_token, expires_at } = req.body;

  if (!access_token) {
    return res.status(400).json({
      success: false,
      message: 'access_token is required',
    });
  }

  try {
    await TokenManager.saveCredentials(TokenManager.PROVIDERS.WHOOP, {
      accessToken: access_token,
      refreshToken: refresh_token || null,
      expiresAt: expires_at || null,
    });

    res.json({
      success: true,
      message: 'Whoop token saved to database successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save Whoop token',
      error: error.message,
    });
  }
});

// GET /api/whoop/status - Check Whoop connection status
app.get('/api/whoop/status', async (req, res) => {
  try {
    const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.WHOOP);
    const envToken = process.env.WHOOP_ACCESS_TOKEN;

    res.json({
      success: true,
      database: {
        hasToken: !!credentials?.accessToken,
        hasRefreshToken: !!credentials?.refreshToken,
        isExpired: credentials ? TokenManager.isExpired(credentials.expiresAt) : null,
        tokenPreview: credentials?.accessToken 
          ? `${credentials.accessToken.substring(0, 8)}...${credentials.accessToken.slice(-4)}`
          : null,
      },
      environment: {
        hasToken: !!envToken,
        tokenPreview: envToken ? `${envToken.substring(0, 8)}...${envToken.slice(-4)}` : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/whoop/recovery - Get today's Whoop recovery score
app.get('/api/whoop/recovery', async (req, res) => {
  try {
    // Try to create service with stored credentials, fall back to env
    let whoop;
    try {
      whoop = await WhoopService.createWithStoredCredentials();
    } catch {
      // Fall back to environment token
      const envToken = process.env.WHOOP_ACCESS_TOKEN;
      if (!envToken) {
        return res.status(401).json({
          success: false,
          message: 'No Whoop credentials found. Set token via POST /api/whoop/token',
        });
      }
      whoop = new WhoopService(envToken);
    }

    const result = await whoop.getTodayRecovery();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Whoop recovery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Whoop recovery',
      error: error.message,
    });
  }
});

// GET /api/whoop/sleep - Get today's Whoop sleep data
app.get('/api/whoop/sleep', async (req, res) => {
  try {
    let whoop;
    try {
      whoop = await WhoopService.createWithStoredCredentials();
    } catch {
      const envToken = process.env.WHOOP_ACCESS_TOKEN;
      if (!envToken) {
        return res.status(401).json({
          success: false,
          message: 'No Whoop credentials found',
        });
      }
      whoop = new WhoopService(envToken);
    }

    const result = await whoop.getTodaySleep();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Whoop sleep:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Whoop sleep',
      error: error.message,
    });
  }
});

// GET /api/whoop/metrics - Get all Whoop daily metrics
app.get('/api/whoop/metrics', async (req, res) => {
  try {
    let whoop;
    try {
      whoop = await WhoopService.createWithStoredCredentials();
    } catch {
      const envToken = process.env.WHOOP_ACCESS_TOKEN;
      if (!envToken) {
        return res.status(401).json({
          success: false,
          message: 'No Whoop credentials found',
        });
      }
      whoop = new WhoopService(envToken);
    }

    const result = await whoop.getDailyMetrics();
    res.json(result);
  } catch (error) {
    console.error('Error fetching Whoop metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Whoop metrics',
      error: error.message,
    });
  }
});

// ============================================
// METRICS SYNC ENDPOINT
// ============================================

// GET /api/metrics/sync - Refresh data from Strava and Whoop (uses DB tokens)
app.get('/api/metrics/sync', async (req, res) => {
  const results = {
    strava: null,
    whoop: null,
    syncedAt: new Date().toISOString(),
  };

  // Fetch Whoop recovery
  try {
    let whoop;
    try {
      whoop = await WhoopService.createWithStoredCredentials();
    } catch {
      const envToken = process.env.WHOOP_ACCESS_TOKEN;
      if (envToken) {
        whoop = new WhoopService(envToken);
      }
    }

    if (whoop) {
      const whoopResult = await whoop.getTodayRecovery();
      results.whoop = {
        success: whoopResult.success,
        connected: true,
        recoveryScore: whoopResult.data?.recoveryScore || null,
        hrvRmssd: whoopResult.data?.hrvRmssd || null,
        restingHeartRate: whoopResult.data?.restingHeartRate || null,
        error: whoopResult.error || null,
      };
    } else {
      results.whoop = {
        success: false,
        connected: false,
        message: 'No Whoop credentials found. Set via POST /api/whoop/token',
      };
    }
  } catch (error) {
    results.whoop = {
      success: false,
      connected: false,
      error: error.message,
    };
  }

  // Fetch Strava latest run (from DB)
  try {
    const strava = await StravaService.createWithStoredCredentials();
    const stravaResult = await strava.getTodayRuns();
    
    if (stravaResult.success && stravaResult.data.length > 0) {
      const latestRun = stravaResult.data[0];
      results.strava = {
        success: true,
        connected: true,
        latestRun: {
          id: latestRun.id,
          name: latestRun.name,
          distance: latestRun.distance,
          formattedDistance: StravaService.formatDistance(latestRun.distance),
          pace: StravaService.formatPace(latestRun.averageSpeed),
          duration: StravaService.formatDuration(latestRun.movingTime),
          startDate: latestRun.startDateLocal,
          averageHeartrate: latestRun.averageHeartrate,
        },
      };
    } else {
      results.strava = {
        success: true,
        connected: true,
        latestRun: null,
        message: 'No runs found for today',
      };
    }
  } catch (error) {
    results.strava = {
      success: false,
      connected: false,
      message: error.message.includes('No Strava credentials')
        ? 'Strava not connected. Visit /api/strava/auth to connect.'
        : error.message,
    };
  }

  res.json({
    success: true,
    data: results,
  });
});

// POST /api/metrics/link - Link external metrics to a workout day
app.post('/api/metrics/link', async (req, res) => {
  try {
    const { plan_id, strava_activity_id, whoop_recovery_score } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'plan_id is required',
      });
    }

    // Check if daily log exists
    const { data: existingLog } = await supabase
      .from('daily_logs')
      .select('id')
      .eq('plan_id', plan_id)
      .single();

    let result;

    if (existingLog) {
      // Update existing log
      const updateData = {};
      if (strava_activity_id !== undefined) updateData.strava_activity_id = strava_activity_id;
      if (whoop_recovery_score !== undefined) updateData.whoop_recovery_score = whoop_recovery_score;

      const { data, error } = await supabase
        .from('daily_logs')
        .update(updateData)
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new log
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({
          plan_id,
          strava_activity_id: strava_activity_id || null,
          whoop_recovery_score: whoop_recovery_score || null,
          is_day_complete: false,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({
      success: true,
      message: 'Metrics linked successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error linking metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to link metrics',
      error: error.message,
    });
  }
});

// ============================================
// WORKOUT LOGS API
// ============================================

/**
 * POST /api/workouts/complete
 * Save a completed workout with exercises and sets
 */
app.post('/api/workouts/complete', async (req, res) => {
  try {
    const workoutData = req.body;
    
    if (!workoutData.routineName || !workoutData.exercises) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: routineName, exercises',
      });
    }

    const savedWorkout = await WorkoutLogService.saveWorkout(workoutData);

    res.json({
      success: true,
      message: 'Workout saved successfully! 💪',
      data: savedWorkout,
    });
  } catch (error) {
    console.error('Error saving workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save workout',
      error: error.message,
    });
  }
});

/**
 * GET /api/workouts/history
 * Get workout history with optional filters
 */
app.get('/api/workouts/history', async (req, res) => {
  try {
    const { limit, offset, startDate, endDate, routineId, workoutType } = req.query;

    const history = await WorkoutLogService.getWorkoutHistory({
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
      startDate,
      endDate,
      routineId,
      workoutType,
    });

    res.json({
      success: true,
      ...history,
    });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout history',
      error: error.message,
    });
  }
});

/**
 * GET /api/workouts/:id
 * Get a single workout by ID
 */
app.get('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await WorkoutLogService.getWorkoutById(id);

    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found',
      });
    }

    res.json({
      success: true,
      data: workout,
    });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/workouts/:id
 * Delete a workout
 */
app.delete('/api/workouts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await WorkoutLogService.deleteWorkout(id);

    res.json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout',
      error: error.message,
    });
  }
});

/**
 * GET /api/workouts/stats
 * Get workout statistics for a date range
 */
app.get('/api/stats/workouts', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await WorkoutLogService.getWorkoutStats(
      start.toISOString(),
      end.toISOString()
    );

    res.json({
      success: true,
      data: stats,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching workout stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout stats',
      error: error.message,
    });
  }
});

/**
 * GET /api/prs
 * Get personal records
 */
app.get('/api/prs', async (req, res) => {
  try {
    const { exercise } = req.query;
    const prs = await WorkoutLogService.getPersonalRecords(exercise);

    res.json({
      success: true,
      data: prs,
    });
  } catch (error) {
    console.error('Error fetching PRs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal records',
      error: error.message,
    });
  }
});

/**
 * GET /api/prs/recent
 * Get recent personal records
 */
app.get('/api/prs/recent', async (req, res) => {
  try {
    const { days } = req.query;
    const prs = await WorkoutLogService.getRecentPRs(days ? parseInt(days) : 30);

    res.json({
      success: true,
      data: prs,
    });
  } catch (error) {
    console.error('Error fetching recent PRs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent PRs',
      error: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🏋️  Fitness Tracker API
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server running on http://localhost:${PORT}
  📡 Health check: http://localhost:${PORT}/api/health
  🌱 Seed database: POST http://localhost:${PORT}/api/seed
  
  📊 External Integrations:
  ├─ Strava Auth: http://localhost:${PORT}/api/strava/auth
  ├─ Strava Callback: http://localhost:${PORT}/api/auth/strava/callback
  ├─ Whoop Auth: http://localhost:${PORT}/api/auth/whoop
  ├─ Whoop Callback: http://localhost:${PORT}/api/auth/whoop/callback
  └─ Sync All: http://localhost:${PORT}/api/metrics/sync
  
  💾 Workout Logs:
  ├─ Save Workout: POST http://localhost:${PORT}/api/workouts/complete
  ├─ Get History: GET http://localhost:${PORT}/api/workouts/history
  ├─ Get Stats: GET http://localhost:${PORT}/api/stats/workouts
  └─ Get PRs: GET http://localhost:${PORT}/api/prs
  
  🔧 Debug:
  └─ Auth Status: http://localhost:${PORT}/api/debug/auth-status
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;

