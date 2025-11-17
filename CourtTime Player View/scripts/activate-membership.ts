import * as dotenv from 'dotenv';
import { query } from '../src/database/connection';

// Load environment variables
dotenv.config();

async function activateMembership() {
  try {
    console.log('🔄 Activating membership for test player...\n');

    // Update membership status to active
    await query(
      `UPDATE facility_memberships
       SET status = 'active'
       WHERE user_id = $1 AND facility_id = $2`,
      ['22bf76c8-a8a0-42df-9556-11d19f8fdde3', 'sunrise-valley']
    );

    console.log('✅ Membership activated successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to activate membership:', error);
    process.exit(1);
  }
}

activateMembership();
