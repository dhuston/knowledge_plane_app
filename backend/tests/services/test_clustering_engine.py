import unittest
from unittest.mock import MagicMock, patch
import numpy as np
from datetime import datetime
from collections import defaultdict

from sqlalchemy.orm import Session
from app.services.clustering_engine import ClusteringEngine
from app.services.emergent_model_service import EmergentModelService
from app.models.node import Node
from app.models.edge import Edge
from app.models.emergent_model import RelationshipStrength, EmergentPattern


class TestClusteringEngine(unittest.TestCase):
    """Tests for the ClusteringEngine class."""
    
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.tenant_id = 1
        self.engine = ClusteringEngine(self.mock_db, self.tenant_id)
        
        # Set up some test data
        self._setup_test_data()
    
    def _setup_test_data(self):
        """Set up test data for the clustering engine."""
        # Create test nodes
        self.user_nodes = [
            self._create_mock_node(101, "User 1", "user"),
            self._create_mock_node(102, "User 2", "user"),
            self._create_mock_node(103, "User 3", "user"),
            self._create_mock_node(104, "User 4", "user"),
            self._create_mock_node(105, "User 5", "user")
        ]
        
        self.team_nodes = [
            self._create_mock_node(201, "Team 1", "team", {"department_id": 301}),
            self._create_mock_node(202, "Team 2", "team", {"department_id": 301}),
            self._create_mock_node(203, "Team 3", "team", {"department_id": 302})
        ]
        
        self.project_nodes = [
            self._create_mock_node(401, "Project 1", "project"),
            self._create_mock_node(402, "Project 2", "project"),
            self._create_mock_node(403, "Project 3", "project")
        ]
        
        self.goal_nodes = [
            self._create_mock_node(501, "Goal 1", "goal"),
            self._create_mock_node(502, "Goal 2", "goal", {"parent_goal_id": 501}),
            self._create_mock_node(503, "Goal 3", "goal", {"parent_goal_id": 501})
        ]
        
        # Create test relationships
        self.relationships = [
            self._create_mock_relationship(101, 102, 0.8, "collaboration"),
            self._create_mock_relationship(101, 103, 0.7, "collaboration"),
            self._create_mock_relationship(102, 103, 0.9, "collaboration"),
            self._create_mock_relationship(104, 105, 0.6, "collaboration"),
            self._create_mock_relationship(201, 202, 0.7, "team_relationship"),
            self._create_mock_relationship(401, 501, 0.8, "goal_alignment"),
            self._create_mock_relationship(402, 501, 0.7, "goal_alignment"),
            self._create_mock_relationship(403, 502, 0.6, "goal_alignment")
        ]
    
    def _create_mock_node(self, id: int, name: str, type: str, attributes=None) -> MagicMock:
        """Create a mock Node object."""
        mock_node = MagicMock(spec=Node)
        mock_node.id = id
        mock_node.name = name
        mock_node.type = type
        mock_node.tenant_id = self.tenant_id
        mock_node.attributes = attributes or {}
        return mock_node
    
    def _create_mock_relationship(self, source_id: int, target_id: int, 
                                strength: float, type: str) -> MagicMock:
        """Create a mock RelationshipStrength object."""
        mock_rel = MagicMock(spec=RelationshipStrength)
        mock_rel.source_id = source_id
        mock_rel.target_id = target_id
        mock_rel.strength_value = strength
        mock_rel.relationship_type = type
        mock_rel.tenant_id = self.tenant_id
        return mock_rel
    
    def test_init(self):
        """Test initialization of the clustering engine."""
        self.assertEqual(self.engine.tenant_id, self.tenant_id)
        self.assertEqual(self.engine.db, self.mock_db)
        self.assertIsInstance(self.engine.emergent_model_service, EmergentModelService)
        self.assertEqual(self.engine.min_cluster_size, 3)
        self.assertEqual(self.engine.strength_threshold, 0.3)
    
    def test_detect_clusters_users(self):
        """Test detecting clusters for user nodes."""
        # Setup mock queries
        nodes_query = MagicMock()
        nodes_query.filter.return_value = nodes_query
        nodes_query.all.return_value = self.user_nodes
        self.mock_db.query.side_effect = [nodes_query, MagicMock()]
        self.mock_db.query.return_value.filter.return_value.all.return_value = self.relationships
        
        # Mock the _build_graph method
        mock_graph = {
            101: {"id": 101, "name": "User 1", "type": "user", "neighbors": {102: {"strength": 0.8}, 103: {"strength": 0.7}}, "attributes": {}},
            102: {"id": 102, "name": "User 2", "type": "user", "neighbors": {101: {"strength": 0.8}, 103: {"strength": 0.9}}, "attributes": {}},
            103: {"id": 103, "name": "User 3", "type": "user", "neighbors": {101: {"strength": 0.7}, 102: {"strength": 0.9}}, "attributes": {}},
            104: {"id": 104, "name": "User 4", "type": "user", "neighbors": {105: {"strength": 0.6}}, "attributes": {}},
            105: {"id": 105, "name": "User 5", "type": "user", "neighbors": {104: {"strength": 0.6}}, "attributes": {}}
        }
        self.engine._build_graph = MagicMock(return_value=mock_graph)
        
        # Mock the _cluster_users method
        mock_clusters = [[101, 102, 103], [104, 105]]
        self.engine._cluster_users = MagicMock(return_value=mock_clusters)
        
        # Mock the _post_process_clusters method
        mock_processed_clusters = [
            {
                "id": "abc123",
                "name": "User Cluster: User 1, User 2",
                "node_type": "user",
                "members": [101, 102, 103],
                "size": 3,
                "central_members": [101, 102],
                "metadata": {"algorithm": "hierarchical_clustering"}
            },
            {
                "id": "def456",
                "name": "User Cluster: User 4, User 5",
                "node_type": "user",
                "members": [104, 105],
                "size": 2,
                "central_members": [104, 105],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._post_process_clusters = MagicMock(return_value=mock_processed_clusters)
        
        # Call method
        result = self.engine.detect_clusters(node_type="user")
        
        # Verify
        self.mock_db.query.assert_called()
        self.engine._build_graph.assert_called_once()
        self.engine._cluster_users.assert_called_once_with(mock_graph)
        self.engine._post_process_clusters.assert_called_once_with(mock_clusters, self.user_nodes)
        self.assertEqual(result, mock_processed_clusters)
        
        # Check that internal state is set
        self.assertEqual(self.engine._clusters, mock_processed_clusters)
        self.assertTrue(hasattr(self.engine, "_node_to_cluster"))
    
    def test_detect_clusters_teams(self):
        """Test detecting clusters for team nodes."""
        # Setup mock queries
        nodes_query = MagicMock()
        nodes_query.filter.return_value = nodes_query
        nodes_query.all.return_value = self.team_nodes
        self.mock_db.query.side_effect = [nodes_query, MagicMock()]
        self.mock_db.query.return_value.filter.return_value.all.return_value = self.relationships
        
        # Mock the _build_graph method
        mock_graph = {
            201: {"id": 201, "name": "Team 1", "type": "team", "neighbors": {202: {"strength": 0.7}}, "attributes": {"department_id": 301}},
            202: {"id": 202, "name": "Team 2", "type": "team", "neighbors": {201: {"strength": 0.7}}, "attributes": {"department_id": 301}},
            203: {"id": 203, "name": "Team 3", "type": "team", "neighbors": {}, "attributes": {"department_id": 302}}
        }
        self.engine._build_graph = MagicMock(return_value=mock_graph)
        
        # Mock the _cluster_teams method
        mock_clusters = [[201, 202]]
        self.engine._cluster_teams = MagicMock(return_value=mock_clusters)
        
        # Mock the _post_process_clusters method
        mock_processed_clusters = [
            {
                "id": "ghi789",
                "name": "Team Cluster: Team 1, Team 2",
                "node_type": "team",
                "members": [201, 202],
                "size": 2,
                "central_members": [201, 202],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._post_process_clusters = MagicMock(return_value=mock_processed_clusters)
        
        # Call method
        result = self.engine.detect_clusters(node_type="team")
        
        # Verify
        self.mock_db.query.assert_called()
        self.engine._build_graph.assert_called_once()
        self.engine._cluster_teams.assert_called_once_with(mock_graph)
        self.engine._post_process_clusters.assert_called_once_with(mock_clusters, self.team_nodes)
        self.assertEqual(result, mock_processed_clusters)
    
    def test_detect_clusters_projects(self):
        """Test detecting clusters for project nodes."""
        # Setup mock queries
        nodes_query = MagicMock()
        nodes_query.filter.return_value = nodes_query
        nodes_query.all.return_value = self.project_nodes
        self.mock_db.query.side_effect = [nodes_query, MagicMock()]
        self.mock_db.query.return_value.filter.return_value.all.return_value = self.relationships
        
        # Mock the _build_graph method
        mock_graph = {
            401: {"id": 401, "name": "Project 1", "type": "project", "neighbors": {501: {"strength": 0.8, "type": "goal_alignment"}}, "attributes": {}},
            402: {"id": 402, "name": "Project 2", "type": "project", "neighbors": {501: {"strength": 0.7, "type": "goal_alignment"}}, "attributes": {}},
            403: {"id": 403, "name": "Project 3", "type": "project", "neighbors": {502: {"strength": 0.6, "type": "goal_alignment"}}, "attributes": {}},
            501: {"id": 501, "name": "Goal 1", "type": "goal", "neighbors": {401: {"strength": 0.8}, 402: {"strength": 0.7}}, "attributes": {}},
            502: {"id": 502, "name": "Goal 2", "type": "goal", "neighbors": {403: {"strength": 0.6}}, "attributes": {"parent_goal_id": 501}}
        }
        self.engine._build_graph = MagicMock(return_value=mock_graph)
        
        # Mock the _cluster_projects method
        mock_clusters = [[401, 402]]
        self.engine._cluster_projects = MagicMock(return_value=mock_clusters)
        
        # Mock the _post_process_clusters method
        mock_processed_clusters = [
            {
                "id": "jkl012",
                "name": "Project Cluster: Project 1, Project 2",
                "node_type": "project",
                "members": [401, 402],
                "size": 2,
                "central_members": [401, 402],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._post_process_clusters = MagicMock(return_value=mock_processed_clusters)
        
        # Call method
        result = self.engine.detect_clusters(node_type="project")
        
        # Verify
        self.mock_db.query.assert_called()
        self.engine._build_graph.assert_called_once()
        self.engine._cluster_projects.assert_called_once_with(mock_graph)
        self.engine._post_process_clusters.assert_called_once_with(mock_clusters, self.project_nodes)
        self.assertEqual(result, mock_processed_clusters)
    
    def test_detect_clusters_goals(self):
        """Test detecting clusters for goal nodes."""
        # Setup mock queries
        nodes_query = MagicMock()
        nodes_query.filter.return_value = nodes_query
        nodes_query.all.return_value = self.goal_nodes
        self.mock_db.query.side_effect = [nodes_query, MagicMock()]
        self.mock_db.query.return_value.filter.return_value.all.return_value = self.relationships
        
        # Mock the _build_graph method
        mock_graph = {
            501: {"id": 501, "name": "Goal 1", "type": "goal", "neighbors": {401: {"strength": 0.8}, 402: {"strength": 0.7}}, "attributes": {}},
            502: {"id": 502, "name": "Goal 2", "type": "goal", "neighbors": {403: {"strength": 0.6}}, "attributes": {"parent_goal_id": 501}},
            503: {"id": 503, "name": "Goal 3", "type": "goal", "neighbors": {}, "attributes": {"parent_goal_id": 501}}
        }
        self.engine._build_graph = MagicMock(return_value=mock_graph)
        
        # Mock the _cluster_goals method
        mock_clusters = [[501, 502, 503]]
        self.engine._cluster_goals = MagicMock(return_value=mock_clusters)
        
        # Mock the _post_process_clusters method
        mock_processed_clusters = [
            {
                "id": "mno345",
                "name": "Goal Cluster: Goal 1, Goal 2, Goal 3",
                "node_type": "goal",
                "members": [501, 502, 503],
                "size": 3,
                "central_members": [501],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._post_process_clusters = MagicMock(return_value=mock_processed_clusters)
        
        # Call method
        result = self.engine.detect_clusters(node_type="goal")
        
        # Verify
        self.mock_db.query.assert_called()
        self.engine._build_graph.assert_called_once()
        self.engine._cluster_goals.assert_called_once_with(mock_graph)
        self.engine._post_process_clusters.assert_called_once_with(mock_clusters, self.goal_nodes)
        self.assertEqual(result, mock_processed_clusters)
    
    def test_detect_clusters_cache(self):
        """Test that detect_clusters uses cached results when available."""
        # Set up cached results
        mock_cached_clusters = [
            {
                "id": "abc123",
                "name": "User Cluster: User 1, User 2",
                "node_type": "user",
                "members": [101, 102, 103],
                "size": 3,
                "central_members": [101, 102],
                "metadata": {"algorithm": "hierarchical_clustering"}
            },
            {
                "id": "ghi789",
                "name": "Team Cluster: Team 1, Team 2",
                "node_type": "team",
                "members": [201, 202],
                "size": 2,
                "central_members": [201, 202],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._clusters = mock_cached_clusters
        
        # Mock other methods to verify they're not called
        self.engine._build_graph = MagicMock()
        self.engine._cluster_users = MagicMock()
        self.engine._post_process_clusters = MagicMock()
        
        # Call method with node_type filter
        result = self.engine.detect_clusters(node_type="user")
        
        # Verify
        self.mock_db.query.assert_not_called()
        self.engine._build_graph.assert_not_called()
        self.engine._cluster_users.assert_not_called()
        self.engine._post_process_clusters.assert_not_called()
        
        # Should return only user clusters from cache
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["node_type"], "user")
        
        # Call method with force_recalculate=True
        self.mock_db.query.side_effect = [MagicMock(), MagicMock()]
        self.mock_db.query.return_value.filter.return_value.all.side_effect = [[], []]
        self.engine._build_graph = MagicMock(return_value={})
        self.engine._cluster_hierarchical = MagicMock(return_value=[])
        self.engine._post_process_clusters = MagicMock(return_value=[])
        
        result = self.engine.detect_clusters(force_recalculate=True)
        
        # Verify methods were called to recalculate
        self.mock_db.query.assert_called()
        self.engine._build_graph.assert_called_once()
        self.engine._cluster_hierarchical.assert_called_once()
        self.engine._post_process_clusters.assert_called_once()
    
    def test_get_node_cluster(self):
        """Test getting the cluster a node belongs to."""
        # Set up node-to-cluster mapping
        mock_cluster = {
            "id": "abc123",
            "name": "User Cluster: User 1, User 2",
            "node_type": "user",
            "members": [101, 102, 103],
            "size": 3,
            "central_members": [101, 102],
            "metadata": {"algorithm": "hierarchical_clustering"}
        }
        self.engine._node_to_cluster = {
            101: mock_cluster,
            102: mock_cluster,
            103: mock_cluster
        }
        
        # Test getting a cluster for a node
        result = self.engine.get_node_cluster(101)
        self.assertEqual(result, mock_cluster)
        
        # Test getting a cluster for a node that doesn't exist
        result = self.engine.get_node_cluster(999)
        self.assertIsNone(result)
        
        # Test when mapping is empty
        self.engine._node_to_cluster = {}
        self.engine._clusters = [mock_cluster]
        self.engine._build_node_to_cluster_mapping = MagicMock()
        
        result = self.engine.get_node_cluster(101)
        
        # Verify mapping was rebuilt
        self.engine._build_node_to_cluster_mapping.assert_called_once()
    
    def test_get_cluster(self):
        """Test getting a specific cluster by ID."""
        # Set up clusters
        mock_clusters = [
            {
                "id": "abc123",
                "name": "User Cluster 1",
                "node_type": "user",
                "members": [101, 102, 103]
            },
            {
                "id": "def456",
                "name": "User Cluster 2",
                "node_type": "user",
                "members": [104, 105]
            }
        ]
        self.engine._clusters = mock_clusters
        
        # Test getting a cluster by ID
        result = self.engine.get_cluster("abc123")
        self.assertEqual(result, mock_clusters[0])
        
        # Test getting a cluster that doesn't exist
        result = self.engine.get_cluster("nonexistent")
        self.assertIsNone(result)
        
        # Test when clusters are empty
        self.engine._clusters = []
        result = self.engine.get_cluster("abc123")
        self.assertIsNone(result)
    
    def test_detect_cross_cluster_relationships(self):
        """Test detecting relationships between clusters."""
        # Set up clusters
        mock_clusters = [
            {
                "id": "cluster1",
                "name": "User Cluster 1",
                "node_type": "user",
                "members": [101, 102, 103]
            },
            {
                "id": "cluster2",
                "name": "User Cluster 2",
                "node_type": "user",
                "members": [104, 105]
            }
        ]
        self.engine._clusters = mock_clusters
        
        # Set up relationships
        mock_relationships = [
            self._create_mock_relationship(101, 104, 0.7, "collaboration"),
            self._create_mock_relationship(102, 104, 0.6, "collaboration"),
            self._create_mock_relationship(101, 102, 0.9, "collaboration")  # Within cluster1
        ]
        self.mock_db.query.return_value.filter.return_value.all.return_value = mock_relationships
        
        # Call method
        result = self.engine.detect_cross_cluster_relationships()
        
        # Verify
        self.mock_db.query.assert_called_once()
        self.assertEqual(len(result), 1)  # One cross-cluster relationship
        self.assertEqual(result[0]["source_cluster_id"], "cluster1")
        self.assertEqual(result[0]["target_cluster_id"], "cluster2")
        self.assertAlmostEqual(result[0]["strength"], 0.65)  # Average of 0.7 and 0.6
        self.assertEqual(result[0]["relationship_count"], 2)
    
    def test_store_clusters_as_patterns(self):
        """Test storing clusters as emergent patterns."""
        # Set up clusters
        mock_clusters = [
            {
                "id": "cluster1",
                "name": "User Cluster 1",
                "node_type": "user",
                "members": [101, 102],
                "metadata": {"algorithm": "hierarchical_clustering"}
            }
        ]
        self.engine._clusters = mock_clusters
        
        # Set up nodes
        mock_nodes = [
            self._create_mock_node(101, "User 1", "user"),
            self._create_mock_node(102, "User 2", "user")
        ]
        
        # Mock database queries
        self.mock_db.query.return_value.filter.return_value.first.return_value = None  # No existing pattern
        self.mock_db.query.return_value.get.side_effect = mock_nodes
        
        # Call method
        result = self.engine.store_clusters_as_patterns()
        
        # Verify
        self.mock_db.query.assert_called()
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()
        self.assertEqual(len(result), 1)
        
        # Check created pattern
        pattern = result[0]
        self.assertEqual(pattern.pattern_type, "cluster_user")
        self.assertEqual(pattern.confidence_score, 0.8)
        self.assertEqual(pattern.description, "User Cluster 1")
        self.assertEqual(pattern.metadata, {"cluster_id": "cluster1", "details": {"algorithm": "hierarchical_clustering"}})
        self.assertEqual(pattern.tenant_id, self.tenant_id)
        self.assertEqual(pattern.nodes, mock_nodes)
    
    def test_build_graph(self):
        """Test building the graph representation from nodes and relationships."""
        # Call method
        graph = self.engine._build_graph(
            [self.user_nodes[0], self.user_nodes[1], self.user_nodes[2]],
            [self.relationships[0], self.relationships[1], self.relationships[2]]
        )
        
        # Verify structure
        self.assertEqual(len(graph), 3)
        self.assertIn(101, graph)
        self.assertIn(102, graph)
        self.assertIn(103, graph)
        
        # Check node data
        self.assertEqual(graph[101]["name"], "User 1")
        self.assertEqual(graph[101]["type"], "user")
        
        # Check relationships
        self.assertIn(102, graph[101]["neighbors"])
        self.assertIn(103, graph[101]["neighbors"])
        self.assertEqual(graph[101]["neighbors"][102]["strength"], 0.8)
        self.assertEqual(graph[101]["neighbors"][103]["strength"], 0.7)
        
        # Check bidirectional connections
        self.assertIn(101, graph[102]["neighbors"])
        self.assertEqual(graph[102]["neighbors"][101]["strength"], 0.8)
    
    def test_cluster_connected_components(self):
        """Test clustering based on connected components algorithm."""
        # Create a simple graph with two connected components
        graph = {
            101: {"id": 101, "neighbors": {102: {}, 103: {}}},
            102: {"id": 102, "neighbors": {101: {}, 103: {}}},
            103: {"id": 103, "neighbors": {101: {}, 102: {}}},
            104: {"id": 104, "neighbors": {105: {}}},
            105: {"id": 105, "neighbors": {104: {}}}
        }
        
        # Call method
        clusters = self.engine._cluster_connected_components(graph)
        
        # Verify
        self.assertEqual(len(clusters), 1)  # Only one cluster meets min_cluster_size (3)
        self.assertEqual(sorted(clusters[0]), [101, 102, 103])
    
    @patch('app.services.clustering_engine.np')
    @patch('scipy.cluster.hierarchy.linkage')
    @patch('scipy.cluster.hierarchy.fcluster')
    def test_cluster_hierarchical_with_scipy(self, mock_fcluster, mock_linkage, mock_np):
        """Test hierarchical clustering with SciPy available."""
        # Create a mock graph
        graph = {
            101: {"id": 101, "neighbors": {102: {"strength": 0.8}, 103: {"strength": 0.5}}},
            102: {"id": 102, "neighbors": {101: {"strength": 0.8}, 103: {"strength": 0.7}}},
            103: {"id": 103, "neighbors": {101: {"strength": 0.5}, 102: {"strength": 0.7}}}
        }
        
        # Configure mocks
        mock_np.ones.return_value = np.ones((3, 3)) * 2.0
        mock_np.fill_diagonal = np.fill_diagonal
        mock_linkage.return_value = "mock_linkage_result"
        mock_fcluster.return_value = [1, 1, 2]  # Two clusters
        
        # Call method
        clusters = self.engine._cluster_hierarchical(graph)
        
        # Verify
        mock_linkage.assert_called_once()
        mock_fcluster.assert_called_once_with("mock_linkage_result", 0.8, criterion='distance')
        
        # Check cluster results
        self.assertEqual(len(clusters), 1)  # Only one cluster meets min_cluster_size (3)
        self.assertEqual(sorted(clusters[0]), [101, 102])
    
    def test_cluster_hierarchical_fallback(self):
        """Test hierarchical clustering falling back to connected components."""
        # Create a mock graph
        graph = {
            101: {"id": 101, "neighbors": {102: {"strength": 0.8}, 103: {"strength": 0.5}}},
            102: {"id": 102, "neighbors": {101: {"strength": 0.8}, 103: {"strength": 0.7}}},
            103: {"id": 103, "neighbors": {101: {"strength": 0.5}, 102: {"strength": 0.7}}}
        }
        
        # Mock import error
        with patch('app.services.clustering_engine.np'):
            with patch('scipy.cluster.hierarchy.linkage', side_effect=ImportError):
                # Also mock the fallback method
                self.engine._cluster_connected_components = MagicMock(return_value=[[101, 102, 103]])
                
                # Call method
                clusters = self.engine._cluster_hierarchical(graph)
                
                # Verify fallback was used
                self.engine._cluster_connected_components.assert_called_once_with(graph)
                self.assertEqual(clusters, [[101, 102, 103]])
    
    def test_cluster_teams(self):
        """Test team-specific clustering."""
        # Create a graph of teams
        graph = {
            201: {"id": 201, "type": "team", "neighbors": {202: {}}, "attributes": {"department_id": 301}},
            202: {"id": 202, "type": "team", "neighbors": {201: {}}, "attributes": {"department_id": 301}},
            203: {"id": 203, "type": "team", "neighbors": {}, "attributes": {"department_id": 302}}
        }
        
        # Override min_cluster_size for test
        self.engine.min_cluster_size = 2
        
        # Call method
        clusters = self.engine._cluster_teams(graph)
        
        # Verify
        self.assertEqual(len(clusters), 1)
        self.assertEqual(sorted(clusters[0]), [201, 202])
    
    def test_cluster_goals(self):
        """Test goal-specific clustering."""
        # Create a graph of goals
        graph = {
            501: {"id": 501, "type": "goal", "neighbors": {}, "attributes": {}},
            502: {"id": 502, "type": "goal", "neighbors": {}, "attributes": {"parent_goal_id": 501}},
            503: {"id": 503, "type": "goal", "neighbors": {}, "attributes": {"parent_goal_id": 501}}
        }
        
        # Override min_cluster_size for test
        self.engine.min_cluster_size = 3
        
        # Call method
        clusters = self.engine._cluster_goals(graph)
        
        # Verify
        self.assertEqual(len(clusters), 1)
        self.assertEqual(sorted(clusters[0]), [501, 502, 503])
    
    def test_post_process_clusters(self):
        """Test post-processing of raw clusters."""
        # Create raw clusters
        raw_clusters = [
            [101, 102, 103]
        ]
        
        # Mock finding central nodes
        central_nodes = [self.user_nodes[0], self.user_nodes[1]]
        self.engine._find_central_nodes = MagicMock(return_value=central_nodes)
        
        # Call method
        with patch('hashlib.md5') as mock_md5:
            mock_md5.return_value.hexdigest.return_value = "abcdef1234"
            processed = self.engine._post_process_clusters(raw_clusters, self.user_nodes[:3])
        
        # Verify
        self.assertEqual(len(processed), 1)
        cluster = processed[0]
        self.assertEqual(cluster["id"], "abcdef1234")
        self.assertEqual(cluster["name"], "User Cluster: User 1, User 2")
        self.assertEqual(cluster["node_type"], "user")
        self.assertEqual(cluster["members"], [101, 102, 103])
        self.assertEqual(cluster["size"], 3)
        self.assertEqual(cluster["central_members"], [101, 102])
        self.assertIn("algorithm", cluster["metadata"])
        self.assertIn("created_at", cluster["metadata"])
    
    def test_find_central_nodes(self):
        """Test finding central nodes in a cluster."""
        # Mock relationship queries
        self.mock_db.query.return_value.filter.return_value.count.side_effect = [3, 2, 1]
        
        # Create node map
        node_map = {node.id: node for node in self.user_nodes[:3]}
        
        # Call method
        central_nodes = self.engine._find_central_nodes([101, 102, 103], node_map)
        
        # Verify
        self.assertEqual(len(central_nodes), 3)
        self.assertEqual(central_nodes[0].id, 101)  # Most relationships
        self.assertEqual(central_nodes[1].id, 102)  # Second most
        self.assertEqual(central_nodes[2].id, 103)  # Fewest relationships
    
    def test_build_node_to_cluster_mapping(self):
        """Test building the node-to-cluster mapping."""
        # Set up clusters
        mock_clusters = [
            {
                "id": "cluster1",
                "members": [101, 102]
            },
            {
                "id": "cluster2",
                "members": [103]
            }
        ]
        self.engine._clusters = mock_clusters
        
        # Call method
        self.engine._build_node_to_cluster_mapping()
        
        # Verify
        self.assertEqual(len(self.engine._node_to_cluster), 3)
        self.assertEqual(self.engine._node_to_cluster[101], mock_clusters[0])
        self.assertEqual(self.engine._node_to_cluster[102], mock_clusters[0])
        self.assertEqual(self.engine._node_to_cluster[103], mock_clusters[1])


if __name__ == "__main__":
    unittest.main()