from typing import List, Dict, Any, Optional, Tuple, Set
from sqlalchemy.orm import Session
import numpy as np
from datetime import datetime
import logging
from collections import defaultdict

from app.models.node import Node
from app.models.edge import Edge
from app.models.emergent_model import RelationshipStrength, EmergentPattern
from app.services.emergent_model_service import EmergentModelService

# Set up logging
logger = logging.getLogger(__name__)


class ClusteringEngine:
    """
    Engine for clustering organizational entities in the Living Map.
    
    This component analyzes relationships between entities and creates
    hierarchical clusters for better visualization and organization.
    """
    
    def __init__(self, db: Session, tenant_id: int):
        """
        Initialize the clustering engine.
        
        Args:
            db: Database session
            tenant_id: Tenant ID for data isolation
        """
        self.db = db
        self.tenant_id = tenant_id
        self.emergent_model_service = EmergentModelService(db)
        
        # Configuration parameters
        self.min_cluster_size = 3
        self.max_cluster_size = 50
        self.strength_threshold = 0.3  # Minimum strength for relationships to consider
        
        # Internal state
        self._clusters = []
        self._node_to_cluster = {}
    
    def detect_clusters(self, node_type: Optional[str] = None, force_recalculate: bool = False) -> List[Dict[str, Any]]:
        """
        Detect clusters of entities based on relationship strengths.
        
        Args:
            node_type: Optional node type to filter by (e.g., "user", "team", "project")
            force_recalculate: Force recalculation even if cached
            
        Returns:
            List of cluster dictionaries with members and metadata
        """
        logger.info(f"Detecting clusters for tenant {self.tenant_id}, node type: {node_type}")
        
        # First check if we already have clustering results we can reuse
        if self._clusters and not force_recalculate:
            if node_type:
                return [cluster for cluster in self._clusters if cluster.get("node_type") == node_type]
            return self._clusters
        
        # Start from scratch
        self._clusters = []
        self._node_to_cluster = {}
        
        # Get nodes to cluster
        nodes_query = self.db.query(Node).filter(Node.tenant_id == self.tenant_id)
        if node_type:
            nodes_query = nodes_query.filter(Node.type == node_type)
        nodes = nodes_query.all()
        
        if not nodes:
            logger.info(f"No nodes found for tenant {self.tenant_id}, node type: {node_type}")
            return []
        
        # Get all relationship strengths above threshold
        relationships = self.db.query(RelationshipStrength).filter(
            RelationshipStrength.tenant_id == self.tenant_id,
            RelationshipStrength.strength_value >= self.strength_threshold
        ).all()
        
        # Create node ID sets for quick lookups
        node_ids = {node.id for node in nodes}
        
        # Filter relationships to only include nodes in our set
        filtered_relationships = [
            r for r in relationships 
            if r.source_id in node_ids and r.target_id in node_ids
        ]
        
        logger.info(f"Found {len(filtered_relationships)} relationships above threshold")
        
        # Build graph representation
        graph = self._build_graph(nodes, filtered_relationships)
        
        # Apply clustering algorithm based on node type
        if node_type == "user":
            clusters = self._cluster_users(graph)
        elif node_type == "team":
            clusters = self._cluster_teams(graph)
        elif node_type == "project":
            clusters = self._cluster_projects(graph)
        elif node_type == "goal":
            clusters = self._cluster_goals(graph)
        else:
            # General purpose clustering for mixed node types
            clusters = self._cluster_hierarchical(graph)
        
        # Post-process clusters
        processed_clusters = self._post_process_clusters(clusters, nodes)
        
        # Store results
        self._clusters = processed_clusters
        self._build_node_to_cluster_mapping()
        
        logger.info(f"Detected {len(processed_clusters)} clusters")
        return processed_clusters
    
    def get_node_cluster(self, node_id: int) -> Optional[Dict[str, Any]]:
        """
        Get the cluster a node belongs to.
        
        Args:
            node_id: Node ID
            
        Returns:
            Cluster dictionary if found, None otherwise
        """
        if not self._node_to_cluster:
            # Build the mapping if it doesn't exist
            self._build_node_to_cluster_mapping()
        
        return self._node_to_cluster.get(node_id)
    
    def get_cluster(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific cluster by ID.
        
        Args:
            cluster_id: Cluster ID
            
        Returns:
            Cluster dictionary if found, None otherwise
        """
        if not self._clusters:
            return None
            
        for cluster in self._clusters:
            if cluster.get("id") == cluster_id:
                return cluster
                
        return None
    
    def detect_cross_cluster_relationships(self) -> List[Dict[str, Any]]:
        """
        Detect significant relationships between clusters.
        
        Returns:
            List of cross-cluster relationships
        """
        if not self._clusters:
            return []
            
        # Build map of node ID to cluster ID
        node_to_cluster_id = {}
        for cluster in self._clusters:
            cluster_id = cluster.get("id")
            for node_id in cluster.get("members", []):
                node_to_cluster_id[node_id] = cluster_id
        
        # Get all strong relationships
        relationships = self.db.query(RelationshipStrength).filter(
            RelationshipStrength.tenant_id == self.tenant_id,
            RelationshipStrength.strength_value >= self.strength_threshold
        ).all()
        
        # Find relationships that span clusters
        cross_cluster_rels = []
        cluster_pair_strengths = defaultdict(list)
        
        for rel in relationships:
            source_cluster = node_to_cluster_id.get(rel.source_id)
            target_cluster = node_to_cluster_id.get(rel.target_id)
            
            if source_cluster and target_cluster and source_cluster != target_cluster:
                # This is a cross-cluster relationship
                cluster_pair = tuple(sorted([source_cluster, target_cluster]))
                cluster_pair_strengths[cluster_pair].append(rel.strength_value)
        
        # Aggregate relationship strengths between clusters
        for (cluster1, cluster2), strengths in cluster_pair_strengths.items():
            avg_strength = sum(strengths) / len(strengths)
            cross_cluster_rels.append({
                "source_cluster_id": cluster1,
                "target_cluster_id": cluster2,
                "strength": avg_strength,
                "relationship_count": len(strengths)
            })
        
        # Sort by strength
        cross_cluster_rels.sort(key=lambda x: x["strength"], reverse=True)
        
        return cross_cluster_rels
    
    def store_clusters_as_patterns(self) -> List[EmergentPattern]:
        """
        Store detected clusters as emergent patterns in the database.
        
        Returns:
            List of created EmergentPattern objects
        """
        if not self._clusters:
            return []
            
        patterns = []
        for cluster in self._clusters:
            # Check if this cluster already exists in the database
            existing_pattern = self.db.query(EmergentPattern).filter(
                EmergentPattern.tenant_id == self.tenant_id,
                EmergentPattern.pattern_type == f"cluster_{cluster['node_type']}",
                EmergentPattern.pattern_metadata.contains({"cluster_id": cluster["id"]})
            ).first()
            
            if existing_pattern:
                # Update existing pattern
                existing_pattern.confidence_score = 0.8
                existing_pattern.description = cluster["name"]
                
                # Update nodes
                existing_pattern.nodes = []
                for node_id in cluster["members"]:
                    node = self.db.query(Node).get(node_id)
                    if node:
                        existing_pattern.nodes.append(node)
                
                patterns.append(existing_pattern)
            else:
                # Create new pattern
                pattern = EmergentPattern(
                    pattern_type=f"cluster_{cluster['node_type']}",
                    confidence_score=0.8,
                    description=cluster["name"],
                    pattern_metadata={"cluster_id": cluster["id"], "details": cluster["metadata"]},
                    tenant_id=self.tenant_id
                )
                self.db.add(pattern)
                
                # Add nodes
                for node_id in cluster["members"]:
                    node = self.db.query(Node).get(node_id)
                    if node:
                        pattern.nodes.append(node)
                
                patterns.append(pattern)
        
        self.db.commit()
        logger.info(f"Stored {len(patterns)} clusters as emergent patterns")
        return patterns
    
    def _build_graph(self, nodes: List[Node], relationships: List[RelationshipStrength]) -> Dict[int, Dict[str, Any]]:
        """
        Build a graph representation from nodes and relationships.
        
        Args:
            nodes: List of node objects
            relationships: List of relationship strength objects
            
        Returns:
            Dictionary with node IDs as keys and node data as values
        """
        graph = {}
        
        # Add all nodes to the graph
        for node in nodes:
            graph[node.id] = {
                "id": node.id,
                "name": node.name,
                "type": node.type,
                "neighbors": {},
                "attributes": node.attributes or {}
            }
        
        # Add relationships as edges
        for rel in relationships:
            source_id = rel.source_id
            target_id = rel.target_id
            
            # Skip if either node is not in our graph
            if source_id not in graph or target_id not in graph:
                continue
            
            # Add bidirectional connections
            graph[source_id]["neighbors"][target_id] = {
                "strength": rel.strength_value,
                "type": rel.relationship_type
            }
            
            graph[target_id]["neighbors"][source_id] = {
                "strength": rel.strength_value,
                "type": rel.relationship_type
            }
        
        return graph
    
    def _cluster_hierarchical(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply hierarchical clustering to the graph.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        if not graph:
            return []
            
        # Create distance matrix
        node_ids = list(graph.keys())
        n = len(node_ids)
        
        # Map node IDs to matrix indices
        id_to_idx = {node_id: i for i, node_id in enumerate(node_ids)}
        
        # Initialize distance matrix with max distances
        distances = np.ones((n, n)) * 2.0  # Max distance is 2 (no connection)
        np.fill_diagonal(distances, 0)  # Zero distance to self
        
        # Fill distances based on relationship strengths
        for i, node_id in enumerate(node_ids):
            for neighbor_id, edge in graph[node_id]["neighbors"].items():
                if neighbor_id in id_to_idx:
                    j = id_to_idx[neighbor_id]
                    # Convert strength to distance (1 - strength)
                    distances[i, j] = 1.0 - edge["strength"]
        
        # Apply hierarchical clustering
        try:
            from scipy.cluster.hierarchy import linkage, fcluster
            
            # Squash distance matrix to condensed form
            condensed_distances = []
            for i in range(n):
                for j in range(i + 1, n):
                    condensed_distances.append(distances[i, j])
            
            # Apply linkage
            Z = linkage(condensed_distances, method='average')
            
            # Determine optimal number of clusters
            max_d = 0.8  # Distance threshold (related to strength threshold)
            clusters = fcluster(Z, max_d, criterion='distance')
            
            # Convert cluster labels to lists of node IDs
            cluster_to_nodes = defaultdict(list)
            for i, cluster_label in enumerate(clusters):
                node_id = node_ids[i]
                cluster_to_nodes[cluster_label].append(node_id)
            
            # Filter small clusters
            return [nodes for nodes in cluster_to_nodes.values() if len(nodes) >= self.min_cluster_size]
        except ImportError:
            logger.warning("SciPy not available, falling back to connected components clustering")
            return self._cluster_connected_components(graph)
    
    def _cluster_connected_components(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply connected components clustering to the graph.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        if not graph:
            return []
        
        # Track visited nodes
        visited = set()
        clusters = []
        
        # Helper function for DFS
        def dfs(node_id, current_cluster):
            visited.add(node_id)
            current_cluster.append(node_id)
            
            for neighbor_id in graph[node_id]["neighbors"]:
                if neighbor_id not in visited:
                    dfs(neighbor_id, current_cluster)
        
        # Find connected components
        for node_id in graph:
            if node_id not in visited:
                current_cluster = []
                dfs(node_id, current_cluster)
                if len(current_cluster) >= self.min_cluster_size:
                    clusters.append(current_cluster)
        
        return clusters
    
    def _cluster_users(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply user-specific clustering.
        
        For users, we focus on collaboration and reporting relationships.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        # Filter graph to only include user nodes
        user_graph = {}
        for node_id, node_data in graph.items():
            if node_data["type"] == "user":
                user_graph[node_id] = node_data
        
        # Apply hierarchical clustering to user nodes
        return self._cluster_hierarchical(user_graph)
    
    def _cluster_teams(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply team-specific clustering.
        
        For teams, we focus on department hierarchy and overlapping team members.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        # Get all teams and their departments
        team_graph = {}
        team_departments = {}
        
        for node_id, node_data in graph.items():
            if node_data["type"] == "team":
                team_graph[node_id] = node_data
                
                # Extract department from attributes if available
                if "department_id" in node_data["attributes"]:
                    team_departments[node_id] = node_data["attributes"]["department_id"]
        
        # Group teams by department first
        dept_clusters = defaultdict(list)
        for team_id, dept_id in team_departments.items():
            dept_clusters[dept_id].append(team_id)
        
        # Create initial clusters from departments
        initial_clusters = [teams for teams in dept_clusters.values() if len(teams) >= self.min_cluster_size]
        
        # For teams without department or in small departments, use hierarchical clustering
        remaining_teams = set(team_graph.keys()) - {team for cluster in initial_clusters for team in cluster}
        if remaining_teams:
            remaining_graph = {node_id: node_data for node_id, node_data in team_graph.items() if node_id in remaining_teams}
            remaining_clusters = self._cluster_hierarchical(remaining_graph)
            initial_clusters.extend(remaining_clusters)
        
        return initial_clusters
    
    def _cluster_projects(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply project-specific clustering.
        
        For projects, we focus on goal alignment and team overlaps.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        # Filter graph to only include project nodes
        project_graph = {}
        for node_id, node_data in graph.items():
            if node_data["type"] == "project":
                project_graph[node_id] = node_data
        
        # For projects, we need to check goal alignment
        clusters = []
        
        # First, try to cluster by goal
        project_goals = defaultdict(list)
        for project_id, project_data in project_graph.items():
            for neighbor_id, edge in project_data["neighbors"].items():
                neighbor = graph.get(neighbor_id)
                if neighbor and neighbor["type"] == "goal" and edge["strength"] > self.strength_threshold:
                    project_goals[neighbor_id].append(project_id)
        
        # Create clusters from goals with enough aligned projects
        goal_clusters = [projects for projects in project_goals.values() if len(projects) >= self.min_cluster_size]
        clusters.extend(goal_clusters)
        
        # For remaining projects, use hierarchical clustering
        clustered_projects = {project for cluster in goal_clusters for project in cluster}
        remaining_projects = set(project_graph.keys()) - clustered_projects
        if remaining_projects:
            remaining_graph = {node_id: node_data for node_id, node_data in project_graph.items() if node_id in remaining_projects}
            remaining_clusters = self._cluster_hierarchical(remaining_graph)
            clusters.extend(remaining_clusters)
        
        return clusters
    
    def _cluster_goals(self, graph: Dict[int, Dict[str, Any]]) -> List[List[int]]:
        """
        Apply goal-specific clustering.
        
        For goals, we focus on hierarchical structure and similarity.
        
        Args:
            graph: Graph representation
            
        Returns:
            List of clusters, each a list of node IDs
        """
        # Filter graph to only include goal nodes
        goal_graph = {}
        for node_id, node_data in graph.items():
            if node_data["type"] == "goal":
                goal_graph[node_id] = node_data
        
        # For goals, we check for parent-child relationships in attributes
        clusters = []
        
        # First, try to cluster by hierarchy
        goal_hierarchies = defaultdict(list)
        for goal_id, goal_data in goal_graph.items():
            if "parent_goal_id" in goal_data["attributes"]:
                parent_id = goal_data["attributes"]["parent_goal_id"]
                goal_hierarchies[parent_id].append(goal_id)
                
        # Include parents in their own hierarchies
        for parent_id in list(goal_hierarchies.keys()):
            if parent_id in goal_graph:
                goal_hierarchies[parent_id].append(parent_id)
        
        # Create clusters from hierarchies
        hierarchy_clusters = [goals for goals in goal_hierarchies.values() if len(goals) >= self.min_cluster_size]
        clusters.extend(hierarchy_clusters)
        
        # For remaining goals, use hierarchical clustering
        clustered_goals = {goal for cluster in hierarchy_clusters for goal in cluster}
        remaining_goals = set(goal_graph.keys()) - clustered_goals
        if remaining_goals:
            remaining_graph = {node_id: node_data for node_id, node_data in goal_graph.items() if node_id in remaining_goals}
            remaining_clusters = self._cluster_hierarchical(remaining_graph)
            clusters.extend(remaining_clusters)
        
        return clusters
    
    def _post_process_clusters(self, clusters: List[List[int]], nodes: List[Node]) -> List[Dict[str, Any]]:
        """
        Post-process raw clusters into structured output.
        
        Args:
            clusters: List of raw clusters (lists of node IDs)
            nodes: List of all node objects
            
        Returns:
            List of processed cluster dictionaries
        """
        # Build node ID to node mapping for quick lookups
        node_map = {node.id: node for node in nodes}
        
        # Process each cluster
        processed_clusters = []
        for i, cluster in enumerate(clusters):
            # Skip empty clusters
            if not cluster:
                continue
                
            # Get node objects for this cluster
            cluster_nodes = [node_map[node_id] for node_id in cluster if node_id in node_map]
            
            # Skip if no valid nodes
            if not cluster_nodes:
                continue
            
            # Determine node type (use most common type in cluster)
            node_types = [node.type for node in cluster_nodes]
            node_type = max(set(node_types), key=node_types.count)
            
            # Generate cluster name based on most central nodes
            central_nodes = self._find_central_nodes(cluster, node_map)
            if central_nodes:
                name = f"{node_type.capitalize()} Cluster: {', '.join(n.name for n in central_nodes[:2])}"
            else:
                name = f"{node_type.capitalize()} Cluster #{i+1}"
            
            # Generate random but stable cluster ID
            import hashlib
            cluster_id = hashlib.md5(f"{self.tenant_id}_{node_type}_{','.join(str(id) for id in sorted(cluster))}".encode()).hexdigest()[:10]
            
            # Build final cluster dictionary
            processed_cluster = {
                "id": cluster_id,
                "name": name,
                "node_type": node_type,
                "members": cluster,
                "size": len(cluster),
                "central_members": [node.id for node in central_nodes],
                "metadata": {
                    "created_at": datetime.utcnow().isoformat(),
                    "algorithm": "hierarchical_clustering",
                    "strength_threshold": self.strength_threshold
                }
            }
            
            processed_clusters.append(processed_cluster)
        
        return processed_clusters
    
    def _find_central_nodes(self, cluster: List[int], node_map: Dict[int, Node], max_nodes: int = 3) -> List[Node]:
        """
        Find the most central nodes in a cluster.
        
        Args:
            cluster: List of node IDs in the cluster
            node_map: Mapping of node IDs to Node objects
            max_nodes: Maximum number of central nodes to return
            
        Returns:
            List of central Node objects
        """
        # Get node objects for this cluster
        cluster_nodes = [node_map[node_id] for node_id in cluster if node_id in node_map]
        
        if not cluster_nodes:
            return []
            
        # For now, use a simple approach - nodes with most relationships
        node_relationships = []
        for node in cluster_nodes:
            rel_count = self.db.query(RelationshipStrength).filter(
                (RelationshipStrength.source_id == node.id) | 
                (RelationshipStrength.target_id == node.id),
                RelationshipStrength.tenant_id == self.tenant_id
            ).count()
            node_relationships.append((node, rel_count))
        
        # Sort by relationship count
        node_relationships.sort(key=lambda x: x[1], reverse=True)
        
        return [node for node, _ in node_relationships[:max_nodes]]
    
    def _build_node_to_cluster_mapping(self) -> None:
        """Build a mapping of node IDs to their clusters."""
        self._node_to_cluster = {}
        for cluster in self._clusters:
            for node_id in cluster.get("members", []):
                self._node_to_cluster[node_id] = cluster