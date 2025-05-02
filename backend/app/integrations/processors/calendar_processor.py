"""Calendar event data processor for integration framework."""

import logging
import uuid
import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Set, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base_processor import BaseProcessor
from app.models.knowledge_asset import KnowledgeAssetType
from app.models.node import Node, NodeType
from app.models.edge import Edge, EdgeType

logger = logging.getLogger(__name__)


class CalendarEventProcessor(BaseProcessor):
    """
    Processor for calendar events from Google Calendar and Microsoft Outlook.
    
    This processor transforms calendar events into nodes and edges in the
    knowledge graph, with relationships between meetings, attendees, and topics.
    
    Attributes:
        PROCESSOR_TYPE: Type identifier for this processor
        ENTITY_TYPES: List of entity types this processor can handle
    """
    
    PROCESSOR_TYPE = "calendar"
    ENTITY_TYPES = ["calendar_event"]
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Process a calendar event entity.
        
        Args:
            data: Raw calendar event data
            entity_type: Type of entity (must be "calendar_event")
            
        Returns:
            Dict containing the processed entity and metadata
            
        Raises:
            ProcessingError: If processing fails
        """
        if entity_type != "calendar_event":
            logger.warning(f"Calendar processor received unsupported entity type: {entity_type}")
            return None
        
        try:
            # Extract key properties
            event_id = data.get('id')
            summary = data.get('summary', 'Untitled Event')
            description = data.get('description', '')
            start_time = self._parse_datetime(data.get('start'))
            end_time = self._parse_datetime(data.get('end'))
            attendees = data.get('attendees', [])
            location = data.get('location')
            organizer = data.get('organizer')
            source = data.get('source')
            
            # Generate a unique ID for the event
            event_uuid = self._generate_entity_id(event_id, source)
            
            # Process and create event node in the knowledge graph
            event_node = await self._process_event_node(
                event_uuid=event_uuid,
                summary=summary,
                description=description,
                start_time=start_time,
                end_time=end_time,
                location=location,
                source=source
            )
            
            # Extract topics from event summary and description
            topics = self._extract_topics(summary, description)
            
            # Process attendees and create relationships
            attendee_nodes = await self._process_attendees(attendees, event_uuid, organizer)
            
            # Process topics and create relationships
            topic_nodes = await self._process_topics(topics, event_uuid)
            
            # Return processed data including nodes and relationships
            return {
                "id": event_uuid,
                "type": "calendar_event",
                "title": summary,
                "start_time": start_time,
                "end_time": end_time,
                "location": location,
                "attendee_count": len(attendees),
                "topic_count": len(topics),
                "nodes": [event_node] + attendee_nodes + topic_nodes,
                "source": source
            }
            
        except Exception as e:
            logger.error(f"Error processing calendar event: {e}")
            return None
    
    async def _process_event_node(
        self,
        event_uuid: str,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        location: str,
        source: str
    ) -> Dict[str, Any]:
        """
        Process and create a node for a calendar event.
        
        Args:
            event_uuid: UUID for the event
            summary: Event title/summary
            description: Event description
            start_time: Event start time
            end_time: Event end time
            location: Event location
            source: Data source (e.g., "google_calendar")
            
        Returns:
            Dictionary with node information
        """
        # Calculate duration in minutes
        duration_mins = 0
        if start_time and end_time:
            duration = end_time - start_time
            duration_mins = duration.total_seconds() / 60
        
        # Prepare node properties
        node_properties = {
            "title": summary,
            "description": description,
            "start_time": start_time.isoformat() if start_time else None,
            "end_time": end_time.isoformat() if end_time else None,
            "duration_minutes": duration_mins,
            "location": location,
            "source_system": source
        }
        
        # Create or update event node
        event_node = await self._get_or_create_node(
            node_id=event_uuid,
            node_type=NodeType.KNOWLEDGE_ASSET,
            name=summary,
            asset_type=KnowledgeAssetType.MEETING,
            properties=node_properties,
            tenant_id=self._tenant_id
        )
        
        return {
            "id": event_uuid,
            "type": "event",
            "name": summary
        }
    
    async def _process_attendees(
        self,
        attendees: List[Dict[str, Any]],
        event_id: str,
        organizer: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process attendees and create relationships to the event.
        
        Args:
            attendees: List of attendee objects
            event_id: UUID of the event
            organizer: Organizer information
            
        Returns:
            List of attendee node information dictionaries
        """
        attendee_nodes = []
        
        # Track organizer email
        organizer_email = None
        if organizer and "email" in organizer:
            organizer_email = organizer["email"].lower()
        
        # Process each attendee
        for attendee in attendees:
            # Skip empty entries
            if not attendee:
                continue
                
            email = attendee.get("email")
            if not email:
                continue
                
            email = email.lower()  # Normalize email
            
            # Get name from attendee info
            name = attendee.get("displayName", email.split("@")[0])
            
            # Create a deterministic UUID for this person
            attendee_id = self._generate_entity_id(email, "person")
            
            # Create or update person node
            person_node = await self._get_or_create_node(
                node_id=attendee_id,
                node_type=NodeType.USER,
                name=name,
                properties={
                    "email": email,
                    "displayName": name
                },
                tenant_id=self._tenant_id
            )
            
            # Determine relationship type based on response status and organizer
            is_organizer = email == organizer_email
            response_status = attendee.get("responseStatus", "").lower()
            
            if is_organizer:
                edge_type = EdgeType.ORGANIZED
            elif response_status == "accepted":
                edge_type = EdgeType.ATTENDED
            elif response_status == "declined":
                edge_type = EdgeType.DECLINED
            else:
                edge_type = EdgeType.INVITED
            
            # Create relationship between person and event
            edge = Edge(
                source_id=attendee_id,
                target_id=event_id,
                edge_type=edge_type,
                tenant_id=self._tenant_id,
                properties={
                    "response_status": response_status,
                    "optional": attendee.get("optional", False)
                }
            )
            
            await self._create_or_update_edge(edge)
            
            attendee_nodes.append({
                "id": attendee_id,
                "type": "person",
                "name": name,
                "email": email,
                "relationship": edge_type.value
            })
        
        return attendee_nodes
    
    async def _process_topics(
        self,
        topics: Set[str],
        event_id: str
    ) -> List[Dict[str, Any]]:
        """
        Process topics and create relationships to the event.
        
        Args:
            topics: Set of topic strings
            event_id: UUID of the event
            
        Returns:
            List of topic node information dictionaries
        """
        topic_nodes = []
        
        for topic in topics:
            # Skip very short topics
            if len(topic) < 3:
                continue
                
            # Create a deterministic UUID for this topic
            topic_id = self._generate_entity_id(topic.lower(), "topic")
            
            # Create or update topic node
            topic_node = await self._get_or_create_node(
                node_id=topic_id,
                node_type=NodeType.KNOWLEDGE_ASSET,
                name=topic,
                asset_type=KnowledgeAssetType.TOPIC,
                properties={
                    "name": topic
                },
                tenant_id=self._tenant_id
            )
            
            # Create relationship between topic and event
            edge = Edge(
                source_id=event_id,
                target_id=topic_id,
                edge_type=EdgeType.RELATED_TO,
                tenant_id=self._tenant_id,
                properties={}
            )
            
            await self._create_or_update_edge(edge)
            
            topic_nodes.append({
                "id": topic_id,
                "type": "topic",
                "name": topic
            })
        
        return topic_nodes
    
    def _extract_topics(self, summary: str, description: str) -> Set[str]:
        """
        Extract topic keywords from event summary and description.
        
        Args:
            summary: Event title/summary
            description: Event description
            
        Returns:
            Set of topic strings
        """
        topics = set()
        
        if not summary and not description:
            return topics
        
        # Combine text for analysis
        text = f"{summary} {description}"
        
        # Look for hashtags
        hashtag_pattern = r'#([a-zA-Z0-9_]+)'
        hashtags = re.findall(hashtag_pattern, text)
        topics.update(hashtags)
        
        # Look for common topic indicators
        topic_indicators = [
            r'agenda item[s]?:\s*(.*?)(?=\n|$)',
            r'topic[s]?:\s*(.*?)(?=\n|$)',
            r'discuss(?:ing)?:\s*(.*?)(?=\n|$)',
            r'review(?:ing)?:\s*(.*?)(?=\n|$)',
            r'objective[s]?:\s*(.*?)(?=\n|$)'
        ]
        
        for pattern in topic_indicators:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Split by commas or semicolons and clean up
                parts = re.split(r'[,;]', match)
                for part in parts:
                    topic = part.strip()
                    if topic and len(topic) >= 3 and len(topic) <= 50:
                        topics.add(topic)
        
        # Extract keywords using simple keyword extraction
        # This is a very basic approach; in a real system you'd use NLP
        stopwords = {"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "with"}
        words = re.findall(r'\b[a-zA-Z]{3,}\b', summary.lower())
        words = [w for w in words if w not in stopwords]
        
        # Count frequency
        word_count = {}
        for word in words:
            word_count[word] = word_count.get(word, 0) + 1
        
        # Add frequent words as topics
        for word, count in word_count.items():
            if count > 1 and len(word) >= 4:  # Words that appear multiple times
                topics.add(word.title())  # Capitalize
        
        return topics
    
    def _parse_datetime(self, time_data: Optional[Dict[str, Any]]) -> Optional[datetime]:
        """
        Parse datetime from calendar event time data.
        
        Args:
            time_data: Dictionary with date/time information
            
        Returns:
            Parsed datetime object or None
        """
        if not time_data:
            return None
            
        # Handle different time formats from various providers
        if "dateTime" in time_data:
            # ISO format datetime
            try:
                return datetime.fromisoformat(time_data["dateTime"].replace('Z', '+00:00'))
            except (ValueError, TypeError):
                return None
        elif "date" in time_data:
            # All-day event
            try:
                date_str = time_data["date"]
                return datetime.fromisoformat(f"{date_str}T00:00:00")
            except (ValueError, TypeError):
                return None
        
        return None
    
    def _generate_entity_id(self, original_id: str, namespace: str) -> str:
        """
        Generate a deterministic UUID for an entity.
        
        Args:
            original_id: Original entity ID
            namespace: Namespace for the ID (e.g., "calendar_event")
            
        Returns:
            UUID string
        """
        if not original_id:
            return str(uuid.uuid4())
        
        # Create namespace UUID based on the entity type
        namespace_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"knowledgeplane.{namespace}")
        
        # Generate a deterministic UUID based on the ID and namespace
        return str(uuid.uuid5(namespace_uuid, original_id))