import logging
from collections import defaultdict
from typing import List, Dict, Set, Tuple, Optional, Union, Any
from uuid import UUID
import re
import json
from datetime import datetime, timedelta
import networkx as nx
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
import random  # For mock data generation

from app.crud.crud_project import project as crud_project
from app.crud.crud_user import user as crud_user
from app.crud.crud_team import team as crud_team
from app.crud.crud_goal import goal as crud_goal
from app.crud.crud_edge import edge as crud_edge
from app.crud.crud_node import node as crud_node
from app import models

logger = logging.getLogger(__name__)

# Simple list of common English stop words - can be expanded
STOP_WORDS = set([
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "as", 
    "is", "am", "are", "was", "were", "be", "being", "been",
    "and", "or", "but", "if", "so", "than", "this", "that", "these", "those",
    "it", "its", "i", "me", "my", "mine", "you", "your", "yours", 
    "he", "him", "his", "she", "her", "hers", "we", "us", "our", "ours", 
    "they", "them", "their", "theirs", "what", "which", "who", "whom", 
    "about", "above", "below", "from", "up", "down", "out", "over", "under", 
    "again", "further", "then", "once", "here", "there", "when", "where", 
    "why", "how", "all", "any", "both", "each", "few", "more", "most", 
    "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
    "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", 
    "should", "now", "project", "goal", "research", "development", "study"
])

# Redis client mock for caching
class RedisCacheMock:
    def __init__(self):
        self.cache = {}
    
    async def get(self, key: str) -> Optional[str]:
        return self.cache.get(key)
    
    async def set(self, key: str, value: str, expire: int = 3600) -> None:
        self.cache[key] = value
        
    async def delete(self, key: str) -> None:
        if key in self.cache:
            del self.cache[key]

# Singleton cache instance
cache = RedisCacheMock()

class InsightService:
    def _extract_keywords(self, text: str | None) -> Set[str]:
        """Extracts simple keywords from text: lowercases, splits, removes stop words."""
        if not text:
            return set()
        # Remove punctuation, make lowercase
        cleaned_text = re.sub(r'[^\w\s]', '', text.lower())
        # Split into words, filter stop words and short words
        words = {word for word in cleaned_text.split() if word not in STOP_WORDS and len(word) > 2}
        return words

    async def find_project_overlaps(
        self, db: AsyncSession, tenant_id: UUID, min_overlap_keywords: int = 3
    ) -> Dict[UUID, List[UUID]]:
        """Finds potentially overlapping projects based on keyword matches in descriptions."""
        
        # Try to get from cache first
        cache_key = f"project_overlaps:{tenant_id}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            try:
                return json.loads(cached_result)
            except:
                logger.warning(f"Failed to parse cached project overlaps for tenant {tenant_id}")
        
        overlaps: Dict[UUID, List[UUID]] = defaultdict(list)
        projects: List[models.Project] = await crud_project.get_multi_by_tenant(db=db, tenant_id=tenant_id, limit=1000) # Fetch all for now
        
        if len(projects) < 2:
            return {}

        # Extract keywords for all projects first
        project_keywords: Dict[UUID, Set[str]] = {
            p.id: self._extract_keywords(p.description) for p in projects
        }

        # Compare all pairs of projects
        project_ids = [p.id for p in projects]
        for i in range(len(project_ids)):
            for j in range(i + 1, len(project_ids)):
                proj_id_1 = project_ids[i]
                proj_id_2 = project_ids[j]

                keywords1 = project_keywords.get(proj_id_1, set())
                keywords2 = project_keywords.get(proj_id_2, set())

                if not keywords1 or not keywords2:
                    continue

                common_keywords = keywords1.intersection(keywords2)
                
                if len(common_keywords) >= min_overlap_keywords:
                    logger.debug(f"Found overlap between {proj_id_1} and {proj_id_2} (Keywords: {common_keywords})")
                    overlaps[str(proj_id_1)].append(str(proj_id_2))
                    overlaps[str(proj_id_2)].append(str(proj_id_1))
        
        logger.info(f"Found {len(overlaps)} projects with potential overlaps for tenant {tenant_id}.")
        result = dict(overlaps)
        
        # Cache the results (stringify UUIDs for JSON serialization)
        await cache.set(cache_key, json.dumps(result), expire=3600)  # 1 hour cache
        
        return result

    async def calculate_network_metrics(
        self, db: AsyncSession, tenant_id: UUID, include_historical: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate network metrics for the organization graph.
        
        Args:
            db: Database session
            tenant_id: Tenant ID to filter data
            include_historical: Whether to include historical data
            
        Returns:
            Dictionary with network metrics
        """
        # Try to get from cache first
        cache_key = f"network_metrics:{tenant_id}:{include_historical}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            try:
                return json.loads(cached_result)
            except:
                logger.warning(f"Failed to parse cached network metrics for tenant {tenant_id}")
        
        try:
            # Get all nodes and edges for the tenant
            nodes = await crud_node.get_multi_by_tenant(db=db, tenant_id=tenant_id)
            edges = await crud_edge.get_multi_by_tenant(db=db, tenant_id=tenant_id)
            
            # Build a NetworkX graph
            G = nx.Graph()
            
            # Add nodes
            for node_obj in nodes:
                G.add_node(node_obj.id, type=node_obj.type, label=node_obj.label)
                
            # Add edges
            for edge_obj in edges:
                G.add_edge(edge_obj.source_id, edge_obj.target_id, type=edge_obj.type)
            
            # If we have a very small graph, return basic metrics
            if len(G.nodes) < 5:
                results = {
                    "node_count": len(G.nodes),
                    "edge_count": len(G.edges),
                    "density": 0.0,
                    "clustering": 0.0,
                    "connected_components": 1,
                    "avg_shortest_path": 0.0,
                }
                
                if include_historical:
                    # Mockup historical data for demonstration
                    results["historical"] = self._generate_mock_historical_data()
                    
                await cache.set(cache_key, json.dumps(results), expire=3600)
                return results
            
            # Calculate basic metrics
            results = {
                "node_count": len(G.nodes),
                "edge_count": len(G.edges),
                "density": nx.density(G),
                "clustering": nx.average_clustering(G),
                "connected_components": nx.number_connected_components(G),
                "degree_centrality": {str(k): v for k, v in nx.degree_centrality(G).items()},
                "betweenness_centrality": {},  # Commented out for demo: {str(k): float(v) for k, v in nx.betweenness_centrality(G).items()},
                "communities": []
            }
            
            # Calculate communities
            try:
                communities_generator = nx.community.louvain_communities(G)
                communities = list(communities_generator)
                results["communities"] = [
                    {
                        "id": f"cluster-{i}",
                        "size": len(community),
                        "nodes": [str(node_id) for node_id in community]
                    }
                    for i, community in enumerate(communities)
                ]
                
                # Calculate modularity
                results["modularity"] = nx.community.modularity(G, communities)
            except Exception as e:
                logger.error(f"Error calculating communities: {e}")
                results["communities"] = []
                results["modularity"] = 0.0
            
            # Try to calculate avg_shortest_path for connected components
            try:
                # Get largest connected component
                largest_cc = max(nx.connected_components(G), key=len)
                largest_cc_graph = G.subgraph(largest_cc)
                
                # Calculate average shortest path length in the largest connected component
                results["avg_shortest_path"] = nx.average_shortest_path_length(largest_cc_graph)
            except Exception as e:
                logger.error(f"Error calculating average shortest path: {e}")
                results["avg_shortest_path"] = 0.0
                
            # Include historical data if requested
            if include_historical:
                results["historical"] = self._generate_mock_historical_data()
            
            # Cache the results
            await cache.set(cache_key, json.dumps(results), expire=3600)  # 1 hour cache
            
            return results
        except Exception as e:
            logger.error(f"Error calculating network metrics: {e}")
            return {
                "error": "Failed to calculate network metrics",
                "node_count": 0,
                "edge_count": 0
            }

    async def get_metric_timeseries(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        metric_type: str,
        start_date: str,
        end_date: str,
        interval: str = "daily"
    ) -> List[Dict[str, Any]]:
        """
        Get time series data for a specific metric.
        
        For the initial implementation, returns mock data.
        """
        # Try to get from cache first
        cache_key = f"timeseries:{tenant_id}:{metric_type}:{start_date}:{end_date}:{interval}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            try:
                return json.loads(cached_result)
            except:
                logger.warning(f"Failed to parse cached timeseries for tenant {tenant_id}")
                
        # Parse dates
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        except ValueError:
            logger.error(f"Invalid date format: {start_date} or {end_date}")
            return []
            
        # Generate mock time series data
        data = self._generate_mock_timeseries(metric_type, start, end, interval)
        
        # Cache the results
        await cache.set(cache_key, json.dumps(data), expire=3600)  # 1 hour cache
        
        return data

    async def generate_heatmap_data(
        self,
        db: AsyncSession,
        tenant_id: UUID,
        entity_type: str,
        metric: str
    ) -> List[Dict[str, Any]]:
        """
        Generate heatmap data for visualization.
        
        For initial implementation, returns mock data.
        """
        # Try to get from cache first
        cache_key = f"heatmap:{tenant_id}:{entity_type}:{metric}"
        cached_result = await cache.get(cache_key)
        if cached_result:
            try:
                return json.loads(cached_result)
            except:
                logger.warning(f"Failed to parse cached heatmap for tenant {tenant_id}")
                
        # Generate mock heatmap data
        if entity_type == "team":
            data = self._generate_mock_team_heatmap(metric)
        elif entity_type == "user":
            data = self._generate_mock_user_heatmap(metric)
        else:
            data = self._generate_mock_generic_heatmap(entity_type, metric)
        
        # Cache the results
        await cache.set(cache_key, json.dumps(data), expire=3600)  # 1 hour cache
        
        return data

    def _generate_mock_historical_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """Generate mock historical data for demonstrations"""
        now = datetime.now()
        days = 30
        
        density_data = []
        clustering_data = []
        component_data = []
        
        # Start with reasonable base values
        base_density = 0.35
        base_clustering = 0.55
        base_components = 3
        
        # Add some trend and randomness
        for i in range(days):
            date = now - timedelta(days=days-i-1)
            date_str = date.strftime("%Y-%m-%d")
            
            # Add slight upward trend with noise
            trend_factor = i / (days * 2)  # Maxes out at 0.5 increase
            random_factor = random.uniform(-0.05, 0.05)
            
            density_data.append({
                "date": date_str,
                "value": base_density + trend_factor + random_factor
            })
            
            clustering_data.append({
                "date": date_str,
                "value": base_clustering + trend_factor + random_factor
            })
            
            # Integer values for components with occasional changes
            if i % 5 == 0 and random.random() > 0.7:
                base_components += random.choice([-1, 1])
                base_components = max(1, base_components)  # Ensure minimum of 1 component
                
            component_data.append({
                "date": date_str,
                "value": base_components
            })
        
        return {
            "density": density_data,
            "clustering": clustering_data,
            "components": component_data
        }

    def _generate_mock_timeseries(
        self, 
        metric_type: str, 
        start: datetime,
        end: datetime,
        interval: str
    ) -> List[Dict[str, Any]]:
        """Generate mock time series data for the specified metric"""
        result = []
        
        # Determine interval in days
        interval_days = 1  # default daily
        if interval == "weekly":
            interval_days = 7
        elif interval == "monthly":
            interval_days = 30
        elif interval == "hourly":
            # For hourly, we'll use a fraction of a day
            interval_days = 1/24
        
        # Base values for different metrics
        base_values = {
            "density": 0.35,
            "clustering": 0.55,
            "centralization": 0.42,
            "components": 3,
            "modularity": 0.65,
            "activity": 75
        }
        
        # Trend factors
        trend_factors = {
            "density": 0.001,
            "clustering": 0.002,
            "centralization": -0.0005,
            "components": 0,
            "modularity": 0.0015,
            "activity": 0.5
        }
        
        # Volatility factors (randomness)
        volatility = {
            "density": 0.05,
            "clustering": 0.08,
            "centralization": 0.06,
            "components": 1,
            "modularity": 0.04,
            "activity": 15
        }
        
        # Default to density if metric type not specified
        if metric_type not in base_values:
            metric_type = "density"
            
        # Generate data points
        current_date = start
        day_count = 0
        while current_date <= end:
            # Calculate value with trend and randomness
            trend = trend_factors.get(metric_type, 0) * day_count
            random_factor = random.uniform(-volatility.get(metric_type, 0.05), 
                                          volatility.get(metric_type, 0.05))
            
            value = base_values.get(metric_type, 0.5) + trend + random_factor
            
            # Ensure reasonable values
            if metric_type in ["density", "clustering", "centralization", "modularity"]:
                value = max(0.01, min(0.99, value))  # Between 0.01 and 0.99
            elif metric_type == "components":
                value = max(1, round(value))  # At least 1 component, rounded to integer
            elif metric_type == "activity":
                value = max(0, round(value))  # Non-negative integer
                
            result.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "value": value
            })
            
            # Move to next interval
            current_date += timedelta(days=interval_days)
            day_count += interval_days
            
        return result

    def _generate_mock_team_heatmap(self, metric: str) -> List[Dict[str, Any]]:
        """Generate mock heatmap data for team relationships"""
        teams = [
            "Research Team", "Development Team", "Product Team", 
            "Marketing Team", "Sales Team", "Support Team"
        ]
        
        result = []
        
        for i, team1 in enumerate(teams):
            for j, team2 in enumerate(teams):
                # Skip self-connections
                if i == j:
                    continue
                    
                # For collaboration metric
                if metric == "collaboration":
                    # More collaboration between adjacent teams
                    base_value = 0.7 if abs(i - j) == 1 else 0.3
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.2, 0.2)))
                
                # For overlap metric
                elif metric == "overlap":
                    # More overlap between teams with similar roles
                    is_similar = (
                        (i < 3 and j < 3) or  # Both are technical teams
                        (i >= 3 and j >= 3)    # Both are customer-facing teams
                    )
                    base_value = 0.6 if is_similar else 0.2
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.2, 0.2)))
                    
                # Default to connections metric
                else:
                    # Basic connection strength
                    base_value = 0.5
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.3, 0.3)))
                
                result.append({
                    "x": team1,
                    "y": team2,
                    "value": value
                })
                
        return result

    def _generate_mock_user_heatmap(self, metric: str) -> List[Dict[str, Any]]:
        """Generate mock heatmap data for user relationships"""
        users = [
            "John Doe", "Jane Smith", "Mike Johnson", 
            "Lisa Brown", "David Lee", "Sarah Wilson"
        ]
        
        result = []
        
        for i, user1 in enumerate(users):
            for j, user2 in enumerate(users):
                # Skip self-connections
                if i == j:
                    continue
                    
                # For communication metric
                if metric == "communication":
                    # More communication between users with similar indices
                    is_team = (
                        (i < 3 and j < 3) or  # Both in first team
                        (i >= 3 and j >= 3)    # Both in second team
                    )
                    base_value = 0.7 if is_team else 0.2
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.2, 0.2)))
                
                # For knowledge sharing metric
                elif metric == "knowledge_sharing":
                    # Knowledge sharing is stronger between adjacent users
                    base_value = 0.8 if abs(i - j) == 1 else 0.4
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.3, 0.3)))
                    
                # Default to connections metric
                else:
                    # Basic connection strength
                    base_value = 0.5
                    value = max(0.1, min(0.9, base_value + random.uniform(-0.4, 0.4)))
                
                result.append({
                    "x": user1,
                    "y": user2,
                    "value": value
                })
                
        return result

    def _generate_mock_generic_heatmap(self, entity_type: str, metric: str) -> List[Dict[str, Any]]:
        """Generate mock heatmap data for generic entity relationships"""
        # Create 5 generic entities
        entities = [f"{entity_type.capitalize()} {i+1}" for i in range(5)]
        
        result = []
        
        for i, entity1 in enumerate(entities):
            for j, entity2 in enumerate(entities):
                # Skip self-connections
                if i == j:
                    continue
                
                # Generate a value between 0.1 and 0.9
                value = max(0.1, min(0.9, 0.5 + random.uniform(-0.4, 0.4)))
                
                result.append({
                    "x": entity1,
                    "y": entity2,
                    "value": value
                })
                
        return result

# Singleton instance
insight_service = InsightService() 