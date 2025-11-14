import { query, transaction } from '../database/connection';
import { Facility, Court } from '../types/database';
import type { PoolClient } from 'pg';

/**
 * Facility Service
 * Handles facility and court-related operations, facility registration, and admin management
 */

export interface FacilityCreateData {
  name: string;
  type: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  description?: string;
  operatingHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  generalRules?: string;
  cancellationPolicy?: string;
  bookingRules?: string;
}

export interface FacilityRuleData {
  facilityId: string;
  ruleType: 'booking_limit' | 'cancellation_policy' | 'usage_rules' | 'peak_hours';
  ruleName: string;
  ruleDescription?: string;
  ruleConfig: Record<string, any>;
  appliesToCourts?: string[]; // Array of court UUIDs, null = all courts
  createdBy: string;
}

export interface FacilityRule {
  id: string;
  facilityId: string;
  ruleType: string;
  ruleName: string;
  ruleDescription?: string;
  ruleConfig: Record<string, any>;
  isActive: boolean;
  appliesToCourts?: string[];
  createdBy?: string;
  createdAt: Date;
}

/**
 * Get all facilities
 */
export async function getAllFacilities(): Promise<Facility[]> {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        type,
        address,
        phone,
        email,
        description,
        amenities,
        operating_hours as "operatingHours",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM facilities
      ORDER BY name
    `);

    return result.rows;
  } catch (error) {
    console.error('Get all facilities error:', error);
    return [];
  }
}

/**
 * Search facilities by query
 */
export async function searchFacilities(searchQuery: string): Promise<any[]> {
  try {
    const result = await query(`
      SELECT
        f.id,
        f.name,
        f.type,
        f.address,
        f.description,
        COUNT(DISTINCT c.id) as courts,
        COUNT(DISTINCT fm.user_id) as members
      FROM facilities f
      LEFT JOIN courts c ON f.id = c.facility_id
      LEFT JOIN facility_memberships fm ON f.id = fm.facility_id AND fm.status = 'active'
      WHERE
        LOWER(f.name) LIKE LOWER($1) OR
        LOWER(f.type) LIKE LOWER($1) OR
        LOWER(f.address) LIKE LOWER($1) OR
        LOWER(f.description) LIKE LOWER($1)
      GROUP BY f.id, f.name, f.type, f.address, f.description
      ORDER BY f.name
    `, [`%${searchQuery}%`]);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type || 'Facility',
      location: row.address || 'Location not specified',
      description: row.description || '',
      courts: parseInt(row.courts) || 0,
      members: parseInt(row.members) || 0,
      requiresApproval: row.type === 'Private Club' // Private clubs require approval
    }));
  } catch (error) {
    console.error('Search facilities error:', error);
    return [];
  }
}

/**
 * Get facility by ID
 */
export async function getFacilityById(facilityId: string): Promise<Facility | null> {
  try {
    const result = await query(`
      SELECT
        id,
        name,
        type,
        address,
        phone,
        email,
        description,
        amenities,
        operating_hours as "operatingHours",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM facilities
      WHERE id = $1
    `, [facilityId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get facility by ID error:', error);
    return null;
  }
}

/**
 * Get courts for a facility
 */
export async function getFacilityCourts(facilityId: string): Promise<Court[]> {
  try {
    const result = await query(`
      SELECT
        id,
        facility_id as "facilityId",
        name,
        court_number as "courtNumber",
        surface_type as "surfaceType",
        court_type as "courtType",
        is_indoor as "isIndoor",
        has_lights as "hasLights",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM courts
      WHERE facility_id = $1
      ORDER BY court_number
    `, [facilityId]);

    return result.rows;
  } catch (error) {
    console.error('Get facility courts error:', error);
    return [];
  }
}

/**
 * Get facilities with member counts
 */
export async function getFacilitiesWithStats(): Promise<any[]> {
  try {
    const result = await query(`
      SELECT
        f.id,
        f.name,
        f.type,
        f.description,
        COUNT(DISTINCT c.id) as total_courts,
        COUNT(DISTINCT fm.user_id) FILTER (WHERE fm.status = 'active') as active_members,
        COUNT(DISTINCT fm.user_id) FILTER (WHERE fm.status = 'pending') as pending_requests
      FROM facilities f
      LEFT JOIN courts c ON f.id = c.facility_id
      LEFT JOIN facility_memberships fm ON f.id = fm.facility_id
      GROUP BY f.id, f.name, f.type, f.description
      ORDER BY f.name
    `);

    return result.rows;
  } catch (error) {
    console.error('Get facilities with stats error:', error);
    return [];
  }
}

/**
 * Create a new facility with super admin
 */
export async function createFacilityWithAdmin(
  facilityData: FacilityCreateData,
  superAdminUserId: string
): Promise<{ facility: any; adminId: string }> {
  return transaction(async (client: PoolClient) => {
    // Generate facility ID from name (slug format)
    const facilityId = facilityData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // 1. Create facility
    const facilityResult = await client.query(
      `INSERT INTO facilities (
        id, name, type, address, phone, email, contact_name, description,
        operating_hours, general_rules, cancellation_policy, booking_rules, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
      RETURNING
        id, name, type, address, phone, email, contact_name as "contactName",
        description, operating_hours as "operatingHours",
        general_rules as "generalRules", cancellation_policy as "cancellationPolicy",
        booking_rules as "bookingRules", status, created_at as "createdAt"`,
      [
        facilityId,
        facilityData.name,
        facilityData.type,
        facilityData.address,
        facilityData.phone || null,
        facilityData.email || null,
        facilityData.contactName || null,
        facilityData.description || null,
        facilityData.operatingHours ? JSON.stringify(facilityData.operatingHours) : null,
        facilityData.generalRules || null,
        facilityData.cancellationPolicy || null,
        facilityData.bookingRules || null,
      ]
    );

    const facility = facilityResult.rows[0];

    // 2. Mark user as super admin
    await client.query(
      `UPDATE users SET is_super_admin = true WHERE id = $1`,
      [superAdminUserId]
    );

    // 3. Add user as facility admin (super admin)
    const adminResult = await client.query(
      `INSERT INTO facility_admins (user_id, facility_id, is_super_admin, status)
       VALUES ($1, $2, true, 'active')
       RETURNING id`,
      [superAdminUserId, facilityId]
    );

    // 4. Create facility membership for super admin
    await client.query(
      `INSERT INTO facility_memberships (user_id, facility_id, membership_type, status, start_date)
       VALUES ($1, $2, 'admin', 'active', CURRENT_DATE)
       ON CONFLICT (user_id, facility_id) DO NOTHING`,
      [superAdminUserId, facilityId]
    );

    return {
      facility,
      adminId: adminResult.rows[0].id,
    };
  });
}

/**
 * Update facility information
 */
export async function updateFacility(
  facilityId: string,
  updates: Partial<FacilityCreateData>
): Promise<any> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.name) {
    fields.push(`name = $${paramCount++}`);
    values.push(updates.name);
  }
  if (updates.type) {
    fields.push(`type = $${paramCount++}`);
    values.push(updates.type);
  }
  if (updates.address) {
    fields.push(`address = $${paramCount++}`);
    values.push(updates.address);
  }
  if (updates.phone !== undefined) {
    fields.push(`phone = $${paramCount++}`);
    values.push(updates.phone);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }
  if (updates.contactName !== undefined) {
    fields.push(`contact_name = $${paramCount++}`);
    values.push(updates.contactName);
  }
  if (updates.description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(updates.description);
  }
  if (updates.operatingHours) {
    fields.push(`operating_hours = $${paramCount++}`);
    values.push(JSON.stringify(updates.operatingHours));
  }
  if (updates.generalRules !== undefined) {
    fields.push(`general_rules = $${paramCount++}`);
    values.push(updates.generalRules);
  }
  if (updates.cancellationPolicy !== undefined) {
    fields.push(`cancellation_policy = $${paramCount++}`);
    values.push(updates.cancellationPolicy);
  }
  if (updates.bookingRules !== undefined) {
    fields.push(`booking_rules = $${paramCount++}`);
    values.push(updates.bookingRules);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(facilityId);

  const result = await query(
    `UPDATE facilities
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING
       id, name, type, address, phone, email, contact_name as "contactName",
       description, operating_hours as "operatingHours",
       general_rules as "generalRules", cancellation_policy as "cancellationPolicy",
       booking_rules as "bookingRules", status, created_at as "createdAt"`,
    values
  );

  return result.rows[0];
}

/**
 * Create a facility rule
 */
export async function createFacilityRule(ruleData: FacilityRuleData): Promise<FacilityRule> {
  const result = await query(
    `INSERT INTO facility_rules (
      facility_id, rule_type, rule_name, rule_description, rule_config,
      applies_to_courts, created_by, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
    RETURNING
      id, facility_id as "facilityId", rule_type as "ruleType",
      rule_name as "ruleName", rule_description as "ruleDescription",
      rule_config as "ruleConfig", is_active as "isActive",
      applies_to_courts as "appliesToCourts", created_by as "createdBy",
      created_at as "createdAt"`,
    [
      ruleData.facilityId,
      ruleData.ruleType,
      ruleData.ruleName,
      ruleData.ruleDescription || null,
      JSON.stringify(ruleData.ruleConfig),
      ruleData.appliesToCourts || null,
      ruleData.createdBy,
    ]
  );

  return result.rows[0];
}

/**
 * Get all rules for a facility
 */
export async function getFacilityRules(facilityId: string): Promise<FacilityRule[]> {
  const result = await query(
    `SELECT
      id, facility_id as "facilityId", rule_type as "ruleType",
      rule_name as "ruleName", rule_description as "ruleDescription",
      rule_config as "ruleConfig", is_active as "isActive",
      applies_to_courts as "appliesToCourts", created_by as "createdBy",
      created_at as "createdAt"
     FROM facility_rules
     WHERE facility_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [facilityId]
  );

  return result.rows;
}

/**
 * Update a facility rule
 */
export async function updateFacilityRule(
  ruleId: string,
  updates: Partial<Omit<FacilityRuleData, 'facilityId' | 'createdBy'>>
): Promise<FacilityRule> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updates.ruleName) {
    fields.push(`rule_name = $${paramCount++}`);
    values.push(updates.ruleName);
  }
  if (updates.ruleDescription !== undefined) {
    fields.push(`rule_description = $${paramCount++}`);
    values.push(updates.ruleDescription);
  }
  if (updates.ruleConfig) {
    fields.push(`rule_config = $${paramCount++}`);
    values.push(JSON.stringify(updates.ruleConfig));
  }
  if (updates.appliesToCourts !== undefined) {
    fields.push(`applies_to_courts = $${paramCount++}`);
    values.push(updates.appliesToCourts);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(ruleId);

  const result = await query(
    `UPDATE facility_rules
     SET ${fields.join(', ')}
     WHERE id = $${paramCount}
     RETURNING
       id, facility_id as "facilityId", rule_type as "ruleType",
       rule_name as "ruleName", rule_description as "ruleDescription",
       rule_config as "ruleConfig", is_active as "isActive",
       applies_to_courts as "appliesToCourts", created_by as "createdBy",
       created_at as "createdAt"`,
    values
  );

  return result.rows[0];
}

/**
 * Delete (deactivate) a facility rule
 */
export async function deleteFacilityRule(ruleId: string): Promise<void> {
  await query(
    `UPDATE facility_rules SET is_active = false WHERE id = $1`,
    [ruleId]
  );
}

/**
 * Upload HOA addresses for a facility
 */
export async function uploadHOAAddresses(
  facilityId: string,
  addresses: Array<{
    streetAddress: string;
    city?: string;
    state?: string;
    zipCode?: string;
    householdName?: string;
  }>,
  uploadedBy: string
): Promise<number> {
  return transaction(async (client: PoolClient) => {
    let insertedCount = 0;

    for (const address of addresses) {
      try {
        await client.query(
          `INSERT INTO hoa_addresses (
            facility_id, street_address, city, state, zip_code, household_name, uploaded_by, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
          ON CONFLICT (facility_id, street_address)
          DO UPDATE SET
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            zip_code = EXCLUDED.zip_code,
            household_name = EXCLUDED.household_name,
            is_active = true,
            updated_at = CURRENT_TIMESTAMP`,
          [
            facilityId,
            address.streetAddress,
            address.city || null,
            address.state || null,
            address.zipCode || null,
            address.householdName || null,
            uploadedBy,
          ]
        );
        insertedCount++;
      } catch (error) {
        console.error('Error inserting HOA address:', error);
        // Continue with next address
      }
    }

    return insertedCount;
  });
}

/**
 * Get HOA addresses for a facility
 */
export async function getHOAAddresses(facilityId: string): Promise<any[]> {
  const result = await query(
    `SELECT
      id, facility_id as "facilityId", street_address as "streetAddress",
      city, state, zip_code as "zipCode", household_name as "householdName",
      is_active as "isActive", created_at as "createdAt"
     FROM hoa_addresses
     WHERE facility_id = $1 AND is_active = true
     ORDER BY street_address`,
    [facilityId]
  );

  return result.rows;
}

/**
 * Check if an address is valid for a facility
 */
export async function isValidHOAAddress(
  facilityId: string,
  streetAddress: string
): Promise<boolean> {
  const result = await query(
    `SELECT id FROM hoa_addresses
     WHERE facility_id = $1 AND street_address = $2 AND is_active = true
     LIMIT 1`,
    [facilityId, streetAddress]
  );

  return result.rows.length > 0;
}

/**
 * Get facility statistics
 */
export async function getFacilityStats(facilityId: string): Promise<any> {
  const result = await query(
    `SELECT
      (SELECT COUNT(*) FROM facility_memberships WHERE facility_id = $1 AND status = 'active') as "activeMemberCount",
      (SELECT COUNT(*) FROM courts WHERE facility_id = $1 AND status = 'available') as "availableCourtCount",
      (SELECT COUNT(*) FROM bookings WHERE facility_id = $1 AND status = 'confirmed' AND booking_date >= CURRENT_DATE) as "upcomingBookingsCount",
      (SELECT COUNT(*) FROM facility_admins WHERE facility_id = $1 AND status = 'active') as "adminCount"`,
    [facilityId]
  );

  return result.rows[0];
}
