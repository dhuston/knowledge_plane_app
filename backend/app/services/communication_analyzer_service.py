from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import json
import numpy as np
from collections import defaultdict

from app.models.user import User
from app.models.emergent_model import RelationshipStrength
from app.models.node import Node


class PrivacyFilter:
    """
    Filter to ensure communication analysis respects user privacy settings.
    """
    
    def __init__(self, db: Session, tenant_id: int):
        self.db = db
        self.tenant_id = tenant_id
        self.opt_out_users = set()
        self._load_opt_out_users()
    
    def _load_opt_out_users(self):
        """Load users who have opted out of communication analysis."""
        users = self.db.query(User).filter(
            User.tenant_id == self.tenant_id,
            User.settings.contains({"communication_analysis_opt_out": True})
        ).all()
        
        self.opt_out_users = {user.id for user in users}
    
    def filter_communication_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Filter communication data to respect privacy settings.
        
        Args:
            data: List of communication data records
            
        Returns:
            Filtered list with opt-out users removed
        """
        filtered_data = []
        
        for record in data:
            # Skip records involving opt-out users
            if record.get("sender_id") in self.opt_out_users or record.get("recipient_id") in self.opt_out_users:
                continue
                
            filtered_data.append(record)
            
        return filtered_data
    
    def anonymize_data(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Anonymize communication data for aggregate analysis.
        
        Args:
            data: List of communication data records
            
        Returns:
            Anonymized data with user IDs replaced by anonymous identifiers
        """
        anonymized_data = []
        id_mapping = {}
        next_id = 1
        
        for record in data:
            anon_record = record.copy()
            
            # Anonymize sender ID
            sender_id = record.get("sender_id")
            if sender_id not in id_mapping:
                id_mapping[sender_id] = f"anon_user_{next_id}"
                next_id += 1
            anon_record["sender_id"] = id_mapping[sender_id]
            
            # Anonymize recipient ID
            recipient_id = record.get("recipient_id")
            if recipient_id not in id_mapping:
                id_mapping[recipient_id] = f"anon_user_{next_id}"
                next_id += 1
            anon_record["recipient_id"] = id_mapping[recipient_id]
            
            # Remove any other identifying information
            if "sender_email" in anon_record:
                del anon_record["sender_email"]
            if "recipient_email" in anon_record:
                del anon_record["recipient_email"]
            if "content" in anon_record:
                del anon_record["content"]
                
            anonymized_data.append(anon_record)
            
        return anonymized_data


class CommunicationAnalyzer:
    """
    Service for analyzing communication patterns between users.
    """
    
    def __init__(self, db: Session, tenant_id: int):
        self.db = db
        self.tenant_id = tenant_id
        self.privacy_filter = PrivacyFilter(db, tenant_id)
    
    def analyze_email_communications(self, email_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze email communication patterns.
        
        Args:
            email_data: List of email metadata records
            
        Returns:
            Analysis results
        """
        # Apply privacy filter
        filtered_data = self.privacy_filter.filter_communication_data(email_data)
        
        # Analyze communication frequency
        frequency_analysis = self._analyze_communication_frequency(filtered_data)
        
        # Analyze temporal patterns
        temporal_analysis = self._analyze_temporal_patterns(filtered_data)
        
        # Build communication network
        network_analysis = self._build_communication_network(filtered_data)
        
        return {
            "frequency_analysis": frequency_analysis,
            "temporal_analysis": temporal_analysis,
            "network_analysis": network_analysis,
            "metadata": {
                "total_communications": len(filtered_data),
                "date_range": self._get_date_range(filtered_data),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }
    
    def analyze_calendar_interactions(self, calendar_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze calendar meeting patterns.
        
        Args:
            calendar_data: List of calendar event records
            
        Returns:
            Analysis results
        """
        # Apply privacy filter
        filtered_data = self.privacy_filter.filter_communication_data(calendar_data)
        
        # Process calendar data into interaction records
        interaction_records = []
        for event in filtered_data:
            organizer_id = event.get("organizer_id")
            participants = event.get("participants", [])
            
            # Create interaction records between organizer and each participant
            for participant_id in participants:
                if organizer_id != participant_id:
                    interaction_records.append({
                        "sender_id": organizer_id,
                        "recipient_id": participant_id,
                        "timestamp": event.get("start_time"),
                        "type": "calendar",
                        "duration_minutes": event.get("duration_minutes", 0)
                    })
        
        # Analyze the interaction records
        frequency_analysis = self._analyze_communication_frequency(interaction_records)
        network_analysis = self._build_communication_network(interaction_records)
        
        return {
            "frequency_analysis": frequency_analysis,
            "network_analysis": network_analysis,
            "meeting_stats": self._analyze_meeting_stats(filtered_data),
            "metadata": {
                "total_meetings": len(filtered_data),
                "total_interactions": len(interaction_records),
                "date_range": self._get_date_range(filtered_data),
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }
    
    def calculate_relationship_strengths(self, combined_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculate relationship strengths based on communication patterns.
        
        Args:
            combined_data: Combined communication data from various sources
            
        Returns:
            List of calculated relationship strengths
        """
        # Apply privacy filter
        filtered_data = self.privacy_filter.filter_communication_data(combined_data)
        
        # Group interactions by user pair
        user_pair_interactions = defaultdict(list)
        for record in filtered_data:
            sender_id = record.get("sender_id")
            recipient_id = record.get("recipient_id")
            
            # Skip if either ID is missing
            if not sender_id or not recipient_id:
                continue
                
            # Ensure consistent ordering of user IDs
            user_pair = tuple(sorted([sender_id, recipient_id]))
            user_pair_interactions[user_pair].append(record)
        
        # Calculate relationship strengths
        relationship_strengths = []
        for user_pair, interactions in user_pair_interactions.items():
            user1_id, user2_id = user_pair
            
            # Calculate various factors that contribute to relationship strength
            frequency = len(interactions)
            recency = self._calculate_recency(interactions)
            reciprocity = self._calculate_reciprocity(interactions, user1_id, user2_id)
            
            # Calculate overall strength (simplified algorithm)
            strength = (0.5 * frequency + 0.3 * recency + 0.2 * reciprocity) / 10.0
            
            # Normalize to 0-1 range
            normalized_strength = min(1.0, max(0.0, strength))
            
            # Create relationship strength records in both directions
            relationship_strengths.append({
                "source_id": user1_id,
                "target_id": user2_id,
                "relationship_type": "collaboration",
                "strength_value": normalized_strength,
                "confidence_score": min(1.0, frequency / 100),  # Simple confidence calculation
                "metadata": {
                    "frequency": frequency,
                    "recency": recency,
                    "reciprocity": reciprocity
                }
            })
            
            relationship_strengths.append({
                "source_id": user2_id,
                "target_id": user1_id,
                "relationship_type": "collaboration",
                "strength_value": normalized_strength,
                "confidence_score": min(1.0, frequency / 100),
                "metadata": {
                    "frequency": frequency,
                    "recency": recency,
                    "reciprocity": reciprocity
                }
            })
        
        return relationship_strengths
    
    def store_relationship_strengths(self, relationship_strengths: List[Dict[str, Any]]) -> List[RelationshipStrength]:
        """
        Store calculated relationship strengths in the database.
        
        Args:
            relationship_strengths: List of calculated relationship strengths
            
        Returns:
            List of created/updated RelationshipStrength objects
        """
        results = []
        
        for strength_data in relationship_strengths:
            # Check if the relationship already exists
            relationship = self.db.query(RelationshipStrength).filter(
                RelationshipStrength.source_id == strength_data["source_id"],
                RelationshipStrength.target_id == strength_data["target_id"],
                RelationshipStrength.relationship_type == strength_data["relationship_type"],
                RelationshipStrength.tenant_id == self.tenant_id
            ).first()
            
            if relationship:
                # Update existing relationship
                relationship.strength_value = strength_data["strength_value"]
                relationship.confidence_score = strength_data["confidence_score"]
                relationship.metadata = json.dumps(strength_data["metadata"])
                relationship.last_updated = datetime.utcnow()
            else:
                # Create new relationship
                relationship = RelationshipStrength(
                    source_id=strength_data["source_id"],
                    target_id=strength_data["target_id"],
                    relationship_type=strength_data["relationship_type"],
                    strength_value=strength_data["strength_value"],
                    confidence_score=strength_data["confidence_score"],
                    metadata=json.dumps(strength_data["metadata"]),
                    tenant_id=self.tenant_id
                )
                self.db.add(relationship)
                
            results.append(relationship)
        
        self.db.commit()
        return results
    
    def _analyze_communication_frequency(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze communication frequency patterns."""
        if not data:
            return {"total_communications": 0}
            
        # Count communications per user pair
        user_pair_counts = defaultdict(int)
        for record in data:
            sender_id = record.get("sender_id")
            recipient_id = record.get("recipient_id")
            
            if sender_id and recipient_id:
                user_pair = tuple(sorted([sender_id, recipient_id]))
                user_pair_counts[user_pair] += 1
        
        # Calculate frequency statistics
        frequencies = list(user_pair_counts.values())
        
        return {
            "total_communications": len(data),
            "unique_pairs": len(user_pair_counts),
            "max_frequency": max(frequencies) if frequencies else 0,
            "min_frequency": min(frequencies) if frequencies else 0,
            "avg_frequency": sum(frequencies) / len(frequencies) if frequencies else 0,
            "frequency_distribution": self._create_frequency_distribution(frequencies)
        }
    
    def _analyze_temporal_patterns(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze temporal communication patterns."""
        if not data:
            return {}
            
        # Group communications by day of week and hour of day
        day_of_week_counts = defaultdict(int)
        hour_of_day_counts = defaultdict(int)
        
        for record in data:
            timestamp_str = record.get("timestamp")
            if not timestamp_str:
                continue
                
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                day_of_week_counts[timestamp.weekday()] += 1
                hour_of_day_counts[timestamp.hour] += 1
            except (ValueError, TypeError):
                # Skip records with invalid timestamps
                continue
        
        return {
            "day_of_week_distribution": {
                "Monday": day_of_week_counts[0],
                "Tuesday": day_of_week_counts[1],
                "Wednesday": day_of_week_counts[2],
                "Thursday": day_of_week_counts[3],
                "Friday": day_of_week_counts[4],
                "Saturday": day_of_week_counts[5],
                "Sunday": day_of_week_counts[6]
            },
            "hour_of_day_distribution": {str(hour): hour_of_day_counts[hour] for hour in range(24)}
        }
    
    def _build_communication_network(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build and analyze communication network graph."""
        if not data:
            return {}
            
        # Build adjacency list
        adjacency_list = defaultdict(set)
        for record in data:
            sender_id = record.get("sender_id")
            recipient_id = record.get("recipient_id")
            
            if sender_id and recipient_id:
                adjacency_list[sender_id].add(recipient_id)
                adjacency_list[recipient_id].add(sender_id)
        
        # Calculate network metrics
        nodes = list(adjacency_list.keys())
        edges = sum(len(neighbors) for neighbors in adjacency_list.values()) // 2  # Divide by 2 to avoid double counting
        
        # Calculate average degree
        avg_degree = sum(len(neighbors) for neighbors in adjacency_list.values()) / len(adjacency_list) if adjacency_list else 0
        
        # Identify central nodes (simplified)
        degree_centrality = {node: len(adjacency_list[node]) for node in nodes}
        central_nodes = sorted(degree_centrality.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "nodes": len(nodes),
            "edges": edges,
            "avg_degree": avg_degree,
            "central_nodes": [{"node_id": node, "degree": degree} for node, degree in central_nodes]
        }
    
    def _analyze_meeting_stats(self, calendar_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze meeting statistics from calendar data."""
        if not calendar_data:
            return {}
            
        # Calculate meeting durations
        durations = [event.get("duration_minutes", 0) for event in calendar_data]
        
        # Calculate participant counts
        participant_counts = [len(event.get("participants", [])) for event in calendar_data]
        
        return {
            "avg_duration": sum(durations) / len(durations) if durations else 0,
            "max_duration": max(durations) if durations else 0,
            "min_duration": min(durations) if durations else 0,
            "avg_participants": sum(participant_counts) / len(participant_counts) if participant_counts else 0,
            "max_participants": max(participant_counts) if participant_counts else 0,
            "duration_distribution": self._create_duration_distribution(durations)
        }
    
    def _create_frequency_distribution(self, frequencies: List[int]) -> Dict[str, int]:
        """Create a distribution of communication frequencies."""
        bins = {
            "1": 0,
            "2-5": 0,
            "6-10": 0,
            "11-20": 0,
            "21-50": 0,
            "51+": 0
        }
        
        for freq in frequencies:
            if freq == 1:
                bins["1"] += 1
            elif 2 <= freq <= 5:
                bins["2-5"] += 1
            elif 6 <= freq <= 10:
                bins["6-10"] += 1
            elif 11 <= freq <= 20:
                bins["11-20"] += 1
            elif 21 <= freq <= 50:
                bins["21-50"] += 1
            else:
                bins["51+"] += 1
                
        return bins
    
    def _create_duration_distribution(self, durations: List[int]) -> Dict[str, int]:
        """Create a distribution of meeting durations."""
        bins = {
            "0-15 min": 0,
            "16-30 min": 0,
            "31-60 min": 0,
            "61-120 min": 0,
            "120+ min": 0
        }
        
        for duration in durations:
            if duration <= 15:
                bins["0-15 min"] += 1
            elif 16 <= duration <= 30:
                bins["16-30 min"] += 1
            elif 31 <= duration <= 60:
                bins["31-60 min"] += 1
            elif 61 <= duration <= 120:
                bins["61-120 min"] += 1
            else:
                bins["120+ min"] += 1
                
        return bins
    
    def _get_date_range(self, data: List[Dict[str, Any]]) -> Dict[str, str]:
        """Get the date range covered by the data."""
        timestamps = []
        
        for record in data:
            timestamp_str = record.get("timestamp")
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    timestamps.append(timestamp)
                except (ValueError, TypeError):
                    continue
        
        if not timestamps:
            return {"start_date": None, "end_date": None}
            
        start_date = min(timestamps).date().isoformat()
        end_date = max(timestamps).date().isoformat()
        
        return {"start_date": start_date, "end_date": end_date}
    
    def _calculate_recency(self, interactions: List[Dict[str, Any]]) -> float:
        """Calculate recency score based on timestamp of interactions."""
        timestamps = []
        
        for record in interactions:
            timestamp_str = record.get("timestamp")
            if timestamp_str:
                try:
                    timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    timestamps.append(timestamp)
                except (ValueError, TypeError):
                    continue
        
        if not timestamps:
            return 0.0
            
        now = datetime.utcnow()
        most_recent = max(timestamps)
        days_since = (now - most_recent).days
        
        # Recency score decreases with time (1.0 for today, decreasing to 0.0 for 90+ days)
        return max(0.0, min(1.0, 1.0 - (days_since / 90.0)))
    
    def _calculate_reciprocity(self, interactions: List[Dict[str, Any]], user1_id: int, user2_id: int) -> float:
        """Calculate reciprocity score based on balance of interactions."""
        user1_initiated = sum(1 for record in interactions if record.get("sender_id") == user1_id)
        user2_initiated = sum(1 for record in interactions if record.get("sender_id") == user2_id)
        
        total = user1_initiated + user2_initiated
        if total == 0:
            return 0.0
            
        # Perfect reciprocity (0.5/0.5 split) gets score of 1.0
        # Completely one-sided interactions get score of 0.0
        ratio = min(user1_initiated, user2_initiated) / total
        return 2.0 * ratio  # Scale to 0.0-1.0 range