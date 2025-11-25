-- Migration: Add facility_id to conversations table
-- This ensures players can only message others in the same facility

-- Add facility_id column to conversations table
ALTER TABLE conversations
ADD COLUMN facility_id VARCHAR(50) REFERENCES facilities(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_conversations_facility ON conversations(facility_id);

-- Update existing conversations to have a facility_id (if any exist)
-- This would need to be done manually based on the users' memberships
-- For now, we'll leave existing conversations as NULL and require facility_id for new conversations

-- Add a check to ensure facility_id is provided for new conversations
-- (We'll enforce this in the application logic rather than a NOT NULL constraint
-- to avoid breaking existing data)

COMMENT ON COLUMN conversations.facility_id IS 'The facility where both participants are members. Players can only message within the same facility.';
