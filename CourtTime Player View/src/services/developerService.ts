import { query } from '../database/connection';

// Whitelist of tables that can be managed through the developer interface
export const ALLOWED_TABLES = [
  'users',
  'user_preferences',
  'player_profiles',
  'facilities',
  'courts',
  'facility_contacts',
  'facility_admins',
  'facility_rules',
  'facility_memberships',
  'hoa_addresses',
  'bookings',
  'booking_violations',
  'hitting_partner_posts',
  'bulletin_posts',
  'events',
  'event_participants',
  'leagues',
  'league_participants',
  'conversations',
  'messages',
  'notifications',
  'booking_analytics',
  'facility_usage_stats'
] as const;

export type AllowedTable = typeof ALLOWED_TABLES[number];

export interface TableInfo {
  name: string;
  rowCount: number;
  columns: ColumnInfo[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  foreignColumn?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Validate table name against whitelist
export function isValidTable(tableName: string): tableName is AllowedTable {
  return ALLOWED_TABLES.includes(tableName as AllowedTable);
}

// Get all tables with row counts
export async function getAllTables(): Promise<TableInfo[]> {
  const tables: TableInfo[] = [];

  for (const tableName of ALLOWED_TABLES) {
    try {
      const countResult = await query(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const count = parseInt(countResult.rows[0]?.count || '0', 10);

      const columns = await getTableSchema(tableName);

      tables.push({
        name: tableName,
        rowCount: count,
        columns
      });
    } catch (error) {
      // Table might not exist, skip it
      console.warn(`Table ${tableName} not found or error:`, error);
    }
  }

  return tables;
}

// Get table schema (columns, types, constraints)
export async function getTableSchema(tableName: string): Promise<ColumnInfo[]> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const result = await query(`
    SELECT
      c.column_name as name,
      c.data_type as type,
      c.is_nullable = 'YES' as nullable,
      c.column_default as default_value,
      COALESCE(pk.is_pk, false) as is_primary_key,
      COALESCE(fk.is_fk, false) as is_foreign_key,
      fk.foreign_table,
      fk.foreign_column
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT kcu.column_name, true as is_pk
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
      SELECT
        kcu.column_name,
        true as is_fk,
        ccu.table_name as foreign_table,
        ccu.column_name as foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_name = $1 AND tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.column_name = fk.column_name
    WHERE c.table_name = $1
    ORDER BY c.ordinal_position
  `, [tableName]);

  return result.rows.map(row => ({
    name: row.name,
    type: row.type,
    nullable: row.nullable,
    defaultValue: row.default_value,
    isPrimaryKey: row.is_primary_key,
    isForeignKey: row.is_foreign_key,
    foreignTable: row.foreign_table,
    foreignColumn: row.foreign_column
  }));
}

// Get paginated records from a table
export async function getRecords(
  tableName: string,
  page: number = 1,
  limit: number = 25,
  search?: string,
  orderBy: string = 'created_at',
  orderDir: 'asc' | 'desc' = 'desc'
): Promise<PaginatedResult<Record<string, any>>> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const offset = (page - 1) * limit;

  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
  const countParams: any[] = [];

  if (search) {
    // Get text columns for search
    const schema = await getTableSchema(tableName);
    const textColumns = schema
      .filter(c => ['text', 'character varying', 'varchar', 'uuid'].includes(c.type))
      .map(c => c.name);

    if (textColumns.length > 0) {
      const searchConditions = textColumns
        .map((col, i) => `${col}::text ILIKE $${i + 1}`)
        .join(' OR ');
      countQuery += ` WHERE ${searchConditions}`;
      textColumns.forEach(() => countParams.push(`%${search}%`));
    }
  }

  const countResult = await query(countQuery, countParams);
  const total = parseInt(countResult.rows[0]?.count || '0', 10);

  // Get records
  let dataQuery = `SELECT * FROM ${tableName}`;
  const dataParams: any[] = [];

  if (search) {
    const schema = await getTableSchema(tableName);
    const textColumns = schema
      .filter(c => ['text', 'character varying', 'varchar', 'uuid'].includes(c.type))
      .map(c => c.name);

    if (textColumns.length > 0) {
      const searchConditions = textColumns
        .map((col, i) => `${col}::text ILIKE $${i + 1}`)
        .join(' OR ');
      dataQuery += ` WHERE ${searchConditions}`;
      textColumns.forEach(() => dataParams.push(`%${search}%`));
    }
  }

  // Validate orderBy column exists
  const schema = await getTableSchema(tableName);
  const columnNames = schema.map(c => c.name);
  const safeOrderBy = columnNames.includes(orderBy) ? orderBy :
    (columnNames.includes('created_at') ? 'created_at' : columnNames[0]);

  dataQuery += ` ORDER BY ${safeOrderBy} ${orderDir.toUpperCase()}`;
  dataQuery += ` LIMIT $${dataParams.length + 1} OFFSET $${dataParams.length + 2}`;
  dataParams.push(limit, offset);

  const dataResult = await query(dataQuery, dataParams);

  return {
    data: dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// Get single record by ID
export async function getRecordById(
  tableName: string,
  id: string
): Promise<Record<string, any> | null> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  // Determine primary key column
  const schema = await getTableSchema(tableName);
  const pkColumn = schema.find(c => c.isPrimaryKey)?.name || 'id';

  const result = await query(
    `SELECT * FROM ${tableName} WHERE ${pkColumn} = $1`,
    [id]
  );

  return result.rows[0] || null;
}

// Create a new record
export async function createRecord(
  tableName: string,
  data: Record<string, any>
): Promise<Record<string, any>> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  // Filter out null/undefined values and get valid columns
  const schema = await getTableSchema(tableName);
  const columnNames = schema.map(c => c.name);

  const validData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (columnNames.includes(key) && value !== undefined) {
      validData[key] = value;
    }
  }

  const columns = Object.keys(validData);
  const values = Object.values(validData);
  const placeholders = columns.map((_, i) => `$${i + 1}`);

  const result = await query(
    `INSERT INTO ${tableName} (${columns.join(', ')})
     VALUES (${placeholders.join(', ')})
     RETURNING *`,
    values
  );

  return result.rows[0];
}

// Update a record
export async function updateRecord(
  tableName: string,
  id: string,
  data: Record<string, any>
): Promise<Record<string, any> | null> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  // Get schema and primary key
  const schema = await getTableSchema(tableName);
  const columnNames = schema.map(c => c.name);
  const pkColumn = schema.find(c => c.isPrimaryKey)?.name || 'id';

  // Filter to valid columns only
  const validData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (columnNames.includes(key) && key !== pkColumn && value !== undefined) {
      validData[key] = value;
    }
  }

  if (Object.keys(validData).length === 0) {
    throw new Error('No valid fields to update');
  }

  const setClause = Object.keys(validData)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ');

  const values = [...Object.values(validData), id];

  const result = await query(
    `UPDATE ${tableName}
     SET ${setClause}, updated_at = CURRENT_TIMESTAMP
     WHERE ${pkColumn} = $${values.length}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
}

// Delete a record
export async function deleteRecord(
  tableName: string,
  id: string
): Promise<boolean> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const schema = await getTableSchema(tableName);
  const pkColumn = schema.find(c => c.isPrimaryKey)?.name || 'id';

  const result = await query(
    `DELETE FROM ${tableName} WHERE ${pkColumn} = $1 RETURNING ${pkColumn}`,
    [id]
  );

  return result.rows.length > 0;
}

// Export table data
export async function exportTable(
  tableName: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  if (!isValidTable(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  const result = await query(`SELECT * FROM ${tableName}`);
  const data = result.rows;

  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  // CSV format
  if (data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) {
        return '';
      }
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Execute raw SQL (SELECT only for safety)
export async function executeSQL(
  sql: string
): Promise<{ rows: any[]; rowCount: number; fields: string[] }> {
  // Security: Only allow SELECT statements
  const trimmedSQL = sql.trim().toUpperCase();
  if (!trimmedSQL.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed for safety');
  }

  // Block dangerous keywords even in SELECT
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'GRANT', 'REVOKE'];
  for (const keyword of dangerousKeywords) {
    if (trimmedSQL.includes(keyword)) {
      throw new Error(`Query contains forbidden keyword: ${keyword}`);
    }
  }

  const result = await query(sql);

  return {
    rows: result.rows,
    rowCount: result.rowCount || result.rows.length,
    fields: result.fields?.map((f: any) => f.name) || (result.rows[0] ? Object.keys(result.rows[0]) : [])
  };
}

// Get foreign key options for a column
export async function getForeignKeyOptions(
  foreignTable: string,
  foreignColumn: string,
  displayColumn?: string
): Promise<{ value: string; label: string }[]> {
  if (!isValidTable(foreignTable)) {
    throw new Error(`Invalid foreign table: ${foreignTable}`);
  }

  // Try to find a good display column
  const schema = await getTableSchema(foreignTable);
  const columnNames = schema.map(c => c.name);

  const possibleDisplayColumns = ['name', 'full_name', 'title', 'email', foreignColumn];
  const displayCol = displayColumn ||
    possibleDisplayColumns.find(c => columnNames.includes(c)) ||
    foreignColumn;

  const result = await query(
    `SELECT ${foreignColumn} as value, ${displayCol} as label FROM ${foreignTable} LIMIT 1000`
  );

  return result.rows;
}
