"""Microsoft Teams connector implementation."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncIterator, Optional, List

import aiohttp
import msal

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class MicrosoftTeamsConnector(BaseConnector):
    """
    Connector for Microsoft Teams API.
    
    This connector provides access to Microsoft Teams channels, conversations, and other data.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "microsoft_teams"
    SUPPORTED_ENTITY_TYPES = ["team", "channel", "conversation", "user"]
    
    # Configuration schema for this connector
    CONFIG_SCHEMA = {
        "type": "object",
        "required": ["tenant_id", "client_id", "client_secret"],
        "properties": {
            "tenant_id": {
                "type": "string",
                "title": "Microsoft Azure Tenant ID",
                "description": "Tenant ID from your Azure AD application"
            },
            "client_id": {
                "type": "string", 
                "title": "Client ID",
                "description": "Application (client) ID from your Azure AD application"
            },
            "client_secret": {
                "type": "string",
                "title": "Client Secret",
                "description": "Client secret from your Azure AD application",
                "format": "password"
            }
        }
    }
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the Microsoft Teams connector.
        
        Args:
            config: Configuration parameters including tenant_id, client_id, and client_secret
            credentials: Authentication credentials including access_token and refresh_token
        """
        super().__init__(config, credentials)
        self.client = None
        self.access_token = None
        self.token_expires_at = None
    
    async def _connect(self) -> bool:
        """
        Establish connection to Microsoft Teams API.
        
        Returns:
            True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        try:
            # First try to use existing access token if available
            self.access_token = self.credentials.get("access_token")
            expires_at = self.credentials.get("expires_at")
            
            # Check if token is expired or missing
            if not self.access_token or (expires_at and datetime.fromisoformat(expires_at) < datetime.now()):
                # Need to acquire a new token
                tenant_id = self.config.get("tenant_id")
                client_id = self.config.get("client_id")
                client_secret = self.config.get("client_secret")
                
                if not all([tenant_id, client_id, client_secret]):
                    raise AuthenticationError("Missing required configuration: tenant_id, client_id, client_secret")
                
                # Use MSAL to acquire token
                authority = f"https://login.microsoftonline.com/{tenant_id}"
                scopes = ["https://graph.microsoft.com/.default"]
                
                # Create a CCA
                def acquire_token():
                    app = msal.ConfidentialClientApplication(
                        client_id,
                        authority=authority,
                        client_credential=client_secret,
                    )
                    result = app.acquire_token_for_client(scopes=scopes)
                    if "error" in result:
                        raise AuthenticationError(f"Error acquiring token: {result.get('error_description')}")
                    return result
                
                # Acquire token in a thread to avoid blocking
                token_result = await asyncio.to_thread(acquire_token)
                
                self.access_token = token_result.get("access_token")
                expires_in = token_result.get("expires_in", 3600)
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                
                # Update credentials with new token
                self.credentials["access_token"] = self.access_token
                self.credentials["expires_at"] = self.token_expires_at.isoformat()
            
            # Create HTTP client
            self.client = aiohttp.ClientSession(headers={
                "Authorization": f"Bearer {self.access_token}",
                "Content-Type": "application/json"
            })
            
            # Test the connection
            async with self.client.get("https://graph.microsoft.com/v1.0/me") as response:
                if response.status != 200:
                    text = await response.text()
                    raise ConnectionError(f"Failed to connect to Microsoft Graph API: {response.status} - {text}")
            
            return True
            
        except AuthenticationError:
            # Re-raise authentication errors
            raise
        except Exception as e:
            logger.error(f"Error connecting to Microsoft Teams: {str(e)}")
            raise ConnectionError(f"Failed to connect to Microsoft Teams: {str(e)}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to Microsoft Teams is working.
        
        Returns:
            Dict containing status and message about the connection
        """
        if not self.client or not self.access_token:
            try:
                await self._connect()
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Connection failed: {str(e)}"
                }
        
        try:
            # Test connection by fetching current user
            async with self.client.get("https://graph.microsoft.com/v1.0/me") as response:
                if response.status != 200:
                    return {
                        "status": "error",
                        "message": f"API request failed with status code {response.status}"
                    }
                
                data = await response.json()
                
                return {
                    "status": "success",
                    "message": f"Connected to Microsoft Teams as {data.get('displayName', 'Unknown User')}",
                    "details": {
                        "user_principal_name": data.get("userPrincipalName"),
                        "id": data.get("id")
                    }
                }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}"
            }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch data from Microsoft Teams.
        
        Args:
            entity_type: Type of entity to fetch (team, channel, conversation, user)
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding entity data
        """
        if not self.client:
            await self._connect()
        
        # Determine filter for incremental sync
        filter_param = ""
        if last_sync:
            last_sync_str = last_sync.isoformat()
            if entity_type in ["team", "channel"]:
                filter_param = f"$filter=lastModifiedDateTime ge {last_sync_str}"
        
        if entity_type == "team":
            # Fetch teams
            url = "https://graph.microsoft.com/v1.0/me/joinedTeams"
            async for team in self._fetch_paged_data(url):
                # Get additional details for each team
                team_id = team.get("id")
                details_url = f"https://graph.microsoft.com/v1.0/teams/{team_id}"
                
                try:
                    async with self.client.get(details_url) as response:
                        if response.status == 200:
                            details = await response.json()
                            team.update(details)
                except Exception as e:
                    logger.warning(f"Error fetching details for team {team_id}: {str(e)}")
                
                yield {
                    "id": team.get("id"),
                    "name": team.get("displayName"),
                    "description": team.get("description"),
                    "visibility": team.get("visibility"),
                    "created_at": team.get("createdDateTime"),
                    "web_url": team.get("webUrl"),
                    "source": "microsoft_teams",
                    "raw_data": team
                }
        
        elif entity_type == "channel":
            # First, get all teams
            teams_url = "https://graph.microsoft.com/v1.0/me/joinedTeams"
            async for team in self._fetch_paged_data(teams_url):
                team_id = team.get("id")
                team_name = team.get("displayName", "Unknown Team")
                
                # Then get channels for each team
                channels_url = f"https://graph.microsoft.com/v1.0/teams/{team_id}/channels"
                async for channel in self._fetch_paged_data(channels_url):
                    yield {
                        "id": channel.get("id"),
                        "name": channel.get("displayName"),
                        "description": channel.get("description"),
                        "email": channel.get("email"),
                        "web_url": channel.get("webUrl"),
                        "team_id": team_id,
                        "team_name": team_name,
                        "source": "microsoft_teams",
                        "raw_data": channel
                    }
        
        elif entity_type == "conversation":
            # First, get all teams and channels
            teams_url = "https://graph.microsoft.com/v1.0/me/joinedTeams"
            async for team in self._fetch_paged_data(teams_url):
                team_id = team.get("id")
                team_name = team.get("displayName", "Unknown Team")
                
                channels_url = f"https://graph.microsoft.com/v1.0/teams/{team_id}/channels"
                async for channel in self._fetch_paged_data(channels_url):
                    channel_id = channel.get("id")
                    channel_name = channel.get("displayName", "Unknown Channel")
                    
                    # Get messages for each channel, with filter for incremental sync
                    filter_query = ""
                    if last_sync:
                        filter_str = f"lastModifiedDateTime ge {last_sync.isoformat()}"
                        filter_query = f"?$filter={filter_str}"
                    
                    messages_url = f"https://graph.microsoft.com/v1.0/teams/{team_id}/channels/{channel_id}/messages{filter_query}"
                    
                    try:
                        async for message in self._fetch_paged_data(messages_url):
                            yield {
                                "id": message.get("id"),
                                "content": message.get("body", {}).get("content"),
                                "content_type": message.get("body", {}).get("contentType"),
                                "created_at": message.get("createdDateTime"),
                                "last_modified": message.get("lastModifiedDateTime"),
                                "user_id": message.get("from", {}).get("user", {}).get("id"),
                                "user_name": message.get("from", {}).get("user", {}).get("displayName"),
                                "team_id": team_id,
                                "team_name": team_name,
                                "channel_id": channel_id,
                                "channel_name": channel_name,
                                "message_type": message.get("messageType"),
                                "importance": message.get("importance"),
                                "source": "microsoft_teams",
                                "raw_data": message
                            }
                    except Exception as e:
                        logger.warning(f"Error fetching messages for channel {channel_id}: {str(e)}")
        
        elif entity_type == "user":
            # Fetch users from organization directory
            url = "https://graph.microsoft.com/v1.0/users"
            async for user in self._fetch_paged_data(url):
                yield {
                    "id": user.get("id"),
                    "name": user.get("displayName"),
                    "email": user.get("mail") or user.get("userPrincipalName"),
                    "title": user.get("jobTitle"),
                    "department": user.get("department"),
                    "office_location": user.get("officeLocation"),
                    "business_phones": user.get("businessPhones"),
                    "mobile_phone": user.get("mobilePhone"),
                    "source": "microsoft_teams",
                    "raw_data": user
                }
    
    async def _fetch_paged_data(self, url: str) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch paged data from the Microsoft Graph API.
        
        Args:
            url: Initial URL to fetch
            
        Returns:
            AsyncIterator yielding items from all pages
        """
        next_link = url
        
        while next_link:
            try:
                async with self.client.get(next_link) as response:
                    if response.status != 200:
                        text = await response.text()
                        logger.error(f"Error fetching data from {next_link}: {response.status} - {text}")
                        break
                    
                    data = await response.json()
                    
                    # Yield each item in the current page
                    for item in data.get("value", []):
                        yield item
                    
                    # Check if there are more pages
                    next_link = data.get("@odata.nextLink")
            
            except Exception as e:
                logger.error(f"Error fetching paged data: {str(e)}")
                break
    
    async def __aenter__(self):
        """Support for async context manager protocol."""
        await self._connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up resources when exiting async context."""
        if self.client and not self.client.closed:
            await self.client.close()
            self.client = None