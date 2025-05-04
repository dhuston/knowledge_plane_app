import json
import pytest
from unittest.mock import patch, Mock
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.api.v1.endpoints.strategic_alignment import router
from app.services.strategic_alignment_service import StrategicAlignmentService
from app.services.alignment_recommendation_service import AlignmentRecommendationService
from app.services.strategic_impact_service import StrategicImpactService
from app.models.user import User
from app.models.alignment import Misalignment, Recommendation, ImpactAnalysis, ImpactScenario
from app.schemas.strategic_alignment import MisalignmentType, MisalignmentSeverity


class TestStrategicAlignmentEndpoints:
    """Tests for the Strategic Alignment API endpoints."""

    def test_get_misalignments(self, test_client, mock_db, mock_current_user):
        """Test getting all misalignments."""
        # Setup mock misalignments
        mock_misalignments = [
            Mock(
                id=1,
                tenant_id=mock_current_user.tenant_id,
                type=MisalignmentType.UNALIGNED_PROJECT,
                severity=MisalignmentSeverity.HIGH,
                description="Project without goal",
                affected_entities={"projects": [101]},
                context=None
            ),
            Mock(
                id=2,
                tenant_id=mock_current_user.tenant_id,
                type=MisalignmentType.CONFLICTING_GOALS,
                severity=MisalignmentSeverity.MEDIUM,
                description="Team with conflicting goals",
                affected_entities={"teams": [201], "goals": [301, 302]},
                context=None
            )
        ]
        
        # Mock the service method
        with patch.object(StrategicAlignmentService, 'get_all_misalignments', return_value=mock_misalignments):
            response = test_client.get("/strategic-alignment/misalignments/")
            
            # Assert
            assert response.status_code == 200
            response_data = response.json()
            assert len(response_data) == 2
            
            # Check first misalignment
            assert response_data[0]["id"] == 1
            assert response_data[0]["type"] == "unaligned_project"
            assert response_data[0]["severity"] == "high"
            
            # Check second misalignment
            assert response_data[1]["id"] == 2
            assert response_data[1]["type"] == "conflicting_goals"
            assert response_data[1]["severity"] == "medium"

    def test_run_alignment_analysis(self, test_client, mock_db, mock_current_user):
        """Test running a full alignment analysis."""
        # Setup mock misalignments and metrics
        mock_misalignments = [Mock(), Mock()]
        mock_metrics = {
            "total_projects": 10,
            "aligned_projects": 8,
            "alignment_percentage": 80.0,
            "misalignment_count_by_type": {
                "unaligned_project": 2
            },
            "misalignment_count_by_severity": {
                "high": 2
            },
            "overall_alignment_score": 85.0
        }
        
        # Mock the service method
        with patch.object(StrategicAlignmentService, 'run_full_alignment_analysis', return_value=(mock_misalignments, mock_metrics)):
            response = test_client.post("/strategic-alignment/misalignments/analyze/")
            
            # Assert
            assert response.status_code == 200
            response_data = response.json()
            assert "misalignments" in response_data
            assert "metrics" in response_data
            assert len(response_data["misalignments"]) == 2
            
            # Check metrics
            metrics = response_data["metrics"]
            assert metrics["total_projects"] == 10
            assert metrics["aligned_projects"] == 8
            assert metrics["alignment_percentage"] == 80.0
            assert metrics["overall_alignment_score"] == 85.0

    def test_get_alignment_metrics(self, test_client, mock_db, mock_current_user):
        """Test getting alignment metrics."""
        # Setup mock metrics
        mock_metrics = {
            "total_projects": 10,
            "aligned_projects": 8,
            "alignment_percentage": 80.0,
            "misalignment_count_by_type": {
                "unaligned_project": 2
            },
            "misalignment_count_by_severity": {
                "high": 2
            },
            "overall_alignment_score": 85.0
        }
        
        # Mock the service method
        with patch.object(StrategicAlignmentService, 'calculate_alignment_metrics', return_value=mock_metrics):
            response = test_client.get("/strategic-alignment/metrics/")
            
            # Assert
            assert response.status_code == 200
            metrics = response.json()
            assert metrics["total_projects"] == 10
            assert metrics["aligned_projects"] == 8
            assert metrics["alignment_percentage"] == 80.0
            assert metrics["overall_alignment_score"] == 85.0

    def test_get_recommendations(self, test_client, mock_db, mock_current_user):
        """Test getting recommendations."""
        # Setup mock recommendations
        mock_recommendations = [
            Mock(
                id=1,
                tenant_id=mock_current_user.tenant_id,
                type="goal_alignment",
                title="Align Project A with Goal B",
                description="This project appears to align with strategic goal B",
                difficulty="medium",
                project_id=101,
                details={"recommended_goals": [{"goal_id": 201, "goal_name": "Goal B", "similarity_score": 0.8}]}
            ),
            Mock(
                id=2,
                tenant_id=mock_current_user.tenant_id,
                type="team_collaboration",
                title="Collaboration opportunity for Teams X and Y",
                description="These teams work on similar goals",
                difficulty="easy",
                details={"teams": [{"id": 301, "name": "Team X"}, {"id": 302, "name": "Team Y"}]}
            )
        ]
        
        # Mock the service method
        with patch.object(AlignmentRecommendationService, 'get_all_recommendations', return_value=mock_recommendations):
            response = test_client.get("/strategic-alignment/recommendations/")
            
            # Assert
            assert response.status_code == 200
            recommendations = response.json()
            assert len(recommendations) == 2
            
            # Check first recommendation
            assert recommendations[0]["id"] == 1
            assert recommendations[0]["type"] == "goal_alignment"
            assert recommendations[0]["project_id"] == 101
            
            # Check second recommendation
            assert recommendations[1]["id"] == 2
            assert recommendations[1]["type"] == "team_collaboration"
            assert "teams" in recommendations[1]["details"]

    def test_generate_recommendations(self, test_client, mock_db, mock_current_user):
        """Test generating new recommendations."""
        # Setup mock recommendations
        mock_recommendations = [Mock(id=1), Mock(id=2)]
        
        # Mock the service method
        with patch.object(AlignmentRecommendationService, 'generate_all_recommendations', return_value=mock_recommendations):
            response = test_client.post("/strategic-alignment/recommendations/generate/")
            
            # Assert
            assert response.status_code == 200
            recommendations = response.json()
            assert len(recommendations) == 2

    def test_provide_recommendation_feedback(self, test_client, mock_db, mock_current_user):
        """Test providing feedback on a recommendation."""
        recommendation_id = 101
        feedback_data = {
            "recommendation_id": recommendation_id,
            "is_helpful": True,
            "feedback_text": "This recommendation was very helpful",
            "implemented": True
        }
        
        # Mock the service method
        with patch.object(AlignmentRecommendationService, 'record_recommendation_feedback') as mock_record_feedback:
            # Setup successful feedback recording
            mock_feedback = Mock(id=201)
            mock_record_feedback.return_value = mock_feedback
            
            response = test_client.post(
                f"/strategic-alignment/recommendations/{recommendation_id}/feedback/",
                json=feedback_data
            )
            
            # Assert
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "success"
            assert "feedback_id" in result
            
            # Verify service method was called with correct args
            mock_record_feedback.assert_called_once_with(
                recommendation_id=recommendation_id,
                user_id=mock_current_user.id,
                is_helpful=feedback_data["is_helpful"],
                feedback_text=feedback_data["feedback_text"],
                implemented=feedback_data["implemented"]
            )
    
    def test_analyze_goal_change_impact(self, test_client, mock_db, mock_current_user):
        """Test analyzing the impact of goal changes."""
        goal_id = 101
        changes = {
            "priority": "high",
            "status": "active"
        }
        
        # Mock the service method
        with patch.object(StrategicImpactService, 'analyze_goal_change_impact') as mock_analyze:
            # Setup mock impact analysis
            mock_impact = Mock(
                id=201,
                tenant_id=mock_current_user.tenant_id,
                name="Impact Analysis: Changes to Goal 101",
                description="Analysis of changing goal priority and status",
                severity="medium",
                timeframe="short_term",
                affected_entities={"goals": [{"id": goal_id}], "projects": []},
                metrics_impact={"alignment_score_change": 5.0}
            )
            mock_analyze.return_value = mock_impact
            
            response = test_client.post(
                f"/strategic-alignment/impact-analysis/goal-change/?goal_id={goal_id}",
                json=changes
            )
            
            # Assert
            assert response.status_code == 200
            impact = response.json()
            assert impact["name"] == "Impact Analysis: Changes to Goal 101"
            assert impact["severity"] == "medium"
            assert impact["timeframe"] == "short_term"
            
            # Verify service method was called with correct args
            mock_analyze.assert_called_once_with(
                goal_id=goal_id,
                changes=changes,
                tenant_id=mock_current_user.tenant_id,
                user_id=mock_current_user.id
            )

    def test_create_impact_scenario(self, test_client, mock_db, mock_current_user):
        """Test creating a new impact scenario."""
        scenario_data = {
            "name": "Resource Reallocation Scenario",
            "description": "Testing moving resources between projects",
            "scenario_type": "resource_reallocation",
            "parameters": {
                "from_project_id": 101,
                "to_project_id": 102,
                "resource_amount": 3
            }
        }
        
        # Mock the service method
        with patch.object(StrategicImpactService, 'create_impact_scenario') as mock_create:
            # Setup mock scenario
            mock_scenario = Mock(
                id=201,
                tenant_id=mock_current_user.tenant_id,
                name=scenario_data["name"],
                description=scenario_data["description"],
                scenario_type=scenario_data["scenario_type"],
                parameters=scenario_data["parameters"]
            )
            mock_create.return_value = mock_scenario
            
            response = test_client.post(
                "/strategic-alignment/scenarios/",
                json=scenario_data
            )
            
            # Assert
            assert response.status_code == 200
            scenario = response.json()
            assert scenario["name"] == scenario_data["name"]
            assert scenario["scenario_type"] == scenario_data["scenario_type"]
            
            # Verify service method was called with correct args
            mock_create.assert_called_once_with(
                tenant_id=mock_current_user.tenant_id,
                name=scenario_data["name"],
                description=scenario_data["description"],
                scenario_type=scenario_data["scenario_type"],
                parameters=scenario_data["parameters"],
                created_by_user_id=mock_current_user.id
            )

    def test_run_scenario_simulation(self, test_client, mock_db, mock_current_user):
        """Test running a scenario simulation."""
        scenario_id = 101
        
        # Mock the service method
        with patch.object(StrategicImpactService, 'run_scenario_simulation') as mock_simulate:
            # Setup mock scenario result
            mock_result = Mock(
                id=201,
                scenario_id=scenario_id,
                result_summary={"status": "completed"},
                affected_entities={"projects": [301, 302]},
                metrics_before={"alignment_score": 75.0},
                metrics_after={"alignment_score": 80.0},
                recommendation="Consider implementing this change"
            )
            mock_simulate.return_value = mock_result
            
            response = test_client.post(f"/strategic-alignment/scenarios/{scenario_id}/simulate/")
            
            # Assert
            assert response.status_code == 200
            result = response.json()
            assert result["scenario_id"] == scenario_id
            assert "metrics_before" in result
            assert "metrics_after" in result
            assert "recommendation" in result
            
            # Verify service method was called with correct args
            mock_simulate.assert_called_once_with(
                scenario_id=scenario_id,
                tenant_id=mock_current_user.tenant_id
            )

    def test_get_misalignment_map_data(self, test_client, mock_db, mock_current_user):
        """Test getting misalignment data for the map visualization."""
        # Setup mock misalignments
        mock_misalignments = [
            Mock(
                id=1,
                type=MisalignmentType.UNALIGNED_PROJECT,
                severity=MisalignmentSeverity.HIGH,
                description="Project without goals",
                affected_entities={"projects": [101]}
            ),
            Mock(
                id=2,
                type=MisalignmentType.CONFLICTING_GOALS,
                severity=MisalignmentSeverity.MEDIUM,
                description="Team with conflicting goals",
                affected_entities={"teams": [201], "goals": [301, 302]}
            )
        ]
        
        # Mock the service method
        with patch.object(StrategicAlignmentService, 'get_all_misalignments', return_value=mock_misalignments):
            response = test_client.get("/strategic-alignment/map/misalignments/")
            
            # Assert
            assert response.status_code == 200
            data = response.json()
            assert "overlays" in data
            overlays = data["overlays"]
            
            # Check that overlays were created for all affected entities
            # The first misalignment affects 1 project
            # The second misalignment affects 1 team and 2 goals
            # Total: 1 + 1 + 2 = 4 overlays
            assert len(overlays) > 0
            
            # Check overlay properties
            for overlay in overlays:
                assert "node_id" in overlay
                assert "node_type" in overlay
                assert "overlay_type" in overlay
                assert overlay["overlay_type"] == "misalignment"
                assert "overlay_data" in overlay
                assert "visual" in overlay
                assert "color" in overlay["visual"]
                assert "icon" in overlay["visual"]


@pytest.fixture
def mock_current_user():
    """Create a mock authenticated user."""
    return Mock(
        id=1,
        tenant_id=1,
        email="test@example.com",
        is_active=True,
        is_superuser=False
    )


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    return Mock(spec=Session)


@pytest.fixture
def test_client(mock_db, mock_current_user):
    """Create a test client with mock dependencies."""
    # Create a simple dependency override to return our mocks
    from app.api import deps
    from fastapi import FastAPI
    
    app = FastAPI()
    app.include_router(router, prefix="/strategic-alignment")
    
    # Override the get_db dependency
    def override_get_db():
        return mock_db
    
    # Override the get_current_active_user dependency
    def override_get_current_active_user():
        return mock_current_user
    
    app.dependency_overrides[deps.get_db] = override_get_db
    app.dependency_overrides[deps.get_current_active_user] = override_get_current_active_user
    
    return TestClient(app)