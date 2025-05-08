"""
Research data connector for academic and research paper integrations.
"""

import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
from datetime import datetime, timedelta
import json

from app.integrations.base import BaseConnector

logger = logging.getLogger(__name__)


class PubMedConnector(BaseConnector):
    """
    Connector for PubMed research database.
    
    Provides access to research papers, authors, and citations.
    """
    
    CONNECTOR_TYPE = "pubmed"
    SUPPORTED_ENTITY_TYPES = ["paper", "author", "journal"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        super().__init__(config, credentials)
        
        # Extract configuration
        self.search_terms = config.get("search_terms", [])
        self.max_results = config.get("max_results", 100)
        self.date_range_days = config.get("date_range_days", 30)
        
        # Extract API credentials
        self.api_key = credentials.get("api_key", "")
        self.email = credentials.get("email", "")
        self.tool = credentials.get("tool", "Biosphere_Alpha")
        
    async def connect(self) -> bool:
        """
        Connect to PubMed API using provided credentials.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # In a real implementation, we would test the API connection
            # For example, using the Biopython library:
            # from Bio import Entrez
            # Entrez.email = self.email
            # Entrez.api_key = self.api_key
            # Entrez.tool = self.tool
            # handle = Entrez.einfo()
            # record = Entrez.read(handle)
            # handle.close()
            
            # For this simplified version, we just log and set connected state
            logger.info(f"Connected to PubMed API as {self.email}")
            self.is_connected = True
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to PubMed API: {e}")
            self.is_connected = False
            return False
    
    async def fetch_data(
        self, 
        entity_type: str,
        last_sync_time: Optional[datetime] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Fetch research data from PubMed.
        
        Args:
            entity_type: Type of entity to fetch ('paper', 'author', 'journal')
            last_sync_time: Optional timestamp for incremental sync
            
        Yields:
            Raw data dictionaries for each entity
        """
        if not self.is_connected:
            await self.connect()
            if not self.is_connected:
                logger.error("Cannot fetch data: Not connected to PubMed API")
                return
        
        # Calculate date range for search
        end_date = datetime.now()
        if last_sync_time:
            start_date = last_sync_time
        else:
            start_date = end_date - timedelta(days=self.date_range_days)
        
        date_filter = f"{start_date.strftime('%Y/%m/%d')}:{end_date.strftime('%Y/%m/%d')}[dp]"
        
        if entity_type == "paper":
            # In a real implementation, we would search and fetch papers
            # For example:
            # search_terms = " OR ".join(f'"{term}"[Title/Abstract]' for term in self.search_terms)
            # query = f"({search_terms}) AND {date_filter}"
            # handle = Entrez.esearch(db="pubmed", term=query, retmax=self.max_results)
            # record = Entrez.read(handle)
            # handle.close()
            # id_list = record["IdList"]
            
            # for pmid in id_list:
            #     paper_handle = Entrez.efetch(db="pubmed", id=pmid, retmode="xml")
            #     papers = Entrez.read(paper_handle)
            #     paper_handle.close()
            #     yield papers
            
            # Mock paper data for example purposes
            mock_papers = [
                {
                    "PMID": "36671234",
                    "Title": "Advances in Deep Learning for Biomedical Image Analysis",
                    "Abstract": "Recent advances in deep learning have revolutionized biomedical image analysis...",
                    "Journal": {
                        "Title": "Nature Machine Intelligence",
                        "Volume": "5",
                        "Issue": "3",
                        "PubDate": "2025 Mar"
                    },
                    "AuthorList": [
                        {"LastName": "Chen", "ForeName": "J", "Initials": "J", "AffiliationInfo": ["Stanford University"]},
                        {"LastName": "Smith", "ForeName": "K", "Initials": "K", "AffiliationInfo": ["MIT"]}
                    ],
                    "Keywords": ["deep learning", "medical imaging", "convolutional neural networks"],
                    "PublicationDate": "2025-03-15",
                    "DOI": "10.1038/s41586-025-12345-6"
                },
                {
                    "PMID": "36781234",
                    "Title": "Novel Therapeutic Targets in Cancer Immunotherapy",
                    "Abstract": "This review explores emerging therapeutic targets in cancer immunotherapy...",
                    "Journal": {
                        "Title": "Nature Reviews Cancer",
                        "Volume": "25",
                        "Issue": "4",
                        "PubDate": "2025 Apr"
                    },
                    "AuthorList": [
                        {"LastName": "Johnson", "ForeName": "A", "Initials": "A", "AffiliationInfo": ["Memorial Sloan Kettering"]},
                        {"LastName": "Lee", "ForeName": "B", "Initials": "B", "AffiliationInfo": ["Harvard Medical School"]}
                    ],
                    "Keywords": ["cancer immunotherapy", "therapeutic targets", "checkpoint inhibitors"],
                    "PublicationDate": "2025-04-01",
                    "DOI": "10.1038/nrc.2025.123"
                }
            ]
            
            for paper in mock_papers:
                yield paper
                
        elif entity_type == "author":
            # For this simplified version, we extract authors from papers
            # In a real implementation, we might have author-specific endpoints
            
            # Mock author data derived from papers
            mock_authors = [
                {
                    "LastName": "Chen",
                    "ForeName": "J",
                    "Initials": "J",
                    "AffiliationInfo": ["Stanford University"],
                    "Papers": ["36671234"],
                    "ResearchInterests": ["deep learning", "medical imaging"]
                },
                {
                    "LastName": "Smith",
                    "ForeName": "K",
                    "Initials": "K",
                    "AffiliationInfo": ["MIT"],
                    "Papers": ["36671234"],
                    "ResearchInterests": ["computer vision", "biomedical imaging"]
                },
                {
                    "LastName": "Johnson",
                    "ForeName": "A",
                    "Initials": "A",
                    "AffiliationInfo": ["Memorial Sloan Kettering"],
                    "Papers": ["36781234"],
                    "ResearchInterests": ["cancer immunotherapy", "clinical trials"]
                }
            ]
            
            for author in mock_authors:
                yield author
                
        elif entity_type == "journal":
            # Mock journal data
            mock_journals = [
                {
                    "Title": "Nature Machine Intelligence",
                    "ISSN": "2522-5839",
                    "Publisher": "Nature Publishing Group",
                    "ImpactFactor": 15.3,
                    "Category": ["Artificial Intelligence", "Machine Learning"]
                },
                {
                    "Title": "Nature Reviews Cancer",
                    "ISSN": "1474-175X",
                    "Publisher": "Nature Publishing Group",
                    "ImpactFactor": 51.8,
                    "Category": ["Oncology", "Cancer Research"]
                }
            ]
            
            for journal in mock_journals:
                yield journal
                
        else:
            logger.warning(f"Unsupported entity type for PubMed: {entity_type}")
            return
    
    async def process_entity(self, data: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Process PubMed entity data into a standardized format.
        
        Args:
            data: Raw PubMed data
            entity_type: Type of entity
            
        Returns:
            Normalized entity data
        """
        if entity_type == "paper":
            return {
                "id": data.get("PMID", ""),
                "title": data.get("Title", ""),
                "abstract": data.get("Abstract", ""),
                "journal": data.get("Journal", {}).get("Title", ""),
                "journal_info": {
                    "volume": data.get("Journal", {}).get("Volume", ""),
                    "issue": data.get("Journal", {}).get("Issue", ""),
                    "pub_date": data.get("Journal", {}).get("PubDate", "")
                },
                "authors": [
                    {
                        "name": f"{author.get('ForeName', '')} {author.get('LastName', '')}",
                        "affiliations": author.get("AffiliationInfo", [])
                    } 
                    for author in data.get("AuthorList", [])
                ],
                "keywords": data.get("Keywords", []),
                "publication_date": data.get("PublicationDate", ""),
                "doi": data.get("DOI", ""),
                "source": self.CONNECTOR_TYPE,
                "raw_data": json.dumps(data)  # Store original data for reference
            }
            
        elif entity_type == "author":
            return {
                "id": f"{data.get('LastName', '')}{data.get('Initials', '')}",
                "name": f"{data.get('ForeName', '')} {data.get('LastName', '')}",
                "initials": data.get("Initials", ""),
                "affiliations": data.get("AffiliationInfo", []),
                "papers": data.get("Papers", []),
                "research_interests": data.get("ResearchInterests", []),
                "source": self.CONNECTOR_TYPE
            }
            
        elif entity_type == "journal":
            return {
                "id": data.get("ISSN", ""),
                "name": data.get("Title", ""),
                "publisher": data.get("Publisher", ""),
                "impact_factor": data.get("ImpactFactor", 0.0),
                "categories": data.get("Category", []),
                "source": self.CONNECTOR_TYPE
            }
            
        return data