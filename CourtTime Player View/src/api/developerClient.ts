// In production, use empty string for same-origin API calls
// In development, fallback to localhost:3001
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:3001');

const API_BASE = `${API_BASE_URL}/api/developer`;

// Get stored developer password from sessionStorage
const getPassword = (): string | null => {
  return sessionStorage.getItem('developer_password');
};

// Store developer password
export const setDeveloperPassword = (password: string): void => {
  sessionStorage.setItem('developer_password', password);
};

// Clear developer password (logout)
export const clearDeveloperPassword = (): void => {
  sessionStorage.removeItem('developer_password');
};

// Check if developer is authenticated
export const isDeveloperAuthenticated = (): boolean => {
  return !!getPassword();
};

// Common fetch wrapper with auth header
async function developerFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const password = getPassword();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (password) {
    (headers as Record<string, string>)['x-developer-password'] = password;
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

// Verify password
export async function verifyPassword(password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-developer-password': password,
      },
    });

    const data = await response.json();

    if (data.success) {
      setDeveloperPassword(password);
    }

    return data;
  } catch (error) {
    return { success: false, error: 'Failed to connect to server' };
  }
}

// Get all tables with row counts
export async function getTables(): Promise<{
  success: boolean;
  data?: { tables: Array<{ name: string; rowCount: number; columns: any[] }> };
  error?: string;
}> {
  try {
    const response = await developerFetch('/tables');
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch tables' };
  }
}

// Get table schema
export async function getTableSchema(tableName: string): Promise<{
  success: boolean;
  data?: { schema: any[] };
  error?: string;
}> {
  try {
    const response = await developerFetch(`/schema/${tableName}`);
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch schema' };
  }
}

// Get paginated records from a table
export async function getRecords(
  tableName: string,
  page: number = 1,
  limit: number = 25,
  search?: string,
  orderBy?: string,
  orderDir?: 'asc' | 'desc'
): Promise<{
  success: boolean;
  data?: {
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) params.append('search', search);
    if (orderBy) params.append('orderBy', orderBy);
    if (orderDir) params.append('orderDir', orderDir);

    const response = await developerFetch(`/tables/${tableName}?${params}`);
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch records' };
  }
}

// Get single record by ID
export async function getRecordById(
  tableName: string,
  id: string
): Promise<{
  success: boolean;
  data?: { record: any };
  error?: string;
}> {
  try {
    const response = await developerFetch(`/tables/${tableName}/${id}`);
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch record' };
  }
}

// Create a new record
export async function createRecord(
  tableName: string,
  data: Record<string, any>
): Promise<{
  success: boolean;
  data?: { record: any };
  error?: string;
}> {
  try {
    const response = await developerFetch(`/tables/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to create record' };
  }
}

// Update a record
export async function updateRecord(
  tableName: string,
  id: string,
  data: Record<string, any>
): Promise<{
  success: boolean;
  data?: { record: any };
  error?: string;
}> {
  try {
    const response = await developerFetch(`/tables/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to update record' };
  }
}

// Delete a record
export async function deleteRecord(
  tableName: string,
  id: string
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const response = await developerFetch(`/tables/${tableName}/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to delete record' };
  }
}

// Export table data
export async function exportTable(
  tableName: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  try {
    const response = await developerFetch(`/tables/${tableName}/export?format=${format}`);
    return response.text();
  } catch (error) {
    throw new Error('Failed to export table');
  }
}

// Execute raw SQL (SELECT only)
export async function executeSQL(sql: string): Promise<{
  success: boolean;
  data?: {
    rows: any[];
    rowCount: number;
    fields: string[];
  };
  error?: string;
}> {
  try {
    const response = await developerFetch('/sql', {
      method: 'POST',
      body: JSON.stringify({ query: sql }),
    });
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to execute SQL' };
  }
}

// Get foreign key options for dropdowns
export async function getForeignKeyOptions(
  table: string,
  column: string,
  displayColumn?: string
): Promise<{
  success: boolean;
  data?: { options: Array<{ value: string; label: string }> };
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (displayColumn) params.append('displayColumn', displayColumn);

    const response = await developerFetch(`/fk-options/${table}/${column}?${params}`);
    return response.json();
  } catch (error) {
    return { success: false, error: 'Failed to fetch options' };
  }
}
