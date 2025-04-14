import asyncio
import os
import sys
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# --- Path setup ---
# Add the project root directory to sys.path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)
# -----------------

# Now we can import from the app
from app.db.session import SessionLocal # Assuming SessionLocal is defined for sync scripts
from app.models import User, Tenant, Team # Import models

# --- Configuration (Adjust as needed) ---
TARGET_TENANT_DOMAIN = "gmail.com"
YOUR_LOGIN_EMAIL = "drhuston1@gmail.com" # <-- Make sure this is your login email!

async def seed():
    print("Starting data seeding...")
    db: AsyncSession = SessionLocal()
    
    try:
        # 1. Get Target Tenant (MUST exist from your login)
        print(f"Looking for tenant with domain: {TARGET_TENANT_DOMAIN}")
        tenant_result = await db.execute(select(Tenant).where(Tenant.domain == TARGET_TENANT_DOMAIN))
        target_tenant = tenant_result.scalar_one_or_none()
        
        if not target_tenant:
            print(f"ERROR: Tenant not found for domain {TARGET_TENANT_DOMAIN}. Please log in first.")
            return
            
        print(f"Found tenant: {target_tenant.name} ({target_tenant.id})")
        tenant_id = target_tenant.id

        # 2. Create or Get Team
        team_name = "Alpha Team"
        print(f"Checking/Creating team: {team_name}")
        team_result = await db.execute(select(Team).where(Team.name == team_name, Team.tenant_id == tenant_id))
        team_alpha = team_result.scalar_one_or_none()
        if not team_alpha:
            team_alpha = Team(
                name=team_name, 
                description="The A team for demo", 
                tenant_id=tenant_id
            )
            db.add(team_alpha)
            await db.flush() # Use flush to get ID before commit if needed elsewhere
            print(f"Created team: {team_alpha.name} ({team_alpha.id})")
        else:
             print(f"Team already exists: {team_alpha.name} ({team_alpha.id})")
        team_alpha_id = team_alpha.id

        # 3. Create or Get Manager User
        alice_email = "alice.manager@example.com"
        print(f"Checking/Creating user: {alice_email}")
        user_result = await db.execute(select(User).where(User.email == alice_email))
        alice = user_result.scalar_one_or_none()
        if not alice:
             alice = User(
                 email=alice_email,
                 name="Alice Manager",
                 title="Engineering Lead",
                 tenant_id=tenant_id,
                 team_id=team_alpha_id # Assign team
             )
             db.add(alice)
             await db.flush()
             print(f"Created Alice Manager: {alice.id}")
        else:
             print(f"User Alice Manager already exists: {alice.id}")
             # Optionally update existing Alice
             if alice.team_id != team_alpha_id:
                 alice.team_id = team_alpha_id
                 db.add(alice)
                 await db.flush()
                 print(f"Updated Alice Manager team assignment.")
        alice_id = alice.id
        
        # 4. Create or Get Report User
        bob_email = "bob.report@example.com"
        print(f"Checking/Creating user: {bob_email}")
        user_result = await db.execute(select(User).where(User.email == bob_email))
        bob = user_result.scalar_one_or_none()
        if not bob:
            bob = User(
                email=bob_email,
                name="Bob Report",
                title="Software Engineer",
                manager_id=alice_id, # Assign manager
                tenant_id=tenant_id,
                team_id=team_alpha_id # Assign team
            )
            db.add(bob)
            await db.flush()
            print(f"Created Bob Report: {bob.id}")
        else:
             print(f"User Bob Report already exists: {bob.id}")
             # Optionally update existing Bob
             needs_update = False
             if bob.manager_id != alice_id:
                 bob.manager_id = alice_id
                 needs_update = True
             if bob.team_id != team_alpha_id:
                 bob.team_id = team_alpha_id
                 needs_update = True
             if needs_update:
                 db.add(bob)
                 await db.flush()
                 print(f"Updated Bob Report manager/team assignment.")

        # --- NEW STEP: Assign Alice as manager for logged-in user ---
        print(f"Assigning Alice Manager as manager for user: {YOUR_LOGIN_EMAIL}")
        login_user_result = await db.execute(select(User).where(User.email == YOUR_LOGIN_EMAIL))
        login_user = login_user_result.scalar_one_or_none()
        if login_user:
            if login_user.manager_id != alice_id:
                 login_user.manager_id = alice_id
                 db.add(login_user) # Add to session to mark for update
                 print(f"Updated {YOUR_LOGIN_EMAIL}'s manager.")
            else:
                 print(f"{YOUR_LOGIN_EMAIL} already has Alice as manager.")
        else:
            print(f"WARNING: Logged-in user {YOUR_LOGIN_EMAIL} not found in DB. Skipping manager assignment.")
        # ----------------------------------------------------------

        # Commit all changes
        await db.commit()
        print("Seeding completed successfully!")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        await db.rollback() # Rollback on error
    finally:
        await db.close()

if __name__ == "__main__":
    # Ensure the DB URL used by SessionLocal is correct for local execution
    # This might require adjustment in db/session.py similar to env.py
    print("--- Make sure SessionLocal connects to localhost:5433 --- ")
    asyncio.run(seed()) 