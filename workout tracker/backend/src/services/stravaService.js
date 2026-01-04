import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import TokenManager from './tokenManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

// Use parseInt to ensure client_id is a number
const STRAVA_CLIENT_ID = parseInt(process.env.STRAVA_CLIENT_ID, 10);
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;

// Use BACKEND_URL env var for production, fallback to localhost for dev
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const STRAVA_REDIRECT_URI = `${BACKEND_URL}/api/auth/strava/callback`;

/**
 * Strava Service - Handles OAuth and fetches run activities
 * With automatic token refresh and database storage
 */
class StravaService {
  constructor(accessToken = null) {
    this.accessToken = accessToken;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    this.clientId = STRAVA_CLIENT_ID;
    this.clientSecret = STRAVA_CLIENT_SECRET;
    this.redirectUri = STRAVA_REDIRECT_URI;
    this.retryCount = 0;
    this.maxRetries = 1;
  }

  /**
   * Initialize service with tokens from database
   */
  static async createWithStoredCredentials() {
    const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.STRAVA);
    
    if (!credentials) {
      throw new Error('No Strava credentials found. Please authenticate first.');
    }

    const service = new StravaService(credentials.accessToken);
    service.refreshToken = credentials.refreshToken;
    service.tokenExpiresAt = credentials.expiresAt;
    
    // Check if token is expired and refresh if needed
    if (TokenManager.isExpired(credentials.expiresAt)) {
      console.log('Strava token expired, attempting refresh...');
      await service.refreshAccessToken();
    }

    return service;
  }

  /**
   * Generate OAuth authorization URL
   * User needs to visit this URL to authorize the app
   */
  getAuthorizationUrl(redirectUri = this.redirectUri) {
    const params = new URLSearchParams({
      client_id: this.clientId.toString(), // Strava expects string in URL
      response_type: 'code',
      redirect_uri: redirectUri,
      approval_prompt: 'force',
      scope: 'read,activity:read,activity:read_all',
    });

    const url = `${STRAVA_AUTH_URL}?${params}`;
    
    console.log('Generated Strava auth URL with:');
    console.log('  - client_id:', this.clientId, `(type: ${typeof this.clientId})`);
    console.log('  - redirect_uri:', redirectUri);
    
    return url;
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from OAuth callback
   */
  async exchangeCodeForToken(code) {
    try {
      console.log('Exchanging Strava code for token...');
      console.log('  - client_id:', this.clientId, `(type: ${typeof this.clientId})`);
      
      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId, // Number type
          client_secret: this.clientSecret,
          code,
          grant_type: 'authorization_code',
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
        console.error('Strava token exchange failed:', data);
        throw new Error(`Token exchange failed (${response.status}): ${JSON.stringify(data)}`);
      }

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiresAt = data.expires_at;

      // Save to database
      await TokenManager.saveCredentials(TokenManager.PROVIDERS.STRAVA, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      });

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
          athlete: data.athlete,
        },
      };
    } catch (error) {
      console.error('Error exchanging Strava code for token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresh the access token using refresh token
   * @param {string} refreshToken - Refresh token to use
   */
  async refreshAccessToken(refreshToken = this.refreshToken) {
    // Try to get refresh token from database if not provided
    if (!refreshToken) {
      const credentials = await TokenManager.getCredentials(TokenManager.PROVIDERS.STRAVA);
      if (credentials?.refreshToken) {
        refreshToken = credentials.refreshToken;
      } else {
        throw new Error('No refresh token available. Please re-authenticate with Strava.');
      }
    }

    try {
      console.log('Refreshing Strava access token...');
      
      const response = await fetch(STRAVA_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId, // Number type
          client_secret: this.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiresAt = data.expires_at;

      // Save to database
      await TokenManager.saveCredentials(TokenManager.PROVIDERS.STRAVA, {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      });

      console.log('✅ Strava token refreshed successfully');

      return {
        success: true,
        data: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: data.expires_at,
        },
      };
    } catch (error) {
      console.error('Error refreshing Strava token:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Set access token for API calls
   * @param {string} token - Access token
   */
  setAccessToken(token) {
    this.accessToken = token;
  }

  /**
   * Make authenticated request to Strava API with automatic retry on 401
   */
  async request(endpoint, options = {}) {
    if (!this.accessToken) {
      throw new Error('No access token. Please authenticate with Strava first.');
    }

    const url = `${STRAVA_API_BASE}${endpoint}`;

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
      console.log('Strava API returned 401, attempting token refresh...');
      this.retryCount++;
      
      try {
        const refreshResult = await this.refreshAccessToken();
        if (refreshResult.success) {
          // Retry the request with new token
          return this.request(endpoint, options);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError.message);
      }
    }

    // Reset retry count on successful request
    this.retryCount = 0;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strava API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get authenticated athlete profile
   */
  async getAthlete() {
    try {
      const data = await this.request('/athlete');
      return {
        success: true,
        data: {
          id: data.id,
          firstName: data.firstname,
          lastName: data.lastname,
          city: data.city,
          state: data.state,
          country: data.country,
          profilePicture: data.profile,
        },
      };
    } catch (error) {
      console.error('Error fetching Strava athlete:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get athlete activities with optional filters
   * @param {Object} options - Filter options
   * @param {number} options.before - Epoch timestamp (activities before this time)
   * @param {number} options.after - Epoch timestamp (activities after this time)
   * @param {number} options.page - Page number
   * @param {number} options.perPage - Results per page (max 200)
   */
  async getActivities({ before, after, page = 1, perPage = 30 } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (before) params.append('before', before.toString());
      if (after) params.append('after', after.toString());

      const data = await this.request(`/athlete/activities?${params}`);

      return {
        success: true,
        data: data.map(activity => ({
          id: activity.id,
          name: activity.name,
          type: activity.type,
          sportType: activity.sport_type,
          startDate: activity.start_date,
          startDateLocal: activity.start_date_local,
          timezone: activity.timezone,
          distance: activity.distance, // meters
          movingTime: activity.moving_time, // seconds
          elapsedTime: activity.elapsed_time, // seconds
          totalElevationGain: activity.total_elevation_gain,
          averageSpeed: activity.average_speed, // m/s
          maxSpeed: activity.max_speed,
          averageHeartrate: activity.average_heartrate,
          maxHeartrate: activity.max_heartrate,
          calories: activity.calories,
          sufferScore: activity.suffer_score,
          hasHeartrate: activity.has_heartrate,
          map: activity.map?.summary_polyline || null,
        })),
      };
    } catch (error) {
      console.error('Error fetching Strava activities:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a specific activity by ID
   * @param {string|number} activityId - Activity ID
   */
  async getActivity(activityId) {
    try {
      const data = await this.request(`/activities/${activityId}`);
      
      return {
        success: true,
        data: {
          id: data.id,
          name: data.name,
          description: data.description,
          type: data.type,
          sportType: data.sport_type,
          startDate: data.start_date,
          startDateLocal: data.start_date_local,
          timezone: data.timezone,
          distance: data.distance,
          movingTime: data.moving_time,
          elapsedTime: data.elapsed_time,
          totalElevationGain: data.total_elevation_gain,
          averageSpeed: data.average_speed,
          maxSpeed: data.max_speed,
          averageHeartrate: data.average_heartrate,
          maxHeartrate: data.max_heartrate,
          calories: data.calories,
          sufferScore: data.suffer_score,
          averageCadence: data.average_cadence,
          averageTemp: data.average_temp,
          splits: data.splits_metric,
          laps: data.laps,
          deviceName: data.device_name,
          embedToken: data.embed_token,
        },
      };
    } catch (error) {
      console.error('Error fetching Strava activity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get today's run activities
   * Fetches activities from the start of today (local time)
   */
  async getTodayRuns() {
    try {
      // Get start of today in epoch seconds
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const afterTimestamp = Math.floor(today.getTime() / 1000);

      const result = await this.getActivities({ after: afterTimestamp });
      
      if (!result.success) {
        return result;
      }

      // Filter for run activities only
      const runs = result.data.filter(activity => 
        activity.type === 'Run' || activity.sportType === 'Run'
      );

      return {
        success: true,
        data: runs,
        message: runs.length === 0 ? 'No run activities found for today' : null,
      };
    } catch (error) {
      console.error('Error fetching today\'s runs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the latest run activity (most recent)
   */
  async getLatestRun() {
    try {
      const result = await this.getActivities({ perPage: 50 });
      
      if (!result.success) {
        return result;
      }

      // Find the most recent run
      const latestRun = result.data.find(activity => 
        activity.type === 'Run' || activity.sportType === 'Run'
      );

      if (!latestRun) {
        return {
          success: true,
          data: null,
          message: 'No run activities found',
        };
      }

      return {
        success: true,
        data: latestRun,
      };
    } catch (error) {
      console.error('Error fetching latest run:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get runs for a specific date
   * @param {string} date - Date in YYYY-MM-DD format
   */
  async getRunsForDate(date) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const afterTimestamp = Math.floor(targetDate.getTime() / 1000);

      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const beforeTimestamp = Math.floor(nextDay.getTime() / 1000);

      const result = await this.getActivities({ 
        after: afterTimestamp, 
        before: beforeTimestamp 
      });
      
      if (!result.success) {
        return result;
      }

      // Filter for run activities only
      const runs = result.data.filter(activity => 
        activity.type === 'Run' || activity.sportType === 'Run'
      );

      return {
        success: true,
        data: runs,
        date,
      };
    } catch (error) {
      console.error('Error fetching runs for date:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format pace from m/s to min/km
   * @param {number} speedMs - Speed in meters per second
   */
  static formatPace(speedMs) {
    if (!speedMs || speedMs === 0) return 'N/A';
    
    const paceMinPerKm = 1000 / (speedMs * 60);
    const minutes = Math.floor(paceMinPerKm);
    const seconds = Math.round((paceMinPerKm - minutes) * 60);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  }

  /**
   * Format distance from meters to km
   * @param {number} meters - Distance in meters
   */
  static formatDistance(meters) {
    if (!meters) return 'N/A';
    return `${(meters / 1000).toFixed(2)} km`;
  }

  /**
   * Format duration from seconds to HH:MM:SS
   * @param {number} seconds - Duration in seconds
   */
  static formatDuration(seconds) {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get debug info about the service configuration
   */
  getDebugInfo() {
    return {
      clientId: this.clientId,
      clientIdType: typeof this.clientId,
      redirectUri: this.redirectUri,
      hasAccessToken: !!this.accessToken,
      hasRefreshToken: !!this.refreshToken,
      tokenExpiresAt: this.tokenExpiresAt,
    };
  }
}

export default StravaService;
