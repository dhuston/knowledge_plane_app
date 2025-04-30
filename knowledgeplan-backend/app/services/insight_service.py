import logging
from collections import defaultdict
from typing import List, Dict, Set, Tuple
from uuid import UUID
import re

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_project import project as crud_project
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
                    overlaps[proj_id_1].append(proj_id_2)
                    overlaps[proj_id_2].append(proj_id_1)
        
        logger.info(f"Found {len(overlaps)} projects with potential overlaps for tenant {tenant_id}.")
        return dict(overlaps) # Convert back to regular dict

# Singleton instance
insight_service = InsightService() 