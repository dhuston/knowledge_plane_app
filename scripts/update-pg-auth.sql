-- Update PostgreSQL authentication method for local connections to postgres user
-- This changes the authentication method from 'peer' to 'md5'
-- Run this in the PostgreSQL container with: psql -U postgres -f update-pg-auth.sql

-- First, show current pg_hba.conf entries
SHOW hba_file;

-- Update authentication method
ALTER SYSTEM SET password_encryption TO 'md5';

-- Reload the configuration
SELECT pg_reload_conf();

-- Add a direct set password command for postgres user
ALTER USER postgres WITH PASSWORD 'password';