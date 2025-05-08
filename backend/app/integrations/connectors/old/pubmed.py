"""PubMed connector implementation."""

import asyncio
import logging
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncIterator, Optional, List, Set
import urllib.parse

import aiohttp
from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, DataError

logger = logging.getLogger(__name__)


class PubMedConnector(BaseConnector):
    """
    Connector for PubMed API.
    
    This connector provides access to research papers and publications from PubMed.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "pubmed"
    SUPPORTED_ENTITY_TYPES = ["research_paper"]
    
    # PubMed API endpoints
    ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    ESUMMARY_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the PubMed connector.
        
        Args:
            config: Configuration parameters including search queries
            credentials: Authentication credentials (API key)
        """
        super().__init__(config, credentials)
        self.api_key = credentials.get("api_key")
        self.search_queries = config.get("search_queries", [])
        self.max_results = config.get("max_results", 100)
        self.session = None
    
    async def _connect(self) -> bool:
        """
        Establish connection to PubMed API.
        
        Returns:
            True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
        """
        try:
            self.session = aiohttp.ClientSession()
            return True
        
        except Exception as e:
            if self.session:
                await self.session.close()
                self.session = None
            raise ConnectionError(f"Failed to create session for PubMed API: {e}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to PubMed is working.
        
        Returns:
            Dict containing status and message about the connection
        """
        if not self.session:
            try:
                await self._connect()
            except Exception as e:
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        try:
            # Test connection by making a simple query
            params = {
                "db": "pubmed",
                "term": "science[journal]",
                "retmax": "1",
                "retmode": "json",
            }
            
            if self.api_key:
                params["api_key"] = self.api_key
            
            async with self.session.get(self.ESEARCH_URL, params=params) as response:
                if response.status == 200:
                    return {
                        "status": "success",
                        "message": "Successfully connected to PubMed API",
                        "details": {
                            "endpoint": self.ESEARCH_URL,
                            "has_api_key": bool(self.api_key)
                        }
                    }
                else:
                    text = await response.text()
                    return {
                        "status": "error",
                        "message": f"Failed to connect to PubMed API: HTTP {response.status}",
                        "details": {
                            "response": text[:500] if len(text) > 500 else text
                        }
                    }
        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error testing PubMed connection: {e}"
            }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch research paper data from PubMed.
        
        Args:
            entity_type: Type of entity to fetch (must be "research_paper")
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding research paper entities
            
        Raises:
            ConnectionError: If not connected or connection fails
            DataError: If data cannot be fetched or parsed
        """
        if not self.session:
            await self._connect()
        
        if entity_type != "research_paper":
            logger.warning(f"Unsupported entity type for PubMed: {entity_type}")
            return
        
        # Determine date range for incremental sync
        date_range = ""
        if last_sync:
            # Format as PubMed date range query (YYYY/MM/DD format)
            from_date = last_sync.strftime("%Y/%m/%d")
            to_date = datetime.now().strftime("%Y/%m/%d")
            date_range = f" AND {from_date}:{to_date}[PDAT]"
        
        try:
            # Process each configured search query
            for search_query in self.search_queries:
                # Add date range for incremental sync
                query_with_date = search_query + date_range
                
                # Get IDs matching the search query
                pmids = await self._search_pubmed(query_with_date)
                
                # Process each batch of IDs
                batch_size = 50  # PubMed recommended batch size
                for i in range(0, len(pmids), batch_size):
                    batch_ids = pmids[i:i+batch_size]
                    papers = await self._fetch_papers_by_ids(batch_ids)
                    
                    for paper in papers:
                        yield paper
        
        except Exception as e:
            logger.error(f"Error fetching data from PubMed: {e}")
            raise ConnectionError(f"Error fetching data from PubMed: {e}")
    
    async def _search_pubmed(self, query: str) -> List[str]:
        """
        Search PubMed for articles matching a query.
        
        Args:
            query: Search query string
            
        Returns:
            List of PubMed IDs matching the query
            
        Raises:
            DataError: If search fails
        """
        logger.info(f"Searching PubMed for: {query}")
        
        # Prepare search parameters
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": str(self.max_results),
            "retmode": "json",
            "sort": "pub_date"
        }
        
        if self.api_key:
            params["api_key"] = self.api_key
        
        try:
            # Execute search
            async with self.session.get(self.ESEARCH_URL, params=params) as response:
                if response.status != 200:
                    text = await response.text()
                    raise DataError(f"PubMed search failed: HTTP {response.status}. Response: {text[:500]}")
                
                # Parse response
                data = await response.json()
                
                # Extract PMIDs
                result = data.get("esearchresult", {})
                id_list = result.get("idlist", [])
                
                logger.info(f"Found {len(id_list)} papers matching query: {query}")
                return id_list
        
        except aiohttp.ClientError as e:
            raise DataError(f"Error searching PubMed: {e}")
    
    async def _fetch_papers_by_ids(self, pmids: List[str]) -> List[Dict[str, Any]]:
        """
        Fetch detailed paper information for a list of PubMed IDs.
        
        Args:
            pmids: List of PubMed IDs
            
        Returns:
            List of paper entities
            
        Raises:
            DataError: If fetching fails
        """
        if not pmids:
            return []
            
        # Join IDs for API request
        id_param = ",".join(pmids)
        
        # Prepare fetch parameters
        params = {
            "db": "pubmed",
            "id": id_param,
            "retmode": "xml",
            "rettype": "full"
        }
        
        if self.api_key:
            params["api_key"] = self.api_key
        
        try:
            # Execute fetch
            async with self.session.get(self.EFETCH_URL, params=params) as response:
                if response.status != 200:
                    text = await response.text()
                    raise DataError(f"PubMed fetch failed: HTTP {response.status}. Response: {text[:500]}")
                
                # Parse XML response
                xml_text = await response.text()
                return self._parse_pubmed_xml(xml_text)
        
        except aiohttp.ClientError as e:
            raise DataError(f"Error fetching PubMed articles: {e}")
    
    def _parse_pubmed_xml(self, xml_text: str) -> List[Dict[str, Any]]:
        """
        Parse PubMed XML output into structured paper entities.
        
        Args:
            xml_text: PubMed XML response
            
        Returns:
            List of paper entities
            
        Raises:
            DataError: If parsing fails
        """
        try:
            # Parse XML
            root = ET.fromstring(xml_text)
            
            # Container for results
            papers = []
            
            # Process each PubMed article
            for article_elem in root.findall(".//PubmedArticle"):
                try:
                    # Extract PubMed ID
                    pmid_elem = article_elem.find(".//PMID")
                    if pmid_elem is None:
                        continue
                    pmid = pmid_elem.text
                    
                    # Get article metadata
                    article_meta = article_elem.find(".//Article")
                    if article_meta is None:
                        continue
                    
                    # Extract title
                    title_elem = article_meta.find(".//ArticleTitle")
                    title = title_elem.text if title_elem is not None and title_elem.text else "Unknown Title"
                    
                    # Extract abstract
                    abstract_text = ""
                    abstract_elems = article_meta.findall(".//AbstractText")
                    for abstract_elem in abstract_elems:
                        label = abstract_elem.get("Label")
                        if label:
                            abstract_text += f"{label}: {abstract_elem.text}\n"
                        else:
                            abstract_text += f"{abstract_elem.text}\n"
                            
                    # Extract journal info
                    journal_elem = article_meta.find(".//Journal")
                    journal_name = "Unknown Journal"
                    if journal_elem is not None:
                        journal_title = journal_elem.find(".//Title")
                        if journal_title is not None and journal_title.text:
                            journal_name = journal_title.text
                    
                    # Extract publication date
                    pub_date = None
                    pub_date_elem = article_meta.find(".//PubDate")
                    if pub_date_elem is not None:
                        year_elem = pub_date_elem.find("Year")
                        month_elem = pub_date_elem.find("Month")
                        day_elem = pub_date_elem.find("Day")
                        
                        year = year_elem.text if year_elem is not None else None
                        month = month_elem.text if month_elem is not None else "01"
                        day = day_elem.text if day_elem is not None else "01"
                        
                        if year:
                            pub_date_str = f"{year}/{month}/{day}"
                        
                    # Extract authors
                    authors = []
                    author_list = article_meta.find(".//AuthorList")
                    if author_list is not None:
                        for author_elem in author_list.findall("Author"):
                            last_name = author_elem.find("LastName")
                            fore_name = author_elem.find("ForeName")
                            initials = author_elem.find("Initials")
                            affiliation = author_elem.find("Affiliation")
                            
                            author_name = ""
                            if last_name is not None and last_name.text:
                                author_name += last_name.text
                            if fore_name is not None and fore_name.text:
                                author_name = f"{fore_name.text} {author_name}"
                            elif initials is not None and initials.text:
                                author_name = f"{initials.text} {author_name}"
                                
                            if author_name:
                                author_data = {
                                    "name": author_name.strip(),
                                    "affiliation": affiliation.text if affiliation is not None and affiliation.text else None
                                }
                                authors.append(author_data)
                    
                    # Extract keywords/MeSH terms
                    keywords = []
                    mesh_heading_list = article_elem.find(".//MeshHeadingList")
                    if mesh_heading_list is not None:
                        for mesh_elem in mesh_heading_list.findall("MeshHeading"):
                            descriptor = mesh_elem.find("DescriptorName")
                            if descriptor is not None and descriptor.text:
                                keywords.append(descriptor.text)
                                
                    # Extract DOI
                    doi = None
                    article_id_list = article_elem.find(".//ArticleIdList")
                    if article_id_list is not None:
                        for id_elem in article_id_list.findall("ArticleId"):
                            if id_elem.get("IdType") == "doi" and id_elem.text:
                                doi = id_elem.text
                                break
                    
                    # Construct paper entity
                    paper = {
                        "id": pmid,
                        "pmid": pmid,
                        "title": title,
                        "abstract": abstract_text.strip(),
                        "journal": journal_name,
                        "publication_date": pub_date_str if 'pub_date_str' in locals() else None,
                        "authors": authors,
                        "keywords": keywords,
                        "doi": doi,
                        "source": "pubmed",
                        "url": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    }
                    
                    papers.append(paper)
                    
                except Exception as e:
                    logger.warning(f"Error parsing individual PubMed article: {e}")
                    continue
            
            return papers
            
        except Exception as e:
            logger.error(f"Error parsing PubMed XML: {e}")
            raise DataError(f"Error parsing PubMed XML: {e}")
    
    async def search_papers(self, query: str, max_results: int = 50) -> List[Dict[str, Any]]:
        """
        Search PubMed for papers matching a query.
        
        Args:
            query: Search query
            max_results: Maximum number of results to return
            
        Returns:
            List of paper entities matching the query
        """
        if not self.session:
            await self._connect()
        
        try:
            # Get IDs matching the search query
            pmids = await self._search_pubmed(query)
            
            # Limit the number of results
            pmids = pmids[:max_results]
            
            # Fetch paper details
            return await self._fetch_papers_by_ids(pmids)
            
        except Exception as e:
            logger.error(f"Error searching papers: {e}")
            return []
    
    async def fetch_paper_citations(self, pmid: str) -> List[Dict[str, Any]]:
        """
        Fetch papers that cite a given paper.
        
        Args:
            pmid: PubMed ID of the paper
            
        Returns:
            List of citing paper entities
        """
        if not self.session:
            await self._connect()
        
        try:
            # Use ELink to find citing articles
            params = {
                "dbfrom": "pubmed",
                "db": "pubmed",
                "id": pmid,
                "linkname": "pubmed_pubmed_citedin",
                "retmode": "json"
            }
            
            if self.api_key:
                params["api_key"] = self.api_key
            
            # ELink URL
            elink_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi"
            
            async with self.session.get(elink_url, params=params) as response:
                if response.status != 200:
                    return []
                
                data = await response.json()
                
                citing_ids = []
                try:
                    linksets = data.get("linksets", [])
                    if linksets:
                        links = linksets[0].get("linksetdbs", [])
                        for link_db in links:
                            if link_db.get("linkname") == "pubmed_pubmed_citedin":
                                citing_ids = [link.get("id") for link in link_db.get("links", [])]
                except (KeyError, IndexError):
                    pass
                
                # Return details of citing papers
                if citing_ids:
                    return await self._fetch_papers_by_ids(citing_ids)
                    
            return []
            
        except Exception as e:
            logger.error(f"Error fetching citations: {e}")
            return []
    
    async def __aenter__(self):
        """Enter async context manager."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context manager and close resources."""
        if self.session:
            await self.session.close()