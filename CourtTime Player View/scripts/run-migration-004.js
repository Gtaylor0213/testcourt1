const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('Running address whitelist migration...');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../database/migrations/004_add_address_whitelist.sql'),
      'utf8'
    );

    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'address_whitelist'
    `);

    if (result.rows.length > 0) {
      console.log('✅ address_whitelist table created');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
