import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
import json

from sqlalchemy.orm import Session
from app.services.communication_analyzer_service import PrivacyFilter, CommunicationAnalyzer
from app.models.user import User
from app.models.emergent_model import RelationshipStrength


class TestPrivacyFilter(unittest.TestCase):
    """Tests for the PrivacyFilter class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.tenant_id = 1
        
        # Mock users with privacy settings
        mock_user1 = MagicMock(spec=User)
        mock_user1.id = 101
        mock_user1.settings = {"communication_analysis_opt_out": True}
        
        mock_user2 = MagicMock(spec=User)
        mock_user2.id = 102
        mock_user2.settings = {}
        
        # Setup mock query for opt-out users
        mock_query = self.mock_db.query.return_value.filter.return_value
        mock_query.all.return_value = [mock_user1]  # Only user1 has opted out
        
        self.filter = PrivacyFilter(self.mock_db, self.tenant_id)
        
        # Sample communication data
        self.test_data = [
            {"sender_id": 101, "recipient_id": 102, "content": "Hello"},
            {"sender_id": 102, "recipient_id": 103, "content": "Hi there"},
            {"sender_id": 103, "recipient_id": 104, "content": "Meeting tomorrow"}
        ]

    def test_initialization(self):
        """Test filter initialization and loading of opt-out users."""
        self.mock_db.query.assert_called_once_with(User)
        self.assertEqual(self.filter.opt_out_users, {101})

    def test_filter_communication_data(self):
        """Test filtering communication data based on opt-out users."""
        filtered_data = self.filter.filter_communication_data(self.test_data)
        
        # Records involving user 101 (who opted out) should be removed
        self.assertEqual(len(filtered_data), 1)
        self.assertEqual(filtered_data[0]["sender_id"], 103)
        self.assertEqual(filtered_data[0]["recipient_id"], 104)

    def test_anonymize_data(self):
        """Test anonymizing communication data."""
        anonymized_data = self.filter.anonymize_data(self.test_data)
        
        # Verify all records are anonymized
        self.assertEqual(len(anonymized_data), 3)
        
        # Check that IDs are replaced with anonymous identifiers
        self.assertTrue(all("anon_user" in record["sender_id"] for record in anonymized_data))
        self.assertTrue(all("anon_user" in record["recipient_id"] for record in anonymized_data))
        
        # Check that content is removed
        self.assertTrue(all("content" not in record for record in anonymized_data))
        
        # Check that the same user always gets the same anonymous ID
        sender_ids = [record["sender_id"] for record in anonymized_data]
        self.assertEqual(sender_ids.count(sender_ids[0]), 
                        self.test_data.count({"sender_id": self.test_data[0]["sender_id"]}))


class TestCommunicationAnalyzer(unittest.TestCase):
    """Tests for the CommunicationAnalyzer class."""

    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.tenant_id = 1
        
        # Create analyzer and patch privacy filter
        self.analyzer = CommunicationAnalyzer(self.mock_db, self.tenant_id)
        self.analyzer.privacy_filter = MagicMock()
        self.analyzer.privacy_filter.filter_communication_data = lambda data: data  # No filtering
        
        # Sample email data
        now = datetime.utcnow()
        yesterday = now - timedelta(days=1)
        self.email_data = [
            {
                "sender_id": 101,
                "recipient_id": 102,
                "timestamp": now.isoformat(),
                "subject": "Test Email"
            },
            {
                "sender_id": 102,
                "recipient_id": 101,
                "timestamp": yesterday.isoformat(),
                "subject": "Re: Test Email"
            },
            {
                "sender_id": 101,
                "recipient_id": 103,
                "timestamp": now.isoformat(),
                "subject": "Another Email"
            }
        ]
        
        # Sample calendar data
        tomorrow = now + timedelta(days=1)
        self.calendar_data = [
            {
                "organizer_id": 101,
                "participants": [102, 103],
                "start_time": tomorrow.isoformat(),
                "duration_minutes": 60,
                "title": "Team Meeting"
            },
            {
                "organizer_id": 102,
                "participants": [101, 103, 104],
                "start_time": (tomorrow + timedelta(hours=2)).isoformat(),
                "duration_minutes": 30,
                "title": "Quick Sync"
            }
        ]

    def test_analyze_email_communications(self):
        """Test analyzing email communication patterns."""
        result = self.analyzer.analyze_email_communications(self.email_data)
        
        # Check that analysis contains expected sections
        self.assertIn("frequency_analysis", result)
        self.assertIn("temporal_analysis", result)
        self.assertIn("network_analysis", result)
        self.assertIn("metadata", result)
        
        # Verify frequency analysis
        freq = result["frequency_analysis"]
        self.assertEqual(freq["total_communications"], 3)
        self.assertEqual(freq["unique_pairs"], 2)  # (101,102) and (101,103)
        
        # Verify network analysis
        network = result["network_analysis"]
        self.assertEqual(network["nodes"], 3)
        self.assertEqual(network["edges"], 2)
        
        # Verify user 101 is most central (connected to both 102 and 103)
        central_nodes = network["central_nodes"]
        self.assertEqual(central_nodes[0]["node_id"], 101)
        self.assertEqual(central_nodes[0]["degree"], 2)

    def test_analyze_calendar_interactions(self):
        """Test analyzing calendar meeting patterns."""
        result = self.analyzer.analyze_calendar_interactions(self.calendar_data)
        
        # Check that analysis contains expected sections
        self.assertIn("frequency_analysis", result)
        self.assertIn("network_analysis", result)
        self.assertIn("meeting_stats", result)
        self.assertIn("metadata", result)
        
        # Verify meeting stats
        stats = result["meeting_stats"]
        self.assertEqual(stats["avg_duration"], 45)  # (60+30)/2
        self.assertEqual(stats["max_duration"], 60)
        self.assertEqual(stats["min_duration"], 30)
        self.assertEqual(stats["avg_participants"], 2.5)  # (2+3)/2
        
        # Verify metadata
        metadata = result["metadata"]
        self.assertEqual(metadata["total_meetings"], 2)
        self.assertEqual(metadata["total_interactions"], 5)  # 5 unique organizer-participant pairs

    def test_calculate_relationship_strengths(self):
        """Test calculating relationship strengths from communication data."""
        # Combine email and calendar data
        combined_data = self.email_data + [
            {
                "sender_id": 101,
                "recipient_id": 102,
                "timestamp": datetime.utcnow().isoformat(),
                "type": "calendar"
            }
        ]
        
        # Mock helper methods
        self.analyzer._calculate_recency = MagicMock(return_value=0.9)
        self.analyzer._calculate_reciprocity = MagicMock(return_value=0.8)
        
        # Calculate strengths
        strengths = self.analyzer.calculate_relationship_strengths(combined_data)
        
        # Should have relationship strengths in both directions
        self.assertEqual(len(strengths), 4)  # 2 pairs * 2 directions
        
        # Check first strength record
        strength1 = next(s for s in strengths if s["source_id"] == 101 and s["target_id"] == 102)
        self.assertEqual(strength1["relationship_type"], "collaboration")
        self.assertGreater(strength1["strength_value"], 0)
        self.assertGreater(strength1["confidence_score"], 0)
        self.assertIn("frequency", strength1["metadata"])
        self.assertIn("recency", strength1["metadata"])
        self.assertIn("reciprocity", strength1["metadata"])
        
        # Check that strengths are the same in both directions
        strength2 = next(s for s in strengths if s["source_id"] == 102 and s["target_id"] == 101)
        self.assertEqual(strength1["strength_value"], strength2["strength_value"])

    def test_store_relationship_strengths(self):
        """Test storing calculated relationship strengths in the database."""
        # Mock relationship strengths
        strengths = [
            {
                "source_id": 101,
                "target_id": 102,
                "relationship_type": "collaboration",
                "strength_value": 0.75,
                "confidence_score": 0.8,
                "metadata": {"frequency": 10, "recency": 0.9, "reciprocity": 0.8}
            },
            {
                "source_id": 102,
                "target_id": 101,
                "relationship_type": "collaboration",
                "strength_value": 0.75,
                "confidence_score": 0.8,
                "metadata": {"frequency": 10, "recency": 0.9, "reciprocity": 0.8}
            }
        ]
        
        # Mock database query for existing relationship
        mock_relationship = MagicMock(spec=RelationshipStrength)
        mock_query = self.mock_db.query.return_value.filter.return_value
        mock_query.first.side_effect = [mock_relationship, None]  # First exists, second doesn't
        
        # Store strengths
        results = self.analyzer.store_relationship_strengths(strengths)
        
        # Verify one relationship was updated and one was created
        self.assertEqual(len(results), 2)
        self.assertEqual(mock_relationship.strength_value, 0.75)
        self.assertEqual(mock_relationship.confidence_score, 0.8)
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    def test_calculate_recency(self):
        """Test calculating recency score."""
        # Restore actual method
        self.analyzer._calculate_recency = CommunicationAnalyzer._calculate_recency.__get__(
            self.analyzer, CommunicationAnalyzer
        )
        
        now = datetime.utcnow()
        
        # Test with recent interaction
        interactions = [{"timestamp": now.isoformat()}]
        recency = self.analyzer._calculate_recency(interactions)
        self.assertAlmostEqual(recency, 1.0)
        
        # Test with older interaction
        old_time = now - timedelta(days=45)  # 45 days old = 0.5 recency
        interactions = [{"timestamp": old_time.isoformat()}]
        recency = self.analyzer._calculate_recency(interactions)
        self.assertAlmostEqual(recency, 0.5, delta=0.1)
        
        # Test with very old interaction
        very_old_time = now - timedelta(days=100)  # More than 90 days old = 0.0 recency
        interactions = [{"timestamp": very_old_time.isoformat()}]
        recency = self.analyzer._calculate_recency(interactions)
        self.assertEqual(recency, 0.0)

    def test_calculate_reciprocity(self):
        """Test calculating reciprocity score."""
        # Restore actual method
        self.analyzer._calculate_reciprocity = CommunicationAnalyzer._calculate_reciprocity.__get__(
            self.analyzer, CommunicationAnalyzer
        )
        
        # Test perfect reciprocity
        interactions = [
            {"sender_id": 101, "recipient_id": 102},
            {"sender_id": 102, "recipient_id": 101}
        ]
        reciprocity = self.analyzer._calculate_reciprocity(interactions, 101, 102)
        self.assertEqual(reciprocity, 1.0)
        
        # Test one-sided interaction
        interactions = [
            {"sender_id": 101, "recipient_id": 102},
            {"sender_id": 101, "recipient_id": 102}
        ]
        reciprocity = self.analyzer._calculate_reciprocity(interactions, 101, 102)
        self.assertEqual(reciprocity, 0.0)
        
        # Test unbalanced interaction
        interactions = [
            {"sender_id": 101, "recipient_id": 102},
            {"sender_id": 101, "recipient_id": 102},
            {"sender_id": 101, "recipient_id": 102},
            {"sender_id": 102, "recipient_id": 101}
        ]
        reciprocity = self.analyzer._calculate_reciprocity(interactions, 101, 102)
        self.assertEqual(reciprocity, 0.5)  # 1/4 vs 3/4 = 0.25 ratio = 0.5 score


if __name__ == "__main__":
    unittest.main()