import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

import supabase from '../config/supabase.js';

/**
 * SmartSeeder - Parses the workout CSV and populates:
 * 1. training_plan table with main workout data
 * 2. exercise_checklists table with individual exercises parsed from descriptions
 */
class SmartSeeder {
  constructor(csvPath) {
    this.csvPath = csvPath;
  }

  /**
   * Parse description into individual exercises
   * Splits by semicolons (;) and newlines, cleans up whitespace
   */
  parseExercises(description) {
    if (!description || description.trim() === '') {
      return [];
    }

    // Split by semicolons first, then by newlines
    const exercises = description
      .split(/[;\n]/)
      .map(ex => ex.trim())
      .filter(ex => ex.length > 0 && ex.toLowerCase() !== 'n/a');

    return exercises;
  }

  /**
   * Read and parse the CSV file
   */
  readCSV() {
    const csvContent = fs.readFileSync(this.csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    return records;
  }

  /**
   * Clear existing data from tables
   */
  async clearTables() {
    console.log('🗑️  Clearing existing data...');
    
    // Delete in correct order due to foreign key constraints
    const { error: checklistError } = await supabase
      .from('exercise_checklists')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (checklistError) {
      console.error('Error clearing exercise_checklists:', checklistError);
    }

    const { error: logsError } = await supabase
      .from('daily_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (logsError) {
      console.error('Error clearing daily_logs:', logsError);
    }

    const { error: planError } = await supabase
      .from('training_plan')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (planError) {
      console.error('Error clearing training_plan:', planError);
    }

    console.log('✅ Tables cleared');
  }

  /**
   * Seed the database with workout plan data
   */
  async seed() {
    console.log('🌱 Starting SmartSeeder...');
    console.log(`📄 Reading CSV from: ${this.csvPath}`);

    try {
      // Clear existing data
      await this.clearTables();

      // Read CSV
      const records = this.readCSV();
      console.log(`📊 Found ${records.length} workout records`);

      let totalExercises = 0;

      // Process each record
      for (const record of records) {
        // Insert into training_plan
        const planData = {
          week: parseInt(record.Week, 10),
          day: record.Day,
          primary_type: record.Primary_Session_Type,
          secondary_type: record.Secondary_Session_Type === 'None' ? null : record.Secondary_Session_Type,
          description: record.Description,
          target_pace_load: record.Run_Pace_or_Load,
          duration_min: record.Approx_Duration_min,
        };

        const { data: insertedPlan, error: planError } = await supabase
          .from('training_plan')
          .insert(planData)
          .select()
          .single();

        if (planError) {
          console.error(`Error inserting plan for Week ${record.Week} ${record.Day}:`, planError);
          continue;
        }

        // Parse exercises from description
        const exercises = this.parseExercises(record.Description);
        
        if (exercises.length > 0) {
          // Insert exercise checklists
          const checklistData = exercises.map(exercise => ({
            plan_id: insertedPlan.id,
            exercise_name: exercise,
            is_completed: false,
          }));

          const { error: checklistError } = await supabase
            .from('exercise_checklists')
            .insert(checklistData);

          if (checklistError) {
            console.error(`Error inserting checklists for Week ${record.Week} ${record.Day}:`, checklistError);
          } else {
            totalExercises += exercises.length;
          }
        }

        console.log(`✅ Week ${record.Week} ${record.Day}: ${exercises.length} exercises`);
      }

      console.log('\n🎉 Seeding complete!');
      console.log(`   📅 ${records.length} training days added`);
      console.log(`   💪 ${totalExercises} exercise checklist items created`);

      return {
        success: true,
        trainingDays: records.length,
        exercises: totalExercises,
      };

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }
}

// Run seeder if called directly
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  const csvPath = process.env.CSV_PATH || path.join(__dirname, '../../../highlevel workoutplan  - Sheet1.csv');
  const resolvedPath = path.resolve(__dirname, '../../', csvPath);
  
  console.log(`Using CSV path: ${resolvedPath}`);
  
  const seeder = new SmartSeeder(resolvedPath);
  seeder.seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default SmartSeeder;

