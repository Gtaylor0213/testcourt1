/**
 * Populate Sample Data Script
 * Adds sample bookings and members to Sunrise Valley HOA
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function populateSampleData() {
  console.log('🚀 Populating sample data for Sunrise Valley HOA...\n');

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database\n');

    const facilityId = 'sunrise-valley';

    // Get courts for sunrise valley
    console.log('📋 Fetching courts for Sunrise Valley...');
    const courtsResult = await pool.query(
      'SELECT id, name FROM courts WHERE facility_id = $1 ORDER BY court_number',
      [facilityId]
    );
    const courts = courtsResult.rows;
    console.log(`✅ Found ${courts.length} courts\n`);

    // Create sample members
    console.log('👥 Creating sample members...');
    const sampleMembers = [
      { email: 'john.doe@email.com', fullName: 'John Doe', firstName: 'John', lastName: 'Doe'},
      { email: 'jane.smith@email.com', fullName: 'Jane Smith', firstName: 'Jane', lastName: 'Smith' },
      { email: 'mike.johnson@email.com', fullName: 'Mike Johnson', firstName: 'Mike', lastName: 'Johnson' },
      { email: 'sarah.williams@email.com', fullName: 'Sarah Williams', firstName: 'Sarah', lastName: 'Williams' },
      { email: 'david.brown@email.com', fullName: 'David Brown', firstName: 'David', lastName: 'Brown' },
    ];

    const createdUsers = [];
    const password = await bcrypt.hash('password123', 10);

    for (const member of sampleMembers) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [member.email]
      );

      let userId;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        console.log(`  ⚠️  User already exists: ${member.email}`);
      } else {
        const userResult = await pool.query(
          `INSERT INTO users (email, password_hash, full_name, first_name, last_name, user_type)
           VALUES ($1, $2, $3, $4, $5, 'player')
           RETURNING id`,
          [member.email, password, member.fullName, member.firstName, member.lastName]
        );
        userId = userResult.rows[0].id;
        console.log(`  ✅ Created user: ${member.email}`);

        // Create membership
        const membershipExists = await pool.query(
          'SELECT id FROM facility_memberships WHERE user_id = $1 AND facility_id = $2',
          [userId, facilityId]
        );

        if (membershipExists.rows.length === 0) {
          await pool.query(
            `INSERT INTO facility_memberships (user_id, facility_id, membership_type, status, start_date)
             VALUES ($1, $2, 'standard', 'active', CURRENT_DATE)`,
            [userId, facilityId]
          );
          console.log(`  ✅ Created membership for: ${member.email}`);
        }
      }

      createdUsers.push({ ...member, userId });
    }

    console.log(`\n✅ Created ${sampleMembers.length} members\n`);

    // Create sample bookings for the current month
    console.log('📅 Creating sample bookings...');
    let bookingCount = 0;

    // Create bookings for the past 2 weeks and next 2 weeks
    for (let dayOffset = -14; dayOffset <= 14; dayOffset++) {
      const bookingDate = new Date();
      bookingDate.setDate(bookingDate.getDate() + dayOffset);
      const dateStr = bookingDate.toISOString().split('T')[0];

      // Skip some days randomly to make it more realistic
      if (Math.random() > 0.7) continue;

      // Create 2-5 bookings per day
      const numBookings = Math.floor(Math.random() * 4) + 2;

      for (let i = 0; i < numBookings; i++) {
        const court = courts[Math.floor(Math.random() * courts.length)];
        const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];

        // Random start hour between 8 AM and 6 PM
        const startHour = 8 + Math.floor(Math.random() * 10);
        const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
        const endTime = `${String(startHour + 1).padStart(2, '0')}:00:00`;

        try {
          // Check if slot is available
          const conflictCheck = await pool.query(
            `SELECT id FROM bookings
             WHERE court_id = $1 AND booking_date = $2
               AND status != 'cancelled'
               AND ((start_time <= $3 AND end_time > $3)
                 OR (start_time < $4 AND end_time >= $4)
                 OR (start_time >= $3 AND end_time <= $4))`,
            [court.id, dateStr, startTime, endTime]
          );

          if (conflictCheck.rows.length === 0) {
            await pool.query(
              `INSERT INTO bookings (
                court_id, user_id, facility_id, booking_date,
                start_time, end_time, duration_minutes,
                booking_type, status
              )
              VALUES ($1, $2, $3, $4, $5, $6, 60, 'singles', 'confirmed')`,
              [court.id, user.userId, facilityId, dateStr, startTime, endTime]
            );
            bookingCount++;
          }
        } catch (err) {
          // Skip conflicts
        }
      }
    }

    console.log(`✅ Created ${bookingCount} bookings\n`);

    // Update facility description
    console.log('🏢 Updating facility information...');
    await pool.query(
      `UPDATE facilities
       SET
         description = 'Sunrise Valley HOA Tennis Facility offers premium tennis courts for our residents. Our well-maintained courts provide the perfect setting for both casual play and competitive matches.',
         amenities = ARRAY['Restrooms', 'Water Fountain', 'Benches', 'Lighting', 'Parking'],
         operating_hours = '{"monday": "6:00 AM - 10:00 PM", "tuesday": "6:00 AM - 10:00 PM", "wednesday": "6:00 AM - 10:00 PM", "thursday": "6:00 AM - 10:00 PM", "friday": "6:00 AM - 10:00 PM", "saturday": "7:00 AM - 9:00 PM", "sunday": "7:00 AM - 9:00 PM"}'::jsonb
       WHERE id = $1`,
      [facilityId]
    );
    console.log('✅ Updated facility information\n');

    console.log('🎉 Sample data population complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Facility: Sunrise Valley HOA`);
    console.log(`   - Members: ${sampleMembers.length}`);
    console.log(`   - Bookings: ${bookingCount}`);
    console.log(`   - Courts: ${courts.length}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Failed to populate sample data:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
populateSampleData()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
