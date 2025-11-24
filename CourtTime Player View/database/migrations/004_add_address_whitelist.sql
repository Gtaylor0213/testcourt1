-- Add address whitelist table for facility admin control
CREATE TABLE IF NOT EXISTS address_whitelist (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  facility_id VARCHAR(255) NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  accounts_limit INTEGER DEFAULT 4,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(facility_id, address)
);

-- Add address field to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS street_address TEXT;

-- Add index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_users_address ON users(street_address);
CREATE INDEX IF NOT EXISTS idx_whitelist_facility ON address_whitelist(facility_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_address_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_address_whitelist_timestamp
  BEFORE UPDATE ON address_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_address_whitelist_updated_at();
