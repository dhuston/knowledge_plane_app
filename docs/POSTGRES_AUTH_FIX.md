# PostgreSQL Authentication Fix

## Issue
The system is experiencing PostgreSQL authentication failures with the error message:
```
postgres@knowledgeplan_dev LOG: provided user name (postgres) and authenticated user name (root) do not match
postgres@knowledgeplan_dev FATAL: Peer authentication failed for user "postgres"
```

This occurs because PostgreSQL is configured to use `peer` authentication for local connections, which requires the operating system user to match the database user. In Docker containers, the backend application is running as `root` or `appuser` while trying to connect as the `postgres` database user, causing authentication failures.

## Root Cause
The PostgreSQL container's `pg_hba.conf` file contains this configuration:
```
local   all   postgres   peer
```

This forces local connections to use peer authentication which verifies the OS user name matches the requested database user name.

## Solution Options

### Option 1: Script-based Fix
Run the provided script to update PostgreSQL authentication configuration:

```bash
# Make script executable
chmod +x scripts/fix-postgres-auth.sh

# Run the script from project root
./scripts/fix-postgres-auth.sh
```

This script will:
1. Copy the SQL update script to the PostgreSQL container
2. Execute the script to change authentication method from `peer` to `md5`
3. Modify pg_hba.conf directly if needed
4. Reload PostgreSQL configuration

### Option 2: Docker Override Configuration
Use the `docker-compose.override.yml` file to modify the PostgreSQL configuration during container startup:

1. Place the provided `docker-compose.override.yml` in your project root
2. Rebuild and restart the containers:

```bash
docker-compose down
docker-compose up -d --build
```

This override will:
1. Update the `pg_hba.conf` file to use `md5` authentication
2. Set appropriate environment variables for authentication

### Option 3: Manual Fixed (Temporary)
For immediate testing, you can execute these commands:

```bash
# Connect to PostgreSQL container
docker exec -it biosphere_alpha-db-1 bash

# Modify authentication as postgres user
su - postgres

# Start PostgreSQL client
psql

# Inside psql, set password for postgres user
ALTER USER postgres WITH PASSWORD 'password';

# Edit pg_hba.conf (first find its location)
SHOW hba_file;

# Exit psql
\q

# Edit the file using the path from above
nano /var/lib/postgresql/data/pg_hba.conf
```

Change the line:
```
local   all   postgres   peer
```
to:
```
local   all   postgres   md5
```

Then reload the configuration:
```bash
pg_ctl reload
```

## Verification
After applying the fix, you should see successful database connections in the backend logs without authentication errors. The debug logs added to `session.py` and `config.py` will show the connection details.

## Implementation Notes
- The PostgreSQL server needs to be restarted or configurations reloaded after changes
- Make sure your database credentials in environment variables match what's in `config.py`
- For production environments, consider using more secure authentication methods