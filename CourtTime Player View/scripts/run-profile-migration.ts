import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getPool } from '../src/database/connection';

// Load environment variables
dotenv.config();

async function runMigration() {
  try {
    console.log('🔄 Running profile simplification migration...\n');

    // Get the pool
    const pool = getPool();

    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', '004_simplify_user_profile.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!\n');
    console.log('Updated schema:');
    console.log('  - users table: Added first_name, last_name, address fields');
    console.log('  - users table: Migrated full_name to first_name and last_name');
    console.log('  - player_profiles table: Removed ntrp_rating, playing_hand, playing_style, etc.');
    console.log('  - player_profiles table: Kept skill_level, bio, profile_image_url\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
