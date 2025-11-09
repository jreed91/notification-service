-- Migration: Convert device token fields to arrays for multi-device support
-- Feature: 001-add-user-functionality
-- Date: 2025-11-09

-- Add new array columns for device tokens
ALTER TABLE users ADD COLUMN IF NOT EXISTS apns_tokens TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_tokens TEXT[];

-- Migrate existing single token data to arrays
UPDATE users
SET apns_tokens = ARRAY[apns_device_token]::TEXT[]
WHERE apns_device_token IS NOT NULL AND apns_tokens IS NULL;

UPDATE users
SET fcm_tokens = ARRAY[fcm_device_token]::TEXT[]
WHERE fcm_device_token IS NOT NULL AND fcm_tokens IS NULL;

-- Drop old single token columns (if they exist)
ALTER TABLE users DROP COLUMN IF EXISTS apns_device_token;
ALTER TABLE users DROP COLUMN IF EXISTS fcm_device_token;

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant_email ON users(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_phone ON users(tenant_id, phone_number) WHERE phone_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_created ON users(tenant_id, created_at DESC);

-- Add unique constraints for email and phone within tenant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_tenant_email'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_tenant_phone'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT unique_tenant_phone UNIQUE (tenant_id, phone_number);
    END IF;
END $$;
