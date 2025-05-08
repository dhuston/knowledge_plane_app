#!/usr/bin/env python3
"""
Script to add Dan Huston user directly to the database with proper Pharma tenant associations
"""

import os
import sys
import uuid
import asyncio
import argparse
import datetime

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from sqlalchemy import text

# Set up argument parser
parser = argparse.ArgumentParser(description='Add Dan Huston user to the database')
parser.add_argument('--email', default='daniel.huston@bms.com', help='User email')
parser.add_argument('--name', default='Dan Huston', help='User name')
parser.add_argument('--password', default='Password123!', help='User password')
parser.add_argument('--title', default='Developer', help='User title')
args = parser.parse_args()

# Database configuration
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:password@localhost:5433/knowledgeplan_dev")

# Pharma tenant ID (default tenant)
PHARMA_TENANT_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"

async def create_user():
    """Create Dan Huston user with Pharma tenant associations"""
    
    # Create database engine
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # First, confirm the Pharma tenant exists
            tenant_stmt = text(f"SELECT * FROM tenants WHERE id = '{PHARMA_TENANT_ID}'")
            tenant_result = await session.execute(tenant_stmt)
            tenant = tenant_result.fetchone()
            
            if not tenant:
                print(f"Error: Pharma tenant with ID {PHARMA_TENANT_ID} not found in database")
                return
            
            print(f"Found pharma tenant: {tenant}")
            
            # Check if user already exists with this email
            user_stmt = text(f"SELECT * FROM users WHERE email = '{args.email}'")
            user_result = await session.execute(user_stmt)
            existing_user = user_result.fetchone()
            
            if existing_user:
                print(f"User with email {args.email} already exists: {existing_user}")
                # Update the user's tenant_id to match the Pharma tenant
                update_stmt = text(f"""
                    UPDATE users 
                    SET tenant_id = '{PHARMA_TENANT_ID}',
                        name = '{args.name}',
                        title = '{args.title}',
                        updated_at = CURRENT_TIMESTAMP 
                    WHERE email = '{args.email}'
                """)
                await session.execute(update_stmt)
                await session.commit()
                print(f"Updated user {args.email} to associate with Pharma tenant")
                
                user_id = existing_user.id
            else:
                # User doesn't exist, create a new one
                # Generate password hash - using pbkdf2_sha256 or bcrypt
                from hashlib import pbkdf2_hmac
                import base64
                import os
                import secrets
                
                # Generate a salt
                salt = secrets.token_bytes(16)
                
                # Hash password with salt using pbkdf2
                key = pbkdf2_hmac('sha256', args.password.encode('utf-8'), salt, 100000)
                
                # Combine into a password hash string
                password_hash = f"pbkdf2:sha256:100000${base64.b64encode(salt).decode()}${base64.b64encode(key).decode()}"
                
                # Create a user ID
                user_id = str(uuid.uuid4())
                
                # Generate current timestamp
                now = datetime.datetime.now(datetime.timezone.utc)
                
                # Create the user directly in the database
                insert_stmt = text(f"""
                    INSERT INTO users (
                        id, tenant_id, email, name, hashed_password,
                        title, created_at, updated_at, 
                        auth_provider, auth_provider_id, online_status, is_admin
                    ) VALUES (
                        '{user_id}', '{PHARMA_TENANT_ID}', '{args.email}', '{args.name}', '{password_hash}',
                        '{args.title}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                        'password', '{args.email}', TRUE, TRUE
                    )
                """)
                
                await session.execute(insert_stmt)
                await session.commit()
                print(f"Created new user: {args.name} ({args.email}) with ID {user_id}")
            
            # Find an appropriate team to associate with in the Pharma tenant
            team_stmt = text(f"""
                SELECT id, name FROM teams 
                WHERE tenant_id = '{PHARMA_TENANT_ID}'
                LIMIT 1
            """)
            
            team_result = await session.execute(team_stmt)
            team = team_result.fetchone()
            
            if team:
                # Associate user with team
                update_team_stmt = text(f"""
                    UPDATE users
                    SET team_id = '{team.id}'
                    WHERE id = '{user_id}'
                """)
                await session.execute(update_team_stmt)
                await session.commit()
                print(f"Associated user with team: {team.name} ({team.id})")
            
            # Find admin user to set as manager
            admin_stmt = text(f"""
                SELECT id, name FROM users
                WHERE tenant_id = '{PHARMA_TENANT_ID}'
                AND (email LIKE 'admin%' OR is_admin = TRUE)
                LIMIT 1
            """)
            
            admin_result = await session.execute(admin_stmt)
            admin = admin_result.fetchone()
            
            if admin:
                # Set admin as manager
                update_manager_stmt = text(f"""
                    UPDATE users
                    SET manager_id = '{admin.id}'
                    WHERE id = '{user_id}'
                """)
                await session.execute(update_manager_stmt)
                await session.commit()
                print(f"Set manager to: {admin.name} ({admin.id})")
            
            # Grant admin privileges
            admin_flag_stmt = text(f"""
                UPDATE users
                SET is_admin = TRUE
                WHERE id = '{user_id}'
            """)
            await session.execute(admin_flag_stmt)
            await session.commit()
            print(f"Granted admin privileges to {args.name}")
            
            # Create notification preferences for the user
            try:
                prefs_check_stmt = text(f"""
                    SELECT user_id FROM notification_preferences 
                    WHERE user_id = '{user_id}'
                """)
                prefs_result = await session.execute(prefs_check_stmt)
                existing_prefs = prefs_result.fetchone()
                
                if not existing_prefs:
                    prefs_stmt = text(f"""
                        INSERT INTO notification_preferences (
                            user_id, tenant_id, email_enabled, in_app_enabled, 
                            priority_threshold, categories, created_at, updated_at
                        ) VALUES (
                            '{user_id}', '{PHARMA_TENANT_ID}', TRUE, TRUE,
                            'info', '["all"]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                        )
                    """)
                    await session.execute(prefs_stmt)
                    await session.commit()
                    print(f"Created notification preferences for user")
            except Exception as prefs_error:
                print(f"Warning: Could not create notification preferences: {prefs_error}")
            
            print(f"\nSuccessfully set up Dan Huston user in the Pharma tenant")
            print(f"Login credentials: {args.email} / {args.password}")
            
        except Exception as e:
            print(f"Error creating user: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_user())