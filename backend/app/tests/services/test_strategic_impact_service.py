import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.strategic_impact_service import StrategicImpactService
from app.models.alignment import ImpactAnalysis, ImpactScenario, ScenarioResult
from app.models.project import Project
from app.models.goal import Goal
from app.models.team import Team
from app.models.user import User
from app.schemas.strategic_alignment import ImpactSeverity, ImpactTimeframe


class TestStrategicImpactService:
    """Tests for the Strategic Impact Analysis Service."""

    def test_analyze_goal_change_impact(self, db_session_mock):
        """Test impact analysis for goal changes."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        tenant_id = 1
        user_id = 101
        goal_id = 201
        
        # Mock goal
        goal = Mock(
            id=goal_id,
            name="Research Excellence",
            priority="high",
            status="active",
            tenant_id=tenant_id
        )
        
        # Mock changes to be analyzed
        changes = {
            "priority": "medium",
            "status": "inactive"
        }
        
        # Mock aligned projects
        aligned_projects = [
            Mock(id=301, name="Project A", tenant_id=tenant_id),
            Mock(id=302, name="Project B", tenant_id=tenant_id)
        ]
        
        # Mock teams
        affected_teams = [
            Mock(id=401, name="Team X", tenant_id=tenant_id),
            Mock(id=402, name="Team Y", tenant_id=tenant_id)
        ]
        
        # Mock goal query
        db_session_mock.query.return_value.filter.return_value.first.return_value = goal
        
        # Mock project query
        mock_project_query = Mock()
        mock_project_query.join.return_value.filter.return_value.all.return_value = aligned_projects
        db_session_mock.query.return_value = mock_project_query
        
        # Mock team query
        mock_team_query = Mock()
        mock_team_query.join.return_value.filter.return_value.all.return_value = affected_teams
        db_session_mock.query.return_value = mock_team_query
        
        # Mock the internal scoring methods
        with patch.object(service, '_assess_goal_change_severity') as mock_severity, \
             patch.object(service, '_determine_impact_timeframe') as mock_timeframe, \
             patch.object(service, '_calculate_alignment_score_impact') as mock_alignment_score, \
             patch.object(service, '_calculate_resource_efficiency_impact') as mock_resource_impact, \
             patch.object(service, '_calculate_strategic_coverage_impact') as mock_coverage_impact:
            
            # Setup return values
            mock_severity.return_value = ImpactSeverity.HIGH
            mock_timeframe.return_value = ImpactTimeframe.SHORT_TERM
            mock_alignment_score.return_value = -5.0
            mock_resource_impact.return_value = -10.0
            mock_coverage_impact.return_value = -20.0
            
            # Mock database operations
            db_session_mock.add = Mock()
            db_session_mock.commit = Mock()
            db_session_mock.refresh = Mock()
            
            # Execute
            result = service.analyze_goal_change_impact(
                goal_id=goal_id,
                changes=changes,
                tenant_id=tenant_id,
                user_id=user_id
            )
            
            # Assert
            # Verify impact analysis was created with correct properties
            db_session_mock.add.assert_called_once()
            impact_analysis = db_session_mock.add.call_args[0][0]
            
            assert isinstance(impact_analysis, ImpactAnalysis)
            assert impact_analysis.tenant_id == tenant_id
            assert impact_analysis.severity == ImpactSeverity.HIGH
            assert impact_analysis.timeframe == ImpactTimeframe.SHORT_TERM
            assert impact_analysis.created_by_user_id == user_id
            
            # Verify affected entities include goal, projects, and teams
            affected_entities = impact_analysis.affected_entities
            assert "goals" in affected_entities
            assert affected_entities["goals"][0]["id"] == goal_id
            assert affected_entities["goals"][0]["name"] == "Research Excellence"
            assert "projects" in affected_entities
            assert len(affected_entities["projects"]) == 2
            assert "teams" in affected_entities
            assert len(affected_entities["teams"]) == 2
            
            # Verify metrics impact scores
            metrics_impact = impact_analysis.metrics_impact
            assert metrics_impact["alignment_score_change"] == -5.0
            assert metrics_impact["resource_efficiency_impact"] == -10.0
            assert metrics_impact["strategic_coverage_impact"] == -20.0
            
            # Verify severity assessment was called with correct arguments
            mock_severity.assert_called_once_with(goal, changes)
            
            # Verify timeframe determination was called with correct arguments
            mock_timeframe.assert_called_once_with(goal, changes)
            
            # Verify commit and refresh were called
            db_session_mock.commit.assert_called_once()
            db_session_mock.refresh.assert_called_once_with(impact_analysis)

    def test_assess_goal_change_severity(self, db_session_mock):
        """Test assessment of goal change severity."""
        service = StrategicImpactService(db_session_mock)
        
        # Create a mock goal
        goal = Mock(
            name="Strategic Initiative",
            description="Important strategic goal",
            priority="medium",
            status="active"
        )
        
        # Test case 1: Minor changes
        minor_changes = {
            "name": "Strategic Initiative Updated"
        }
        severity = service._assess_goal_change_severity(goal, minor_changes)
        assert severity == ImpactSeverity.LOW
        
        # Test case 2: Medium changes
        medium_changes = {
            "name": "Strategic Initiative Updated",
            "targets": {"q1_target": 100, "q2_target": 200}
        }
        severity = service._assess_goal_change_severity(goal, medium_changes)
        assert severity == ImpactSeverity.MEDIUM
        
        # Test case 3: Major changes
        major_changes = {
            "status": "inactive",
            "priority": "low"
        }
        severity = service._assess_goal_change_severity(goal, major_changes)
        assert severity == ImpactSeverity.HIGH
        
        # Test case 4: Critical changes
        critical_changes = {
            "status": "inactive", 
            "priority": "low",
            "targets": {"q1_target": 0, "q2_target": 0},
            "name": "Deprecated Initiative"
        }
        severity = service._assess_goal_change_severity(goal, critical_changes)
        assert severity == ImpactSeverity.CRITICAL

    def test_create_impact_scenario(self, db_session_mock):
        """Test creation of a new impact scenario."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        tenant_id = 1
        name = "Resource Reallocation Scenario"
        description = "Testing impact of moving resources from Project A to Project B"
        scenario_type = "resource_reallocation"
        parameters = {
            "from_project_id": 101,
            "to_project_id": 102,
            "resource_amount": 3
        }
        created_by_user_id = 201
        
        # Mock database operations
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        db_session_mock.refresh = Mock()
        
        # Execute
        result = service.create_impact_scenario(
            tenant_id=tenant_id,
            name=name,
            description=description,
            scenario_type=scenario_type,
            parameters=parameters,
            created_by_user_id=created_by_user_id
        )
        
        # Assert
        # Verify scenario was created with correct properties
        db_session_mock.add.assert_called_once()
        scenario = db_session_mock.add.call_args[0][0]
        
        assert isinstance(scenario, ImpactScenario)
        assert scenario.tenant_id == tenant_id
        assert scenario.name == name
        assert scenario.description == description
        assert scenario.scenario_type == scenario_type
        assert scenario.parameters == parameters
        assert scenario.created_by_user_id == created_by_user_id
        
        # Verify commit and refresh were called
        db_session_mock.commit.assert_called_once()
        db_session_mock.refresh.assert_called_once_with(scenario)

    def test_run_scenario_simulation(self, db_session_mock):
        """Test running a simulation for an impact scenario."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        scenario_id = 101
        tenant_id = 1
        
        # Mock scenario
        scenario = Mock(
            id=scenario_id,
            tenant_id=tenant_id,
            scenario_type="resource_reallocation",
            parameters={
                "from_project_id": 201,
                "to_project_id": 202,
                "resource_amount": 3
            }
        )
        
        # Mock scenario query
        db_session_mock.query.return_value.filter.return_value.first.return_value = scenario
        
        # Patch simulation methods
        with patch.object(service, '_simulate_resource_reallocation') as mock_simulate:
            # Setup return value
            expected_result = Mock(spec=ScenarioResult)
            mock_simulate.return_value = expected_result
            
            # Execute
            result = service.run_scenario_simulation(
                scenario_id=scenario_id,
                tenant_id=tenant_id
            )
            
            # Assert
            # Verify correct simulation method was called
            mock_simulate.assert_called_once_with(scenario)
            
            # Verify result
            assert result == expected_result

    def test_simulate_resource_reallocation(self, db_session_mock):
        """Test simulation of resource reallocation scenario."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        
        # Mock scenario
        scenario = Mock(
            id=101,
            tenant_id=1,
            scenario_type="resource_reallocation",
            parameters={
                "from_project_id": 201,
                "to_project_id": 202,
                "resource_amount": 3
            }
        )
        
        # Mock database operations
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        db_session_mock.refresh = Mock()
        
        # Execute
        result = service._simulate_resource_reallocation(scenario)
        
        # Assert
        # Verify result was created with correct properties
        db_session_mock.add.assert_called_once()
        simulation_result = db_session_mock.add.call_args[0][0]
        
        assert isinstance(simulation_result, ScenarioResult)
        assert simulation_result.scenario_id == scenario.id
        
        # Verify result contains metrics and affected entities
        assert "metrics_before" in dir(simulation_result)
        assert "metrics_after" in dir(simulation_result)
        assert "affected_entities" in dir(simulation_result)
        
        # Verify affected projects are included
        assert simulation_result.affected_entities["projects"] == [201, 202]
        
        # Verify recommendation field has content
        assert simulation_result.recommendation is not None
        
        # Verify commit and refresh were called
        db_session_mock.commit.assert_called_once()
        db_session_mock.refresh.assert_called_once_with(simulation_result)

    def test_get_scenario_results(self, db_session_mock):
        """Test retrieving results for a scenario."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        scenario_id = 101
        tenant_id = 1
        
        # Mock scenario
        scenario = Mock(id=scenario_id, tenant_id=tenant_id)
        
        # Mock scenario results
        expected_results = [
            Mock(scenario_id=scenario_id),
            Mock(scenario_id=scenario_id)
        ]
        
        # Mock queries
        db_session_mock.query.return_value.filter.return_value.first.return_value = scenario
        db_session_mock.query.return_value.filter.return_value.all.return_value = expected_results
        
        # Execute
        results = service.get_scenario_results(
            scenario_id=scenario_id,
            tenant_id=tenant_id
        )
        
        # Assert
        assert results == expected_results
        
        # Verify scenario ownership was checked
        scenario_query = db_session_mock.query.return_value.filter
        scenario_query.assert_called()
        
        # Verify results were queried
        results_query = db_session_mock.query.return_value.filter
        results_query.assert_called()
    
    def test_get_all_scenarios(self, db_session_mock):
        """Test retrieving all scenarios for a tenant."""
        # Setup
        service = StrategicImpactService(db_session_mock)
        tenant_id = 1
        
        # Mock scenarios
        expected_scenarios = [
            Mock(id=101, tenant_id=tenant_id, name="Scenario A"),
            Mock(id=102, tenant_id=tenant_id, name="Scenario B")
        ]
        
        # Mock query
        db_session_mock.query.return_value.filter.return_value.all.return_value = expected_scenarios
        
        # Execute
        scenarios = service.get_all_scenarios(tenant_id=tenant_id)
        
        # Assert
        assert scenarios == expected_scenarios
        
        # Verify tenant filter was applied
        db_session_mock.query.return_value.filter.assert_called_once()


@pytest.fixture
def db_session_mock():
    """Create a mock database session."""
    return Mock(spec=Session)