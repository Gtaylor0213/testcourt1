const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

async function checkBookings() {
  try {
    console.log('Checking bookings for user: 22bf76c8-a8a0-42df-9556-11d19f8fdde3\n');

    // Check all bookings for this user
    const result = await pool.query(`
      SELECT
        b.id,
        b.user_id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.duration_minutes,
        b.status,
        u.full_name,
        c.name as court_name,
        f.name as facility_name
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN courts c ON b.court_id = c.id
      JOIN facilities f ON b.facility_id = f.id
      WHERE b.user_id = '22bf76c8-a8a0-42df-9556-11d19f8fdde3'
      ORDER BY b.booking_date DESC, b.start_time DESC
      LIMIT 10
    `);

    console.log(`Found ${result.rows.length} bookings:\n`);
    result.rows.forEach((booking, i) => {
      console.log(`${i + 1}. ${booking.court_name} at ${booking.facility_name}`);
      console.log(`   Date: ${booking.booking_date}, Time: ${booking.start_time} - ${booking.end_time}`);
      console.log(`   Status: ${booking.status}, Duration: ${booking.duration_minutes}min`);
      console.log(`   User: ${booking.full_name}`);
      console.log('');
    });

    // Check upcoming bookings specifically
    console.log('\n--- UPCOMING BOOKINGS ---\n');
    const upcomingResult = await pool.query(`
      SELECT
        b.id,
        b.booking_date,
        b.start_time,
        b.end_time,
        b.status,
        c.name as court_name,
        LOCALTIMESTAMP as current_time,
        (b.booking_date || ' ' || b.end_time)::timestamp as end_timestamp,
        (b.booking_date || ' ' || b.end_time)::timestamp >= LOCALTIMESTAMP as is_upcoming
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.user_id = '22bf76c8-a8a0-42df-9556-11d19f8fdde3'
        AND b.status != 'cancelled'
        AND (b.booking_date || ' ' || b.end_time)::timestamp >= LOCALTIMESTAMP
      ORDER BY b.booking_date ASC, b.start_time ASC
    `);

    console.log(`Found ${upcomingResult.rows.length} upcoming bookings:\n`);
    if (upcomingResult.rows.length > 0) {
      console.log('Current time:', upcomingResult.rows[0]?.current_time);
      console.log('');
      upcomingResult.rows.forEach((booking, i) => {
        console.log(`${i + 1}. ${booking.court_name} - ${booking.booking_date} ${booking.start_time}-${booking.end_time} (${booking.status})`);
        console.log(`   End timestamp: ${booking.end_timestamp}, Is upcoming: ${booking.is_upcoming}`);
      });
    }

    // Also show today's bookings to debug
    console.log('\n--- TODAY\'S BOOKINGS (for debugging) ---\n');
    const todayResult = await pool.query(`
      SELECT
        c.name as court_name,
        b.start_time,
        b.end_time,
        b.status,
        (b.booking_date || ' ' || b.end_time)::timestamp as end_timestamp,
        LOCALTIMESTAMP as current_time,
        (b.booking_date || ' ' || b.end_time)::timestamp >= LOCALTIMESTAMP as should_show
      FROM bookings b
      JOIN courts c ON b.court_id = c.id
      WHERE b.user_id = '22bf76c8-a8a0-42df-9556-11d19f8fdde3'
        AND b.booking_date = CURRENT_DATE
      ORDER BY b.start_time ASC
    `);
    todayResult.rows.forEach((booking) => {
      console.log(`${booking.court_name}: ${booking.start_time}-${booking.end_time} (${booking.status})`);
      console.log(`  End: ${booking.end_timestamp}, Now: ${booking.current_time}, Should show: ${booking.should_show}`);
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBookings();
