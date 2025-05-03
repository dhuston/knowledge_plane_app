#!/usr/bin/env python3
from sqlalchemy import text
from app.db.session import engine

def main():
    """Connect to database and query tenant and user information"""
    with engine.connect() as connection:
        # Query all tenants
        print("="*50)
        print("ALL TENANTS")
        print("="*50)
        tenant_result = connection.execute(text("SELECT id, name, domain FROM tenants"))
        for row in tenant_result:
            tenant_id, name, domain = row
            print(f"Tenant ID: {tenant_id} | Name: {name} | Domain: {domain}")
        
        print("\n" + "="*50)
        print("USERS WITH THEIR TENANT IDS")
        print("="*50)
        user_result = connection.execute(
            text("SELECT id, email, full_name, tenant_id FROM users")
        )
        for row in user_result:
            user_id, email, full_name, tenant_id = row
            print(f"User ID: {user_id} | Email: {email} | Name: {full_name} | Tenant ID: {tenant_id}")

if __name__ == "__main__":
    main()