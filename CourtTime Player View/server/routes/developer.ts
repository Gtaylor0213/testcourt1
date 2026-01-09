import express from 'express';
import {
  getAllTables,
  getTableSchema,
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  exportTable,
  executeSQL,
  isValidTable,
  getForeignKeyOptions,
  ALLOWED_TABLES
} from '../../src/services/developerService';

const router = express.Router();

// Developer authentication middleware
const developerAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const password = req.headers['x-developer-password'] as string;
  const envPassword = process.env.DEVELOPER_PASSWORD;

  // If no password is set in env, deny access
  if (!envPassword) {
    console.warn('DEVELOPER_PASSWORD not set in environment');
    return res.status(503).json({
      success: false,
      error: 'Developer console is not configured'
    });
  }

  if (password !== envPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid developer password'
    });
  }

  next();
};

// Apply auth middleware to all routes
router.use(developerAuth);

// Verify password (for login)
router.post('/verify', (req, res) => {
  // If we get here, the password was correct (middleware passed)
  res.json({ success: true, message: 'Password verified' });
});

// Get all tables with row counts
router.get('/tables', async (req, res, next) => {
  try {
    const tables = await getAllTables();
    res.json({
      success: true,
      data: { tables }
    });
  } catch (error: any) {
    console.error('Error getting tables:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get table schema
router.get('/schema/:table', async (req, res, next) => {
  try {
    const { table } = req.params;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}. Allowed tables: ${ALLOWED_TABLES.join(', ')}`
      });
    }

    const schema = await getTableSchema(table);
    res.json({
      success: true,
      data: { schema }
    });
  } catch (error: any) {
    console.error('Error getting schema:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get paginated records from a table
router.get('/tables/:table', async (req, res, next) => {
  try {
    const { table } = req.params;
    const {
      page = '1',
      limit = '25',
      search,
      orderBy = 'created_at',
      orderDir = 'desc'
    } = req.query;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const result = await getRecords(
      table,
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      search as string | undefined,
      orderBy as string,
      (orderDir as string).toLowerCase() === 'asc' ? 'asc' : 'desc'
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error getting records:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single record by ID
router.get('/tables/:table/:id', async (req, res, next) => {
  try {
    const { table, id } = req.params;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const record = await getRecordById(table, id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    res.json({
      success: true,
      data: { record }
    });
  } catch (error: any) {
    console.error('Error getting record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a new record
router.post('/tables/:table', async (req, res, next) => {
  try {
    const { table } = req.params;
    const data = req.body;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const record = await createRecord(table, data);

    console.log(`[Developer] Created record in ${table}:`, record.id || record);

    res.status(201).json({
      success: true,
      data: { record }
    });
  } catch (error: any) {
    console.error('Error creating record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a record
router.put('/tables/:table/:id', async (req, res, next) => {
  try {
    const { table, id } = req.params;
    const data = req.body;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const record = await updateRecord(table, id, data);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    console.log(`[Developer] Updated record in ${table}:`, id);

    res.json({
      success: true,
      data: { record }
    });
  } catch (error: any) {
    console.error('Error updating record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a record
router.delete('/tables/:table/:id', async (req, res, next) => {
  try {
    const { table, id } = req.params;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const deleted = await deleteRecord(table, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Record not found'
      });
    }

    console.log(`[Developer] Deleted record from ${table}:`, id);

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export table data
router.get('/tables/:table/export', async (req, res, next) => {
  try {
    const { table } = req.params;
    const { format = 'json' } = req.query;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const exportFormat = format === 'csv' ? 'csv' : 'json';
    const data = await exportTable(table, exportFormat);

    const contentType = exportFormat === 'csv' ? 'text/csv' : 'application/json';
    const extension = exportFormat === 'csv' ? 'csv' : 'json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${table}_export.${extension}`);
    res.send(data);
  } catch (error: any) {
    console.error('Error exporting table:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute raw SQL (SELECT only)
router.post('/sql', async (req, res, next) => {
  try {
    const { query: sql } = req.body;

    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'SQL query is required'
      });
    }

    console.log(`[Developer] Executing SQL:`, sql.substring(0, 100));

    const result = await executeSQL(sql);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error executing SQL:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get foreign key options for dropdowns
router.get('/fk-options/:table/:column', async (req, res, next) => {
  try {
    const { table, column } = req.params;
    const { displayColumn } = req.query;

    if (!isValidTable(table)) {
      return res.status(400).json({
        success: false,
        error: `Invalid table name: ${table}`
      });
    }

    const options = await getForeignKeyOptions(
      table,
      column,
      displayColumn as string | undefined
    );

    res.json({
      success: true,
      data: { options }
    });
  } catch (error: any) {
    console.error('Error getting FK options:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
