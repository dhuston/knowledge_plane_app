"""
Automated performance testing for the Biosphere Alpha API endpoints using Locust.

The tests focus on the map-related API endpoints which are critical for the application's 
performance and user experience.

Usage:
    Run with: locust -f locustfile.py

Configuration:
    - Edit the API_BASE_URL to match your testing environment
    - Update the test data generation in setup() if needed
    - Adjust the WAIT_TIME_* constants to simulate different user behaviors
"""

import json
import random
import time
import uuid
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple, Any

from locust import HttpUser, TaskSet, between, tag, task, events


# Configuration
API_BASE_URL = "/api/v1"
WAIT_TIME_MIN = 1.0  # Minimum wait time between tasks in seconds
WAIT_TIME_MAX = 3.0  # Maximum wait time between tasks in seconds

# Store performance metrics for reporting
performance_data = defaultdict(list)

# Custom event handlers to collect stats
@events.request.add_listener
def request_success_handler(request_type, name, response_time, response_length, **kwargs):
    performance_data[name].append({
        "response_time": response_time,
        "response_length": response_length,
        "status_code": kwargs.get("response", {}).status_code
    })

class BaseApiUser(HttpUser):
    """Base user class with common functionality for API testing."""
    
    abstract = True
    wait_time = between(WAIT_TIME_MIN, WAIT_TIME_MAX)
    
    # Store authentication token and user info
    token: Optional[str] = None
    user_id: Optional[str] = None
    team_id: Optional[str] = None
    
    # Store map data for more realistic interactions
    known_nodes: Dict[str, List[str]] = {
        "user": [],
        "team": [],
        "project": [],
        "goal": []
    }
    
    def on_start(self):
        """Setup before starting the tests."""
        self.login()
        self.setup()
    
    def login(self):
        """Authenticate with the API."""
        # Get authentication token
        with self.client.post(
            f"{API_BASE_URL}/auth/login", 
            json={
                "username": "test@example.com", 
                "password": "password123"
            },
            catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                # Set default authorization header for all future requests
                self.client.headers.update({
                    "Authorization": f"Bearer {self.token}"
                })
                
                # Fetch user info to have realistic IDs
                self._get_current_user()
                response.success()
            else:
                response.failure(f"Login failed with status code {response.status_code}")
    
    def _get_current_user(self):
        """Get the current user details."""
        if not self.token:
            return
        
        with self.client.get(
            f"{API_BASE_URL}/users/me", 
            name="/users/me",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                user_data = response.json()
                self.user_id = user_data.get("id")
                self.team_id = user_data.get("team_id")
                response.success()
            else:
                response.failure(f"Failed to get current user: {response.status_code}")
    
    def setup(self):
        """Initialize test data and state for the user instance."""
        # Store viewport coordinates for spatial queries
        self.viewports = [
            {"x": 0, "y": 0, "ratio": 1.0},  # Center view
            {"x": 100, "y": 100, "ratio": 0.5},  # Zoomed in
            {"x": -100, "y": -100, "ratio": 2.0},  # Zoomed out
            {"x": 500, "y": 500, "ratio": 1.0},  # Far from center
        ]
        
        # Fetch initial entity IDs to use in tests if needed
        self._fetch_entity_ids()
    
    def _fetch_entity_ids(self):
        """
        Fetch entity IDs for more realistic tests
        This runs only if known_nodes are empty
        """
        # Only run if we don't already have data
        has_data = any(len(nodes) > 0 for nodes in self.known_nodes.values())
        if has_data:
            return

        try:
            # Get users if needed
            if not self.known_nodes["user"] and self.user_id:
                self.known_nodes["user"].append(self.user_id)
                
            # Get teams if needed
            if not self.known_nodes["team"] and self.team_id:
                self.known_nodes["team"].append(self.team_id)
                
            # Try to get default map data to populate known nodes
            with self.client.get(
                f"{API_BASE_URL}/map/data", 
                name="/map/data (setup)",
                catch_response=True
            ) as response:
                if response.status_code == 200:
                    self._track_map_nodes(response.json())
                    response.success()
                else:
                    response.failure(f"Failed to fetch initial map data: {response.status_code}")
        
        except Exception as e:
            print(f"Error fetching entity IDs: {str(e)}")
    
    def _track_map_nodes(self, data):
        """
        Track node IDs from map data responses for more realistic navigation
        """
        if not data or not isinstance(data, dict):
            return
            
        nodes = data.get("nodes", [])
        for node in nodes:
            if "id" in node and "type" in node:
                node_type = node["type"].lower()
                if node_type in self.known_nodes:
                    if node["id"] not in self.known_nodes[node_type]:
                        self.known_nodes[node_type].append(node["id"])
    
    def _get_random_node_id(self, node_type=None):
        """
        Get a random known node ID, optionally filtered by type
        """
        if node_type and node_type in self.known_nodes and self.known_nodes[node_type]:
            return random.choice(self.known_nodes[node_type])
        
        # Get any node type if specific type not specified or no nodes of that type
        all_nodes = []
        for node_list in self.known_nodes.values():
            all_nodes.extend(node_list)
        
        if all_nodes:
            return random.choice(all_nodes)
        
        # Return user's ID as fallback
        return self.user_id


class MapApiUser(BaseApiUser):
    """User class focused on testing map-related API endpoints."""
    
    @task(3)
    def get_default_map(self):
        """Get the default map view (centered on current user)"""
        with self.client.get(
            f"{API_BASE_URL}/map/data", 
            name="/map/data (default view)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch map data: {response.status_code}")
    
    @task(2)
    def get_filtered_map_by_type(self):
        """Get map filtered by entity types"""
        # Select random entity types to include
        entity_types = random.sample(["USER", "TEAM", "PROJECT", "GOAL"], k=random.randint(1, 3))
        types_param = ",".join(entity_types)
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?types={types_param}", 
            name="/map/data (filtered by types)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch filtered map data: {response.status_code}")
    
    @task(2)
    def get_filtered_map_by_status(self):
        """Get map filtered by status (for projects/goals)"""
        statuses = random.sample(["active", "planning", "completed", "on_hold"], k=random.randint(1, 2))
        statuses_param = ",".join(statuses)
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?statuses={statuses_param}", 
            name="/map/data (filtered by status)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch status-filtered map data: {response.status_code}")
    
    @task(3)
    def get_centered_map(self):
        """Get map centered on a specific entity"""
        # Select a random entity ID to center on
        center_id = self._get_random_node_id()
        if not center_id:
            return
            
        depth = random.choice([1, 2])  # Test both depth levels
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?center_node_id={center_id}&depth={depth}", 
            name=f"/map/data (centered, depth={depth})", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch centered map data: {response.status_code}")
    
    @task(2)
    def get_spatial_map(self):
        """Get map using spatial queries"""
        viewport = random.choice(self.viewports)
        radius = random.choice([50, 100, 200, 500])
        
        params = {
            "use_spatial": "true",
            "view_x": viewport["x"],
            "view_y": viewport["y"],
            "view_ratio": viewport["ratio"],
            "radius": radius
        }
        
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?{query_string}", 
            name="/map/data (spatial query)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch spatial map data: {response.status_code}")
    
    @task(1)
    def get_paginated_map(self):
        """Test pagination of map data"""
        # Test different page sizes and page numbers
        page = random.randint(1, 3)
        limit = random.choice([10, 50, 100, 200])
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?page={page}&limit={limit}", 
            name=f"/map/data (pagination, page={page}, limit={limit})", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                data = response.json()
                # Check if pagination metadata is present
                if "pagination" not in data:
                    response.failure("Pagination metadata not found in response")
                else:
                    response.success()
            else:
                response.failure(f"Failed to fetch paginated map data: {response.status_code}")
    
    @task(2)
    def get_clustered_map(self):
        """Test team clustering feature"""
        with self.client.get(
            f"{API_BASE_URL}/map/data?cluster_teams=true", 
            name="/map/data (team clustering)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch clustered map data: {response.status_code}")
                
    @task(1)
    def get_complex_map_query(self):
        """Test complex map query with multiple parameters"""
        # Combine multiple filtering and querying options
        entity_types = random.sample(["USER", "TEAM", "PROJECT", "GOAL"], k=random.randint(1, 3))
        statuses = random.sample(["active", "planning", "completed"], k=random.randint(1, 2))
        viewport = random.choice(self.viewports)
        
        params = {
            "types": ",".join(entity_types),
            "statuses": ",".join(statuses),
            "view_x": viewport["x"],
            "view_y": viewport["y"],
            "view_ratio": viewport["ratio"],
            "cluster_teams": random.choice(["true", "false"]),
            "page": random.randint(1, 2),
            "limit": random.choice([50, 100])
        }
        
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?{query_string}", 
            name="/map/data (complex query)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to fetch complex map data: {response.status_code}")


class EntityApiUser(BaseApiUser):
    """User class for testing entity-related API endpoints."""
    
    @task(2)
    def get_user_details(self):
        """Get details for a random user."""
        # Use current user if we don't know any other users
        if not self.known_nodes["user"] and self.user_id:
            user_id = self.user_id
        elif self.known_nodes["user"]:
            user_id = random.choice(self.known_nodes["user"])
        else:
            return
            
        with self.client.get(
            f"{API_BASE_URL}/users/{user_id}", 
            name="/users/{id}", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to fetch user details: {response.status_code}")
    
    @task(2)
    def get_team_details(self):
        """Get details for a random team."""
        # Use current user's team if we don't know any other teams
        if not self.known_nodes["team"] and self.team_id:
            team_id = self.team_id
        elif self.known_nodes["team"]:
            team_id = random.choice(self.known_nodes["team"])
        else:
            return
        
        with self.client.get(
            f"{API_BASE_URL}/teams/{team_id}", 
            name="/teams/{id}", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to fetch team details: {response.status_code}")
    
    @task(2)
    def get_project_details(self):
        """Get details for a random project."""
        if not self.known_nodes["project"]:
            return
            
        project_id = random.choice(self.known_nodes["project"])
        with self.client.get(
            f"{API_BASE_URL}/projects/{project_id}", 
            name="/projects/{id}", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to fetch project details: {response.status_code}")
    
    @task(2)
    def get_goal_details(self):
        """Get details for a random goal."""
        if not self.known_nodes["goal"]:
            return
            
        goal_id = random.choice(self.known_nodes["goal"])
        with self.client.get(
            f"{API_BASE_URL}/goals/{goal_id}", 
            name="/goals/{id}", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Failed to fetch goal details: {response.status_code}")
    
    @task(1)
    def get_users_list(self):
        """Get paginated list of users."""
        page = random.randint(1, 3)
        limit = random.choice([10, 25, 50])
        with self.client.get(
            f"{API_BASE_URL}/users?page={page}&limit={limit}", 
            name="/users (list)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                # Extract user IDs from response to use in further requests
                data = response.json()
                if "items" in data and isinstance(data["items"], list):
                    for user in data["items"]:
                        if "id" in user and user["id"] not in self.known_nodes["user"]:
                            self.known_nodes["user"].append(user["id"])
                response.success()
            else:
                response.failure(f"Failed to fetch users list: {response.status_code}")
    
    @task(1)
    def get_teams_list(self):
        """Get paginated list of teams."""
        page = random.randint(1, 2)
        limit = random.choice([10, 25])
        with self.client.get(
            f"{API_BASE_URL}/teams?page={page}&limit={limit}", 
            name="/teams (list)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                # Extract team IDs from response to use in further requests
                data = response.json()
                if "items" in data and isinstance(data["items"], list):
                    for team in data["items"]:
                        if "id" in team and team["id"] not in self.known_nodes["team"]:
                            self.known_nodes["team"].append(team["id"])
                response.success()
            else:
                response.failure(f"Failed to fetch teams list: {response.status_code}")


class CombinedApiUser(BaseApiUser):
    """User class that combines multiple API test patterns."""
    
    @task(10)
    def map_api_tasks(self):
        """Execute map-related API tasks."""
        map_task = MapApiUser(self.environment)
        map_task.client = self.client
        map_task.known_nodes = self.known_nodes  # Share known nodes
        map_task.user_id = self.user_id
        map_task.team_id = self.team_id
        map_task.token = self.token
        map_task.viewports = self.viewports
        
        # Run a random map task
        task_method = random.choice([
            map_task.get_default_map,
            map_task.get_filtered_map_by_type,
            map_task.get_filtered_map_by_status,
            map_task.get_centered_map,
            map_task.get_spatial_map,
            map_task.get_paginated_map,
            map_task.get_clustered_map
        ])
        task_method()
    
    @task(5)
    def entity_api_tasks(self):
        """Execute entity-related API tasks."""
        entity_task = EntityApiUser(self.environment)
        entity_task.client = self.client
        entity_task.known_nodes = self.known_nodes  # Share known nodes
        entity_task.user_id = self.user_id
        entity_task.team_id = self.team_id
        entity_task.token = self.token
        
        # Run a random entity task
        task_method = random.choice([
            entity_task.get_user_details,
            entity_task.get_team_details,
            entity_task.get_project_details,
            entity_task.get_goal_details,
            entity_task.get_users_list,
            entity_task.get_teams_list
        ])
        task_method()
    
    @task(1)
    def simulate_page_load(self):
        """Simulate a typical page load sequence."""
        # 1. Get current user info
        with self.client.get(
            f"{API_BASE_URL}/users/me", 
            name="/users/me (page load)", 
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get user info: {response.status_code}")
                return
                
            user_data = response.json()
            user_id = user_data.get("id")
            self.user_id = user_id
            self.team_id = user_data.get("team_id")
            response.success()
            
        # 2. Get default map view
        with self.client.get(
            f"{API_BASE_URL}/map/data", 
            name="/map/data (page load)", 
            catch_response=True
        ) as response:
            if response.status_code != 200:
                response.failure(f"Failed to get map data: {response.status_code}")
                return
            
            self._track_map_nodes(response.json())
            response.success()
                
        # 3. Get user's teams if possible
        if user_id:
            with self.client.get(
                f"{API_BASE_URL}/users/{user_id}/teams", 
                name="/users/{id}/teams (page load)", 
                catch_response=True
            ) as response:
                # Some endpoints may not exist - don't fail the whole sequence
                response.success() if response.status_code == 200 else response.failure()
                    
        # 4. Get notifications count (simulated) 
        with self.client.get(
            f"{API_BASE_URL}/notifications/count", 
            name="/notifications/count (page load)", 
            catch_response=True
        ) as response:
            # Some endpoints may not exist - don't fail the whole sequence
            response.success() if response.status_code == 200 else response.failure()


# Define a realistic mix of operations that simulates user behavior
class RealisticUserBehavior(BaseApiUser):
    """
    User class that simulates realistic user behavior with a proper mix
    of different API operations.
    """
    
    # Initial map load
    @task(10)
    def initial_map_load(self):
        """First map load when a user accesses the application."""
        with self.client.get(
            f"{API_BASE_URL}/map/data", 
            name="/map/data (initial load)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
                
                # Follow up with a focused entity view based on the initial map
                if self.known_nodes["user"] or self.known_nodes["team"]:
                    entity_type = random.choice(["user", "team"]) 
                    if self.known_nodes[entity_type]:
                        entity_id = random.choice(self.known_nodes[entity_type])
                        
                        # Get entity details
                        entity_path = "users" if entity_type == "user" else "teams"
                        with self.client.get(
                            f"{API_BASE_URL}/{entity_path}/{entity_id}", 
                            name=f"/{entity_path}/{{id}} (after map)", 
                            catch_response=True
                        ) as entity_response:
                            entity_response.success() if entity_response.status_code == 200 else entity_response.failure()
            else:
                response.failure(f"Failed to fetch initial map: {response.status_code}")
    
    # Map interactions - panning and zooming
    @task(7)
    def pan_and_zoom(self):
        """Simulate user panning and zooming in the map."""
        viewport = random.choice(self.viewports)
        view_x = viewport["x"] + random.uniform(-200, 200)  # Add some randomness for panning
        view_y = viewport["y"] + random.uniform(-200, 200)
        view_ratio = viewport["ratio"] * random.uniform(0.8, 1.2)  # Vary zoom level
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?view_x={view_x}&view_y={view_y}&view_ratio={view_ratio}&use_spatial=true", 
            name="/map/data (pan and zoom)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed during pan/zoom: {response.status_code}")
    
    # Clicking on a node to center view
    @task(5)
    def select_map_node(self):
        """Simulate clicking on a node in the map."""
        center_id = self._get_random_node_id()
        if not center_id:
            return
            
        with self.client.get(
            f"{API_BASE_URL}/map/data?center_node_id={center_id}&depth=1", 
            name="/map/data (node selection)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
                
                # Get entity details after selecting node (realistic user flow)
                for node in response.json().get("nodes", []):
                    if node.get("id") == center_id:
                        node_type = node.get("type", "").lower()
                        if node_type in ["user", "team", "project", "goal"]:
                            entity_path = f"{node_type}s"  # Pluralize for API path
                            
                            with self.client.get(
                                f"{API_BASE_URL}/{entity_path}/{center_id}", 
                                name=f"/{entity_path}/{{id}} (after selection)", 
                                catch_response=True
                            ) as details_response:
                                details_response.success() if details_response.status_code == 200 else details_response.failure()
                            break
            else:
                response.failure(f"Failed to center on node: {response.status_code}")
    
    # Filtering the map
    @task(3)
    def filter_map_view(self):
        """Simulate applying filters to the map view."""
        # Apply both type and status filters
        entity_types = random.sample(["USER", "TEAM", "PROJECT", "GOAL"], k=random.randint(1, 3))
        statuses = random.sample(["active", "planning", "completed"], k=random.randint(1, 2))
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?types={','.join(entity_types)}&statuses={','.join(statuses)}", 
            name="/map/data (filtered view)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
            else:
                response.failure(f"Failed to apply filters: {response.status_code}")
    
    # View profile or entity details
    @task(2)
    def view_entity_details(self):
        """Simulate viewing detailed information about an entity."""
        # Choose a random entity type that we know about
        available_types = [t for t in ["user", "team", "project", "goal"] if self.known_nodes[t]]
        if not available_types:
            if self.user_id:
                with self.client.get(
                    f"{API_BASE_URL}/users/{self.user_id}", 
                    name="/users/{id} (profile view)", 
                    catch_response=True
                ) as response:
                    response.success() if response.status_code == 200 else response.failure()
            return
            
        entity_type = random.choice(available_types)
        entity_id = random.choice(self.known_nodes[entity_type])
        entity_path = f"{entity_type}s"  # Pluralize
        
        with self.client.get(
            f"{API_BASE_URL}/{entity_path}/{entity_id}", 
            name=f"/{entity_path}/{{id}} (details view)", 
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
                
                # Follow up with related entities request
                related_endpoints = {
                    "user": ["teams", "projects"],
                    "team": ["members", "projects"],
                    "project": ["participants", "goal"],
                    "goal": ["projects"]
                }
                
                if entity_type in related_endpoints:
                    related_type = random.choice(related_endpoints[entity_type])
                    with self.client.get(
                        f"{API_BASE_URL}/{entity_path}/{entity_id}/{related_type}", 
                        name=f"/{entity_path}/{{id}}/{related_type}", 
                        catch_response=True
                    ) as related_response:
                        # This might return 404 if endpoint doesn't exist
                        related_response.success() if related_response.status_code == 200 else related_response.failure()
            else:
                response.failure(f"Failed to get entity details: {response.status_code}")


class PerformanceTestUser(BaseApiUser):
    """
    User class specifically focused on running performance tests against 
    critical endpoints with varying parameters to help identify bottlenecks.
    """
    
    @task(1)
    def profile_map_size_impact(self):
        """Test impact of result set size on map endpoint performance."""
        # Test different limit sizes
        for limit_size in [10, 50, 100, 200, 500]:
            with self.client.get(
                f"{API_BASE_URL}/map/data?limit={limit_size}", 
                name=f"/map/data (size impact, limit={limit_size})", 
                catch_response=True
            ) as response:
                start_time = time.time()
                if response.status_code == 200:
                    data = response.json()
                    nodes_count = len(data.get("nodes", []))
                    edges_count = len(data.get("edges", []))
                    response_time = time.time() - start_time
                    
                    # Log size and timing information
                    print(f"Map size test: limit={limit_size}, nodes={nodes_count}, edges={edges_count}, time={response_time:.4f}s")
                    
                    if response_time > 2.0:  # Flag slow responses
                        response.failure(f"Response too slow: {response_time:.4f}s")
                    else:
                        response.success()
                else:
                    response.failure(f"Request failed: {response.status_code}")
    
    @task(1)
    def profile_depth_impact(self):
        """Test the impact of relationship depth on performance."""
        # Find a node to center on
        center_id = self._get_random_node_id()
        if not center_id:
            return
            
        # Test both depth levels
        for depth in [1, 2]:
            with self.client.get(
                f"{API_BASE_URL}/map/data?center_node_id={center_id}&depth={depth}", 
                name=f"/map/data (depth impact, depth={depth})", 
                catch_response=True
            ) as response:
                start_time = time.time()
                if response.status_code == 200:
                    data = response.json()
                    nodes_count = len(data.get("nodes", []))
                    edges_count = len(data.get("edges", []))
                    response_time = time.time() - start_time
                    
                    # Log depth impact
                    print(f"Depth impact test: depth={depth}, nodes={nodes_count}, edges={edges_count}, time={response_time:.4f}s")
                    
                    if depth == 2 and response_time > 3.0:  # Depth 2 is expected to be slower
                        response.failure(f"Depth {depth} too slow: {response_time:.4f}s")
                    elif depth == 1 and response_time > 1.0:  # Depth 1 should be faster
                        response.failure(f"Depth {depth} too slow: {response_time:.4f}s")
                    else:
                        response.success()
                else:
                    response.failure(f"Request failed: {response.status_code}")
    
    @task(1)
    def profile_spatial_vs_relational(self):
        """Compare performance of spatial vs relational querying."""
        # Current viewport position
        viewport = random.choice(self.viewports)
        
        # Test with spatial indexing
        with self.client.get(
            f"{API_BASE_URL}/map/data?view_x={viewport['x']}&view_y={viewport['y']}&view_ratio={viewport['ratio']}&use_spatial=true", 
            name="/map/data (spatial query)", 
            catch_response=True
        ) as response:
            start_time = time.time()
            if response.status_code == 200:
                spatial_time = time.time() - start_time
                spatial_nodes = len(response.json().get("nodes", []))
                
                # Now test same viewport without spatial indexing
                with self.client.get(
                    f"{API_BASE_URL}/map/data?view_x={viewport['x']}&view_y={viewport['y']}&view_ratio={viewport['ratio']}&use_spatial=false", 
                    name="/map/data (relational query)", 
                    catch_response=True
                ) as rel_response:
                    rel_start_time = time.time()
                    if rel_response.status_code == 200:
                        rel_time = time.time() - rel_start_time
                        rel_nodes = len(rel_response.json().get("nodes", []))
                        
                        # Log comparison
                        print(f"Query type comparison: spatial={spatial_time:.4f}s ({spatial_nodes} nodes), relational={rel_time:.4f}s ({rel_nodes} nodes)")
                        
                        # Mark success/failure based on expectations
                        # We expect spatial to be faster for larger result sets
                        response.success()
                        rel_response.success()
                    else:
                        rel_response.failure(f"Relational query failed: {rel_response.status_code}")
            else:
                response.failure(f"Spatial query failed: {response.status_code}")