"""
Redis Cache Effectiveness Testing Locustfile for Biosphere Alpha API

This locustfile extends the main locustfile.py to specifically test and measure 
the effectiveness of Redis caching for map-related API endpoints.

The tests are designed to:
1. Measure performance with caching enabled vs. disabled
2. Test cache hit rates under different request patterns
3. Analyze cache effectiveness for spatial vs. relational queries
4. Benchmark the performance impact of different cache TTLs

Usage:
    Run with: locust -f locustfile_map_cache.py
    
Configuration:
    - REDIS_CACHE_ENABLED can be toggled during tests to compare performance
    - CACHE_TTL can be adjusted to test different cache lifetimes
"""

import csv
import json
import random
import time
import uuid
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple, Any
from datetime import datetime

from locust import HttpUser, TaskSet, between, events, tag, task

# Import the base user classes from the main locustfile
from locustfile import BaseApiUser, API_BASE_URL, WAIT_TIME_MIN, WAIT_TIME_MAX

# Cache-specific configuration
REDIS_CACHE_ENABLED = True  # Set to False to disable caching for comparison testing
CACHE_TTL = 300  # Cache TTL in seconds (5 minutes default)

# Custom metrics for cache effectiveness
cache_metrics = {
    "hits": 0,
    "misses": 0,
    "hit_times": [],
    "miss_times": [],
    "spatial_hit_times": [],
    "relational_hit_times": [],
    "spatial_miss_times": [],
    "relational_miss_times": [],
}

# Track the last access time for each node to simulate cache patterns
last_accessed = {}


class MapCacheTestUser(BaseApiUser):
    """
    User class focused on testing the Redis cache effectiveness for map endpoints.
    """
    
    wait_time = between(WAIT_TIME_MIN, WAIT_TIME_MAX)
    
    @task(3)
    def test_cached_default_map(self):
        """Test default map view, which should benefit from caching."""
        # Add cache control headers to test with and without cache
        headers = {
            "Cache-Control": "no-cache" if not REDIS_CACHE_ENABLED else "max-age=300"
        }
        
        with self.client.get(
            f"{API_BASE_URL}/map/data", 
            name="/map/data (cached default)",
            headers=headers,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                # Track response time for cache analysis
                resp_time = response.elapsed.total_seconds()
                result = response.json()
                
                # Check "cache" header in response (if implemented)
                cache_header = response.headers.get("X-Cache", "UNKNOWN")
                if cache_header == "HIT":
                    cache_metrics["hits"] += 1
                    cache_metrics["hit_times"].append(resp_time)
                else:
                    cache_metrics["misses"] += 1
                    cache_metrics["miss_times"].append(resp_time)
                
                # Track node data for future requests
                if "nodes" in result:
                    self._track_map_nodes(result)
                
                # Log caching statistics periodically
                if random.random() < 0.1:  # Log approximately 10% of the time
                    hit_rate = cache_metrics["hits"] / (cache_metrics["hits"] + cache_metrics["misses"]) if cache_metrics["hits"] + cache_metrics["misses"] > 0 else 0
                    avg_hit = sum(cache_metrics["hit_times"]) / len(cache_metrics["hit_times"]) if cache_metrics["hit_times"] else 0
                    avg_miss = sum(cache_metrics["miss_times"]) / len(cache_metrics["miss_times"]) if cache_metrics["miss_times"] else 0
                    
                    print(f"Cache Stats: Hit Rate={hit_rate:.2f}, Avg Hit Time={avg_hit:.4f}s, Avg Miss Time={avg_miss:.4f}s")
                
                response.success()
            else:
                response.failure(f"Failed to fetch cached map: {response.status_code}")
    
    @task(2)
    def test_sequential_node_selection(self):
        """Test sequential selection of nodes to evaluate neighbor caching."""
        if not self.known_nodes["user"] and not self.known_nodes["team"]:
            # Skip if we don't have any nodes to select
            return
            
        # Select node type and get a node
        node_type = random.choice(["user", "team", "project", "goal"])
        if not self.known_nodes[node_type]:
            node_type = "user"  # Fallback to user
        
        # Select a node, preferring recently accessed ones (to test cache hits)
        node_id = self._get_weighted_node_id(node_type)
        
        # Update last accessed time for this node
        last_accessed[node_id] = time.time()
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?center_node_id={node_id}&depth=1", 
            name="/map/data (sequential selection)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                self._track_map_nodes(response.json())
                response.success()
                
                # Track response time and analyze if likely a cache hit
                resp_time = response.elapsed.total_seconds()
                # Simplistic cache hit detection - in reality we'd use X-Cache header
                if resp_time < 0.1:  # Assume cache hit if very fast
                    cache_metrics["hits"] += 1
                    cache_metrics["hit_times"].append(resp_time)
                else:
                    cache_metrics["misses"] += 1
                    cache_metrics["miss_times"].append(resp_time)
            else:
                response.failure(f"Failed to fetch centered map: {response.status_code}")
    
    @task(2)
    def test_spatial_vs_relational(self):
        """Compare performance of spatial vs relational querying with caching."""
        # Get a viewport based on known nodes or use default
        viewport = self._get_realistic_viewport()
        
        # First test with spatial indexing
        with self.client.get(
            f"{API_BASE_URL}/map/data?view_x={viewport['x']}&view_y={viewport['y']}&view_ratio={viewport['ratio']}&use_spatial=true", 
            name="/map/data (spatial query)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                spatial_time = response.elapsed.total_seconds()
                spatial_data = response.json()
                spatial_nodes = len(spatial_data.get("nodes", []))
                self._track_map_nodes(spatial_data)
                response.success()
                
                # Record if it was likely a cache hit
                if spatial_time < 0.1:  # Assume cache hit if very fast
                    cache_metrics["spatial_hit_times"].append(spatial_time)
                else:
                    cache_metrics["spatial_miss_times"].append(spatial_time)
                
                # Now test same viewport without spatial indexing
                with self.client.get(
                    f"{API_BASE_URL}/map/data?view_x={viewport['x']}&view_y={viewport['y']}&view_ratio={viewport['ratio']}&use_spatial=false", 
                    name="/map/data (relational query)",
                    catch_response=True
                ) as rel_response:
                    rel_time = rel_response.elapsed.total_seconds()
                    rel_data = rel_response.json()
                    rel_nodes = len(rel_data.get("nodes", []))
                    self._track_map_nodes(rel_data)
                    rel_response.success()
                    
                    # Record if it was likely a cache hit
                    if rel_time < 0.1:  # Assume cache hit if very fast
                        cache_metrics["relational_hit_times"].append(rel_time)
                    else:
                        cache_metrics["relational_miss_times"].append(rel_time)
                    
                    # Log comparison for this test iteration
                    print(f"Query comparison: spatial={spatial_time:.4f}s ({spatial_nodes} nodes), " +
                          f"relational={rel_time:.4f}s ({rel_nodes} nodes)")
            else:
                response.failure(f"Failed to fetch spatial map: {response.status_code}")
    
    @task(1)
    def test_cache_eviction(self):
        """Test performance with cache eviction by accessing rarely accessed nodes."""
        # Select the oldest accessed node to test cache eviction
        oldest_node_id = None
        oldest_time = float('inf')
        
        for node_id, access_time in last_accessed.items():
            if access_time < oldest_time:
                oldest_time = access_time
                oldest_node_id = node_id
        
        if not oldest_node_id and self.known_nodes["user"]:
            oldest_node_id = random.choice(list(self.known_nodes["user"]))
        elif not oldest_node_id:
            return  # Skip if no nodes available
        
        # Update last accessed time
        last_accessed[oldest_node_id] = time.time()
        
        with self.client.get(
            f"{API_BASE_URL}/map/data?center_node_id={oldest_node_id}&depth=1", 
            name="/map/data (cache eviction test)",
            catch_response=True
        ) as response:
            if response.status_code == 200:
                resp_time = response.elapsed.total_seconds()
                self._track_map_nodes(response.json())
                
                # This should likely be a cache miss since it's the oldest node
                cache_metrics["misses"] += 1
                cache_metrics["miss_times"].append(resp_time)
                
                response.success()
            else:
                response.failure(f"Failed to fetch evicted node data: {response.status_code}")
    
    @task(1)
    def test_depth_impact_with_cache(self):
        """Test the impact of relationship depth on cache performance."""
        if not self.known_nodes["user"] and not self.known_nodes["team"]:
            return  # Skip if we don't have any nodes
            
        # Select a node
        node_type = random.choice(["user", "team"])
        if not self.known_nodes[node_type]:
            return
            
        node_id = random.choice(list(self.known_nodes[node_type]))
        
        # Test with depth=1
        with self.client.get(
            f"{API_BASE_URL}/map/data?center_node_id={node_id}&depth=1", 
            name="/map/data (depth=1, cache test)",
            catch_response=True
        ) as response1:
            if response1.status_code == 200:
                depth1_time = response1.elapsed.total_seconds()
                depth1_data = response1.json()
                self._track_map_nodes(depth1_data)
                response1.success()
                
                # Now test depth=2 with the same center node
                with self.client.get(
                    f"{API_BASE_URL}/map/data?center_node_id={node_id}&depth=2", 
                    name="/map/data (depth=2, cache test)",
                    catch_response=True
                ) as response2:
                    if response2.status_code == 200:
                        depth2_time = response2.elapsed.total_seconds()
                        depth2_data = response2.json()
                        self._track_map_nodes(depth2_data)
                        response2.success()
                        
                        # Log performance comparison
                        depth1_nodes = len(depth1_data.get("nodes", []))
                        depth2_nodes = len(depth2_data.get("nodes", []))
                        
                        print(f"Depth impact: depth1={depth1_time:.4f}s ({depth1_nodes} nodes), " +
                              f"depth2={depth2_time:.4f}s ({depth2_nodes} nodes), " +
                              f"ratio={depth2_time/depth1_time if depth1_time > 0 else 0:.2f}x")
                    else:
                        response2.failure(f"Depth 2 request failed: {response2.status_code}")
            else:
                response1.failure(f"Depth 1 request failed: {response1.status_code}")
    
    def _get_weighted_node_id(self, node_type):
        """
        Get a node ID with weighting toward recently accessed nodes 
        to simulate realistic user behavior and test cache effectiveness.
        """
        if not self.known_nodes[node_type]:
            return None
            
        node_ids = list(self.known_nodes[node_type])
        
        # 80% chance to select a recently accessed node if available
        if random.random() < 0.8:
            recent_nodes = [
                node_id for node_id in node_ids 
                if str(node_id) in last_accessed and 
                time.time() - last_accessed[str(node_id)] < CACHE_TTL
            ]
            if recent_nodes:
                return random.choice(recent_nodes)
        
        # Otherwise select randomly
        return random.choice(node_ids)
    
    def _get_realistic_viewport(self):
        """
        Generate a realistic viewport based on known node positions
        or return a default if no nodes with positions are known.
        """
        # In a real implementation, we would extract positions from known nodes
        # Here we'll just return randomized viewports
        return {
            "x": random.uniform(-500, 500),
            "y": random.uniform(-500, 500),
            "ratio": random.choice([0.5, 1.0, 2.0])
        }


# Event handlers for reporting
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Initialize CSV writers for detailed cache metrics."""
    # Reset cache metrics
    for key in ["hits", "misses"]:
        cache_metrics[key] = 0
    for key in ["hit_times", "miss_times", "spatial_hit_times", "relational_hit_times", 
               "spatial_miss_times", "relational_miss_times"]:
        cache_metrics[key] = []
    
    # Create CSV files for metrics
    with open('cache_performance.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "endpoint", "cache_status", "response_time", "query_type"])
    
    print(f"Cache testing started with Redis cache {'ENABLED' if REDIS_CACHE_ENABLED else 'DISABLED'}")
    print(f"Cache TTL: {CACHE_TTL} seconds")

@events.request.add_listener
def on_request(request_type, name, response_time, response_length, response, context, exception, **kwargs):
    """Log cache-specific metrics to CSV."""
    if not name.startswith("/map/data"):
        return
        
    # Determine if it was likely a cache hit based on response time
    # In a real implementation, we'd use an X-Cache header
    cache_status = "hit" if response_time < 100 else "miss"
    
    # Determine query type
    query_type = "unknown"
    if "spatial query" in name:
        query_type = "spatial"
    elif "relational query" in name:
        query_type = "relational"
    elif "cached default" in name:
        query_type = "default"
    elif "depth=1" in name:
        query_type = "depth1"
    elif "depth=2" in name:
        query_type = "depth2"
    
    # Log to CSV
    with open('cache_performance.csv', 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().isoformat(),
            name,
            cache_status,
            response_time,
            query_type
        ])

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Generate cache performance summary report."""
    # Calculate hit rate
    total_requests = cache_metrics["hits"] + cache_metrics["misses"]
    hit_rate = cache_metrics["hits"] / total_requests if total_requests > 0 else 0
    
    # Calculate average times
    avg_hit_time = sum(cache_metrics["hit_times"]) / len(cache_metrics["hit_times"]) if cache_metrics["hit_times"] else 0
    avg_miss_time = sum(cache_metrics["miss_times"]) / len(cache_metrics["miss_times"]) if cache_metrics["miss_times"] else 0
    
    # Calculate spatial vs relational metrics
    spatial_avg_hit = sum(cache_metrics["spatial_hit_times"]) / len(cache_metrics["spatial_hit_times"]) if cache_metrics["spatial_hit_times"] else 0
    spatial_avg_miss = sum(cache_metrics["spatial_miss_times"]) / len(cache_metrics["spatial_miss_times"]) if cache_metrics["spatial_miss_times"] else 0
    relational_avg_hit = sum(cache_metrics["relational_hit_times"]) / len(cache_metrics["relational_hit_times"]) if cache_metrics["relational_hit_times"] else 0
    relational_avg_miss = sum(cache_metrics["relational_miss_times"]) / len(cache_metrics["relational_miss_times"]) if cache_metrics["relational_miss_times"] else 0
    
    # Print summary
    print("\n=== Cache Performance Summary ===")
    print(f"Redis Cache: {'ENABLED' if REDIS_CACHE_ENABLED else 'DISABLED'}")
    print(f"Cache TTL: {CACHE_TTL} seconds")
    print(f"Total Requests: {total_requests}")
    print(f"Cache Hit Rate: {hit_rate:.2%}")
    print(f"Avg Hit Time: {avg_hit_time*1000:.2f}ms")
    print(f"Avg Miss Time: {avg_miss_time*1000:.2f}ms")
    print(f"Cache Speedup: {avg_miss_time/avg_hit_time:.2f}x")
    print("\n--- Query Type Comparison ---")
    print(f"Spatial Query Avg Hit Time: {spatial_avg_hit*1000:.2f}ms")
    print(f"Spatial Query Avg Miss Time: {spatial_avg_miss*1000:.2f}ms")
    print(f"Relational Query Avg Hit Time: {relational_avg_hit*1000:.2f}ms")
    print(f"Relational Query Avg Miss Time: {relational_avg_miss*1000:.2f}ms")
    
    # Save final report
    with open('cache_performance_summary.json', 'w') as f:
        json.dump({
            "config": {
                "redis_enabled": REDIS_CACHE_ENABLED,
                "cache_ttl": CACHE_TTL
            },
            "overall": {
                "total_requests": total_requests,
                "hit_rate": hit_rate,
                "avg_hit_time_ms": avg_hit_time * 1000,
                "avg_miss_time_ms": avg_miss_time * 1000,
                "speedup": avg_miss_time / avg_hit_time if avg_hit_time > 0 else 0
            },
            "query_types": {
                "spatial": {
                    "avg_hit_time_ms": spatial_avg_hit * 1000,
                    "avg_miss_time_ms": spatial_avg_miss * 1000
                },
                "relational": {
                    "avg_hit_time_ms": relational_avg_hit * 1000,
                    "avg_miss_time_ms": relational_avg_miss * 1000
                }
            }
        }, f, indent=2)
    
    print(f"\nDetailed metrics saved to cache_performance.csv and cache_performance_summary.json")