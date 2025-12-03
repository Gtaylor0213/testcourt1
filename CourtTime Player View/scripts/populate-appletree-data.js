/**
 * Populate Sample Data for Appletree Station
 */

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createSampleData() {
  const facilityId = 'appletree-station';

  console.log('🎾 Creating sample data for Appletree Station...\n');

  // 1. Create sample players
  console.log('👥 Creating sample players...');
  const players = [
    { email: 'sarah.johnson@email.com', firstName: 'Sarah', lastName: 'Johnson', skillLevel: 'intermediate' },
    { email: 'mike.chen@email.com', firstName: 'Mike', lastName: 'Chen', skillLevel: 'advanced' },
    { email: 'lisa.martinez@email.com', firstName: 'Lisa', lastName: 'Martinez', skillLevel: 'beginner' },
    { email: 'david.wilson@email.com', firstName: 'David', lastName: 'Wilson', skillLevel: 'intermediate' },
    { email: 'jennifer.brown@email.com', firstName: 'Jennifer', lastName: 'Brown', skillLevel: 'advanced' }
  ];

  const passwordHash = await bcrypt.hash('player123', 10);
  const userIds = [];

  for (const p of players) {
    // Check if exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [p.email]);
    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      console.log('  ✓ ' + p.firstName + ' ' + p.lastName + ' (exists)');
    } else {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, first_name, last_name, user_type)
         VALUES ($1, $2, $3, $4, $5, 'player') RETURNING id`,
        [p.email, passwordHash, p.firstName + ' ' + p.lastName, p.firstName, p.lastName]
      );
      userId = result.rows[0].id;
      console.log('  ✓ Created ' + p.firstName + ' ' + p.lastName);
    }

    userIds.push({ id: userId, ...p });

    // Add membership
    await pool.query(
      `INSERT INTO facility_memberships (user_id, facility_id, membership_type, status, is_facility_admin, start_date)
       VALUES ($1, $2, 'standard', 'active', false, CURRENT_DATE)
       ON CONFLICT (user_id, facility_id) DO NOTHING`,
      [userId, facilityId]
    );

    // Add player profile
    await pool.query(
      `INSERT INTO player_profiles (user_id, skill_level)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET skill_level = $2`,
      [userId, p.skillLevel]
    );
  }

  // Get admin user ID
  const adminResult = await pool.query("SELECT id FROM users WHERE email = 'admin@appletree.com'");
  const adminId = adminResult.rows[0]?.id;

  // Get courts
  const courtsResult = await pool.query("SELECT id, name, court_type FROM courts WHERE facility_id = $1", [facilityId]);
  const courts = courtsResult.rows;

  // 2. Create bulletin posts
  console.log('\n📋 Creating bulletin board posts...');
  const bulletinPosts = [
    { title: 'Welcome to Appletree Station!', content: 'Welcome to our tennis and pickleball community! We are excited to have you here. Please review the court rules and booking policies. Happy playing!', category: 'announcement', isPinned: true, isAdmin: true, authorId: adminId },
    { title: 'Holiday Tournament - December 21st', content: 'Join us for our annual Holiday Doubles Tournament! Sign up at the front desk by December 15th. Entry fee is $25 per team. Prizes for 1st, 2nd, and 3rd place. All skill levels welcome!', category: 'event', isPinned: true, isAdmin: true, authorId: adminId },
    { title: 'Court Maintenance Schedule', content: 'Courts 1-3 will be resurfaced next week (Dec 9-13). Please use courts 4-8 during this time. We apologize for any inconvenience.', category: 'announcement', isPinned: false, isAdmin: true, authorId: adminId },
    { title: 'Looking for Tennis Doubles Partner', content: 'Hi everyone! I am looking for a doubles partner for the upcoming tournament. I am an intermediate player (3.5 NTRP). Available evenings and weekends. Message me if interested!', category: 'general', isPinned: false, isAdmin: false, authorId: userIds[0].id },
    { title: 'Pickleball Beginner Clinic', content: 'I will be hosting a free beginner pickleball clinic this Saturday at 9am on courts 4a and 4b. All equipment provided. Just bring water and comfortable shoes!', category: 'event', isPinned: false, isAdmin: false, authorId: userIds[1].id },
    { title: 'Lost: Wilson Tennis Racket', content: 'I left my Wilson Pro Staff racket at court 2 yesterday afternoon. It has blue grip tape. If found, please contact me. Thank you!', category: 'general', isPinned: false, isAdmin: false, authorId: userIds[2].id },
    { title: 'New Ball Machine Available', content: 'Great news! We have purchased a new ball machine for member use. It is located in the equipment room. Please sign up for 30-minute slots at the front desk.', category: 'announcement', isPinned: false, isAdmin: true, authorId: adminId }
  ];

  for (let i = 0; i < bulletinPosts.length; i++) {
    const post = bulletinPosts[i];
    const daysAgo = i * 2; // Stagger posts
    await pool.query(
      `INSERT INTO bulletin_posts (facility_id, author_id, title, content, category, is_pinned, is_admin_post, posted_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '${daysAgo} days')`,
      [facilityId, post.authorId, post.title, post.content, post.category, post.isPinned, post.isAdmin]
    );
    console.log('  ✓ ' + post.title.substring(0, 40) + '...');
  }

  // 3. Create bookings
  console.log('\n📅 Creating sample bookings...');
  const today = new Date();

  const bookings = [
    { courtIdx: 0, odx: 0, startTime: '09:00', endTime: '10:30', type: 'singles', notes: 'Morning practice' },
    { courtIdx: 1, uidx: 1, daysFromNow: 0, startTime: '14:00', endTime: '15:30', type: 'doubles', notes: 'Doubles with friends' },
    { courtIdx: 3, uidx: 2, daysFromNow: 0, startTime: '16:00', endTime: '17:00', type: 'singles', notes: 'Pickleball practice' },
    { courtIdx: 0, uidx: 3, daysFromNow: 1, startTime: '08:00', endTime: '09:30', type: 'singles', notes: '' },
    { courtIdx: 2, uidx: 4, daysFromNow: 1, startTime: '10:00', endTime: '11:30', type: 'doubles', notes: 'Weekly game' },
    { courtIdx: 4, uidx: 0, daysFromNow: 1, startTime: '17:00', endTime: '18:30', type: 'singles', notes: 'After work session' },
    { courtIdx: 0, uidx: 1, daysFromNow: 2, startTime: '07:00', endTime: '08:30', type: 'singles', notes: 'Early morning tennis' },
    { courtIdx: 5, uidx: 2, daysFromNow: 2, startTime: '11:00', endTime: '12:00', type: 'doubles', notes: 'Pickleball doubles' },
    { courtIdx: 1, uidx: 3, daysFromNow: 3, startTime: '15:00', endTime: '16:30', type: 'singles', notes: '' },
    { courtIdx: 6, uidx: 4, daysFromNow: 3, startTime: '09:00', endTime: '10:00', type: 'singles', notes: 'Pickleball practice' },
    { courtIdx: 0, uidx: 0, daysFromNow: 4, startTime: '12:00', endTime: '13:30', type: 'doubles', notes: 'Lunch break tennis' },
    { courtIdx: 2, uidx: 1, daysFromNow: 5, startTime: '14:00', endTime: '15:30', type: 'singles', notes: '' }
  ];

  for (const b of bookings) {
    const bookingDate = new Date(today);
    const daysFromNow = b.daysFromNow || 0;
    const uidx = b.uidx || 0;
    bookingDate.setDate(today.getDate() + daysFromNow);
    const dateStr = bookingDate.toISOString().split('T')[0];

    const court = courts[b.courtIdx];
    if (!court) continue;

    const startParts = b.startTime.split(':');
    const endParts = b.endTime.split(':');
    const durationMinutes = (parseInt(endParts[0]) - parseInt(startParts[0])) * 60 +
                           (parseInt(endParts[1]) - parseInt(startParts[1]));

    await pool.query(
      `INSERT INTO bookings (court_id, user_id, facility_id, booking_date, start_time, end_time, duration_minutes, status, booking_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'confirmed', $8, $9)`,
      [court.id, userIds[uidx].id, facilityId, dateStr, b.startTime, b.endTime, durationMinutes, b.type, b.notes]
    );
    console.log('  ✓ ' + court.name + ' on ' + dateStr + ' ' + b.startTime + '-' + b.endTime);
  }

  // 4. Create hitting partner posts
  console.log('\n🎾 Creating hitting partner posts...');
  const hittingPosts = [
    { uidx: 0, skillLevel: 'intermediate', availability: 'Weekday evenings 5-8pm, Weekends mornings', playStyle: ['Singles', 'Rallying'], description: 'Looking for consistent rally partners to improve my game. I can play 2-3 times per week.' },
    { uidx: 1, skillLevel: 'advanced', availability: 'Flexible schedule, prefer mornings', playStyle: ['Singles', 'Doubles', 'Competitive'], description: 'Competitive player looking for match practice. Preparing for USTA league season.' },
    { uidx: 3, skillLevel: 'intermediate', availability: 'Weekends only', playStyle: ['Doubles', 'Social'], description: 'Casual player looking for doubles partners. Fun and social atmosphere preferred!' }
  ];

  for (const hp of hittingPosts) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await pool.query(
      `INSERT INTO hitting_partner_posts (user_id, facility_id, skill_level, availability, play_style, description, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
      [userIds[hp.uidx].id, facilityId, hp.skillLevel, hp.availability, hp.playStyle, hp.description, expiresAt]
    );
    console.log('  ✓ Post by ' + players[hp.uidx].firstName);
  }

  console.log('\n✅ Sample data created successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 5 sample players added');
  console.log('  - 7 bulletin board posts created');
  console.log('  - 12 bookings across the next 5 days');
  console.log('  - 3 hitting partner posts');

  await pool.end();
}

createSampleData()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });
