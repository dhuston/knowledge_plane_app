import pytest
from unittest.mock import Mock, patch, MagicMock
import numpy as np
from sqlalchemy.orm import Session

from app.services.alignment_recommendation_service import AlignmentRecommendationService
from app.models.alignment import Recommendation, RecommendationFeedback
from app.models.project import Project
from app.models.goal import Goal
from app.models.edge import Edge
from app.models.team import Team
from app.models.user import User
from app.schemas.strategic_alignment import RecommendationType, RecommendationDifficulty


class TestAlignmentRecommendationService:
    """Tests for the Strategic Alignment Recommendation Service."""

    def test_recommend_goals_for_project(self, db_session_mock):
        """Test recommendation of goals for an unaligned project."""
        # Setup
        service = AlignmentRecommendationService(db_session_mock)
        tenant_id = 1
        project_id = 101
        
        # Mock project
        project = Mock(
            id=project_id,
            name="AI Research Project",
            description="Research on advanced machine learning techniques",
            tenant_id=tenant_id
        )
        
        # Mock goals
        goals = [
            Mock(id=201, name="Advance AI Capabilities", description="Research and develop AI", tenant_id=tenant_id),
            Mock(id=202, name="Improve Infrastructure", description="Enhance computing resources", tenant_id=tenant_id),
            Mock(id=203, name="Customer Satisfaction", description="Improve user experience", tenant_id=tenant_id)
        ]
        
        # Mock project query
        db_session_mock.query.return_value.filter.return_value.first.return_value = project
        
        # Mock goals query
        mock_goals_query = Mock()
        mock_goals_query.filter.return_value.all.return_value = goals
        db_session_mock.query.return_value = mock_goals_query
        
        # Mock TF-IDF vectorizer and cosine similarity calculations
        with patch('app.services.alignment_recommendation_service.TfidfVectorizer') as mock_tfidf, \
             patch('app.services.alignment_recommendation_service.cosine_similarity') as mock_cosine:
            
            # Setup TF-IDF vectorizer mock
            mock_vectorizer = Mock()
            mock_tfidf.return_value = mock_vectorizer
            mock_vectorizer.fit_transform.return_value = "tfidf_matrix"
            
            # Setup cosine similarity mock with pre-defined similarities
            # Project is more similar to goal 1 (0.8) and goal 3 (0.4) than goal 2 (0.1)
            mock_cosine.return_value = np.array([[0.8, 0.1, 0.4]])
            
            # Mock db operations
            db_session_mock.add = Mock()
            db_session_mock.commit = Mock()
            db_session_mock.refresh = Mock()
            
            # Execute
            result = service.recommend_goals_for_project(project_id=project_id, tenant_id=tenant_id)
            
            # Assert
            assert len(result) == 1  # Should return one recommendation
            
            # Verify vectorizer was called with correct texts
            expected_texts = [
                f"{project.name} {project.description}",  # Project text
                f"{goals[0].name} {goals[0].description}",  # Goal 1 text
                f"{goals[1].name} {goals[1].description}",  # Goal 2 text
                f"{goals[2].name} {goals[2].description}"   # Goal 3 text
            ]
            mock_vectorizer.fit_transform.assert_called_once()
            
            # Verify cosine similarity was called
            mock_cosine.assert_called_once()
            
            # Verify recommendation was created and added to db
            db_session_mock.add.assert_called_once()
            recommendation = db_session_mock.add.call_args[0][0]
            
            assert isinstance(recommendation, Recommendation)
            assert recommendation.tenant_id == tenant_id
            assert recommendation.type == RecommendationType.GOAL_ALIGNMENT
            assert recommendation.project_id == project_id
            assert "recommended_goals" in recommendation.details
            
            # Verify the goals are sorted by similarity (highest first)
            recommended_goals = recommendation.details["recommended_goals"]
            assert recommended_goals[0]["goal_id"] == 201  # First goal should be the most similar one
            assert recommended_goals[0]["similarity_score"] == 0.8
            
            # Verify commit and refresh were called
            db_session_mock.commit.assert_called_once()
            db_session_mock.refresh.assert_called_once()

    def test_recommend_team_collaborations(self, db_session_mock):
        """Test recommendation of team collaborations based on goal overlaps."""
        # Setup
        service = AlignmentRecommendationService(db_session_mock)
        tenant_id = 1
        
        # Mock teams
        teams = [
            Mock(id=1, name="Frontend Team", tenant_id=tenant_id),
            Mock(id=2, name="Backend Team", tenant_id=tenant_id),
            Mock(id=3, name="Design Team", tenant_id=tenant_id)
        ]
        
        # Mock goals
        goals = {
            # Frontend and Backend share goal 101
            1: [Mock(id=101, name="Platform Redesign"), Mock(id=102, name="Frontend Optimization")],
            2: [Mock(id=101, name="Platform Redesign"), Mock(id=103, name="API Performance")],
            # Design team has different goals
            3: [Mock(id=104, name="UX Improvements")]
        }
        
        # Mock team query
        db_session_mock.query.return_value.filter.return_value.all.return_value = teams
        
        # Mock goal queries for different teams
        def mock_goals_for_team(team_id):
            return goals.get(team_id, [])
        
        # Mock join and filter to return different goals based on team ID
        def mock_query_join(*args, **kwargs):
            query_mock = Mock()
            
            # Extract team ID from join args
            team_id = None
            for arg in db_session_mock.query.call_args_list[-1][0]:
                if hasattr(arg, 'source_id'):
                    call = str(arg)
                    if '1' in call:
                        team_id = 1
                    elif '2' in call:
                        team_id = 2
                    elif '3' in call:
                        team_id = 3
            
            # Return appropriate goals for this team
            query_mock.all.return_value = mock_goals_for_team(team_id)
            return query_mock
        
        db_session_mock.query.return_value.join.return_value = Mock()
        db_session_mock.query.return_value.join.return_value.filter.return_value = mock_query_join()
        
        # Mock db operations
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        
        # Execute
        result = service.recommend_team_collaborations(tenant_id=tenant_id)
        
        # Assert
        assert len(result) == 1  # Should find 1 collaboration opportunity
        
        # Verify recommendation was created and added to db
        assert db_session_mock.add.called
        recommendation = db_session_mock.add.call_args[0][0]
        
        assert isinstance(recommendation, Recommendation)
        assert recommendation.tenant_id == tenant_id
        assert recommendation.type == RecommendationType.TEAM_COLLABORATION
        
        # Check details of the recommendation
        details = recommendation.details
        assert len(details["teams"]) == 2
        team_ids = [team["id"] for team in details["teams"]]
        assert 1 in team_ids  # Frontend Team
        assert 2 in team_ids  # Backend Team
        
        # Check common goals
        assert len(details["common_goals"]) == 1
        assert details["common_goals"][0]["id"] == 101  # Platform Redesign
        
        # Verify commit was called
        db_session_mock.commit.assert_called_once()

    def test_record_recommendation_feedback(self, db_session_mock):
        """Test recording user feedback for a recommendation."""
        # Setup
        service = AlignmentRecommendationService(db_session_mock)
        recommendation_id = 101
        user_id = 201
        is_helpful = True
        feedback_text = "This recommendation was very useful!"
        implemented = True
        
        # Mock recommendation and user
        recommendation = Mock(id=recommendation_id)
        user = Mock(id=user_id)
        
        # Mock db queries
        db_session_mock.query.return_value.filter.return_value.first.side_effect = [
            recommendation,  # First call returns recommendation
            user            # Second call returns user
        ]
        
        # Mock db operations
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        db_session_mock.refresh = Mock()
        
        # Execute
        feedback = service.record_recommendation_feedback(
            recommendation_id=recommendation_id,
            user_id=user_id,
            is_helpful=is_helpful,
            feedback_text=feedback_text,
            implemented=implemented
        )
        
        # Assert
        # Verify feedback was created and added to db
        db_session_mock.add.assert_called_once()
        created_feedback = db_session_mock.add.call_args[0][0]
        
        assert isinstance(created_feedback, RecommendationFeedback)
        assert created_feedback.recommendation_id == recommendation_id
        assert created_feedback.user_id == user_id
        assert created_feedback.is_helpful == is_helpful
        assert created_feedback.feedback_text == feedback_text
        assert created_feedback.implemented == implemented
        
        # Verify commit and refresh were called
        db_session_mock.commit.assert_called_once()
        db_session_mock.refresh.assert_called_once_with(created_feedback)

    def test_get_recommendations_for_project(self, db_session_mock):
        """Test retrieving recommendations for a specific project."""
        # Setup
        service = AlignmentRecommendationService(db_session_mock)
        tenant_id = 1
        project_id = 101
        
        # Mock recommendations
        expected_recommendations = [
            Mock(id=1, project_id=project_id, tenant_id=tenant_id),
            Mock(id=2, project_id=project_id, tenant_id=tenant_id)
        ]
        
        # Mock query
        db_session_mock.query.return_value.filter.return_value.all.return_value = expected_recommendations
        
        # Execute
        result = service.get_recommendations_for_project(project_id=project_id, tenant_id=tenant_id)
        
        # Assert
        assert result == expected_recommendations
        db_session_mock.query.return_value.filter.assert_called_once()

    def test_generate_all_recommendations(self, db_session_mock):
        """Test generating all types of recommendations for a tenant."""
        # Setup
        service = AlignmentRecommendationService(db_session_mock)
        tenant_id = 1
        
        # Mock projects without goals (unaligned)
        unaligned_projects = [
            Mock(id=101, tenant_id=tenant_id),
            Mock(id=102, tenant_id=tenant_id)
        ]
        
        # Mock edge query to indicate no goals
        mock_edge_query = Mock()
        mock_edge_query.filter.return_value.count.return_value = 0  # No goals
        db_session_mock.query.return_value = mock_edge_query
        
        # Mock project query
        db_session_mock.query.return_value.filter.return_value.all.return_value = unaligned_projects
        
        # Mock recommendation methods
        goal_recommendation = Mock(id=1, type=RecommendationType.GOAL_ALIGNMENT)
        team_recommendation = Mock(id=2, type=RecommendationType.TEAM_COLLABORATION)
        
        # Patch the recommendation methods
        with patch.object(service, 'recommend_goals_for_project') as mock_recommend_goals, \
             patch.object(service, 'recommend_team_collaborations') as mock_team_collabs:
            
            # Setup return values
            mock_recommend_goals.return_value = [goal_recommendation]
            mock_team_collabs.return_value = [team_recommendation]
            
            # Execute
            results = service.generate_all_recommendations(tenant_id=tenant_id)
            
            # Assert
            assert len(results) == 3  # 2 goal recommendations + 1 team collaboration
            
            # Verify goal recommendations were generated for each unaligned project
            assert mock_recommend_goals.call_count == 2
            mock_recommend_goals.assert_any_call(101, tenant_id)
            mock_recommend_goals.assert_any_call(102, tenant_id)
            
            # Verify team collaboration recommendations were generated
            mock_team_collabs.assert_called_once_with(tenant_id)


@pytest.fixture
def db_session_mock():
    """Create a mock database session."""
    return Mock(spec=Session)