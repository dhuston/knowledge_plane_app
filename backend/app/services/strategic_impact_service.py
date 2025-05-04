from typing import List, Dict, Optional, Any, Tuple
from sqlalchemy.orm import Session
from datetime import datetime

from app.models.alignment import ImpactAnalysis, ImpactScenario, ScenarioResult
from app.models.project import Project
from app.models.goal import Goal
from app.models.team import Team
from app.models.edge import Edge
from app.schemas.strategic_alignment import ImpactSeverity, ImpactTimeframe


class StrategicImpactService:
    """
    Service for analyzing the strategic impact of organizational changes.
    
    This service helps assess the potential impact of changes to goals,
    projects, and resource allocations before they are implemented.
    """
    
    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db
    
    def analyze_goal_change_impact(
        self, 
        goal_id: int, 
        changes: Dict[str, Any], 
        tenant_id: int,
        user_id: int
    ) -> ImpactAnalysis:
        """
        Analyze the impact of changing a goal on aligned projects and teams.
        
        Args:
            goal_id: The ID of the goal being changed
            changes: Dictionary of proposed changes to the goal
            tenant_id: The tenant ID
            user_id: The ID of the user requesting the analysis
            
        Returns:
            Impact analysis results
        """
        # Get the current goal
        goal = self.db.query(Goal).filter(
            Goal.id == goal_id, 
            Goal.tenant_id == tenant_id
        ).first()
        
        if not goal:
            raise ValueError(f"Goal with ID {goal_id} not found")
        
        # Get projects aligned with this goal through edges
        aligned_projects = self.db.query(Project).join(
            Edge, 
            (Edge.source_id == Project.id) & 
            (Edge.source_type == "project") & 
            (Edge.target_id == goal_id) & 
            (Edge.target_type == "goal") & 
            (Edge.tenant_id == tenant_id)
        ).filter(
            Project.tenant_id == tenant_id
        ).all()
        
        # Get teams associated with these projects
        affected_teams = []
        for project in aligned_projects:
            teams = self.db.query(Team).join(
                Edge,
                (Edge.source_id == Team.id) &
                (Edge.source_type == "team") &
                (Edge.target_id == project.id) &
                (Edge.target_type == "project") &
                (Edge.tenant_id == tenant_id)
            ).filter(
                Team.tenant_id == tenant_id
            ).all()
            
            for team in teams:
                if team not in affected_teams:
                    affected_teams.append(team)
        
        # Assess the severity of the change
        severity = self._assess_goal_change_severity(goal, changes)
        
        # Determine the timeframe of impact
        timeframe = self._determine_impact_timeframe(goal, changes)
        
        # Calculate metrics impact
        metrics_impact = {
            "alignment_score_change": self._calculate_alignment_score_impact(goal, changes),
            "resource_efficiency_impact": self._calculate_resource_efficiency_impact(goal, changes, aligned_projects),
            "strategic_coverage_impact": self._calculate_strategic_coverage_impact(goal, changes)
        }
        
        # Create impact analysis record
        impact_analysis = ImpactAnalysis(
            tenant_id=tenant_id,
            name=f"Impact Analysis: Changes to Goal '{goal.name}'",
            description=f"Analysis of the impact of changing goal '{goal.name}' on aligned projects and teams",
            severity=severity,
            timeframe=timeframe,
            affected_entities={
                "goals": [{"id": goal.id, "name": goal.name}],
                "projects": [{"id": p.id, "name": p.name} for p in aligned_projects],
                "teams": [{"id": t.id, "name": t.name} for t in affected_teams]
            },
            metrics_impact=metrics_impact,
            created_by_user_id=user_id
        )
        
        self.db.add(impact_analysis)
        self.db.commit()
        self.db.refresh(impact_analysis)
        
        return impact_analysis
    
    def _assess_goal_change_severity(self, goal: Goal, changes: Dict[str, Any]) -> str:
        """
        Assess the severity of changes to a goal.
        
        Args:
            goal: The current goal
            changes: The proposed changes
            
        Returns:
            Impact severity level
        """
        # Simple severity assessment based on which fields are changing
        severity_score = 0
        
        # Name change is low impact
        if "name" in changes and changes["name"] != goal.name:
            severity_score += 1
            
        # Description change is low impact
        if "description" in changes and changes["description"] != goal.description:
            severity_score += 1
            
        # Target or metric changes are higher impact
        if "targets" in changes:
            severity_score += 3
            
        # Status changes are high impact
        if "status" in changes:
            severity_score += 4
            
        # Priority changes are high impact
        if "priority" in changes:
            severity_score += 4
            
        # Map score to severity level
        if severity_score <= 1:
            return ImpactSeverity.LOW
        elif severity_score <= 3:
            return ImpactSeverity.MEDIUM
        elif severity_score <= 6:
            return ImpactSeverity.HIGH
        else:
            return ImpactSeverity.CRITICAL
    
    def _determine_impact_timeframe(self, goal: Goal, changes: Dict[str, Any]) -> str:
        """
        Determine the timeframe of impact for goal changes.
        
        Args:
            goal: The current goal
            changes: The proposed changes
            
        Returns:
            Impact timeframe
        """
        # Simple heuristic based on change type
        if "status" in changes or "priority" in changes:
            return ImpactTimeframe.IMMEDIATE
        
        if "targets" in changes:
            return ImpactTimeframe.SHORT_TERM
        
        # Default to medium-term for other changes
        return ImpactTimeframe.MEDIUM_TERM
    
    def _calculate_alignment_score_impact(self, goal: Goal, changes: Dict[str, Any]) -> float:
        """
        Calculate the impact on alignment score.
        
        Args:
            goal: The current goal
            changes: The proposed changes
            
        Returns:
            Expected change in alignment score (-100 to +100)
        """
        # Simple placeholder implementation
        # In a real system, this would use more sophisticated algorithms
        if hasattr(goal, 'priority') and "priority" in changes:
            current_priority = goal.priority
            new_priority = changes["priority"]
            
            # Convert priority to numeric value if it's a string
            if isinstance(current_priority, str) and isinstance(new_priority, str):
                priority_map = {"low": 1, "medium": 2, "high": 3, "critical": 4}
                current_value = priority_map.get(current_priority.lower(), 2)
                new_value = priority_map.get(new_priority.lower(), 2)
                
                if new_value > current_value:
                    return 10.0  # Positive impact for higher priority
                elif new_value < current_value:
                    return -5.0  # Negative impact for lower priority
        
        # Default to minimal impact
        return 0.0
    
    def _calculate_resource_efficiency_impact(
        self, 
        goal: Goal, 
        changes: Dict[str, Any],
        affected_projects: List[Project]
    ) -> float:
        """
        Calculate the impact on resource efficiency.
        
        Args:
            goal: The current goal
            changes: The proposed changes
            affected_projects: List of affected projects
            
        Returns:
            Expected change in resource efficiency (-100 to +100)
        """
        # Simple placeholder implementation
        # This would normally involve more complex calculations
        project_count = len(affected_projects)
        
        if project_count == 0:
            return 0.0
        
        # Changes to high-impact goals with many projects can cause
        # temporary efficiency decrease as teams adapt
        if project_count > 5 and ("targets" in changes or "priority" in changes):
            return -15.0
        
        return 0.0
    
    def _calculate_strategic_coverage_impact(self, goal: Goal, changes: Dict[str, Any]) -> float:
        """
        Calculate the impact on strategic coverage.
        
        Args:
            goal: The current goal
            changes: The proposed changes
            
        Returns:
            Expected change in strategic coverage (-100 to +100)
        """
        # Simple placeholder implementation
        if "status" in changes:
            current_status = getattr(goal, 'status', 'active')
            new_status = changes["status"]
            
            if new_status == "inactive" and current_status != "inactive":
                return -20.0  # Significant decrease in coverage
            elif new_status == "active" and current_status == "inactive":
                return 20.0  # Significant increase in coverage
        
        return 0.0
    
    def create_impact_scenario(
        self,
        tenant_id: int,
        name: str,
        description: str,
        scenario_type: str,
        parameters: Dict[str, Any],
        created_by_user_id: int
    ) -> ImpactScenario:
        """
        Create a new impact scenario for simulation.
        
        Args:
            tenant_id: The tenant ID
            name: Scenario name
            description: Scenario description
            scenario_type: Type of scenario (e.g., "resource_reallocation")
            parameters: Scenario-specific parameters
            created_by_user_id: ID of user creating the scenario
            
        Returns:
            Created scenario
        """
        scenario = ImpactScenario(
            tenant_id=tenant_id,
            name=name,
            description=description,
            scenario_type=scenario_type,
            parameters=parameters,
            created_by_user_id=created_by_user_id
        )
        
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        
        return scenario
    
    def run_scenario_simulation(
        self,
        scenario_id: int,
        tenant_id: int
    ) -> ScenarioResult:
        """
        Run a simulation for an impact scenario.
        
        Args:
            scenario_id: The ID of the scenario to simulate
            tenant_id: The tenant ID
            
        Returns:
            Simulation results
        """
        # Get the scenario
        scenario = self.db.query(ImpactScenario).filter(
            ImpactScenario.id == scenario_id,
            ImpactScenario.tenant_id == tenant_id
        ).first()
        
        if not scenario:
            raise ValueError(f"Scenario with ID {scenario_id} not found")
        
        # Simulation logic depends on the scenario type
        if scenario.scenario_type == "resource_reallocation":
            return self._simulate_resource_reallocation(scenario)
        elif scenario.scenario_type == "goal_reprioritization":
            return self._simulate_goal_reprioritization(scenario)
        else:
            # Default generic simulation
            return self._simulate_generic_scenario(scenario)
    
    def _simulate_resource_reallocation(self, scenario: ImpactScenario) -> ScenarioResult:
        """
        Simulate resource reallocation between projects.
        
        Args:
            scenario: The scenario to simulate
            
        Returns:
            Simulation results
        """
        # Extract scenario parameters
        parameters = scenario.parameters
        from_project_id = parameters.get("from_project_id")
        to_project_id = parameters.get("to_project_id")
        resource_amount = parameters.get("resource_amount", 0)
        
        # Simplified simulation result
        # In a real implementation, this would involve complex calculations
        result = ScenarioResult(
            scenario_id=scenario.id,
            result_summary={
                "status": "completed",
                "summary": f"Simulated reallocation of {resource_amount} resources from project {from_project_id} to project {to_project_id}",
                "findings": "Resource reallocation would improve alignment with strategic priorities."
            },
            affected_entities={
                "projects": [from_project_id, to_project_id],
                "teams": []  # In a real implementation, would determine affected teams
            },
            metrics_before={
                "alignment_score": 75.0,
                "resource_efficiency": 80.0,
                "strategic_coverage": 70.0
            },
            metrics_after={
                "alignment_score": 78.0,
                "resource_efficiency": 82.0,
                "strategic_coverage": 75.0
            },
            recommendation="Based on the simulation, this resource reallocation would improve overall strategic alignment."
        )
        
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        
        return result
    
    def _simulate_goal_reprioritization(self, scenario: ImpactScenario) -> ScenarioResult:
        """
        Simulate the impact of reprioritizing goals.
        
        Args:
            scenario: The scenario to simulate
            
        Returns:
            Simulation results
        """
        # Extract scenario parameters
        parameters = scenario.parameters
        goal_id = parameters.get("goal_id")
        new_priority = parameters.get("new_priority")
        
        # Simplified simulation result
        result = ScenarioResult(
            scenario_id=scenario.id,
            result_summary={
                "status": "completed",
                "summary": f"Simulated changing priority of goal {goal_id} to {new_priority}",
                "findings": "Priority change would affect resource allocation across projects."
            },
            affected_entities={
                "goals": [goal_id],
                "projects": []  # In a real implementation, would determine affected projects
            },
            metrics_before={
                "alignment_score": 75.0,
                "resource_efficiency": 80.0,
                "strategic_coverage": 70.0
            },
            metrics_after={
                "alignment_score": 73.0,
                "resource_efficiency": 75.0,
                "strategic_coverage": 80.0
            },
            recommendation="Consider phased implementation of this priority change to minimize disruption."
        )
        
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        
        return result
    
    def _simulate_generic_scenario(self, scenario: ImpactScenario) -> ScenarioResult:
        """
        Generic simulation for other scenario types.
        
        Args:
            scenario: The scenario to simulate
            
        Returns:
            Simulation results
        """
        # Create a generic result
        result = ScenarioResult(
            scenario_id=scenario.id,
            result_summary={
                "status": "completed",
                "summary": f"Simulated {scenario.scenario_type} scenario: {scenario.name}",
                "findings": "Simulation completed with mixed results."
            },
            affected_entities={
                "goals": [],
                "projects": [],
                "teams": []
            },
            metrics_before={
                "alignment_score": 75.0,
                "resource_efficiency": 80.0,
                "strategic_coverage": 70.0
            },
            metrics_after={
                "alignment_score": 76.0,
                "resource_efficiency": 79.0,
                "strategic_coverage": 72.0
            },
            recommendation="Further analysis recommended before implementing this change."
        )
        
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        
        return result
    
    def get_scenario_results(
        self,
        scenario_id: int,
        tenant_id: int
    ) -> List[ScenarioResult]:
        """
        Get results for a specific scenario.
        
        Args:
            scenario_id: The scenario ID
            tenant_id: The tenant ID
            
        Returns:
            List of scenario results
        """
        # Verify the scenario belongs to this tenant
        scenario = self.db.query(ImpactScenario).filter(
            ImpactScenario.id == scenario_id,
            ImpactScenario.tenant_id == tenant_id
        ).first()
        
        if not scenario:
            raise ValueError(f"Scenario with ID {scenario_id} not found")
        
        # Get the results
        results = self.db.query(ScenarioResult).filter(
            ScenarioResult.scenario_id == scenario_id
        ).all()
        
        return results
    
    def get_all_scenarios(
        self,
        tenant_id: int
    ) -> List[ImpactScenario]:
        """
        Get all impact scenarios for a tenant.
        
        Args:
            tenant_id: The tenant ID
            
        Returns:
            List of scenarios
        """
        return self.db.query(ImpactScenario).filter(
            ImpactScenario.tenant_id == tenant_id
        ).all()