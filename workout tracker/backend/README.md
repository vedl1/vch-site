# Fitness Tracker Backend

Express.js API for the fitness tracking app with Supabase integration.

## Prerequisites

1. **Create database tables in Supabase:**
   - Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qpgoplcwlcnbauilweux/sql)
   - Copy and run the contents of `src/db/migrations/001_create_tables.sql`
   - This creates: `training_plan`, `exercise_checklists`, `daily_logs`

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   # Or create manually with these values:
   ```
   
   ```env
   SUPABASE_URL="https://qpgoplcwlcnbauilweux.supabase.co"
   SUPABASE_ANON_KEY="sb_publishable_XGl3lKLa3dZfTrn2m3nB8A_dFnPYaDS"
   STRAVA_CLIENT_ID="193481"
   STRAVA_CLIENT_SECRET="925e96070fd24ad7c9821db961c5f95136edcfca"
   WHOOP_ACCESS_TOKEN="31e81551b9018d7489890925257c57fdfd7bed42646b80dd5dc7b47eee094a70"
   CSV_PATH="../highlevel workoutplan  - Sheet1.csv"
   PORT=3000
   ```

3. **Start the server:**
   ```bash
   npm run dev   # Development with auto-reload
   npm start     # Production
   ```

## Seeding the Database

### Option 1: Via API endpoint
```bash
curl -X POST http://localhost:3000/api/seed
```

### Option 2: Via CLI
```bash
npm run seed
```

## API Endpoints

### Core Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/db-status` | Test Supabase connection |
| POST | `/api/seed` | Seed database from CSV |
| GET | `/api/plan/:week/:day` | Get workout for specific day |
| GET | `/api/plan/week/:week` | Get all workouts for a week |
| PATCH | `/api/checklist/:id` | Toggle exercise completion |
| POST | `/api/daily-log/complete` | Complete a day |
| GET | `/api/progress` | Get overall progress stats |

### Strava Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/strava/auth` | Get OAuth authorization URL |
| GET | `/api/strava/callback` | OAuth callback (automatic) |
| POST | `/api/strava/token` | Manually set access token |
| GET | `/api/strava/status` | Check connection status |
| GET | `/api/strava/activities` | Get recent activities |
| GET | `/api/strava/today` | Get today's run activities |

### Whoop Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whoop/recovery` | Get today's recovery score |
| GET | `/api/whoop/sleep` | Get today's sleep data |
| GET | `/api/whoop/metrics` | Get all daily metrics |

### Metrics Sync
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/metrics/sync` | Refresh data from Strava & Whoop |
| POST | `/api/metrics/link` | Link metrics to a workout day |

## Connecting Strava

1. Visit `http://localhost:3000/api/strava/auth` to get the authorization URL
2. Open the URL in your browser and authorize the app
3. You'll be redirected back with a success message
4. Now `/api/strava/activities` and `/api/metrics/sync` will work

## Whoop Token

The Whoop integration requires a valid access token. If you get a 401 error:
1. Generate a new token from the [Whoop Developer Portal](https://developer.whoop.com/)
2. Update the `WHOOP_ACCESS_TOKEN` in your `.env` file
3. Restart the server

## Database Schema

The seeder populates these tables:
- `training_plan` - Main workout schedule (84 days across 12 weeks)
- `exercise_checklists` - Individual exercises parsed from descriptions
- `daily_logs` - User progress and external metric links

