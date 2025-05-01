import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from sqlalchemy.orm import Session
from app.services.emergent_model_service import EmergentModelService
from app.models.emergent_model import RelationshipStrength, EmergentPattern, FeedbackItem
from app.models.node import Node
from app.models.user import User
from app.schemas.emergent_model import FeedbackItemCreate


class TestEmergentModelService(unittest.TestCase):
    """Tests for the EmergentModelService class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.service = EmergentModelService(self.mock_db)
        self.tenant_id = 1

    def test_get_relationship_strength(self):
        """Test retrieving relationship strength between two nodes."""
        # Setup mock
        mock_relation = MagicMock(spec=RelationshipStrength)
        mock_relation.strength_value = 0.8
        mock_query = self.mock_db.query.return_value.filter.return_value
        mock_query.first.return_value = mock_relation

        # Call method
        source_id, target_id = 1, 2
        result = self.service.get_relationship_strength(source_id, target_id, self.tenant_id)

        # Verify
        self.mock_db.query.assert_called_once_with(RelationshipStrength)
        self.assertEqual(result, mock_relation)
        self.assertEqual(result.strength_value, 0.8)

    def test_update_relationship_strength(self):
        """Test updating relationship strength values."""
        # Setup mock
        mock_relation = MagicMock(spec=RelationshipStrength)
        mock_query = self.mock_db.query.return_value.filter.return_value
        mock_query.first.return_value = mock_relation

        # Call method
        relationship_id = 1
        new_strength = 0.9
        new_confidence = 0.85
        result = self.service.update_relationship_strength(
            relationship_id, new_strength, new_confidence, self.tenant_id
        )

        # Verify
        self.mock_db.commit.assert_called_once()
        self.assertEqual(mock_relation.strength_value, new_strength)
        self.assertEqual(mock_relation.confidence_score, new_confidence)
        self.assertIsNotNone(mock_relation.last_updated)

    def test_determine_relationship_type(self):
        """Test relationship type determination between nodes."""
        # Setup mock nodes
        user_node = MagicMock(spec=Node)
        user_node.type = "user"
        
        team_node = MagicMock(spec=Node)
        team_node.type = "team"
        
        project_node = MagicMock(spec=Node)
        project_node.type = "project"
        
        goal_node = MagicMock(spec=Node)
        goal_node.type = "goal"

        # Test different relationships
        self.assertEqual(self.service._determine_relationship_type(user_node, team_node), "team_membership")
        self.assertEqual(self.service._determine_relationship_type(user_node, project_node), "project_assignment")
        self.assertEqual(self.service._determine_relationship_type(user_node, user_node), "collaboration")
        self.assertEqual(self.service._determine_relationship_type(project_node, goal_node), "goal_alignment")
        
        # Test unknown relationship
        self.assertIsNone(self.service._determine_relationship_type(team_node, team_node))

    def test_calculate_relationship_strengths(self):
        """Test calculating relationship strengths between nodes."""
        # Setup mock nodes
        user_node = MagicMock(spec=Node)
        user_node.id = 1
        user_node.type = "user"
        
        team_node = MagicMock(spec=Node)
        team_node.id = 2
        team_node.type = "team"
        
        mock_nodes = [user_node, team_node]
        self.mock_db.query.return_value.filter.return_value.all.return_value = mock_nodes
        
        # Mock the private methods
        self.service._determine_relationship_type = MagicMock(return_value="team_membership")
        self.service._calculate_strength_value = MagicMock(return_value=0.75)

        # Call method
        results = self.service.calculate_relationship_strengths(self.tenant_id)

        # Verify
        self.mock_db.add.assert_called()
        self.mock_db.commit.assert_called_once()
        self.assertEqual(len(results), 2)  # Two relationships (user->team and team->user)

    def test_detect_patterns(self):
        """Test pattern detection in the organization."""
        # Mock the private methods
        self.service._find_collaboration_clusters = MagicMock(return_value=[[101, 102, 103]])
        self.service._find_cross_department_collaborations = MagicMock(return_value=[
            {"departments": ["Engineering", "Marketing"], "nodes": [101, 201]}
        ])
        
        # Mock node retrieval
        mock_node = MagicMock(spec=Node)
        self.mock_db.query.return_value.get.return_value = mock_node

        # Call method
        results = self.service.detect_patterns(self.tenant_id)

        # Verify
        self.assertEqual(len(results), 2)  # Two patterns detected
        self.mock_db.add.assert_called()
        self.mock_db.commit.assert_called_once()

    def test_process_feedback_relationship(self):
        """Test processing feedback for a relationship."""
        # Setup mock relationship
        mock_relation = MagicMock(spec=RelationshipStrength)
        mock_relation.confidence_score = 0.7
        mock_relation.strength_value = 0.6
        self.mock_db.query.return_value.get.return_value = mock_relation

        # Create feedback item
        feedback_data = FeedbackItemCreate(
            user_id=1,
            feedback_type="confirmation",
            entity_type="relationship",
            entity_id=1,
            feedback_value="positive"
        )

        # Call method
        result = self.service.process_feedback(feedback_data, self.tenant_id)

        # Verify
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.assertEqual(mock_relation.confidence_score, 0.8)  # Increased by 0.1

    def test_process_feedback_pattern(self):
        """Test processing feedback for a pattern."""
        # Setup mock pattern
        mock_pattern = MagicMock(spec=EmergentPattern)
        mock_pattern.confidence_score = 0.7
        mock_pattern.is_validated = False
        self.mock_db.query.return_value.get.return_value = mock_pattern

        # Create feedback item
        feedback_data = FeedbackItemCreate(
            user_id=1,
            feedback_type="confirmation",
            entity_type="pattern",
            entity_id=1,
            feedback_value="positive"
        )

        # Call method
        result = self.service.process_feedback(feedback_data, self.tenant_id)

        # Verify
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.assertEqual(mock_pattern.confidence_score, 0.8)  # Increased by 0.1
        self.assertTrue(mock_pattern.is_validated)


if __name__ == "__main__":
    unittest.main()