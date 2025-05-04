from typing import List, Dict, Optional, Any, Tuple
from sqlalchemy.orm import Session

from app.models.alignment import Misalignment
from app.models.project import Project
from app.models.goal import Goal
from app.models.edge import Edge
from app.schemas.strategic_alignment import MisalignmentType, MisalignmentSeverity


class StrategicAlignmentService:
    """
    Service for detecting misalignments between projects and goals,
    and calculating organizational alignment metrics.
    """
    
    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db
    
    def detect_unaligned_projects(self, tenant_id: int) -> List[Misalignment]:
        """
        Detect projects that are not aligned with any strategic goals.
        
        Args:
            tenant_id: The tenant ID to analyze
            
        Returns:
            List of misalignment records for unaligned projects
        """
        # Get all projects for this tenant
        projects = self.db.query(Project).filter(Project.tenant_id == tenant_id).all()
        
        # For each project, check if it has any associated goals
        misalignments = []
        for project in projects:
            # Check if project has goals using Edge table
            goal_connections = self.db.query(Edge).filter(
                Edge.source_id == project.id,
                Edge.source_type == "project",
                Edge.target_type == "goal",
                Edge.tenant_id == tenant_id
            ).count()
            
            if goal_connections == 0:
                # Create a misalignment record
                misalignment = Misalignment(
                    tenant_id=tenant_id,
                    type=MisalignmentType.UNALIGNED_PROJECT,
                    severity=MisalignmentSeverity.HIGH,
                    description=f"Project '{project.name}' is not aligned with any strategic goals",
                    affected_entities={"projects": [project.id]}
                )
                self.db.add(misalignment)
                misalignments.append(misalignment)
        
        self.db.commit()
        return misalignments
    
    def detect_conflicting_goals(self, tenant_id: int) -> List[Misalignment]:
        """
        Detect conflicting goals within teams.
        
        Args:
            tenant_id: The tenant ID to analyze
            
        Returns:
            List of misalignment records for conflicting goals
        """
        # Implementation will depend on how goals and conflicts are defined
        # This is a simplified version that looks for teams with goals with conflicting priorities
        
        # First, get all teams for this tenant
        from app.models.team import Team
        teams = self.db.query(Team).filter(Team.tenant_id == tenant_id).all()
        
        misalignments = []
        for team in teams:
            # Get all goals associated with this team
            team_goals = self.db.query(Goal).join(
                Edge,
                (Edge.target_id == Goal.id) &
                (Edge.target_type == "goal") &
                (Edge.source_id == team.id) &
                (Edge.source_type == "team") &
                (Edge.tenant_id == tenant_id)
            ).filter(Goal.tenant_id == tenant_id).all()
            
            # Simple conflict detection: Look for goals with same priority level
            # This is just an example - real conflict detection would be more sophisticated
            priority_counts = {}
            for goal in team_goals:
                if not hasattr(goal, 'priority'):
                    continue
                    
                if goal.priority not in priority_counts:
                    priority_counts[goal.priority] = []
                priority_counts[goal.priority].append(goal)
            
            # If multiple goals have the same high priority, consider it a conflict
            for priority, goals in priority_counts.items():
                if len(goals) > 1 and priority in ['high', 'critical']:  # If using string priorities
                    # Create a misalignment record
                    misalignment = Misalignment(
                        tenant_id=tenant_id,
                        type=MisalignmentType.CONFLICTING_GOALS,
                        severity=MisalignmentSeverity.MEDIUM,
                        description=f"Team '{team.name}' has {len(goals)} goals with the same {priority} priority",
                        affected_entities={
                            "teams": [team.id],
                            "goals": [goal.id for goal in goals]
                        }
                    )
                    self.db.add(misalignment)
                    misalignments.append(misalignment)
        
        self.db.commit()
        return misalignments
    
    def calculate_alignment_metrics(self, tenant_id: int) -> Dict[str, Any]:
        """
        Calculate overall alignment metrics for the organization.
        
        Args:
            tenant_id: The tenant ID to analyze
            
        Returns:
            Dictionary of alignment metrics
        """
        # Get counts
        total_projects = self.db.query(Project).filter(Project.tenant_id == tenant_id).count()
        
        # Count aligned projects (projects with at least one goal connection)
        aligned_projects = 0
        projects = self.db.query(Project).filter(Project.tenant_id == tenant_id).all()
        for project in projects:
            goal_connections = self.db.query(Edge).filter(
                Edge.source_id == project.id,
                Edge.source_type == "project",
                Edge.target_type == "goal",
                Edge.tenant_id == tenant_id
            ).count()
            
            if goal_connections > 0:
                aligned_projects += 1
        
        # Calculate alignment percentage
        alignment_percentage = (aligned_projects / total_projects * 100) if total_projects > 0 else 0
        
        # Count misalignments by type and severity
        misalignments = self.db.query(Misalignment).filter(
            Misalignment.tenant_id == tenant_id
        ).all()
        
        misalignment_by_type = {}
        misalignment_by_severity = {}
        
        for m in misalignments:
            if m.type not in misalignment_by_type:
                misalignment_by_type[m.type] = 0
            misalignment_by_type[m.type] += 1
            
            if m.severity not in misalignment_by_severity:
                misalignment_by_severity[m.severity] = 0
            misalignment_by_severity[m.severity] += 1
        
        # Calculate overall alignment score (simple algorithm, can be refined)
        # Weighted score based on severity of misalignments
        severity_weights = {
            "low": 0.25,
            "medium": 0.5,
            "high": 0.75,
            "critical": 1.0
        }
        
        weighted_misalignments = 0
        for severity, count in misalignment_by_severity.items():
            weighted_misalignments += count * severity_weights.get(severity, 0)
        
        # Start with base score of 100, subtract weighted misalignments
        # Cap at 0 as the minimum score
        base_score = min(100, aligned_projects / total_projects * 100 * 1.5) if total_projects > 0 else 0
        alignment_score = max(0, base_score - (weighted_misalignments * 5))
        
        return {
            "total_projects": total_projects,
            "aligned_projects": aligned_projects,
            "alignment_percentage": alignment_percentage,
            "misalignment_count_by_type": misalignment_by_type,
            "misalignment_count_by_severity": misalignment_by_severity,
            "overall_alignment_score": alignment_score
        }
    
    def get_all_misalignments(self, tenant_id: int) -> List[Misalignment]:
        """
        Get all detected misalignments for a tenant.
        
        Args:
            tenant_id: The tenant ID to query
            
        Returns:
            List of all misalignment records
        """
        return self.db.query(Misalignment).filter(
            Misalignment.tenant_id == tenant_id
        ).all()
    
    def run_full_alignment_analysis(self, tenant_id: int) -> Tuple[List[Misalignment], Dict[str, Any]]:
        """
        Run a comprehensive alignment analysis, detecting all types of misalignments.
        
        Args:
            tenant_id: The tenant ID to analyze
            
        Returns:
            Tuple of (list of misalignments, alignment metrics)
        """
        # Clear existing misalignments for this tenant to prevent duplicates
        self.db.query(Misalignment).filter(
            Misalignment.tenant_id == tenant_id
        ).delete()
        
        # Run all detection algorithms
        misalignments = []
        misalignments.extend(self.detect_unaligned_projects(tenant_id))
        misalignments.extend(self.detect_conflicting_goals(tenant_id))
        # Can add more detection algorithms here
        
        # Calculate metrics based on fresh analysis
        metrics = self.calculate_alignment_metrics(tenant_id)
        
        return misalignments, metrics