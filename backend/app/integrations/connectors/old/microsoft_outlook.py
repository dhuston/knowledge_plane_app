"""Microsoft Outlook connector implementation."""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, AsyncIterator, Optional, List

import aiohttp
import msal

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class MicrosoftOutlookConnector(BaseConnector):
    """
    Connector for Microsoft Outlook API using Microsoft Graph.
    
    This connector provides access to Outlook calendar events, emails, and contacts.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "microsoft_outlook"
    SUPPORTED_ENTITY_TYPES = ["calendar_event", "email", "contact"]
    
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
        Initialize the Microsoft Outlook connector.
        
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
        Establish connection to Microsoft Graph API.
        
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
            logger.error(f"Error connecting to Microsoft Outlook: {str(e)}")
            raise ConnectionError(f"Failed to connect to Microsoft Outlook: {str(e)}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to Microsoft Graph API is working.
        
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
                    "message": f"Connected to Microsoft Outlook as {data.get('displayName', 'Unknown User')}",
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
        Fetch data from Microsoft Outlook.
        
        Args:
            entity_type: Type of entity to fetch (calendar_event, email, contact)
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
            if entity_type == "calendar_event":
                filter_param = f"$filter=lastModifiedDateTime ge {last_sync_str}"
            elif entity_type == "email":
                filter_param = f"$filter=receivedDateTime ge {last_sync_str}"
        
        if entity_type == "calendar_event":
            # First, get all calendars
            calendars_url = "https://graph.microsoft.com/v1.0/me/calendars"
            async for calendar in self._fetch_paged_data(calendars_url):
                calendar_id = calendar.get("id")
                calendar_name = calendar.get("name", "Unknown Calendar")
                
                # Calculate time range for events
                today = datetime.now()
                start = (today - timedelta(days=30)).isoformat()
                end = (today + timedelta(days=60)).isoformat()
                
                # Get events for each calendar
                events_url = f"https://graph.microsoft.com/v1.0/me/calendars/{calendar_id}/events?startDateTime={start}&endDateTime={end}"
                if filter_param:
                    events_url += f"&{filter_param}"
                
                async for event in self._fetch_paged_data(events_url):
                    yield {
                        "id": event.get("id"),
                        "calendar_id": calendar_id,
                        "calendar_name": calendar_name,
                        "subject": event.get("subject", "No Subject"),
                        "body": event.get("body", {}).get("content"),
                        "body_type": event.get("body", {}).get("contentType"),
                        "start_time": event.get("start", {}).get("dateTime"),
                        "start_timezone": event.get("start", {}).get("timeZone"),
                        "end_time": event.get("end", {}).get("dateTime"),
                        "end_timezone": event.get("end", {}).get("timeZone"),
                        "location": event.get("location", {}).get("displayName"),
                        "organizer": event.get("organizer", {}).get("emailAddress", {}).get("name"),
                        "organizer_email": event.get("organizer", {}).get("emailAddress", {}).get("address"),
                        "is_all_day": event.get("isAllDay", False),
                        "is_cancelled": event.get("isCancelled", False),
                        "is_online_meeting": event.get("isOnlineMeeting", False),
                        "online_meeting_url": event.get("onlineMeeting", {}).get("joinUrl"),
                        "attendees": [
                            {
                                "name": attendee.get("emailAddress", {}).get("name"),
                                "email": attendee.get("emailAddress", {}).get("address"),
                                "type": attendee.get("type"),
                                "status": attendee.get("status", {}).get("response")
                            }
                            for attendee in event.get("attendees", [])
                        ],
                        "categories": event.get("categories", []),
                        "importance": event.get("importance"),
                        "sensitivity": event.get("sensitivity"),
                        "created_at": event.get("createdDateTime"),
                        "last_modified": event.get("lastModifiedDateTime"),
                        "source": "microsoft_outlook",
                        "raw_data": event
                    }
        
        elif entity_type == "email":
            # Get folders first (inbox, sent items, etc.)
            folders_url = "https://graph.microsoft.com/v1.0/me/mailFolders"
            
            # Track processed message IDs to avoid duplicates
            processed_ids = set()
            
            async for folder in self._fetch_paged_data(folders_url):
                folder_id = folder.get("id")
                folder_name = folder.get("displayName", "Unknown Folder")
                
                # Only process main folders (inbox, sent items, etc.)
                if folder_id in ["inbox", "sentitems", "drafts"]:
                    # Get emails from each folder
                    messages_url = f"https://graph.microsoft.com/v1.0/me/mailFolders/{folder_id}/messages?$top=50"
                    if filter_param:
                        messages_url += f"&{filter_param}"
                    
                    async for message in self._fetch_paged_data(messages_url):
                        message_id = message.get("id")
                        
                        # Skip if already processed
                        if message_id in processed_ids:
                            continue
                        
                        processed_ids.add(message_id)
                        
                        yield {
                            "id": message_id,
                            "folder_id": folder_id,
                            "folder_name": folder_name,
                            "subject": message.get("subject", "(No Subject)"),
                            "body": message.get("body", {}).get("content"),
                            "body_type": message.get("body", {}).get("contentType"),
                            "sender": message.get("sender", {}).get("emailAddress", {}).get("name"),
                            "sender_email": message.get("sender", {}).get("emailAddress", {}).get("address"),
                            "from": message.get("from", {}).get("emailAddress", {}).get("name"),
                            "from_email": message.get("from", {}).get("emailAddress", {}).get("address"),
                            "to_recipients": [
                                {
                                    "name": recipient.get("emailAddress", {}).get("name"),
                                    "email": recipient.get("emailAddress", {}).get("address")
                                }
                                for recipient in message.get("toRecipients", [])
                            ],
                            "cc_recipients": [
                                {
                                    "name": recipient.get("emailAddress", {}).get("name"),
                                    "email": recipient.get("emailAddress", {}).get("address")
                                }
                                for recipient in message.get("ccRecipients", [])
                            ],
                            "bcc_recipients": [
                                {
                                    "name": recipient.get("emailAddress", {}).get("name"),
                                    "email": recipient.get("emailAddress", {}).get("address")
                                }
                                for recipient in message.get("bccRecipients", [])
                            ],
                            "received_at": message.get("receivedDateTime"),
                            "sent_at": message.get("sentDateTime"),
                            "has_attachments": message.get("hasAttachments", False),
                            "importance": message.get("importance"),
                            "is_read": message.get("isRead", False),
                            "categories": message.get("categories", []),
                            "source": "microsoft_outlook",
                            "raw_data": message
                        }
        
        elif entity_type == "contact":
            # Get contacts
            contacts_url = "https://graph.microsoft.com/v1.0/me/contacts"
            
            async for contact in self._fetch_paged_data(contacts_url):
                yield {
                    "id": contact.get("id"),
                    "display_name": contact.get("displayName", "Unknown Contact"),
                    "given_name": contact.get("givenName"),
                    "surname": contact.get("surname"),
                    "email": contact.get("emailAddresses", [{}])[0].get("address") if contact.get("emailAddresses") else None,
                    "company_name": contact.get("companyName"),
                    "job_title": contact.get("jobTitle"),
                    "department": contact.get("department"),
                    "office_location": contact.get("officeLocation"),
                    "business_phones": contact.get("businessPhones", []),
                    "mobile_phone": contact.get("mobilePhone"),
                    "home_phones": contact.get("homePhones", []),
                    "birthday": contact.get("birthday"),
                    "personal_notes": contact.get("personalNotes"),
                    "source": "microsoft_outlook",
                    "raw_data": contact
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