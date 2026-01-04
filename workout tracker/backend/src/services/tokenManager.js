import supabase from '../config/supabase.js';

/**
 * TokenManager - Handles OAuth token storage, retrieval, and refresh logic
 * Stores tokens in Supabase auth_credentials table
 */
class TokenManager {
  static PROVIDERS = {
    STRAVA: 'strava',
    WHOOP: 'whoop',
  };

  /**
   * Get stored credentials for a provider
   * @param {string} provider - Provider name ('strava' or 'whoop')
   * @returns {Object} Credentials object or null
   */
  static async getCredentials(provider) {
    try {
      const { data, error } = await supabase
        .from('auth_credentials')
        .select('*')
        .eq('provider_name', provider)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No record found
          return null;
        }
        throw error;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at ? new Date(data.expires_at) : null,
        updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      };
    } catch (error) {
      console.error(`Error fetching ${provider} credentials:`, error);
      return null;
    }
  }

  /**
   * Store or update credentials for a provider
   * @param {string} provider - Provider name
   * @param {Object} credentials - Token credentials
   */
  static async saveCredentials(provider, { accessToken, refreshToken, expiresAt }) {
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('auth_credentials')
        .select('id')
        .eq('provider_name', provider)
        .single();

      const credentialData = {
        provider_name: provider,
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_at: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
      };

      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('auth_credentials')
          .update({
            access_token: accessToken,
            refresh_token: refreshToken || existing.refresh_token,
            expires_at: credentialData.expires_at,
          })
          .eq('provider_name', provider)
          .select()
          .single();

        if (error) throw error;
        console.log(`✅ Updated ${provider} credentials`);
        return data;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('auth_credentials')
          .insert(credentialData)
          .select()
          .single();

        if (error) throw error;
        console.log(`✅ Saved new ${provider} credentials`);
        return data;
      }
    } catch (error) {
      console.error(`Error saving ${provider} credentials:`, error);
      throw error;
    }
  }

  /**
   * Delete credentials for a provider
   * @param {string} provider - Provider name
   */
  static async deleteCredentials(provider) {
    try {
      const { error } = await supabase
        .from('auth_credentials')
        .delete()
        .eq('provider_name', provider);

      if (error) throw error;
      console.log(`🗑️ Deleted ${provider} credentials`);
      return true;
    } catch (error) {
      console.error(`Error deleting ${provider} credentials:`, error);
      return false;
    }
  }

  /**
   * Check if a token is expired
   * @param {Date|string|number} expiresAt - Expiration timestamp
   * @param {number} bufferSeconds - Buffer time before actual expiry (default 5 min)
   */
  static isExpired(expiresAt, bufferSeconds = 300) {
    if (!expiresAt) return true;
    
    const expiryTime = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
    const now = new Date();
    const bufferMs = bufferSeconds * 1000;
    
    return (expiryTime.getTime() - bufferMs) <= now.getTime();
  }

  /**
   * Get auth status for all providers
   * Returns detailed status for debugging
   */
  static async getAuthStatus() {
    const status = {
      strava: null,
      whoop: null,
      timestamp: new Date().toISOString(),
    };

    // Check Strava
    const stravaCreds = await this.getCredentials(this.PROVIDERS.STRAVA);
    if (stravaCreds) {
      status.strava = {
        hasAccessToken: !!stravaCreds.accessToken,
        hasRefreshToken: !!stravaCreds.refreshToken,
        expiresAt: stravaCreds.expiresAt?.toISOString() || null,
        isExpired: this.isExpired(stravaCreds.expiresAt),
        lastUpdated: stravaCreds.updatedAt?.toISOString() || null,
        tokenPreview: stravaCreds.accessToken 
          ? `${stravaCreds.accessToken.substring(0, 8)}...${stravaCreds.accessToken.slice(-4)}`
          : null,
      };
    } else {
      status.strava = {
        hasAccessToken: false,
        hasRefreshToken: false,
        message: 'No credentials stored',
      };
    }

    // Check Whoop
    const whoopCreds = await this.getCredentials(this.PROVIDERS.WHOOP);
    if (whoopCreds) {
      status.whoop = {
        hasAccessToken: !!whoopCreds.accessToken,
        hasRefreshToken: !!whoopCreds.refreshToken,
        expiresAt: whoopCreds.expiresAt?.toISOString() || null,
        isExpired: this.isExpired(whoopCreds.expiresAt),
        lastUpdated: whoopCreds.updatedAt?.toISOString() || null,
        tokenPreview: whoopCreds.accessToken 
          ? `${whoopCreds.accessToken.substring(0, 8)}...${whoopCreds.accessToken.slice(-4)}`
          : null,
      };
    } else {
      status.whoop = {
        hasAccessToken: false,
        hasRefreshToken: false,
        message: 'No credentials stored',
      };
    }

    return status;
  }
}

export default TokenManager;

