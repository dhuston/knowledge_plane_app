from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal, Union

class HighlightedEntity(BaseModel):
    type: Literal['project', 'person', 'team', 'goal', 'event', 'knowledge_asset']
    text: str
    id: Optional[str] = None

class HighlightedTextSegment(BaseModel):
    type: Literal['text', 'entity']
    content: str
    entity: Optional[HighlightedEntity] = None

class BriefingResponse(BaseModel):
    summary: str
    highlighted_summary: Optional[List[HighlightedTextSegment]] = None