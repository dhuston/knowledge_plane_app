import requests
import json
from uuid import uuid4

# --- Configuration ---
# !!! Replace these placeholders with your actual values !!!
API_BASE_URL = "http://localhost:8001/api/v1"  # Your backend API base URL
AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NDY0MjEwODcsInN1YiI6ImU5NGZhMTc2LTk0MWYtNGJjMi05YTYyLWE1NzZjODY3NzJiNyJ9.pTIG1CEzVKG_lQNXF_kaW93atSBi6Xbz22LshAecfnU"  # Obtain from browser dev tools after login
PI_EMAIL = "drhuston1@gmail.com" 

# Optional: If you know the Team ID and Member IDs, fill them in. 
# Otherwise, the script will focus on Goals, Projects, and Notes for the PI's tenant.
PI_TEAM_ID = "KNOWN_TEAM_ID_OR_NONE" # e.g., "f8a5c3b9-..." or None
TEAM_MEMBER_EMAILS = ["member1@example.com", "member2@example.com"] # Placeholder emails

# --- Helper Functions ---
def make_request(method, endpoint, data=None):
    """Helper function to make authenticated API requests."""
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json",
    }
    url = f"{API_BASE_URL}{endpoint}"
    try:
        if data:
            response = requests.request(method, url, headers=headers, json=data)
        else:
            response = requests.request(method, url, headers=headers)
        
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        
        # Handle cases where response might be empty (e.g., 204 No Content)
        if response.content:
            return response.json()
        else:
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Error making request to {method} {url}: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                print(f"Response body: {e.response.json()}")
            except json.JSONDecodeError:
                print(f"Response body: {e.response.text}")
        return None

# --- Main Seeding Logic ---
def seed_data():
    print("Starting data seeding...")

    # 1. Get PI User Info
    print(f"Fetching PI user info for {PI_EMAIL}...")
    pi_user_info = make_request("GET", "/users/me")
    if not pi_user_info:
        print("Failed to fetch PI user info. Exiting.")
        return
    
    pi_user_id = pi_user_info.get("id")
    tenant_id = pi_user_info.get("tenant_id")
    # Use PI's team_id if PI_TEAM_ID wasn't provided manually
    actual_pi_team_id = PI_TEAM_ID if PI_TEAM_ID != "KNOWN_TEAM_ID_OR_NONE" else pi_user_info.get("team_id")
    
    if not pi_user_id or not tenant_id:
        print("Could not extract PI user ID or Tenant ID. Exiting.")
        return
        
    print(f"PI User ID: {pi_user_id}")
    print(f"Tenant ID: {tenant_id}")
    if actual_pi_team_id:
         print(f"Using Team ID: {actual_pi_team_id}")
    else:
         print("Warning: PI Team ID not found or provided. Projects may not be linked to a team.")

    # 2. Create Goals (Hierarchy Example)
    print("\nCreating Goals...")
    dept_goal_data = {
        "title": "Advance Oncology Pipeline 2024",
        "name": "Advance Oncology Pipeline 2024",
        "description": "Deliver 2 IND-ready candidates by end of year.",
        "status": "On Track",
        "type": "department",
        "properties": {"priority": "High"}
    }
    dept_goal = make_request("POST", "/goals/", data=dept_goal_data)
    if not dept_goal: 
        print("Failed to create Department Goal.")
        return # Stop if we can't create the top goal
    dept_goal_id = dept_goal.get("id")
    print(f"  - Created Department Goal: {dept_goal.get('name')} (ID: {dept_goal_id})")

    team_goal_data = {
        "title": "Identify Lead Candidate for Target X",
        "name": "Identify Lead Candidate for Target X",
        "description": "Complete preclinical efficacy and tox studies for lead compound series targeting X.",
        "status": "On Track",
        "type": "team",
        "parent_id": dept_goal_id, # Link to department goal
        "properties": {"quarter": "Q3/Q4"}
    }
    team_goal = make_request("POST", "/goals/", data=team_goal_data)
    if not team_goal:
        print("Warning: Failed to create Team Goal.")
        team_goal_id = None
    else:
        team_goal_id = team_goal.get("id")
        print(f"  - Created Team Goal: {team_goal.get('name')} (ID: {team_goal_id})")

    at_risk_goal_data = {
        "title": "Develop Companion Diagnostic Assay",
        "name": "Develop Companion Diagnostic Assay",
        "description": "Validate biomarker assay for patient selection.",
        "status": "At Risk", # Example of an at-risk goal
        "type": "team",
        "parent_id": team_goal_id, # Link to team goal
        "due_date": "2024-09-30T00:00:00", # Example due date
        "properties": {"vendor": "LabCorp"}
    }
    at_risk_goal = make_request("POST", "/goals/", data=at_risk_goal_data)
    if not at_risk_goal:
         print("Warning: Failed to create At-Risk Goal.")
         at_risk_goal_id = None
    else:
        at_risk_goal_id = at_risk_goal.get("id")
        print(f"  - Created At-Risk Goal: {at_risk_goal.get('name')} (ID: {at_risk_goal_id})")
        
    # 3. Create Projects
    print("\nCreating Projects...")
    project_ids_created = {} # Store name -> id

    project1_data = {
        "name": "Project Phoenix - Lead Optimization",
        "description": "Optimizing potency and ADME properties for compound series targeting X.",
        "status": "Active",
        "team_id": actual_pi_team_id if actual_pi_team_id else None,
        "properties": {"therapeutic_area": "Oncology", "phase": "Discovery"}
    }
    proj1 = make_request("POST", "/projects/", data=project1_data)
    if proj1:
        project_ids_created["Phoenix"] = proj1.get("id")
        print(f"  - Created Project: {proj1.get('name')} (ID: {proj1.get('id')})")
    else:
        print("Warning: Failed to create Project Phoenix.")

    project2_data = {
        "name": "Biomarker Assay Validation",
        "description": "Technical validation of the IHC assay for patient stratification.",
        "status": "Needs Attention",
        "team_id": actual_pi_team_id if actual_pi_team_id else None,
        "properties": {"therapeutic_area": "Oncology", "phase": "Translational"}
    }
    proj2 = make_request("POST", "/projects/", data=project2_data)
    if proj2:
        project_ids_created["Assay"] = proj2.get("id")
        print(f"  - Created Project: {proj2.get('name')} (ID: {proj2.get('id')})")
    else:
         print("Warning: Failed to create Project Assay.")
         
    project3_data = {
        "name": "Project Chimera - Mechanism Study",
        "description": "Investigating downstream signaling pathways of Target Y.",
        "status": "Planning",
        "team_id": actual_pi_team_id if actual_pi_team_id else None,
        "properties": {"therapeutic_area": "Immunology", "phase": "Research"}
    }
    proj3 = make_request("POST", "/projects/", data=project3_data)
    if proj3:
        project_ids_created["Chimera"] = proj3.get("id")
        print(f"  - Created Project: {proj3.get('name')} (ID: {proj3.get('id')})")
    else:
        print("Warning: Failed to create Project Chimera.")

    # 4. Link Projects to Goals
    print("\nLinking Projects to Goals...")
    if "Phoenix" in project_ids_created and team_goal_id:
        update_data = {"goal_id": team_goal_id}
        updated_proj = make_request("PUT", f"/projects/{project_ids_created['Phoenix']}", data=update_data)
        if updated_proj:
            print(f"  - Linked Project Phoenix to Team Goal.")
        else:
            print(f"Warning: Failed to link Project Phoenix to Team Goal.")
            
    if "Assay" in project_ids_created and at_risk_goal_id:
        update_data = {"goal_id": at_risk_goal_id}
        updated_proj = make_request("PUT", f"/projects/{project_ids_created['Assay']}", data=update_data)
        if updated_proj:
            print(f"  - Linked Project Assay Validation to At-Risk Goal.")
        else:
            print(f"Warning: Failed to link Project Assay to At-Risk Goal.")
            
    # 5. Add Notes to Projects
    print("\nAdding Notes to Projects...")
    if "Phoenix" in project_ids_created:
        note1_data = {
            "title": "Phoenix Weekly Update - July 29",
            "content": "Synthesized 5 new analogs (PX-105 to PX-109). Tested in primary assay - PX-107 shows 2x improvement in potency. Planning PK studies next week.",
            "type": "NOTE", # Assuming 'NOTE' type exists for knowledge assets
            "properties": {"tags": ["update", "synthesis", "assay"]}
        }
        created_note = make_request("POST", f"/projects/{project_ids_created['Phoenix']}/notes", data=note1_data)
        if created_note:
            print(f"  - Added Note '{created_note.get('title')}' to Project Phoenix.")
        else:
            print(f"Warning: Failed to add note 1 to Project Phoenix.")

        note2_data = {
            "title": "Meeting Minutes: Phoenix Troubleshooting",
            "content": "Discussed solubility issues with PX-104. Agreed to try formulation approach with Dr. Smith. Action Item: PI to schedule follow-up.",
             "type": "NOTE",
            "properties": {"tags": ["minutes", "solubility", "formulation"]}
        }
        created_note = make_request("POST", f"/projects/{project_ids_created['Phoenix']}/notes", data=note2_data)
        if created_note:
            print(f"  - Added Note '{created_note.get('title')}' to Project Phoenix.")
        else:
            print(f"Warning: Failed to add note 2 to Project Phoenix.")

    if "Assay" in project_ids_created:
        note3_data = {
            "title": "Assay Validation Plan v2",
            "content": "Revised protocol based on vendor feedback. Updated antibody concentrations and incubation times. Need to finalize controls.",
            "type": "NOTE",
            "properties": {"tags": ["protocol", "validation", "assay"]}
        }
        created_note = make_request("POST", f"/projects/{project_ids_created['Assay']}/notes", data=note3_data)
        if created_note:
             print(f"  - Added Note '{created_note.get('title')}' to Project Assay Validation.")
        else:
            print(f"Warning: Failed to add note to Project Assay.")

    print("\nData seeding finished.")


if __name__ == "__main__":
    # Basic check for token placeholder
    if "YOUR_JWT_TOKEN_HERE" in AUTH_TOKEN:
        print("Error: Please replace 'YOUR_JWT_TOKEN_HERE' with your actual JWT token in the script.")
    else:
        seed_data() 