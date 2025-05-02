"""Jira connector implementation."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncIterator, Optional, List

import aiohttp
from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class JiraConnector(BaseConnector):
    """
    Connector for Jira API.
    
    This connector provides access to Jira projects, issues, and boards.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "jira"
    SUPPORTED_ENTITY_TYPES = ["project", "issue", "board", "sprint"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the Jira connector.
        
        Args:
            config: Configuration parameters including jira_url
            credentials: Authentication credentials (token or username/api_key)
        """
        super().__init__(config, credentials)
        self.base_url = config.get("jira_url", "").rstrip('/')
        self.session = None
    
    async def _connect(self) -> bool:
        """
        Establish connection to Jira API.
        
        Returns:
            True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        if not self.base_url:
            raise ConnectionError("Jira URL is required in configuration")
        
        # Get authentication details
        api_token = self.credentials.get("api_token")
        username = self.credentials.get("username")
        pat = self.credentials.get("personal_access_token")
        
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }
        
        auth = None
        if pat:
            # Use Personal Access Token
            headers["Authorization"] = f"Bearer {pat}"
        elif username and api_token:
            # Use Basic authentication with username and API token
            auth = aiohttp.BasicAuth(login=username, password=api_token)
        else:
            raise AuthenticationError("Either Personal Access Token or username/api_token credentials must be provided")
        
        try:
            # Create a new session
            self.session = aiohttp.ClientSession(headers=headers, auth=auth)
            
            # Test connection by making a simple API call
            async with self.session.get(f"{self.base_url}/rest/api/3/myself") as response:
                if response.status == 200:
                    user_data = await response.json()
                    logger.info(f"Connected to Jira as: {user_data.get('displayName', 'Unknown user')}")
                    return True
                elif response.status == 401:
                    raise AuthenticationError("Invalid credentials for Jira API")
                else:
                    raise ConnectionError(f"Failed to connect to Jira API: HTTP {response.status}")
        
        except aiohttp.ClientError as e:
            if self.session:
                await self.session.close()
                self.session = None
            raise ConnectionError(f"Error connecting to Jira API: {e}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to Jira is working.
        
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
            # Fetch server info to verify connection
            async with self.session.get(f"{self.base_url}/rest/api/3/serverInfo") as response:
                if response.status == 200:
                    server_info = await response.json()
                    
                    return {
                        "status": "success",
                        "message": "Successfully connected to Jira API",
                        "details": {
                            "baseUrl": server_info.get('baseUrl'),
                            "version": server_info.get('version'),
                            "serverTitle": server_info.get('serverTitle')
                        }
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Error connecting to Jira API: HTTP {response.status}"
                    }
        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error testing Jira connection: {e}"
            }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch data from Jira API.
        
        Args:
            entity_type: Type of entity to fetch (project, issue, board, sprint)
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding Jira entities
            
        Raises:
            ConnectionError: If not connected or connection fails
        """
        if not self.session:
            await self._connect()
        
        if entity_type not in self.SUPPORTED_ENTITY_TYPES:
            logger.warning(f"Unsupported entity type for Jira: {entity_type}")
            return
        
        try:
            # Call the appropriate fetch method based on entity type
            if entity_type == "project":
                async for item in self._fetch_projects():
                    yield item
            elif entity_type == "board":
                async for item in self._fetch_boards():
                    yield item
            elif entity_type == "issue":
                # Determine JQL query based on last sync time
                jql = ""
                if last_sync:
                    # Format as ISO string and get only items updated since last sync
                    last_sync_str = last_sync.strftime("%Y-%m-%d %H:%M")
                    jql = f"updated >= '{last_sync_str}'"
                
                async for item in self._fetch_issues(jql):
                    yield item
            elif entity_type == "sprint":
                async for item in self._fetch_sprints():
                    yield item
        
        except Exception as e:
            logger.error(f"Error fetching {entity_type} data from Jira: {e}")
            raise ConnectionError(f"Error fetching {entity_type} data: {e}")
    
    async def _fetch_projects(self) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch projects from Jira.
        
        Returns:
            AsyncIterator yielding project data
        """
        endpoint = f"{self.base_url}/rest/api/3/project"
        
        try:
            async with self.session.get(endpoint) as response:
                if response.status == 200:
                    projects = await response.json()
                    
                    for project in projects:
                        # For each project, get more detailed information
                        project_key = project.get('key')
                        
                        async with self.session.get(f"{endpoint}/{project_key}") as project_response:
                            if project_response.status == 200:
                                detailed_project = await project_response.json()
                                
                                yield {
                                    "id": detailed_project.get('id'),
                                    "key": detailed_project.get('key'),
                                    "name": detailed_project.get('name'),
                                    "description": detailed_project.get('description', ''),
                                    "lead": detailed_project.get('lead', {}).get('displayName') if detailed_project.get('lead') else None,
                                    "url": f"{self.base_url}/browse/{detailed_project.get('key')}",
                                    "category": detailed_project.get('projectCategory', {}).get('name') if detailed_project.get('projectCategory') else None,
                                    "type": detailed_project.get('projectTypeKey'),
                                    "source": "jira",
                                    "raw_data": detailed_project
                                }
                else:
                    logger.error(f"Failed to fetch Jira projects: HTTP {response.status}")
        
        except Exception as e:
            logger.error(f"Error fetching Jira projects: {e}")
            raise ConnectionError(f"Error fetching Jira projects: {e}")
    
    async def _fetch_boards(self) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch boards from Jira.
        
        Returns:
            AsyncIterator yielding board data
        """
        endpoint = f"{self.base_url}/rest/agile/1.0/board"
        start_at = 0
        max_results = 50
        
        try:
            while True:
                async with self.session.get(
                    f"{endpoint}?startAt={start_at}&maxResults={max_results}"
                ) as response:
                    if response.status == 200:
                        response_data = await response.json()
                        boards = response_data.get("values", [])
                        
                        if not boards:
                            break
                        
                        for board in boards:
                            # Get detailed information about each board
                            board_id = board.get("id")
                            
                            async with self.session.get(f"{endpoint}/{board_id}") as board_response:
                                if board_response.status == 200:
                                    detailed_board = await board_response.json()
                                    
                                    yield {
                                        "id": detailed_board.get("id"),
                                        "name": detailed_board.get("name"),
                                        "type": detailed_board.get("type"),
                                        "project_key": detailed_board.get("location", {}).get("projectKey") if "location" in detailed_board else None,
                                        "project_name": detailed_board.get("location", {}).get("displayName") if "location" in detailed_board else None,
                                        "url": f"{self.base_url}/jira/software/c/projects/{detailed_board.get('location', {}).get('projectKey')}/boards/{board_id}" if "location" in detailed_board else None,
                                        "source": "jira",
                                        "raw_data": detailed_board
                                    }
                        
                        # Check if there are more boards to fetch
                        total = response_data.get("total", 0)
                        start_at += max_results
                        if start_at >= total:
                            break
                    else:
                        logger.error(f"Failed to fetch Jira boards: HTTP {response.status}")
                        break
        
        except Exception as e:
            logger.error(f"Error fetching Jira boards: {e}")
            raise ConnectionError(f"Error fetching Jira boards: {e}")
    
    async def _fetch_issues(self, jql: str = "") -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch issues from Jira using JQL.
        
        Args:
            jql: JQL query to filter issues
            
        Returns:
            AsyncIterator yielding issue data
        """
        endpoint = f"{self.base_url}/rest/api/3/search"
        start_at = 0
        max_results = 100
        
        # Build the request parameters
        params = {
            "startAt": start_at,
            "maxResults": max_results,
            "fields": "summary,description,issuetype,status,assignee,creator,reporter,priority,created,updated,project,fixVersions,duedate,components"
        }
        
        if jql:
            params["jql"] = jql
        
        try:
            while True:
                params["startAt"] = start_at
                
                async with self.session.get(endpoint, params=params) as response:
                    if response.status == 200:
                        response_data = await response.json()
                        issues = response_data.get("issues", [])
                        
                        if not issues:
                            break
                        
                        for issue in issues:
                            fields = issue.get("fields", {})
                            
                            yield {
                                "id": issue.get("id"),
                                "key": issue.get("key"),
                                "summary": fields.get("summary"),
                                "description": fields.get("description"),
                                "issuetype": fields.get("issuetype", {}).get("name") if fields.get("issuetype") else None,
                                "status": fields.get("status", {}).get("name") if fields.get("status") else None,
                                "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
                                "creator": fields.get("creator", {}).get("displayName") if fields.get("creator") else None,
                                "reporter": fields.get("reporter", {}).get("displayName") if fields.get("reporter") else None,
                                "priority": fields.get("priority", {}).get("name") if fields.get("priority") else None,
                                "created": fields.get("created"),
                                "updated": fields.get("updated"),
                                "project_id": fields.get("project", {}).get("id") if fields.get("project") else None,
                                "project_key": fields.get("project", {}).get("key") if fields.get("project") else None,
                                "project_name": fields.get("project", {}).get("name") if fields.get("project") else None,
                                "fix_versions": [v.get("name") for v in fields.get("fixVersions", [])],
                                "due_date": fields.get("duedate"),
                                "url": f"{self.base_url}/browse/{issue.get('key')}",
                                "source": "jira",
                                "raw_data": issue
                            }
                        
                        # Check if there are more issues to fetch
                        total = response_data.get("total", 0)
                        start_at += max_results
                        if start_at >= total:
                            break
                    else:
                        logger.error(f"Failed to fetch Jira issues: HTTP {response.status}")
                        break
        
        except Exception as e:
            logger.error(f"Error fetching Jira issues: {e}")
            raise ConnectionError(f"Error fetching Jira issues: {e}")
    
    async def _fetch_sprints(self) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch sprints from Jira.
        
        Returns:
            AsyncIterator yielding sprint data
        """
        # First we need to get all boards to fetch their sprints
        try:
            board_ids = []
            async for board in self._fetch_boards():
                board_ids.append(board.get("id"))
            
            for board_id in board_ids:
                endpoint = f"{self.base_url}/rest/agile/1.0/board/{board_id}/sprint"
                start_at = 0
                max_results = 50
                
                while True:
                    async with self.session.get(
                        f"{endpoint}?startAt={start_at}&maxResults={max_results}"
                    ) as response:
                        if response.status == 200:
                            response_data = await response.json()
                            sprints = response_data.get("values", [])
                            
                            if not sprints:
                                break
                            
                            for sprint in sprints:
                                yield {
                                    "id": sprint.get("id"),
                                    "name": sprint.get("name"),
                                    "state": sprint.get("state"),
                                    "start_date": sprint.get("startDate"),
                                    "end_date": sprint.get("endDate"),
                                    "complete_date": sprint.get("completeDate"),
                                    "board_id": board_id,
                                    "goal": sprint.get("goal"),
                                    "url": f"{self.base_url}/jira/software/c/projects/{sprint.get('originBoardId')}/boards/{board_id}/sprints/{sprint.get('id')}",
                                    "source": "jira",
                                    "raw_data": sprint
                                }
                            
                            # Check if there are more sprints to fetch
                            total = response_data.get("total", 0)
                            start_at += max_results
                            if start_at >= total:
                                break
                        else:
                            # Some boards might not have sprints, which is okay
                            if response.status != 404:
                                logger.warning(f"Failed to fetch sprints for board {board_id}: HTTP {response.status}")
                            break
        
        except Exception as e:
            logger.error(f"Error fetching Jira sprints: {e}")
            raise ConnectionError(f"Error fetching Jira sprints: {e}")
    
    async def __aenter__(self):
        """Enter async context manager."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context manager and close resources."""
        if self.session:
            await self.session.close()