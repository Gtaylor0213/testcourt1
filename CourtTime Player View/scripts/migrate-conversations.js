/**
 * Migration script to add facility_id to conversations table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('supabase') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Running conversations migration...\n');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', 'add_facility_to_conversations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    await pool.query(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('   - Added facility_id column to conversations table');
    console.log('   - Created index idx_conversations_facility');
    console.log('   - Added column comment\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Migration may have already been applied.');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
