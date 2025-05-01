"""Default processor implementation for the integration framework."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID, uuid4
from datetime import datetime

from app.integrations.base_processor import BaseProcessor

logger = logging.getLogger(__name__)


class DefaultProcessor(BaseProcessor):
    """
    Default implementation of BaseProcessor.
    
    This processor provides a basic implementation that can handle
    common entity types and relationships.
    """
    
    async def _process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """
        Process raw data from an external system into an internal entity.
        
        Args:
            raw_data: Raw data from the external system
            entity_type: Type of entity to process
            
        Returns:
            Processed entity data or None if not applicable
        """
        # Extract external ID 
        external_id = raw_data.get("id")
        if not external_id:
            logger.warning(f"Skipping {entity_type} with no external ID")
            return None
        
        # Create props dict based on entity type
        if entity_type == "user":
            props = {
                "name": raw_data.get("name") or raw_data.get("display_name"),
                "email": raw_data.get("email") or raw_data.get("mail"),
                "title": raw_data.get("title") or raw_data.get("job_title"),
                "department": raw_data.get("department"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "team":
            props = {
                "name": raw_data.get("name") or raw_data.get("display_name"),
                "description": raw_data.get("description"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "project":
            props = {
                "name": raw_data.get("name") or raw_data.get("title"),
                "description": raw_data.get("description"),
                "status": raw_data.get("status"),
                "start_date": raw_data.get("start_date"),
                "end_date": raw_data.get("end_date") or raw_data.get("due_date"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "goal":
            props = {
                "name": raw_data.get("name") or raw_data.get("title"),
                "description": raw_data.get("description"),
                "status": raw_data.get("status"),
                "progress": raw_data.get("progress") or raw_data.get("completion"),
                "due_date": raw_data.get("due_date"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "document":
            props = {
                "name": raw_data.get("name") or raw_data.get("title"),
                "description": raw_data.get("description"),
                "file_type": raw_data.get("file_type") or raw_data.get("mime_type"),
                "url": raw_data.get("url") or raw_data.get("web_url"),
                "created_at": raw_data.get("created_at") or raw_data.get("created"),
                "updated_at": raw_data.get("updated_at") or raw_data.get("modified"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "calendar_event":
            props = {
                "title": raw_data.get("summary") or raw_data.get("subject"),
                "description": raw_data.get("description"),
                "start_time": raw_data.get("start", {}).get("dateTime") or raw_data.get("start_time"),
                "end_time": raw_data.get("end", {}).get("dateTime") or raw_data.get("end_time"),
                "location": raw_data.get("location"),
                "organizer": raw_data.get("organizer", {}).get("email") if isinstance(raw_data.get("organizer"), dict) else raw_data.get("organizer"),
                "calendar_id": raw_data.get("calendar_id"),
                "calendar_name": raw_data.get("calendar_name"),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        elif entity_type == "research_paper":
            props = {
                "title": raw_data.get("title"),
                "abstract": raw_data.get("abstract"),
                "authors": raw_data.get("authors", []),
                "publication_date": raw_data.get("publication_date"),
                "journal": raw_data.get("journal"),
                "doi": raw_data.get("doi"),
                "url": raw_data.get("url"),
                "citations": raw_data.get("citation_count"),
                "topics": raw_data.get("topics", []),
                "external_id": str(external_id),
                "source": raw_data.get("source", "integration"),
                "last_updated": datetime.now().isoformat()
            }
        
        else:
            # Generic entity processing for unknown types
            props = {k: v for k, v in raw_data.items() if not isinstance(v, (dict, list))}
            props["external_id"] = str(external_id)
            props["source"] = raw_data.get("source", "integration")
            props["last_updated"] = datetime.now().isoformat()
        
        # Filter out None values
        props = {k: v for k, v in props.items() if v is not None}
        
        # Create entity data
        return {
            "type": entity_type,
            "props": props
        }
    
    async def _process_relationship(
        self, 
        source_entity: Dict[str, Any], 
        target_entity: Dict[str, Any], 
        relationship_type: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Process relationship between two entities.
        
        Args:
            source_entity: Source entity data
            target_entity: Target entity data
            relationship_type: Type of relationship
            
        Returns:
            Processed relationship data or None if not applicable
        """
        if not source_entity or not target_entity:
            return None
        
        source_id = source_entity.get("id")
        target_id = target_entity.get("id")
        
        if not source_id or not target_id:
            return None
        
        # Determine relationship label based on entity types if not provided
        if not relationship_type:
            source_type = source_entity.get("type")
            target_type = target_entity.get("type")
            
            # Default relationships based on entity type combinations
            if source_type == "user" and target_type == "team":
                relationship_type = "MEMBER_OF"
            elif source_type == "user" and target_type == "project":
                relationship_type = "PARTICIPATES_IN"
            elif source_type == "user" and target_type == "document":
                relationship_type = "OWNER_OF"
            elif source_type == "team" and target_type == "project":
                relationship_type = "OWNS"
            elif source_type == "project" and target_type == "goal":
                relationship_type = "CONTRIBUTES_TO"
            elif source_type == "user" and target_type == "calendar_event":
                relationship_type = "PARTICIPATES_IN"
            elif source_type == "user" and target_type == "research_paper":
                relationship_type = "AUTHORED"
            else:
                # Generic relationship
                relationship_type = "RELATED_TO"
        
        # Create relationship data
        return {
            "src": source_id,
            "dst": target_id,
            "label": relationship_type,
            "props": {
                "created_at": datetime.now().isoformat(),
                "source": "integration"
            }
        }