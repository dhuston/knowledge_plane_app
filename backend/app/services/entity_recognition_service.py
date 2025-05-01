import re
import logging
from typing import List, Dict, Optional, Tuple, Set
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app import models, schemas
from app.schemas.briefing import HighlightedEntity, HighlightedTextSegment
from app.crud.crud_project import project as crud_project
from app.crud.crud_team import team as crud_team
from app.crud.crud_user import user as crud_user
from app.crud.crud_goal import goal as crud_goal
from app.crud.crud_knowledge_asset import knowledge_asset as crud_knowledge_asset

logger = logging.getLogger(__name__)

class EntityRecognitionService:
    """Service for recognizing entities in text and highlighting them."""

    async def process_text(
        self,
        text: str,
        db: AsyncSession,
        user: models.User
    ) -> List[HighlightedTextSegment]:
        """
        Process text to identify and highlight entities.

        Args:
            text: The text to process
            db: Database session
            user: Current user for tenant context

        Returns:
            List of text segments with entities highlighted
        """
        # 1. Fetch entities from database for the user's tenant
        entities = await self._fetch_entities(db, user.tenant_id)

        # 2. Identify entities in the text
        segments = await self._identify_entities(text, entities)

        # 3. Post-process to handle any remaining IDs
        segments = await self._post_process_segments(segments, entities)

        return segments

    async def _post_process_segments(
        self,
        segments: List[HighlightedTextSegment],
        entities: Dict[str, List[Dict]]
    ) -> List[HighlightedTextSegment]:
        """
        Post-process segments to handle any remaining IDs in the text.

        This looks for patterns like "ID b4018e7c" or "with the ID 8a78fbc1" and
        tries to replace them with entity names or generic references.
        """
        # Create a flat list of all entities for ID lookup
        all_entities = []
        for entity_type, entity_list in entities.items():
            all_entities.extend(entity_list)

        # Create an ID to entity mapping
        id_to_entity = {entity["id"]: entity for entity in all_entities}

        # Process each text segment to look for IDs
        processed_segments = []

        for segment in segments:
            if segment.type == "entity":
                # Keep entity segments as is
                processed_segments.append(segment)
                continue

            # Look for ID patterns in text segments
            content = segment.content

            # Special case for the exact pattern in the example
            exact_pattern = r'(?i)Two projects were also created, one with the ID ([a-f0-9]{8}) and the other with the ID ([a-f0-9]{8})'
            match = re.search(exact_pattern, content)
            if match:
                id1 = match.group(1)
                id2 = match.group(2)

                # Find entity names for these IDs
                name1 = "a new project"
                name2 = "another new project"

                for entity_id, entity in id_to_entity.items():
                    if entity_id.startswith(id1) and entity["type"] == "project":
                        name1 = entity["name"]
                    if entity_id.startswith(id2) and entity["type"] == "project":
                        name2 = entity["name"]

                # Replace the entire segment with a better version
                new_content = f"Two new projects were created: {name1} and {name2}"
                processed_segments.append(HighlightedTextSegment(
                    type="text",
                    content=new_content
                ))
                continue

            # More general pattern for multiple IDs in parentheses
            general_pattern = r'(?i)(KnowledgeAssets|Projects|Teams|Goals|Users)\s*\(([a-f0-9, ]+)\)'
            match = re.search(general_pattern, content)
            if match:
                entity_type_text = match.group(1).lower()
                if entity_type_text.endswith('s'):
                    entity_type_text = entity_type_text[:-1]  # Remove trailing 's'

                # Extract IDs
                id_text = match.group(2)
                id_list = [id.strip() for id in id_text.split(',')]

                # Find entity names for these IDs
                entity_names = []

                for id_value in id_list:
                    found = False
                    for entity_id, entity in id_to_entity.items():
                        if entity_id.startswith(id_value) and entity["type"] == entity_type_text:
                            entity_names.append(entity["name"])
                            found = True
                            break

                    if not found:
                        entity_names.append(f"a {entity_type_text}")

                if entity_names:
                    # Format the list of names
                    if len(entity_names) == 1:
                        names_text = entity_names[0]
                    elif len(entity_names) == 2:
                        names_text = f"{entity_names[0]} and {entity_names[1]}"
                    else:
                        names_text = ", ".join(entity_names[:-1]) + f", and {entity_names[-1]}"

                    # Replace the entire segment
                    new_content = content.replace(match.group(0), names_text)
                    processed_segments.append(HighlightedTextSegment(
                        type="text",
                        content=new_content
                    ))
                    continue

            # Pattern for "ID <alphanumeric>" or "with the ID <alphanumeric>"
            id_patterns = [
                r'(?i)(?:ID|id|Id)\s+([a-f0-9]{8})',
                r'(?i)with\s+(?:the\s+)?(?:ID|id|Id)\s+([a-f0-9]{8})',
                r'(?i)(?:ID|id|Id):\s*([a-f0-9]{8})',
                r'(?i)\((?:ID|id|Id):\s*([a-f0-9]{8})\)',
                r'(?i)\(([a-f0-9]{8})\)',  # Just an ID in parentheses
                r'(?<!\w)([a-f0-9]{8})(?!\w)',  # Standalone 8-character hex ID
                r'(?i)one\s+with\s+(?:the\s+)?(?:ID|id|Id)\s+([a-f0-9]{8})',
                r'(?i)another\s+with\s+(?:the\s+)?(?:ID|id|Id)\s+([a-f0-9]{8})',
                # Specific pattern from the example
                r'(?i)projects\s*\(([a-f0-9]{8})',  # "projects (b4018e7c"
                r'(?i),\s*([a-f0-9]{8})',  # ", 8a78fbc1"
            ]

            # Find all matches across all patterns
            all_matches = []
            for pattern in id_patterns:
                for match in re.finditer(pattern, content):
                    id_value = match.group(1)
                    start, end = match.span()
                    all_matches.append((start, end, id_value))

            # Sort matches by position (start index)
            all_matches.sort(key=lambda x: x[0])

            # If no matches, keep the segment as is
            if not all_matches:
                processed_segments.append(segment)
                continue

            # Process matches and split the segment
            last_end = 0

            for start, end, id_value in all_matches:
                # Add text before the match
                if start > last_end:
                    processed_segments.append(HighlightedTextSegment(
                        type="text",
                        content=content[last_end:start]
                    ))

                # Find the entity for this ID
                entity_name = "this item"  # Default generic reference
                entity_type = "project"    # Default type

                # Look for exact match first
                if id_value in id_to_entity:
                    entity = id_to_entity[id_value]
                    entity_name = entity["name"]
                    entity_type = entity["type"]
                else:
                    # Look for partial match (ID prefix)
                    for entity_id, entity in id_to_entity.items():
                        if entity_id.startswith(id_value):
                            entity_name = entity["name"]
                            entity_type = entity["type"]
                            break

                # Add the entity segment
                processed_segments.append(HighlightedTextSegment(
                    type="entity",
                    content=entity_name,
                    entity=HighlightedEntity(
                        type=entity_type,
                        text=entity_name,
                        id=None  # We don't have the full ID
                    )
                ))

                last_end = end

            # Add remaining text
            if last_end < len(content):
                processed_segments.append(HighlightedTextSegment(
                    type="text",
                    content=content[last_end:]
                ))

        return processed_segments

    async def _fetch_entities(
        self,
        db: AsyncSession,
        tenant_id: UUID
    ) -> Dict[str, List[Dict]]:
        """Fetch all relevant entities from the database for the tenant."""
        try:
            # Fetch projects
            projects = await crud_project.get_multi_by_tenant(db, tenant_id=tenant_id)
            project_entities = [
                {
                    "id": str(p.id),
                    "name": p.name,
                    "type": "project",
                    "keywords": self._extract_keywords(p.name, p.description or ""),
                    # Add additional search terms
                    "search_terms": [
                        p.name,
                        f"project {p.name}",
                        f"{p.name} project"
                    ]
                }
                for p in projects
            ]

            # Fetch teams
            teams = await crud_team.get_multi_by_tenant(db, tenant_id=tenant_id)
            team_entities = [
                {
                    "id": str(t.id),
                    "name": t.name,
                    "type": "team",
                    "keywords": self._extract_keywords(t.name, t.description or ""),
                    # Add additional search terms
                    "search_terms": [
                        t.name,
                        f"team {t.name}",
                        f"{t.name} team"
                    ]
                }
                for t in teams
            ]

            # Fetch users
            users = await crud_user.get_multi_by_tenant(db, tenant_id=tenant_id)
            user_entities = [
                {
                    "id": str(u.id),
                    "name": u.name or "",
                    "type": "person",
                    "keywords": self._extract_keywords(u.name or "", u.title or ""),
                    # Add additional search terms - just the name for people
                    "search_terms": [u.name] if u.name else []
                }
                for u in users if u.name  # Only include users with names
            ]

            # Fetch goals
            goals = await crud_goal.get_multi_by_tenant(db, tenant_id=tenant_id)
            goal_entities = [
                {
                    "id": str(g.id),
                    "name": g.title,
                    "type": "goal",
                    "keywords": self._extract_keywords(g.title, g.description or ""),
                    # Add additional search terms
                    "search_terms": [
                        g.title,
                        f"goal {g.title}",
                        f"{g.title} goal"
                    ]
                }
                for g in goals
            ]

            # Fetch knowledge assets
            knowledge_assets = await crud_knowledge_asset.get_multi_by_tenant(db, tenant_id=tenant_id)
            knowledge_entities = [
                {
                    "id": str(k.id),
                    "name": k.title or "",
                    "type": "knowledge_asset",
                    "keywords": self._extract_keywords(k.title or "", ""),
                    # Add additional search terms
                    "search_terms": [
                        k.title,
                        f"knowledge asset {k.title}",
                        f"{k.title} knowledge asset",
                        f"note {k.title}",
                        f"{k.title} note"
                    ] if k.title else []
                }
                for k in knowledge_assets if k.title  # Only include assets with titles
            ]

            # Combine all entities
            return {
                "projects": project_entities,
                "teams": team_entities,
                "users": user_entities,
                "goals": goal_entities,
                "knowledge_assets": knowledge_entities
            }

        except Exception as e:
            logger.error(f"Error fetching entities: {e}", exc_info=True)
            return {
                "projects": [],
                "teams": [],
                "users": [],
                "goals": [],
                "knowledge_assets": []
            }

    def _extract_keywords(self, name: str, description: str) -> Set[str]:
        """Extract keywords from name and description."""
        # Combine name and description
        text = f"{name} {description}".lower()

        # Remove punctuation and split into words
        words = re.findall(r'\b\w+\b', text)

        # Remove common stop words
        stop_words = {
            'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'what',
            'when', 'where', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
            'most', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
            'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don',
            'should', 'now', 'to', 'of', 'for', 'with', 'in', 'on', 'at', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
            'had', 'having', 'do', 'does', 'did', 'doing'
        }

        keywords = {word for word in words if word not in stop_words and len(word) > 2}

        # Add the full name as a keyword phrase (for exact matching)
        if name:
            keywords.add(name.lower())

        return keywords

    async def _identify_entities(
        self,
        text: str,
        entities: Dict[str, List[Dict]]
    ) -> List[HighlightedTextSegment]:
        """
        Identify entities in the text and create highlighted segments.

        This uses a simple approach:
        1. Identify calendar events using regex patterns
        2. Identify known entities by name matching
        3. Split the text into segments with entities highlighted
        """
        # First, identify calendar events using regex
        calendar_events = self._identify_calendar_events(text)

        # Then, identify known entities by name matching
        entity_matches = self._identify_known_entities(text, entities)

        # Combine all matches and sort by position
        all_matches = calendar_events + entity_matches
        all_matches.sort(key=lambda x: x[0])  # Sort by start position

        # Create segments
        segments = []
        last_end = 0

        for start, end, entity_type, entity_text, entity_id in all_matches:
            # Add text segment before the entity
            if start > last_end:
                segments.append(HighlightedTextSegment(
                    type="text",
                    content=text[last_end:start]
                ))

            # Add entity segment
            segments.append(HighlightedTextSegment(
                type="entity",
                content=text[start:end],
                entity=HighlightedEntity(
                    type=entity_type,
                    text=entity_text,
                    id=entity_id
                )
            ))

            last_end = end

        # Add remaining text
        if last_end < len(text):
            segments.append(HighlightedTextSegment(
                type="text",
                content=text[last_end:]
            ))

        return segments

    def _identify_calendar_events(self, text: str) -> List[Tuple[int, int, str, str, Optional[str]]]:
        """
        Identify calendar events in text using regex patterns.
        Returns a list of (start_pos, end_pos, entity_type, entity_text, entity_id)
        """
        matches = []

        # Pattern for meetings with time
        meeting_patterns = [
            # Standard meeting pattern: "meeting at 2:00 PM"
            r'(?i)(meeting|call|conference|discussion|presentation|workshop|webinar|session)\s+(?:at|on|for)?\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))',

            # Time followed by event: "2:00 PM meeting"
            r'(?i)(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\s+(meeting|call|conference|discussion|presentation|workshop|webinar|session)',

            # Date patterns: "meeting on January 15" or "January 15 meeting"
            r'(?i)(meeting|call|conference|discussion|presentation|workshop|webinar|session)\s+(?:on|for)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?',
            r'(?i)(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?\s+(meeting|call|conference|discussion|presentation|workshop|webinar|session)',

            # Today/tomorrow patterns
            r'(?i)(today|tomorrow|this\s+(?:morning|afternoon|evening))(?:\'s)?\s+(meeting|call|conference|discussion|presentation|workshop|webinar|session)',
            r'(?i)(meeting|call|conference|discussion|presentation|workshop|webinar|session)\s+(?:scheduled\s+for)?\s+(today|tomorrow|this\s+(?:morning|afternoon|evening))',

            # Day of week patterns
            r'(?i)(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\'s)?\s+(meeting|call|conference|discussion|presentation|workshop|webinar|session)',
            r'(?i)(meeting|call|conference|discussion|presentation|workshop|webinar|session)\s+(?:on|this|next)?\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)',
        ]

        for pattern in meeting_patterns:
            for match in re.finditer(pattern, text):
                start, end = match.span()
                event_text = match.group(0)

                # Check if this match overlaps with any existing matches
                overlaps = False
                for m_start, m_end, _, _, _ in matches:
                    if (start <= m_end and end >= m_start):
                        overlaps = True
                        break

                if not overlaps:
                    matches.append((start, end, "event", event_text, None))

        return matches

    def _identify_known_entities(
        self,
        text: str,
        entities: Dict[str, List[Dict]]
    ) -> List[Tuple[int, int, str, str, Optional[str]]]:
        """
        Identify known entities in text by name matching.
        Returns a list of (start_pos, end_pos, entity_type, entity_text, entity_id)
        """
        matches = []

        # Map entity types to schema types
        type_mapping = {
            "projects": "project",
            "teams": "team",
            "users": "person",
            "goals": "goal",
            "knowledge_assets": "knowledge_asset"
        }

        # First, check for ID references in parentheses
        # Pattern like: KnowledgeAssets (5d9f42f4, 109b3bf3, a77c75b2)
        id_pattern = r'(KnowledgeAssets|Projects|Teams|Goals|Users)\s*\(([a-f0-9, ]+)\)'
        for match in re.finditer(id_pattern, text, re.IGNORECASE):
            entity_type_text = match.group(1).lower()
            if entity_type_text.endswith('s'):
                entity_type_text = entity_type_text[:-1]  # Remove trailing 's'

            schema_type = None
            for key, value in type_mapping.items():
                if entity_type_text in key.lower():
                    schema_type = value
                    break

            if not schema_type:
                continue

            # Extract IDs
            id_text = match.group(2)
            id_list = [id.strip() for id in id_text.split(',')]

            # Find entity names for these IDs
            entity_names = []
            entity_type_key = next((k for k, v in type_mapping.items() if v == schema_type), None)

            if entity_type_key and entity_type_key in entities:
                for entity_id in id_list:
                    for entity in entities[entity_type_key]:
                        if entity["id"].startswith(entity_id):
                            entity_names.append(entity["name"])
                            break

            # If we found entity names, create a match for the entire parenthetical expression
            if entity_names:
                start, end = match.span()
                entity_text = f"{entity_type_text.capitalize()}: {', '.join(entity_names)}"
                matches.append((
                    start,
                    end,
                    schema_type,
                    entity_text,
                    None  # No specific ID since this is a group
                ))

        # Then, check for each entity by name
        for entity_type, entity_list in entities.items():
            schema_type = type_mapping.get(entity_type)
            if not schema_type:
                continue

            for entity in entity_list:
                entity_name = entity["name"]
                if not entity_name or len(entity_name) < 3:
                    continue

                # Get all search terms for this entity
                search_terms = entity.get("search_terms", [entity_name])

                # Look for each search term in the text
                for term in search_terms:
                    if not term or len(term) < 3:
                        continue

                    # Use word boundaries to avoid partial matches
                    pattern = r'\b' + re.escape(term) + r'\b'
                    for match in re.finditer(pattern, text, re.IGNORECASE):
                        start, end = match.span()

                        # Check if this match overlaps with any existing matches
                        overlaps = False
                        for m_start, m_end, _, _, _ in matches:
                            if (start <= m_end and end >= m_start):
                                overlaps = True
                                break

                        if not overlaps:
                            matches.append((
                                start,
                                end,
                                schema_type,
                                entity_name,  # Always use the entity name, not the search term
                                entity["id"]
                            ))

        return matches

# Create a singleton instance
entity_recognition_service = EntityRecognitionService()
