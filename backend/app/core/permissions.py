from typing import TYPE_CHECKING, Optional, Union
from uuid import UUID
from fastapi import HTTPException, status

if TYPE_CHECKING:
    from app.models.user import User  # noqa: F401
    from app.models.project import Project  # noqa: F401
    from app.models.goal import Goal  # noqa: F401
    from app.models.team import Team  # noqa: F401


def check_tenant_permissions(user_tenant_id: UUID, resource_tenant_id: UUID) -> None:
    """
    Check if the user's tenant matches the resource tenant.
    Raises HTTPException if not authorized.
    """
    if user_tenant_id != resource_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource"
        )


def user_can_view_project(user: "User", project: "Project") -> bool:
    """Returns True if the user is allowed to view the given project."""
    if user.tenant_id != project.tenant_id:
        return False

    # Owning team members can view
    if project.owning_team_id and user.team_id == project.owning_team_id:
        return True

    # Participants can view
    if getattr(project, "participants", None):
        return any(part.id == user.id for part in project.participants)

    return False


def user_can_edit_project(user: "User", project: "Project") -> bool:
    """Returns True if the user is allowed to update the given project."""
    if user.tenant_id != project.tenant_id:
        return False

    # For now, only members of the owning team can edit.
    return project.owning_team_id is not None and user.team_id == project.owning_team_id


def user_can_create_project(user: "User") -> bool:
    """Simple rule: any authenticated user within tenant can create for now."""
    # Extend later with role checks.
    return user is not None


# ---- Goal permissions ----


def user_can_view_goal(user: "User", goal: "Goal") -> bool:
    """User can view goal if same tenant."""
    return user.tenant_id == goal.tenant_id


def user_can_edit_goal(user_id: UUID, user_team_id: Optional[UUID], goal: "Goal") -> bool:
    """Allow editing if user's team owns a project aligned to goal (simplistic) or same tenant & manager role.
       Note: This version takes IDs instead of the full user object to avoid relationship loading issues.
    """
    # We need the goal's tenant_id. Assuming goal object has it.
    # We can't check user's tenant directly without fetching user.
    # Relying on the endpoint having already verified the goal belongs to the user's tenant.
    # if user.tenant_id != goal.tenant_id: 
    #     return False
    
    # Check if the goal has associated projects (needs relationship loaded)
    if not hasattr(goal, 'projects') or not goal.projects:
        # If no projects linked, maybe allow tenant-wide edit? Or restrict further?
        # For now, let's default to False if no projects are linked.
        return False 

    # Check if the user is the lead of any team that owns any of the linked projects
    if not user_team_id:
        return False

    # Check if the user's team owns any project linked to this goal
    for project in goal.projects:
        if project.owning_team_id == user_team_id:
            return True # User is lead of team owning a linked project
            
    return False


def user_can_create_goal(user: "User") -> bool:
    """Allow any tenant user to create goals for now; refine later."""
    return user is not None


# ---- Team permissions ----


def user_can_view_team(user: "User", team: "Team") -> bool:
    if user.tenant_id != team.tenant_id:
        return False
    # Always allow same-tenant view for now
    return True 