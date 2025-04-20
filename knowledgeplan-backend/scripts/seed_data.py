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
from app.models import User, Tenant, Team, Project, Goal # Added Project, Goal

# --- Configuration (Adjust as needed) ---
TARGET_TENANT_DOMAIN = "gmail.com"
YOUR_LOGIN_EMAIL = "drhuston1@gmail.com" # <-- Make sure this is your login email!

# Helper function to create or get entities
async def get_or_create(db: AsyncSession, model, defaults: dict = None, **kwargs):
    # Check if entity exists based on provided kwargs
    result = await db.execute(select(model).filter_by(**kwargs))
    instance = result.scalar_one_or_none()
    if instance:
        print(f"{model.__name__} already exists: {getattr(instance, 'name', instance.id)}")
        # Optionally update existing instance with defaults?
        # For now, just return existing
        return instance
    else:
        # Create new instance
        instance_data = {**kwargs, **(defaults or {})} 
        instance = model(**instance_data)
        db.add(instance)
        await db.flush() # Get ID immediately
        print(f"Created {model.__name__}: {getattr(instance, 'name', instance.id)}")
        return instance

async def seed():
    print("Starting data seeding...")
    db: AsyncSession = SessionLocal()
    
    try:
        # 1. Get Target Tenant (MUST exist from your login)
        print(f"Looking for tenant with domain: {TARGET_TENANT_DOMAIN}")
        target_tenant = await get_or_create(db, Tenant, domain=TARGET_TENANT_DOMAIN)
        if not target_tenant:
             print(f"ERROR: Tenant not found for domain {TARGET_TENANT_DOMAIN}. Please log in first.")
             return
        tenant_id = target_tenant.id

        # --- Pharma Structure ---

        # 2. Departments/Teams (Simplified as just Teams for now)
        team_virology = await get_or_create(db, Team, 
                                            name="Virology Research", 
                                            description="Developing novel antiviral therapies.", 
                                            tenant_id=tenant_id)
        team_clinical = await get_or_create(db, Team, 
                                            name="Clinical Trial Operations", 
                                            description="Managing global clinical trials.",
                                            tenant_id=tenant_id)
        team_oncology = await get_or_create(db, Team, 
                                            name="Oncology Marketing",
                                            description="Bringing cancer therapies to market.",
                                            tenant_id=tenant_id)

        # 3. Users (Pharma Roles)
        # Ensure unique emails if your User model requires it
        dr_reed = await get_or_create(db, User, email="evelyn.reed@pharma.co",
                                        defaults={
                                            "name":"Dr. Evelyn Reed", 
                                            "title":"Director, Virology", 
                                            "tenant_id":tenant_id,
                                            "team_id": team_virology.id # Assign team
                                        })
        charles_bio = await get_or_create(db, User, email="charles.bio@pharma.co",
                                            defaults={
                                                "name":"Charles Bio", 
                                                "title":"Principal Scientist", 
                                                "manager_id": dr_reed.id, # Reports to Dr. Reed
                                                "tenant_id":tenant_id,
                                                "team_id": team_virology.id 
                                            })
        sarah_stats = await get_or_create(db, User, email="sarah.stats@pharma.co",
                                            defaults={
                                                "name":"Sarah Stats", 
                                                "title":"Clinical Ops Lead", 
                                                "tenant_id":tenant_id,
                                                "team_id": team_clinical.id 
                                            })
        mark_market = await get_or_create(db, User, email="mark.market@pharma.co",
                                             defaults={
                                                 "name":"Mark Market", 
                                                 "title":"Product Manager, Oncology",
                                                 "tenant_id":tenant_id,
                                                 "team_id": team_oncology.id
                                             })

        # 4. Projects
        proj_antidote = await get_or_create(db, Project, name="Project Antidote (Phase II)",
                                            defaults={
                                                "description": "Phase II clinical trial for novel antiviral drug AV-123.",
                                                "status": "Active",
                                                "owning_team_id": team_clinical.id, # Clinical Ops owns trial execution
                                                "tenant_id": tenant_id
                                            })
        proj_mrna = await get_or_create(db, Project, name="mRNA Platform Upgrade",
                                        defaults={
                                            "description": "Developing next-gen mRNA vaccine delivery system.",
                                            "status": "Planning",
                                            "owning_team_id": team_virology.id, # Virology owns platform R&D
                                            "tenant_id": tenant_id
                                        })
        proj_onco_launch = await get_or_create(db, Project, name="OncoDrug Launch Prep",
                                            defaults={
                                                "description": "Preparing market launch for new oncology therapy OC-456.",
                                                "status": "Active",
                                                "owning_team_id": team_oncology.id, # Marketing owns launch
                                                "tenant_id": tenant_id
                                            })

        # 5. Goals (OKRs)
        goal_phase2 = await get_or_create(db, Goal, name="Complete Antidote Phase II by EOY 2025",
                                          defaults={
                                              "description": "Successfully complete patient enrollment and data collection for AV-123 Phase II.",
                                              "project_id": proj_antidote.id, # Aligned to Project Antidote
                                              "tenant_id": tenant_id
                                          })
        goal_mrna_time = await get_or_create(db, Goal, name="Reduce Vaccine Dev Time by 15%",
                                            defaults={
                                                "description": "Streamline mRNA platform processes to shorten development cycles.",
                                                "project_id": proj_mrna.id, # Aligned to mRNA Platform
                                                "tenant_id": tenant_id
                                            })
        goal_onco_share = await get_or_create(db, Goal, name="Capture 10% Market Share for OncoDrug",
                                             defaults={
                                                 "description": "Achieve 10% market share within 12 months of OC-456 launch.",
                                                 "project_id": proj_onco_launch.id, # Aligned to Launch Prep
                                                 "tenant_id": tenant_id
                                             })

        # 6. Update Logged-in User (Optional - Assign to a pharma role/team)
        print(f"Assigning Dr. Reed as manager for user: {YOUR_LOGIN_EMAIL}")
        login_user = await get_or_create(db, User, email=YOUR_LOGIN_EMAIL, defaults={"tenant_id": tenant_id})
        if login_user:
            needs_update = False
            if login_user.manager_id != dr_reed.id:
                 login_user.manager_id = dr_reed.id
                 needs_update = True
                 print(f"Updated {YOUR_LOGIN_EMAIL}'s manager to Dr. Reed.")
            if login_user.team_id != team_virology.id:
                 login_user.team_id = team_virology.id # Assign to Virology for demo
                 login_user.title = "Senior Scientist" # Give a title
                 needs_update = True
                 print(f"Updated {YOUR_LOGIN_EMAIL}'s team and title.")
            
            if needs_update:
                db.add(login_user)
                await db.flush()
            else:
                 print(f"{YOUR_LOGIN_EMAIL} already has manager/team assigned.")
        else:
            # Should not happen if get_or_create works correctly with the defaults
            print(f"WARNING: Logged-in user {YOUR_LOGIN_EMAIL} issue. Skipping assignments.")
        # ----------------------------------------------------------

        # Commit all changes
        await db.commit()
        print("Pharma data seeding completed successfully!")

    except Exception as e:
        print(f"An error occurred during seeding: {e}")
        import traceback
        traceback.print_exc() # Print full traceback for debugging
        await db.rollback() # Rollback on error
    finally:
        await db.close()

if __name__ == "__main__":
    # Ensure the DB URL used by SessionLocal is correct for local execution
    # This might require adjustment in db/session.py similar to env.py
    print("--- Make sure SessionLocal connects to localhost:5433 --- ")
    asyncio.run(seed()) 