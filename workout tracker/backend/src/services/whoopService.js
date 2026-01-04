import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import TokenManager from './tokenManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v1';
const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';

const WHOOP_CLIENT_ID = process.env.WHOOP_CLIENT_ID;
const WHOOP_CLIENT_SECRET = process.env.WHOOP_CLIENT_SECRET;
const WHOOP_REDIRECT_URI = 'http://localhost:3000/api/auth/whoop/callback';

/**
 * Whoop Service - Fetches recovery and health metrics from Whoop API
 * Includes automatic token refresh on 401 errors
 */
class WhoopService {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
    this.refreshToken = null;
    this.baseUrl = WHOOP_API_BASE;
    this.clientId = WHOOP_CLIENT_ID;
    this.clientSecret = WHOOP_CLIENT_SECRET;
    this.redirectUri = WHOOP_REDIRECT_URI;
    this.retryCount = 0;
    this.maxRetries = 1;
  }

  /**
   * Generate a random state string for OAuth CSRF protection
   */
  static generateState() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate OAuth authorization URL
   * Scopes: offline (for refresh token), read:recovery, read:workout
   */
  getAuthorizationUrl(redirectUri = this.redirectUri, scopes = null) {
    // Default scopes - 'offline' is required to get a refresh token
    const defaultScopes = 'offline read:recovery read:workout';
    const oauthState = WhoopService.generateState();
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes || defaultScopes,
      state: oauthState,
    });

    const url = `${WHOOP_AUTH_URL}?${params}`;
    
    console.log('Generated Whoop auth URL:');
    console.log('  - client_id:', this.clientId);
    console.log('  - redirect_uri:', redirectUri);
    console.log('  - scope:', scopes || defaultScopes);
    
    return { url, state: oauthState };
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   */
  async exchangeCodeForToken(code) {
    try {
      console.log('Exchanging Whoop code for token...');
      console.log('  - client_id:', this.clientId);
      console.log('  - redirect_uri:', this.redirectUri);

      const response = await fetch(WHOOP_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
        }),
      });

      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(`Invalid response: ${responseText}`);
      }

      if (!response.ok) {
        console.error('Whoop token exchange failed:', data);
        throw new Error(`Token exchange failed (${response.status}): ${JSON.stringify(data)}`);
      }

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;

      // Calculate expiration time
      const expiresAt = data.expires_in 
        ? Math.floor(Date.now() / 1000) + data.expires_in 
        : null;

      // Save to database
      await TokenManager.saveCredentials(TokenManager.PROVIDERS.WHOOP, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      });

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
          expiresAt,
          tokenType: data.token_type,
          scope: data.scope,
        },
      };
    } catch (error) {
      console.error('Error exchanging Whoop code for token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get debug info about the service configuration
   */
  getDebugInfo() {
    return {
      clientId: this.clientId,
      redirectUri: this.redirectUri,
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
    };
  }

  /**
   * Initialize service with tokens from database
   */
  static async createWithStoredCredentials() {
    const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.WHOOP);
    
    if (!credentials) {
      // Fall back to env token if no stored credentials
      const envToken = process.env.WHOOP_ACCESS_TOKEN;
      if (envToken) {
        console.log('Using Whoop token from environment');
        const service = new WhoopService(envToken);
        return service;
      }
      throw new Error('No Whoop credentials found. Please authenticate first.');
    }

    const service = new WhoopService(credentials.accessToken);
    service.refreshToken = credentials.refreshToken;
    
    // Check if token is expired and refresh if needed
    if (TokenManager.isExpired(credentials.expiresAt)) {
      console.log('Whoop token expired, attempting refresh...');
      await service.refreshAccessToken();
    }

    return service;
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken() {
    if (!this.refreshToken) {
      // Try to get refresh token from database
      const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.WHOOP);
      if (credentials?.refreshToken) {
        this.refreshToken = credentials.refreshToken;
      } else {
        throw new Error('No refresh token available. Please re-authenticate with Whoop at /api/auth/whoop');
      }
    }

    try {
      console.log('Refreshing Whoop access token...');
      
      const response = await fetch(WHOOP_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      // Update instance tokens
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token || this.refreshToken;

      // Save to database
      await TokenManager.saveCredentials(TokenManager.PROVIDERS.WHOOP, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.refreshToken,
        expiresAt: data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null,
      });

      console.log('✅ Whoop token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Failed to refresh Whoop token:', error.message);
      throw error;
    }
  }

  /**
   * Make authenticated request to Whoop API with automatic retry on 401
   */
  async request(endpoint, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate with Whoop first.');
    }

    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && this.retryCount < this.maxRetries) {
      console.log('Whoop API returned 401, attempting token refresh...');
      this.retryCount++;
      
      try {
        await this.refreshAccessToken();
        // Retry the request with new token
        return this.request(endpoint, options);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
        throw new Error(`Authentication failed: ${refreshError.message}`);
      }
    }

    // Reset retry count on successful request
    this.retryCount = 0;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whoop API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get user profile information
   */
  async getProfile() {
    try {
      const data = await this.request('/user/profile/basic');
      return {
        success: true,
        data: {
          userId: data.user_id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
        },
      };
    } catch (error) {
      console.error('Error fetching Whoop profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get recovery data for a specific date range
   * @param {string} startDate - ISO date string (YYYY-MM-DD)
   * @param {string} endDate - ISO date string (YYYY-MM-DD)
   */
  async getRecoveryRange(startDate, endDate) {
    try {
      const params = new URLSearchParams({
        start: `${startDate}T00:00:00.000Z`,
        end: `${endDate}T23:59:59.999Z`,
      });

      const data = await this.request(`/recovery?${params}`);
      
      return {
        success: true,
        data: data.records || [],
      };
    } catch (error) {
      console.error('Error fetching Whoop recovery range:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get today's recovery score
   * Returns the most recent recovery score
   */
  async getTodayRecovery() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        start: `${startDate}T00:00:00.000Z`,
        end: `${endDate}T23:59:59.999Z`,
        limit: '1',
      });

      const data = await this.request(`/recovery?${params}`);
      
      if (data.records && data.records.length > 0) {
        const latestRecovery = data.records[0];
        return {
          success: true,
          data: {
            cycleId: latestRecovery.cycle_id,
            sleepId: latestRecovery.sleep_id,
            recoveryScore: latestRecovery.score?.recovery_score || null,
            restingHeartRate: latestRecovery.score?.resting_heart_rate || null,
            hrvRmssd: latestRecovery.score?.hrv_rmssd_milli || null,
            spo2Percentage: latestRecovery.score?.spo2_percentage || null,
            skinTempCelsius: latestRecovery.score?.skin_temp_celsius || null,
            createdAt: latestRecovery.created_at,
            updatedAt: latestRecovery.updated_at,
          },
        };
      }

      return {
        success: true,
        data: null,
        message: 'No recovery data found for today',
      };
    } catch (error) {
      console.error('Error fetching today\'s Whoop recovery:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get sleep data for today
   */
  async getTodaySleep() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const startDate = yesterday.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        start: `${startDate}T00:00:00.000Z`,
        end: `${endDate}T23:59:59.999Z`,
        limit: '1',
      });

      const data = await this.request(`/activity/sleep?${params}`);
      
      if (data.records && data.records.length > 0) {
        const latestSleep = data.records[0];
        return {
          success: true,
          data: {
            sleepId: latestSleep.id,
            start: latestSleep.start,
            end: latestSleep.end,
            timezoneOffset: latestSleep.timezone_offset,
            nap: latestSleep.nap,
            qualityDuration: latestSleep.score?.stage_summary?.total_in_bed_time_milli,
            sleepEfficiency: latestSleep.score?.sleep_efficiency_percentage,
            respiratoryRate: latestSleep.score?.respiratory_rate,
            sleepConsistency: latestSleep.score?.sleep_consistency_percentage,
          },
        };
      }

      return {
        success: true,
        data: null,
        message: 'No sleep data found for today',
      };
    } catch (error) {
      console.error('Error fetching today\'s Whoop sleep:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get workout/strain data for today
   */
  async getTodayWorkouts() {
    try {
      const today = new Date();
      const startDate = today.toISOString().split('T')[0];

      const params = new URLSearchParams({
        start: `${startDate}T00:00:00.000Z`,
        end: `${startDate}T23:59:59.999Z`,
      });

      const data = await this.request(`/activity/workout?${params}`);
      
      return {
        success: true,
        data: (data.records || []).map(workout => ({
          workoutId: workout.id,
          start: workout.start,
          end: workout.end,
          sportId: workout.sport_id,
          strain: workout.score?.strain,
          averageHeartRate: workout.score?.average_heart_rate,
          maxHeartRate: workout.score?.max_heart_rate,
          caloriesBurned: workout.score?.kilojoule * 0.239, // Convert kJ to kcal
          distanceMeters: workout.score?.distance_meter,
        })),
      };
    } catch (error) {
      console.error('Error fetching today\'s Whoop workouts:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get comprehensive daily metrics (recovery + sleep + strain)
   */
  async getDailyMetrics() {
    const [recovery, sleep, workouts] = await Promise.all([
      this.getTodayRecovery(),
      this.getTodaySleep(),
      this.getTodayWorkouts(),
    ]);

    return {
      success: true,
      data: {
        recovery: recovery.success ? recovery.data : null,
        sleep: sleep.success ? sleep.data : null,
        workouts: workouts.success ? workouts.data : [],
        fetchedAt: new Date().toISOString(),
      },
      errors: {
        recovery: recovery.success ? null : recovery.error,
        sleep: sleep.success ? null : sleep.error,
        workouts: workouts.success ? null : workouts.error,
      },
    };
  }
}

export default WhoopService;
