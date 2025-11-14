/**
 * Migration Runner
 * Applies database migration files to the PostgreSQL database
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function runMigration(migrationFile) {
  const client = await pool.connect();

  try {
    console.log(`\n📂 Reading migration file: ${migrationFile}`);
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`\n🔄 Executing migration: ${migrationFile}`);
    console.log('─'.repeat(60));

    await client.query('BEGIN');

    // Execute the migration SQL
    await client.query(sql);

    await client.query('COMMIT');

    console.log(`✅ Migration completed successfully: ${migrationFile}`);
    console.log('─'.repeat(60));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`\n❌ Migration failed: ${migrationFile}`);
    console.error('Error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('\n🚀 Database Migration Runner');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const result = await pool.query('SELECT version()');
    console.log('✅ Connected to PostgreSQL:', result.rows[0].version.split(' ')[1]);

    // Get migration file from command line or use default
    const migrationFile = process.argv[2] || '001_facility_registration.sql';

    // Run migration
    await runMigration(migrationFile);

    console.log('\n🎉 All migrations completed successfully!');

  } catch (error) {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
