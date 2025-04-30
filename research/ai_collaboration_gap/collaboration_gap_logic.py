"""
Enhanced Collaboration Gap Detection Logic for KnowledgePlane AI

This module defines the advanced logic for identifying collaboration gaps
between related entities (teams, projects, users) within an organization.
It builds upon the initial keyword-based project overlap detection by adding:

1. Time-based collaboration thresholds
2. Activity log analysis
3. Relationship-based relevance scoring
4. Actionable recommendations
"""

import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Tuple, Any
import uuid

logger = logging.getLogger(__name__)

# Collaboration types
class CollaborationType(str, Enum):
    PROJECT_PARTICIPATION = "project_participation"
    NOTE_CONTRIBUTION = "note_contribution"
    SHARED_GOAL = "shared_goal"
    MEETING_ATTENDANCE = "meeting_attendance"
    ASSET_SHARING = "asset_sharing"


# Collaboration gap severity levels
class GapSeverity(str, Enum):
    LOW = "low"  # Should collaborate but no immediate need
    MEDIUM = "medium"  # Would benefit from collaboration soon
    HIGH = "high"  # Critical gap, needs immediate attention


# Model classes (for reference - actual implementation will use SQLAlchemy models)
class Entity:
    """Base class representing any entity in the system that can collaborate"""
    id: uuid.UUID
    type: str  # 'user', 'team', 'project', etc.
    name: str
    description: Optional[str] = None
    keywords: Set[str] = set()
    
    def __init__(self, id: uuid.UUID, type: str, name: str, description: Optional[str] = None):
        self.id = id
        self.type = type
        self.name = name
        self.description = description
        # Extract keywords from name and description
        self.keywords = self._extract_keywords(name, description)
    
    def _extract_keywords(self, name: str, description: Optional[str]) -> Set[str]:
        """Extract keywords from name and description"""
        # This would be a more sophisticated implementation of keyword extraction
        # Potentially using NLP techniques, TF-IDF, etc.
        # For now, just a placeholder that returns lowercase words
        keywords = set()
        if name:
            keywords.update(name.lower().split())
        if description:
            keywords.update(description.lower().split())
        # Remove common stop words
        stop_words = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with"}
        return {k for k in keywords if k not in stop_words and len(k) > 2}


class Activity:
    """Represents a collaboration activity between entities"""
    id: uuid.UUID
    timestamp: datetime
    activity_type: str  # Type of activity (e.g., 'created_note', 'updated_project')
    source_entity_id: uuid.UUID  # Entity that performed the activity
    source_entity_type: str
    target_entity_id: Optional[uuid.UUID]  # Entity that was acted upon, if any
    target_entity_type: Optional[str]
    metadata: Dict[str, Any]  # Additional activity data
    
    def __init__(
        self, 
        id: uuid.UUID,
        timestamp: datetime,
        activity_type: str,
        source_entity_id: uuid.UUID,
        source_entity_type: str,
        target_entity_id: Optional[uuid.UUID] = None,
        target_entity_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.id = id
        self.timestamp = timestamp
        self.activity_type = activity_type
        self.source_entity_id = source_entity_id
        self.source_entity_type = source_entity_type
        self.target_entity_id = target_entity_id
        self.target_entity_type = target_entity_type
        self.metadata = metadata or {}


class CollaborationGap:
    """Represents a detected collaboration gap between entities"""
    entity1_id: uuid.UUID
    entity1_type: str
    entity2_id: uuid.UUID
    entity2_type: str
    gap_type: CollaborationType
    relevance_score: float  # 0.0 to 1.0, how relevant this collaboration would be
    severity: GapSeverity
    last_collaboration: Optional[datetime]  # When these entities last collaborated, if ever
    reason: str  # Human-readable explanation of why this gap was detected
    recommendation: str  # Suggested action to address the gap
    
    def __init__(
        self,
        entity1_id: uuid.UUID,
        entity1_type: str,
        entity2_id: uuid.UUID,
        entity2_type: str,
        gap_type: CollaborationType,
        relevance_score: float,
        severity: GapSeverity,
        last_collaboration: Optional[datetime],
        reason: str,
        recommendation: str
    ):
        self.entity1_id = entity1_id
        self.entity1_type = entity1_type
        self.entity2_id = entity2_id
        self.entity2_type = entity2_type
        self.gap_type = gap_type
        self.relevance_score = relevance_score
        self.severity = severity
        self.last_collaboration = last_collaboration
        self.reason = reason
        self.recommendation = recommendation


class CollaborationGapDetector:
    """Enhanced logic for detecting collaboration gaps"""
    
    # Configuration
    DEFAULT_COLLABORATION_THRESHOLD_DAYS = 30  # Consider a gap if no collaboration in this period
    MIN_KEYWORD_OVERLAP = 3  # Minimum keyword overlap to consider entities related
    MIN_RELEVANCE_SCORE = 0.5  # Minimum relevance score to report a gap
    
    def __init__(
        self,
        collaboration_threshold_days: int = DEFAULT_COLLABORATION_THRESHOLD_DAYS,
        min_keyword_overlap: int = MIN_KEYWORD_OVERLAP,
        min_relevance_score: float = MIN_RELEVANCE_SCORE
    ):
        self.collaboration_threshold_days = collaboration_threshold_days
        self.min_keyword_overlap = min_keyword_overlap
        self.min_relevance_score = min_relevance_score
    
    async def detect_project_collaboration_gaps(
        self,
        projects: List[Entity],
        activities: List[Activity],
        now: datetime = datetime.utcnow()
    ) -> List[CollaborationGap]:
        """
        Detect collaboration gaps between projects based on:
        1. Keyword similarity (projects with similar focus)
        2. Shared goals alignment
        3. Lack of recent cross-team activities
        """
        gaps: List[CollaborationGap] = []
        
        # Create a lookup of activities by entity pairs
        collaboration_lookup = self._build_collaboration_lookup(activities)
        
        # Compare all pairs of projects
        for i, project1 in enumerate(projects):
            for j, project2 in enumerate(projects[i+1:], i+1):
                # Skip if same project
                if project1.id == project2.id:
                    continue
                
                # Calculate keyword overlap and relevance
                common_keywords = project1.keywords.intersection(project2.keywords)
                if len(common_keywords) < self.min_keyword_overlap:
                    continue
                
                keyword_relevance = len(common_keywords) / max(
                    len(project1.keywords.union(project2.keywords)), 1
                )
                
                # Calculate goal alignment relevance (stub - would use actual goal relationships)
                goal_relevance = 0.0  # This would examine if projects share goals or have aligned goals
                
                # Calculate overall relevance score (weighted average)
                relevance_score = 0.7 * keyword_relevance + 0.3 * goal_relevance
                
                # Skip if relevance is too low
                if relevance_score < self.min_relevance_score:
                    continue
                
                # Check for recent collaboration
                last_collab_date, collab_type = self._get_last_collaboration(
                    collaboration_lookup, project1.id, project2.id
                )
                
                # If no collaboration or it's too old, report a gap
                threshold_date = now - timedelta(days=self.collaboration_threshold_days)
                if not last_collab_date or last_collab_date < threshold_date:
                    # Calculate severity based on relevance and time since collaboration
                    severity = self._calculate_severity(relevance_score, last_collab_date, threshold_date)
                    
                    # Create gap with recommendation
                    reason = (
                        f"Projects share {len(common_keywords)} keywords ({', '.join(list(common_keywords)[:3])}...) "
                        f"but have {'no' if not last_collab_date else 'insufficient'} collaboration."
                    )
                    
                    recommendation = self._generate_recommendation(
                        project1, project2, relevance_score, last_collab_date, severity
                    )
                    
                    gap = CollaborationGap(
                        entity1_id=project1.id,
                        entity1_type=project1.type,
                        entity2_id=project2.id,
                        entity2_type=project2.type,
                        gap_type=CollaborationType.PROJECT_PARTICIPATION,
                        relevance_score=relevance_score,
                        severity=severity,
                        last_collaboration=last_collab_date,
                        reason=reason,
                        recommendation=recommendation
                    )
                    
                    gaps.append(gap)
        
        return gaps
    
    def _build_collaboration_lookup(
        self,
        activities: List[Activity]
    ) -> Dict[Tuple[uuid.UUID, uuid.UUID], List[Tuple[datetime, str]]]:
        """Build a lookup of collaboration activities between entity pairs"""
        lookup: Dict[Tuple[uuid.UUID, uuid.UUID], List[Tuple[datetime, str]]] = {}
        
        for activity in activities:
            if activity.target_entity_id:
                # Ensure consistent ordering of entity IDs in the key
                entity_ids = sorted([str(activity.source_entity_id), str(activity.target_entity_id)])
                key = (uuid.UUID(entity_ids[0]), uuid.UUID(entity_ids[1]))
                
                if key not in lookup:
                    lookup[key] = []
                
                lookup[key].append((activity.timestamp, activity.activity_type))
        
        return lookup
    
    def _get_last_collaboration(
        self,
        collaboration_lookup: Dict[Tuple[uuid.UUID, uuid.UUID], List[Tuple[datetime, str]]],
        entity1_id: uuid.UUID,
        entity2_id: uuid.UUID
    ) -> Tuple[Optional[datetime], Optional[str]]:
        """Get the date and type of the most recent collaboration between two entities"""
        # Ensure consistent ordering of entity IDs in the key
        entity_ids = sorted([str(entity1_id), str(entity2_id)])
        key = (uuid.UUID(entity_ids[0]), uuid.UUID(entity_ids[1]))
        
        if key not in collaboration_lookup or not collaboration_lookup[key]:
            return None, None
        
        # Find the most recent activity
        collaborations = sorted(collaboration_lookup[key], key=lambda x: x[0], reverse=True)
        return collaborations[0]
    
    def _calculate_severity(
        self,
        relevance_score: float,
        last_collab_date: Optional[datetime],
        threshold_date: datetime
    ) -> GapSeverity:
        """Calculate the severity of a collaboration gap"""
        # If no collaboration ever, and high relevance, it's a high severity gap
        if not last_collab_date and relevance_score > 0.8:
            return GapSeverity.HIGH
        
        # If no collaboration ever, but moderate relevance, it's a medium severity gap
        if not last_collab_date:
            return GapSeverity.MEDIUM
        
        # If there was collaboration, but it's getting old, calculate based on 
        # how far past the threshold it is
        days_past_threshold = (threshold_date - last_collab_date).days
        
        if days_past_threshold > self.collaboration_threshold_days * 2:
            return GapSeverity.HIGH
        elif days_past_threshold > self.collaboration_threshold_days / 2:
            return GapSeverity.MEDIUM
        else:
            return GapSeverity.LOW
    
    def _generate_recommendation(
        self,
        entity1: Entity,
        entity2: Entity,
        relevance_score: float,
        last_collab_date: Optional[datetime],
        severity: GapSeverity
    ) -> str:
        """Generate a recommendation based on the gap details"""
        if severity == GapSeverity.HIGH:
            return (
                f"Schedule a meeting between {entity1.name} and {entity2.name} teams to discuss "
                f"potential synergies and collaboration opportunities. Consider creating a shared "
                f"knowledge base or regular sync meetings."
            )
        elif severity == GapSeverity.MEDIUM:
            return (
                f"Share documentation between {entity1.name} and {entity2.name} teams. "
                f"Consider inviting key members to respective project meetings."
            )
        else:
            return (
                f"Notify team leads of {entity1.name} and {entity2.name} about potential "
                f"overlapping interests. Suggest informal knowledge sharing."
            )


async def find_collaboration_gaps(db, tenant_id: uuid.UUID) -> Dict[str, List[Dict]]:
    """
    Main entry point for collaboration gap detection API.
    In the actual implementation, this would:
    1. Fetch relevant entities from database
    2. Fetch recent activity logs
    3. Call detector logic
    4. Format and return results
    """
    # This would be implemented with actual DB queries in the real code
    # For now, just a skeleton showing the structure
    
    # Create detector instance
    detector = CollaborationGapDetector()
    
    # Fetch projects for this tenant
    projects = []  # Would be: await crud_project.get_multi_by_tenant(db, tenant_id)
    
    # Fetch recent activities for this tenant
    activities = []  # Would be: await crud_activity.get_recent_by_tenant(db, tenant_id)
    
    # Detect project collaboration gaps
    project_gaps = await detector.detect_project_collaboration_gaps(projects, activities)
    
    # Convert to serializable format
    result = {
        "project_gaps": [
            {
                "entity1_id": str(gap.entity1_id),
                "entity1_type": gap.entity1_type,
                "entity2_id": str(gap.entity2_id),
                "entity2_type": gap.entity2_type,
                "gap_type": gap.gap_type,
                "relevance_score": gap.relevance_score,
                "severity": gap.severity,
                "last_collaboration": gap.last_collaboration.isoformat() if gap.last_collaboration else None,
                "reason": gap.reason,
                "recommendation": gap.recommendation
            }
            for gap in project_gaps
        ]
    }
    
    return result 