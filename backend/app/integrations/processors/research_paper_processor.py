"""Research paper data processor for integration framework."""

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


class ResearchPaperProcessor(BaseProcessor):
    """
    Processor for research papers from sources like PubMed.
    
    This processor transforms research paper data into nodes and edges in the
    knowledge graph, with relationships between papers, authors, and topics.
    
    Attributes:
        PROCESSOR_TYPE: Type identifier for this processor
        ENTITY_TYPES: List of entity types this processor can handle
    """
    
    PROCESSOR_TYPE = "research_paper"
    ENTITY_TYPES = ["research_paper", "journal_article", "publication"]
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Process a research paper entity.
        
        Args:
            data: Raw research paper data
            entity_type: Type of entity to process
            
        Returns:
            Dict containing the processed entity and metadata
            
        Raises:
            ProcessingError: If processing fails
        """
        if entity_type not in self.ENTITY_TYPES:
            logger.warning(f"Research paper processor received unsupported entity type: {entity_type}")
            return None
        
        try:
            # Extract key properties
            paper_id = data.get('id')
            title = data.get('title', 'Untitled Paper')
            abstract = data.get('abstract', '')
            authors = data.get('authors', [])
            journal = data.get('journal')
            publication_date = self._parse_date(data.get('publication_date'))
            doi = data.get('doi')
            pmid = data.get('pmid')
            keywords = data.get('keywords', [])
            citations = data.get('citations', [])
            source = data.get('source', 'unknown')
            
            # Generate a unique ID for the paper
            paper_uuid = self._generate_entity_id(paper_id or doi or pmid, source)
            
            # Process and create paper node in the knowledge graph
            paper_node = await self._process_paper_node(
                paper_uuid=paper_uuid,
                title=title,
                abstract=abstract,
                journal=journal,
                publication_date=publication_date,
                doi=doi,
                pmid=pmid,
                source=source
            )
            
            # Extract additional topics from title and abstract
            topics = set(keywords)
            additional_topics = self._extract_topics(title, abstract)
            topics.update(additional_topics)
            
            # Process authors and create relationships
            author_nodes = await self._process_authors(authors, paper_uuid)
            
            # Process topics and create relationships
            topic_nodes = await self._process_topics(topics, paper_uuid)
            
            # Process citations and create relationships
            citation_edges = await self._process_citations(citations, paper_uuid, source)
            
            # Return processed data including nodes and relationships
            return {
                "id": paper_uuid,
                "type": "research_paper",
                "title": title,
                "publication_date": publication_date,
                "journal": journal,
                "doi": doi,
                "pmid": pmid,
                "author_count": len(authors),
                "topic_count": len(topics),
                "citation_count": len(citations),
                "nodes": [paper_node] + author_nodes + topic_nodes,
                "source": source
            }
            
        except Exception as e:
            logger.error(f"Error processing research paper: {e}")
            return None
    
    async def _process_paper_node(
        self,
        paper_uuid: str,
        title: str,
        abstract: str,
        journal: Optional[str],
        publication_date: Optional[datetime],
        doi: Optional[str],
        pmid: Optional[str],
        source: str
    ) -> Dict[str, Any]:
        """
        Process and create a node for a research paper.
        
        Args:
            paper_uuid: UUID for the paper
            title: Paper title
            abstract: Paper abstract
            journal: Journal name
            publication_date: Publication date
            doi: Digital Object Identifier
            pmid: PubMed ID
            source: Data source (e.g., "pubmed")
            
        Returns:
            Dictionary with node information
        """
        # Prepare node properties
        node_properties = {
            "title": title,
            "abstract": abstract,
            "journal": journal,
            "publication_date": publication_date.isoformat() if publication_date else None,
            "doi": doi,
            "pmid": pmid,
            "source_system": source
        }
        
        # Create or update paper node
        paper_node = await self._get_or_create_node(
            node_id=paper_uuid,
            node_type=NodeType.KNOWLEDGE_ASSET,
            name=title,
            asset_type=KnowledgeAssetType.RESEARCH_PAPER,
            properties=node_properties,
            tenant_id=self._tenant_id
        )
        
        return {
            "id": paper_uuid,
            "type": "research_paper",
            "name": title
        }
    
    async def _process_authors(
        self,
        authors: List[Dict[str, Any]],
        paper_id: str
    ) -> List[Dict[str, Any]]:
        """
        Process authors and create relationships to the paper.
        
        Args:
            authors: List of author objects
            paper_id: UUID of the paper
            
        Returns:
            List of author node information dictionaries
        """
        author_nodes = []
        
        for i, author in enumerate(authors):
            # Skip empty entries
            if not author:
                continue
                
            name = author.get("name")
            if not name:
                continue
            
            # Try to get unique ID for author
            author_identifier = (
                author.get("orcid") or 
                author.get("researcher_id") or 
                author.get("scopus_id")
            )
            
            # Generate a reasonably unique ID for this author
            if author_identifier:
                author_id = self._generate_entity_id(author_identifier, "author")
            else:
                # Use name + affiliation if no identifier
                affiliation = author.get("affiliation", "")
                author_id = self._generate_entity_id(f"{name}|{affiliation}", "author")
            
            # Create or update author node
            author_node = await self._get_or_create_node(
                node_id=author_id,
                node_type=NodeType.USER,
                name=name,
                properties={
                    "name": name,
                    "affiliation": author.get("affiliation"),
                    "orcid": author.get("orcid"),
                    "email": author.get("email")
                },
                tenant_id=self._tenant_id
            )
            
            # Create relationship between author and paper
            edge = Edge(
                source_id=author_id,
                target_id=paper_id,
                edge_type=EdgeType.AUTHORED,
                tenant_id=self._tenant_id,
                properties={
                    "author_position": i + 1,
                    "is_corresponding": author.get("is_corresponding", False)
                }
            )
            
            await self._create_or_update_edge(edge)
            
            author_nodes.append({
                "id": author_id,
                "type": "author",
                "name": name,
                "affiliation": author.get("affiliation"),
                "position": i + 1
            })
        
        return author_nodes
    
    async def _process_topics(
        self,
        topics: Set[str],
        paper_id: str
    ) -> List[Dict[str, Any]]:
        """
        Process topics and create relationships to the paper.
        
        Args:
            topics: Set of topic strings
            paper_id: UUID of the paper
            
        Returns:
            List of topic node information dictionaries
        """
        topic_nodes = []
        
        for topic in topics:
            # Skip very short topics
            if not topic or len(topic) < 3:
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
            
            # Create relationship between paper and topic
            edge = Edge(
                source_id=paper_id,
                target_id=topic_id,
                edge_type=EdgeType.HAS_TOPIC,
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
    
    async def _process_citations(
        self,
        citations: List[Dict[str, Any]],
        paper_id: str,
        source: str
    ) -> List[Dict[str, Any]]:
        """
        Process citations and create relationships between papers.
        
        Args:
            citations: List of cited paper objects
            paper_id: UUID of the citing paper
            source: Data source identifier
            
        Returns:
            List of citation edge information dictionaries
        """
        citation_edges = []
        
        for citation in citations:
            # Skip empty entries
            if not citation:
                continue
                
            # Try to get a unique identifier for the cited paper
            cited_id = citation.get("doi") or citation.get("pmid") or citation.get("id")
            
            if not cited_id:
                # Skip citations without an ID
                continue
                
            # Generate UUID for the cited paper
            cited_paper_id = self._generate_entity_id(cited_id, source)
            
            # Create relationship between papers
            edge = Edge(
                source_id=paper_id,
                target_id=cited_paper_id,
                edge_type=EdgeType.CITES,
                tenant_id=self._tenant_id,
                properties={}
            )
            
            await self._create_or_update_edge(edge)
            
            citation_edges.append({
                "source_id": paper_id,
                "target_id": cited_paper_id,
                "type": "citation"
            })
        
        return citation_edges
    
    def _extract_topics(self, title: str, abstract: str) -> Set[str]:
        """
        Extract topic keywords from paper title and abstract.
        
        Args:
            title: Paper title
            abstract: Paper abstract
            
        Returns:
            Set of topic strings
        """
        topics = set()
        
        if not title and not abstract:
            return topics
        
        # Combine text for analysis
        text = f"{title} {abstract}"
        
        # This is a very basic approach; in a real system you'd use NLP and named entity recognition
        # Define some patterns that might indicate research topics or fields
        topic_indicators = [
            # Topic sections in abstracts
            r'(?:keywords|key\s+words|topics):\s*(.*?)(?=\.|$)',
            # Common phrases that introduce topics
            r'(?:in the field of|related to|focusing on|specializing in)\s+([A-Z][a-zA-Z\s]+)',
            # Capitalized multi-word phrases (often field names)
            r'\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\b'
        ]
        
        for pattern in topic_indicators:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]  # Extract from capture group
                    
                # Split by commas or semicolons and clean up
                parts = re.split(r'[,;]', match)
                for part in parts:
                    topic = part.strip()
                    if topic and len(topic) >= 3 and len(topic) <= 50:
                        topics.add(topic)
        
        return topics
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """
        Parse publication date from string.
        
        Args:
            date_str: Date string in various formats
            
        Returns:
            Parsed datetime object or None
        """
        if not date_str:
            return None
            
        # Try several common date formats
        date_formats = [
            "%Y-%m-%d",  # ISO format
            "%Y/%m/%d",
            "%d %b %Y",  # 01 Jan 2023
            "%b %d, %Y",  # Jan 01, 2023
            "%Y %b %d",  # 2023 Jan 01
            "%Y"  # Just year
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
                
        # If all formats fail, try to extract just the year
        year_match = re.search(r'\b(19|20)\d{2}\b', date_str)
        if year_match:
            year = year_match.group(0)
            try:
                return datetime(int(year), 1, 1)
            except ValueError:
                pass
                
        return None
    
    def _generate_entity_id(self, original_id: str, namespace: str) -> str:
        """
        Generate a deterministic UUID for an entity.
        
        Args:
            original_id: Original entity ID
            namespace: Namespace for the ID (e.g., "paper", "author")
            
        Returns:
            UUID string
        """
        if not original_id:
            return str(uuid.uuid4())
        
        # Create namespace UUID based on the entity type
        namespace_uuid = uuid.uuid5(uuid.NAMESPACE_DNS, f"knowledgeplane.{namespace}")
        
        # Generate a deterministic UUID based on the ID and namespace
        return str(uuid.uuid5(namespace_uuid, original_id))