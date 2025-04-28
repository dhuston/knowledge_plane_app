import asyncio
import os
import sys
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime # Added datetime for created_at/updated_at

# --- Path setup ---
# Add the project root directory to sys.path
project_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if project_dir not in sys.path:
    sys.path.insert(0, project_dir)
# -----------------

# Now we can import from the app
from app.db.session import SessionLocal # Assuming SessionLocal is defined for sync scripts
from app.models import User, Tenant, Team, Project, Goal, KnowledgeAsset # Added Project, Goal, KnowledgeAsset
from app.models.knowledge_asset import KnowledgeAssetTypeEnum
from app.models.goal import GoalTypeEnum
from app.models.project import project_participants # Ensure import
from sqlalchemy import insert, exists

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
        print(f"Using Tenant ID: {tenant_id}") # Added print

        # --- Pharma Structure --- #

        # --- 2. Departments/Teams --- #
        print("\n--- Seeding Departments/Teams ---")
        # Existing
        team_virology = await get_or_create(db, Team, 
                                            name="Virology Research", 
                                            description="Developing novel antiviral therapies.", 
                                            tenant_id=tenant_id)
        team_clinical_ops = await get_or_create(db, Team, 
                                            name="Clinical Trial Operations", 
                                            description="Managing global clinical trials.",
                                            tenant_id=tenant_id)
        team_oncology_mkt = await get_or_create(db, Team, 
                                            name="Oncology Marketing",
                                            description="Bringing cancer therapies to market.",
                                            tenant_id=tenant_id)
        # New Departments
        team_discovery_bio = await get_or_create(db, Team, 
                                             name="Discovery Biology",
                                             description="Early-stage target identification and validation.",
                                             tenant_id=tenant_id)
        team_preclinical = await get_or_create(db, Team,
                                            name="Preclinical Development",
                                            description="Conducting in vivo and in vitro studies.",
                                            tenant_id=tenant_id)
        team_regulatory = await get_or_create(db, Team,
                                          name="Regulatory Affairs",
                                          description="Managing submissions and interactions with health authorities.",
                                          tenant_id=tenant_id)
        team_cmc = await get_or_create(db, Team,
                                    name="CMC (Chemistry, Manufacturing, Controls)",
                                    description="Overseeing drug substance and product development.",
                                    tenant_id=tenant_id)
        team_med_affairs = await get_or_create(db, Team,
                                          name="Medical Affairs",
                                          description="Communicating scientific information and KOL engagement.",
                                          tenant_id=tenant_id)
        # -------------------------- #

        # --- 3. Users --- #
        print("\n--- Seeding Users ---")
        # Existing Users (Assigning to correct teams if needed)
        dr_reed = await get_or_create(db, User, email="evelyn.reed@pharma-corp.com", # Changed domain
                                        defaults={
                                            "name":"Dr. Evelyn Reed", 
                                            "title":"Director, Virology Research", 
                                            "tenant_id":tenant_id,
                                            "team_id": team_virology.id
                                        })
        charles_bio = await get_or_create(db, User, email="charles.bio@pharma-corp.com", # Changed domain
                                            defaults={
                                                "name":"Charles Bio", 
                                                "title":"Principal Scientist, Virology", 
                                                "manager_id": dr_reed.id, 
                                                "tenant_id":tenant_id,
                                                "team_id": team_virology.id 
                                            })
        sarah_stats = await get_or_create(db, User, email="sarah.stats@pharma-corp.com", # Changed domain
                                            defaults={
                                                "name":"Sarah Stats", 
                                                "title":"Director, Clinical Ops", 
                                                "tenant_id":tenant_id,
                                                "team_id": team_clinical_ops.id 
                                            })
        mark_market = await get_or_create(db, User, email="mark.market@pharma-corp.com", # Changed domain
                                             defaults={
                                                 "name":"Mark Market", 
                                                 "title":"Product Director, Oncology",
                                                 "tenant_id":tenant_id,
                                                 "team_id": team_oncology_mkt.id
                                             })
        
        # New Users
        # Discovery
        dr_lee = await get_or_create(db, User, email="david.lee@pharma-corp.com",
                                     defaults={"name":"Dr. David Lee", "title":"VP, Discovery", "tenant_id":tenant_id, "team_id": team_discovery_bio.id})
        alice_target = await get_or_create(db, User, email="alice.target@pharma-corp.com",
                                     defaults={"name":"Alice Target", "title":"Scientist II, Discovery", "manager_id": dr_lee.id, "tenant_id":tenant_id, "team_id": team_discovery_bio.id})

        # Preclinical
        dr_chen = await get_or_create(db, User, email="maria.chen@pharma-corp.com",
                                      defaults={"name":"Dr. Maria Chen", "title":"Director, Preclinical", "tenant_id":tenant_id, "team_id": team_preclinical.id})
        ben_tox = await get_or_create(db, User, email="ben.tox@pharma-corp.com",
                                      defaults={"name":"Ben Tox", "title":"Toxicology Lead", "manager_id": dr_chen.id, "tenant_id":tenant_id, "team_id": team_preclinical.id})

        # Clinical Ops (more roles)
        chris_study = await get_or_create(db, User, email="chris.study@pharma-corp.com",
                                      defaults={"name":"Chris Study", "title":"Clinical Study Manager", "manager_id": sarah_stats.id, "tenant_id":tenant_id, "team_id": team_clinical_ops.id})
        jane_cra = await get_or_create(db, User, email="jane.cra@pharma-corp.com",
                                      defaults={"name":"Jane CRA", "title":"Clinical Research Associate", "manager_id": chris_study.id, "tenant_id":tenant_id, "team_id": team_clinical_ops.id})

        # Regulatory
        robert_reg = await get_or_create(db, User, email="robert.reg@pharma-corp.com",
                                        defaults={"name":"Robert Reg", "title":"VP, Regulatory Affairs", "tenant_id":tenant_id, "team_id": team_regulatory.id})
        linda_label = await get_or_create(db, User, email="linda.label@pharma-corp.com",
                                        defaults={"name":"Linda Label", "title":"Regulatory Manager", "manager_id": robert_reg.id, "tenant_id":tenant_id, "team_id": team_regulatory.id})

        # CMC
        dr_patel = await get_or_create(db, User, email="samir.patel@pharma-corp.com",
                                       defaults={"name":"Dr. Samir Patel", "title":"Head of CMC", "tenant_id":tenant_id, "team_id": team_cmc.id})
        olivia_process = await get_or_create(db, User, email="olivia.process@pharma-corp.com",
                                       defaults={"name":"Olivia Process", "title":"Process Engineer", "manager_id": dr_patel.id, "tenant_id":tenant_id, "team_id": team_cmc.id})

        # Marketing (more roles)
        susan_brand = await get_or_create(db, User, email="susan.brand@pharma-corp.com",
                                        defaults={"name":"Susan Brand", "title":"Senior Brand Manager", "manager_id": mark_market.id, "tenant_id":tenant_id, "team_id": team_oncology_mkt.id})

        # Medical Affairs
        dr_khan = await get_or_create(db, User, email="ayesha.khan@pharma-corp.com",
                                      defaults={"name":"Dr. Ayesha Khan", "title":"Medical Director", "tenant_id":tenant_id, "team_id": team_med_affairs.id})
        mike_msl = await get_or_create(db, User, email="mike.msl@pharma-corp.com",
                                     defaults={"name":"Mike MSL", "title":"Medical Science Liaison", "manager_id": dr_khan.id, "tenant_id":tenant_id, "team_id": team_med_affairs.id})
        # -------------- #

        # --- NEW SECTION: Assign Team Leads --- #
        print("\n--- Assigning Team Leads ---")
        if team_virology and dr_reed:
            if team_virology.lead_id != dr_reed.id:
                team_virology.lead_id = dr_reed.id
                db.add(team_virology)
                print(f"Assigned {dr_reed.name} as lead for {team_virology.name}")
        if team_clinical_ops and sarah_stats:
            if team_clinical_ops.lead_id != sarah_stats.id:
                team_clinical_ops.lead_id = sarah_stats.id
                db.add(team_clinical_ops)
                print(f"Assigned {sarah_stats.name} as lead for {team_clinical_ops.name}")
        if team_oncology_mkt and mark_market:
            if team_oncology_mkt.lead_id != mark_market.id:
                team_oncology_mkt.lead_id = mark_market.id
                db.add(team_oncology_mkt)
                print(f"Assigned {mark_market.name} as lead for {team_oncology_mkt.name}")
        if team_discovery_bio and dr_lee:
            if team_discovery_bio.lead_id != dr_lee.id:
                team_discovery_bio.lead_id = dr_lee.id
                db.add(team_discovery_bio)
                print(f"Assigned {dr_lee.name} as lead for {team_discovery_bio.name}")
        if team_preclinical and dr_chen:
            if team_preclinical.lead_id != dr_chen.id:
                team_preclinical.lead_id = dr_chen.id
                db.add(team_preclinical)
                print(f"Assigned {dr_chen.name} as lead for {team_preclinical.name}")
        if team_regulatory and robert_reg:
            if team_regulatory.lead_id != robert_reg.id:
                team_regulatory.lead_id = robert_reg.id
                db.add(team_regulatory)
                print(f"Assigned {robert_reg.name} as lead for {team_regulatory.name}")
        if team_cmc and dr_patel:
            if team_cmc.lead_id != dr_patel.id:
                team_cmc.lead_id = dr_patel.id
                db.add(team_cmc)
                print(f"Assigned {dr_patel.name} as lead for {team_cmc.name}")
        if team_med_affairs and dr_khan:
            if team_med_affairs.lead_id != dr_khan.id:
                team_med_affairs.lead_id = dr_khan.id
                db.add(team_med_affairs)
                print(f"Assigned {dr_khan.name} as lead for {team_med_affairs.name}")
        await db.flush() # Flush lead assignments
        # ------------------------------------- #
        
        # --- 4. Projects --- #
        print("\n--- Seeding Projects ---")
        # Existing
        proj_antidote_ph2 = await get_or_create(db, Project, name="Antiviral AV-123 (Phase II)", # Renamed slightly
                                            defaults={
                                                "description": "Phase II clinical trial for novel antiviral drug AV-123.",
                                                "status": "Active",
                                                "owning_team_id": team_clinical_ops.id, 
                                                "tenant_id": tenant_id
                                            })
        proj_mrna_platform = await get_or_create(db, Project, name="mRNA Platform Upgrade",
                                        defaults={
                                            "description": "Developing next-gen mRNA vaccine delivery system.",
                                            "status": "Planning",
                                            "owning_team_id": team_virology.id, 
                                            "tenant_id": tenant_id
                                        })
        proj_onco_launch_prep = await get_or_create(db, Project, name="OncoDrug OC-456 Launch Prep", # Renamed slightly
                                            defaults={
                                                "description": "Preparing market launch for new oncology therapy OC-456.",
                                                "status": "Active",
                                                "owning_team_id": team_oncology_mkt.id, 
                                                "tenant_id": tenant_id
                                            })
        
        # New Projects
        proj_kp101_preclin = await get_or_create(db, Project, name="KP-101 Preclinical Package",
                                            defaults={
                                                "description": "Complete IND-enabling studies for KP-101 (oncology).",
                                                "status": "Active",
                                                "owning_team_id": team_preclinical.id, 
                                                "tenant_id": tenant_id
                                            })
        proj_kp205_discovery = await get_or_create(db, Project, name="KP-205 Target Validation (Neuro)",
                                            defaults={
                                                "description": "Validate novel target KP-205 for neurological disorders.",
                                                "status": "Active",
                                                "owning_team_id": team_discovery_bio.id,
                                                "tenant_id": tenant_id
                                            })
        proj_av123_cmc = await get_or_create(db, Project, name="AV-123 Scale-Up Manufacturing",
                                        defaults={
                                            "description": "Develop scalable manufacturing process for AV-123 drug substance.",
                                            "status": "Planning",
                                            "owning_team_id": team_cmc.id,
                                            "tenant_id": tenant_id
                                        })
        proj_oc456_reg_submission = await get_or_create(db, Project, name="OC-456 NDA Submission (US)",
                                        defaults={
                                            "description": "Prepare and submit New Drug Application for OC-456 to FDA.",
                                            "status": "Active",
                                            "owning_team_id": team_regulatory.id,
                                            "tenant_id": tenant_id
                                        })
        proj_av123_med_affairs = await get_or_create(db, Project, name="AV-123 Publication Plan",
                                         defaults={
                                             "description": "Develop strategy for disseminating Phase II results.",
                                             "status": "Active",
                                             "owning_team_id": team_med_affairs.id,
                                             "tenant_id": tenant_id
                                         })
        # -------------- #
        
        # --- 5. Goals (OKRs) --- #
        print("\n--- Seeding Goals ---")
        # Existing
        goal_phase2_complete = await get_or_create(db, Goal, title="[Clinical] Complete Antidote Phase II by EOY 2025",
                                          defaults={
                                              "description": "Successfully complete patient enrollment and data collection for AV-123 Phase II.",
                                              "type": GoalTypeEnum.DEPARTMENT, # More specific type
                                              "tenant_id": tenant_id
                                          })
        goal_mrna_dev_time = await get_or_create(db, Goal, title="[Research] Reduce Vaccine Dev Time by 15%",
                                            defaults={
                                                "description": "Streamline mRNA platform processes to shorten development cycles.",
                                                "type": GoalTypeEnum.DEPARTMENT,
                                                "tenant_id": tenant_id
                                            })
        goal_onco_market_share = await get_or_create(db, Goal, title="[Commercial] Capture 10% Market Share for OncoDrug",
                                             defaults={
                                                 "description": "Achieve 10% market share within 12 months of OC-456 launch.",
                                                 "type": GoalTypeEnum.ENTERPRISE, 
                                                 "tenant_id": tenant_id
                                             })

        # New Goals
        goal_ind_kp101 = await get_or_create(db, Goal, title="[Preclinical] File IND for KP-101 by Q3 2025",
                                          defaults={ # Link to broader goal if applicable?
                                              "description": "Submit Investigational New Drug application for KP-101.",
                                              "type": GoalTypeEnum.DEPARTMENT,
                                              "parent_id": goal_onco_market_share.id, # Example: Preclinical goal supports overall Onco goal
                                              "tenant_id": tenant_id
                                          })
        goal_discovery_pipeline = await get_or_create(db, Goal, title="[Discovery] Advance 3 Novel Targets to Preclinical",
                                            defaults={
                                                "description": "Identify and validate 3 new drug targets for pipeline entry.",
                                                "type": GoalTypeEnum.DEPARTMENT,
                                                # "parent_id": None, # Top-level department goal
                                                "tenant_id": tenant_id
                                            })
        goal_cmc_scale = await get_or_create(db, Goal, title="[CMC] Establish Scalable Process for AV-123",
                                          defaults={
                                              "description": "Ensure robust and scalable manufacturing for Phase III and commercial.",
                                              "type": GoalTypeEnum.TEAM,
                                              "parent_id": goal_phase2_complete.id, # Example: CMC goal supports Phase II completion goal
                                              "tenant_id": tenant_id
                                          })
        goal_reg_approval_oc456 = await get_or_create(db, Goal, title="[Regulatory] Achieve FDA Approval for OC-456",
                                            defaults={
                                                "description": "Gain marketing authorization for OncoDrug OC-456 in the US.",
                                                "type": GoalTypeEnum.ENTERPRISE,
                                                "parent_id": goal_onco_market_share.id, # Example: Reg approval supports market share goal
                                                "tenant_id": tenant_id
                                            })
        # ------------------ #

        # --- 6. Link Projects to Goals --- #
        print("\n--- Linking Projects to Goals ---")
        # Existing links
        if proj_antidote_ph2 and goal_phase2_complete: # Updated names
            if proj_antidote_ph2.goal_id != goal_phase2_complete.id:
                proj_antidote_ph2.goal_id = goal_phase2_complete.id
                db.add(proj_antidote_ph2)
                print(f"Linked {proj_antidote_ph2.name} to goal {goal_phase2_complete.title}")
        if proj_mrna_platform and goal_mrna_dev_time: # Updated names
             if proj_mrna_platform.goal_id != goal_mrna_dev_time.id:
                proj_mrna_platform.goal_id = goal_mrna_dev_time.id
                db.add(proj_mrna_platform)
                print(f"Linked {proj_mrna_platform.name} to goal {goal_mrna_dev_time.title}")
        if proj_onco_launch_prep and goal_onco_market_share: # Updated names
            if proj_onco_launch_prep.goal_id != goal_onco_market_share.id:
                proj_onco_launch_prep.goal_id = goal_onco_market_share.id
                db.add(proj_onco_launch_prep)
                print(f"Linked {proj_onco_launch_prep.name} to goal {goal_onco_market_share.title}")
        # New links
        if proj_kp101_preclin and goal_ind_kp101:
             if proj_kp101_preclin.goal_id != goal_ind_kp101.id:
                proj_kp101_preclin.goal_id = goal_ind_kp101.id
                db.add(proj_kp101_preclin)
                print(f"Linked {proj_kp101_preclin.name} to goal {goal_ind_kp101.title}")
        if proj_kp205_discovery and goal_discovery_pipeline:
             if proj_kp205_discovery.goal_id != goal_discovery_pipeline.id:
                proj_kp205_discovery.goal_id = goal_discovery_pipeline.id # Maybe link to broader goal
                db.add(proj_kp205_discovery)
                print(f"Linked {proj_kp205_discovery.name} to goal {goal_discovery_pipeline.title}")
        if proj_av123_cmc and goal_cmc_scale:
             if proj_av123_cmc.goal_id != goal_cmc_scale.id:
                proj_av123_cmc.goal_id = goal_cmc_scale.id
                db.add(proj_av123_cmc)
                print(f"Linked {proj_av123_cmc.name} to goal {goal_cmc_scale.title}")
        if proj_oc456_reg_submission and goal_reg_approval_oc456:
             if proj_oc456_reg_submission.goal_id != goal_reg_approval_oc456.id:
                proj_oc456_reg_submission.goal_id = goal_reg_approval_oc456.id
                db.add(proj_oc456_reg_submission)
                print(f"Linked {proj_oc456_reg_submission.name} to goal {goal_reg_approval_oc456.title}")

        await db.flush() # Flush project updates before creating KAs
        # ------------------------------ #

        # --- NEW SECTION: Assign Project Participants --- #
        print("\n--- Assigning Project Participants ---")
        async def assign_participant(project: Project, user: User):
            if not project or not user: return
            # Check if association already exists
            exists_stmt = select(exists().where(
                project_participants.c.project_id == project.id,
                project_participants.c.user_id == user.id
            ))
            association_exists = (await db.execute(exists_stmt)).scalar()

            if not association_exists:
                insert_stmt = insert(project_participants).values(project_id=project.id, user_id=user.id)
                await db.execute(insert_stmt)
                print(f"Assigned {user.name} to project {project.name}")
            # else: # Optional log
            #    print(f"{user.name} already assigned to project {project.name}")

        # Example Assignments (add more as needed)
        await assign_participant(proj_antidote_ph2, charles_bio) # Scientist on Virology project
        await assign_participant(proj_antidote_ph2, chris_study) # Study Manager on Virology project
        await assign_participant(proj_antidote_ph2, jane_cra)    # CRA on Virology project
        await assign_participant(proj_mrna_platform, dr_reed)     # Director overseeing platform
        await assign_participant(proj_mrna_platform, charles_bio) # Scientist working on platform
        await assign_participant(proj_onco_launch_prep, susan_brand) # Brand Manager on launch
        await assign_participant(proj_kp101_preclin, ben_tox)      # Toxicology lead on preclinical
        await assign_participant(proj_kp101_preclin, alice_target) # Discovery scientist (collaboration?)
        await assign_participant(proj_kp205_discovery, alice_target) # Discovery scientist
        await assign_participant(proj_av123_cmc, olivia_process) # CMC engineer
        await assign_participant(proj_oc456_reg_submission, linda_label) # Reg manager
        await assign_participant(proj_av123_med_affairs, mike_msl) # MSL 
        # Assign logged-in user to a project
        login_user = await get_or_create(db, User, email=YOUR_LOGIN_EMAIL, defaults={"tenant_id": tenant_id})
        await assign_participant(proj_kp101_preclin, login_user)
        
        await db.flush() # Flush participant assignments
        # ------------------------------------------ #

        # --- 7. Update Logged-in User --- #
        print("\n--- Updating Logged-in User ---")
        # Assigning to a potentially relevant role/manager
        if login_user:
            manager_to_assign = dr_chen # Example: Assign to Preclinical Director
            team_to_assign = team_preclinical
            title_to_assign = "Senior Research Associate"
            needs_update = False
            if login_user.manager_id != manager_to_assign.id:
                 login_user.manager_id = manager_to_assign.id
                 needs_update = True
                 print(f"Updated {YOUR_LOGIN_EMAIL}'s manager to {manager_to_assign.name}.")
            if login_user.team_id != team_to_assign.id:
                 login_user.team_id = team_to_assign.id 
                 login_user.title = title_to_assign 
                 needs_update = True
                 print(f"Updated {YOUR_LOGIN_EMAIL}'s team to {team_to_assign.name} and title to {title_to_assign}.")
            
            if needs_update:
                db.add(login_user)
                await db.flush()
            else:
                 print(f"{YOUR_LOGIN_EMAIL} already has manager/team assigned.")
        else:
            print(f"WARNING: Logged-in user {YOUR_LOGIN_EMAIL} issue. Skipping assignments.")
        # ------------------------------- #

        # --- 8. Knowledge Assets --- #
        print("\n--- Seeding Knowledge Assets ---")
        # Existing (updated links)
        note_antidote_protocol = await get_or_create(db, KnowledgeAsset,
                                            title="Antidote Phase II Protocol Q&A",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_antidote_ph2.id, # Updated project link
                                                "created_by_user_id": sarah_stats.id,
                                                "type": KnowledgeAssetTypeEnum.NOTE,
                                                "content": "Key questions addressed: patient screening criteria clarification, data collection timelines. Follow up needed on site readiness.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        doc_mrna_report = await get_or_create(db, KnowledgeAsset,
                                            title="mRNA Delivery System - Stability Report Q1",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_mrna_platform.id, # Updated project link
                                                "created_by_user_id": charles_bio.id,
                                                "type": KnowledgeAssetTypeEnum.DOCUMENT,
                                                "source": "Internal Research",
                                                "link": "/internal_docs/mrna_stability_q1_2025.pdf",
                                                "content": "Summary: Initial stability data for lipid nanoparticle formulation LN-7 shows promise. Further testing required.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        meet_onco_kickoff = await get_or_create(db, KnowledgeAsset,
                                            title="OncoDrug Launch Kickoff Meeting",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_onco_launch_prep.id, # Updated project link
                                                "created_by_user_id": mark_market.id,
                                                "type": KnowledgeAssetTypeEnum.MEETING,
                                                "content": "Agenda: Finalize launch timeline, align on key messaging, assign regional responsibilities. Action items captured.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        note_cross_functional = await get_or_create(db, KnowledgeAsset,
                                            title="Cross-functional discussion: Antiviral Delivery Tech",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_antidote_ph2.id, # Updated project link
                                                "created_by_user_id": dr_reed.id, 
                                                "type": KnowledgeAssetTypeEnum.NOTE,
                                                "content": f"Discussed leveraging mRNA platform learnings (proj: {proj_mrna_platform.id}) for AV-123 delivery. Participants: Evelyn Reed, Charles Bio, Sarah Stats. Promising synergies, needs feasibility study.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })

        # New KAs
        report_kp101_tox = await get_or_create(db, KnowledgeAsset,
                                            title="KP-101 Preliminary Tox Report",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_kp101_preclin.id, 
                                                "created_by_user_id": ben_tox.id, 
                                                "type": KnowledgeAssetTypeEnum.REPORT, 
                                                "content": "Initial toxicology screen shows acceptable profile at expected therapeutic doses. Full GLP studies pending.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        meeting_kp205_target = await get_or_create(db, KnowledgeAsset,
                                            title="KP-205 Target Review Meeting",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_kp205_discovery.id,
                                                "created_by_user_id": dr_lee.id,
                                                "type": KnowledgeAssetTypeEnum.MEETING,
                                                "content": "Reviewed validation data package for KP-205. Decision: Advance to preclinical evaluation. Action items: Finalize validation report (Alice), Develop preclinical plan (Maria).",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        doc_av123_process = await get_or_create(db, KnowledgeAsset,
                                            title="AV-123 Process Development Summary",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_av123_cmc.id,
                                                "created_by_user_id": olivia_process.id,
                                                "type": KnowledgeAssetTypeEnum.DOCUMENT,
                                                "source": "CMC Team Drive",
                                                "content": "Overview of current process steps, yields, and challenges for AV-123 scale-up.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        submission_oc456_draft = await get_or_create(db, KnowledgeAsset,
                                            title="OC-456 NDA Module 3 Draft",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_oc456_reg_submission.id,
                                                "created_by_user_id": linda_label.id,
                                                "type": KnowledgeAssetTypeEnum.SUBMISSION, # Assuming this exists or map to DOCUMENT
                                                "content": "Draft of the Quality module (CMC) for the OC-456 NDA.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        presentation_av123_results = await get_or_create(db, KnowledgeAsset,
                                            title="AV-123 Phase II Topline Results Deck",
                                            defaults={
                                                "tenant_id": tenant_id,
                                                "project_id": proj_av123_med_affairs.id, # Linked to Med Affairs plan
                                                "created_by_user_id": dr_khan.id,
                                                "type": KnowledgeAssetTypeEnum.PRESENTATION, # Assuming this exists or map to DOCUMENT
                                                "link": "/presentations/av123_phase2_topline.pptx",
                                                "content": "Internal presentation summarizing key efficacy and safety findings from the Antidote Phase II study.",
                                                "created_at": datetime.utcnow(),
                                                "updated_at": datetime.utcnow()
                                            })
        # -------------------------- #

        # Commit all changes
        await db.commit()
        print("\n--- Pharma data seeding completed successfully! ---")

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
    print("--- Running Seed Script --- ")
    print("--- Make sure DB is running and SessionLocal connects correctly --- ")
    asyncio.run(seed()) 