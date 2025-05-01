from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Set, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
import json
import re
import logging
from collections import defaultdict

try:
    import ldap3
except ImportError:
    ldap3 = None

from app.models.user import User
from app.models.team import Team
from app.models.department import Department


# Set up logging
logger = logging.getLogger(__name__)


class IdentityConnectorException(Exception):
    """Base exception for identity connector errors."""
    pass


class ConnectionError(IdentityConnectorException):
    """Raised when a connection to the identity provider fails."""
    pass


class AuthenticationError(IdentityConnectorException):
    """Raised when authentication with the identity provider fails."""
    pass


class DataMappingError(IdentityConnectorException):
    """Raised when data mapping from the identity provider fails."""
    pass


class IdentityConnector(ABC):
    """
    Abstract base class for identity provider connectors.
    
    This class defines the interface that all identity provider connectors must implement.
    Identity connectors are responsible for fetching user and team information from external
    identity providers like Active Directory, Azure AD, Okta, etc.
    """
    
    @abstractmethod
    async def fetch_users(self) -> List[Dict[str, Any]]:
        """
        Fetch users from the identity provider.
        
        Returns:
            List[Dict[str, Any]]: List of user dictionaries with standard format
        
        Raises:
            ConnectionError: If the connection to the identity provider fails
            AuthenticationError: If authentication with the identity provider fails
        """
        pass
        
    @abstractmethod
    async def fetch_groups(self) -> List[Dict[str, Any]]:
        """
        Fetch groups (teams) from the identity provider.
        
        Returns:
            List[Dict[str, Any]]: List of group dictionaries with standard format
        
        Raises:
            ConnectionError: If the connection to the identity provider fails
            AuthenticationError: If authentication with the identity provider fails
        """
        pass
        
    @abstractmethod
    async def fetch_reporting_relationships(self) -> List[Dict[str, Any]]:
        """
        Fetch reporting relationships from the identity provider.
        
        Returns:
            List[Dict[str, Any]]: List of reporting relationship dictionaries
        
        Raises:
            ConnectionError: If the connection to the identity provider fails
            AuthenticationError: If authentication with the identity provider fails
        """
        pass
        
    @abstractmethod
    async def synchronize(self) -> Dict[str, Any]:
        """
        Synchronize all data from the identity provider.
        
        Returns:
            Dict[str, Any]: Dictionary with synchronization results
        
        Raises:
            ConnectionError: If the connection to the identity provider fails
            AuthenticationError: If authentication with the identity provider fails
            DataMappingError: If data mapping from the identity provider fails
        """
        pass


class ActiveDirectoryConnector(IdentityConnector):
    """
    Active Directory identity connector implementation.
    
    This connector uses the ldap3 library to connect to and query Active Directory
    for user, group, and reporting relationship information.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Active Directory connector.
        
        Args:
            config: Configuration dictionary with AD connection details
                - domain: Active Directory domain (e.g., example.com)
                - server: LDAP server address (e.g., ldap.example.com)
                - username: Username for authentication
                - password: Password for authentication
                - use_ssl: Whether to use SSL for the connection (default: True)
                - base_dn: Base DN for LDAP queries (e.g., dc=example,dc=com)
        
        Raises:
            ImportError: If ldap3 library is not installed
        """
        if ldap3 is None:
            raise ImportError("ldap3 library is required for ActiveDirectoryConnector")
            
        self.config = config
        self.domain = config.get("domain")
        self.server = config.get("server")
        self.username = config.get("username")
        self.password = config.get("password")
        self.use_ssl = config.get("use_ssl", True)
        self.base_dn = config.get("base_dn")
        
        # Will be populated during user fetching
        self._dn_to_samaccountname = {}
        
        # Placeholder for AD connection
        self.connection = None
    
    async def _connect(self) -> None:
        """
        Connect to Active Directory using ldap3.
        
        Raises:
            ConnectionError: If the connection to Active Directory fails
            AuthenticationError: If authentication fails
        """
        try:
            # Create server object
            server = ldap3.Server(self.server, use_ssl=self.use_ssl)
            
            # Create connection object with domain authentication
            connection = ldap3.Connection(
                server,
                user=f"{self.domain}\\{self.username}",
                password=self.password,
                auto_bind=False
            )
            
            # Attempt to bind to the server
            if not connection.bind():
                error_msg = connection.result.get("description", "Unknown error")
                raise AuthenticationError(f"Failed to authenticate with Active Directory: {error_msg}")
            
            self.connection = connection
            logger.info(f"Connected to Active Directory server {self.server}")
            
        except ldap3.core.exceptions.LDAPException as e:
            raise ConnectionError(f"Failed to connect to Active Directory: {str(e)}")
        except Exception as e:
            raise ConnectionError(f"Unexpected error connecting to Active Directory: {str(e)}")
    
    def _get_query_params(self, query_type: str) -> Dict[str, Any]:
        """
        Get query parameters based on the query type.
        
        Args:
            query_type: Type of query (users, groups)
            
        Returns:
            Dictionary with search parameters
        """
        params = {
            "search_base": self.base_dn,
            "search_scope": ldap3.SUBTREE
        }
        
        if query_type == "users":
            params["search_filter"] = "(&(objectClass=user)(objectCategory=person)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))"
            params["attributes"] = [
                "sAMAccountName",
                "displayName",
                "mail",
                "department",
                "title",
                "physicalDeliveryOfficeName",
                "manager",
                "memberOf"
            ]
        elif query_type == "groups":
            params["search_filter"] = "(objectClass=group)"
            params["attributes"] = [
                "cn",
                "description",
                "member",
                "distinguishedName"
            ]
        
        return params
    
    async def _query_ad(self, query_type: str, query_params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Query Active Directory.
        
        Args:
            query_type: Type of query to execute (users, groups, etc.)
            query_params: Optional parameters to override defaults
            
        Returns:
            List of dictionaries with query results
            
        Raises:
            ConnectionError: If the query fails due to connection issues
        """
        if self.connection is None:
            await self._connect()
            
        # Get query parameters (use provided params or defaults)
        params = query_params or self._get_query_params(query_type)
        
        try:
            # Execute LDAP search
            if not self.connection.search(
                search_base=params["search_base"],
                search_filter=params["search_filter"],
                search_scope=params.get("search_scope", ldap3.SUBTREE),
                attributes=params["attributes"]
            ):
                error_msg = self.connection.result.get("description", "Unknown error")
                raise ConnectionError(f"LDAP search failed: {error_msg}")
            
            # Process results
            results = []
            for entry in self.connection.entries:
                entry_dict = {
                    "dn": entry.entry_dn,
                    "attributes": {}
                }
                
                # Extract attributes, converting from lists to single values where appropriate
                for attr_name, attr_values in entry.entry_attributes_as_dict.items():
                    if len(attr_values) == 1:
                        # Single value attribute
                        entry_dict["attributes"][attr_name] = attr_values[0]
                    else:
                        # Multi-value attribute
                        entry_dict["attributes"][attr_name] = attr_values
                
                results.append(entry_dict)
            
            return results
            
        except ldap3.core.exceptions.LDAPException as e:
            raise ConnectionError(f"Failed to query Active Directory: {str(e)}")
        except Exception as e:
            raise ConnectionError(f"Unexpected error querying Active Directory: {str(e)}")
    
    async def _resolve_group_members(self, member_dns: List[str]) -> List[str]:
        """
        Resolve group member DNs to sAMAccountNames.
        
        Args:
            member_dns: List of member distinguished names
            
        Returns:
            List of sAMAccountNames
        """
        if not member_dns:
            return []
            
        result = []
        for dn in member_dns:
            if dn in self._dn_to_samaccountname:
                result.append(self._dn_to_samaccountname[dn])
                
        return result
    
    async def fetch_users(self) -> List[Dict[str, Any]]:
        """
        Fetch users from Active Directory.
        
        Returns:
            List of user dictionaries with standardized format
        """
        await self._connect()
        ad_entries = await self._query_ad("users")
        
        # Map AD entries to standardized user format and build DN to sAMAccountName mapping
        users = []
        self._dn_to_samaccountname = {}
        
        for entry in ad_entries:
            attrs = entry["attributes"]
            dn = entry["dn"]
            
            # Extract sAMAccountName and build mapping
            samaccountname = attrs.get("sAMAccountName", "")
            if samaccountname and dn:
                self._dn_to_samaccountname[dn] = samaccountname
            
            # Extract manager DN if present
            manager_dn = attrs.get("manager", "")
            
            # Map to standardized format
            user = {
                "external_id": samaccountname,
                "email": attrs.get("mail", ""),
                "full_name": attrs.get("displayName", ""),
                "department": attrs.get("department", ""),
                "title": attrs.get("title", ""),
                "location": attrs.get("physicalDeliveryOfficeName", ""),
                "metadata": {
                    "source": "active_directory",
                    "last_updated": datetime.utcnow().isoformat(),
                    "dn": dn
                }
            }
            
            # Add manager reference if present
            if manager_dn:
                user["metadata"]["manager_dn"] = manager_dn
            
            users.append(user)
        
        logger.info(f"Fetched {len(users)} users from Active Directory")
        return users
        
    async def fetch_groups(self) -> List[Dict[str, Any]]:
        """
        Fetch groups from Active Directory.
        
        Returns:
            List of group dictionaries with standardized format
        """
        await self._connect()
        ad_entries = await self._query_ad("groups")
        
        # Map AD entries to standardized group format
        groups = []
        for entry in ad_entries:
            attrs = entry["attributes"]
            dn = entry["dn"]
            
            # Extract CN as the group name
            name = attrs.get("cn", "")
            
            # Extract members (could be empty or a single string if only one member)
            members = attrs.get("member", [])
            if isinstance(members, str):
                members = [members]
                
            # Resolve members to sAMAccountNames
            resolved_members = await self._resolve_group_members(members)
            
            group = {
                "external_id": name,
                "name": name,
                "description": attrs.get("description", ""),
                "members": resolved_members,
                "metadata": {
                    "source": "active_directory",
                    "last_updated": datetime.utcnow().isoformat(),
                    "dn": dn
                }
            }
            
            groups.append(group)
        
        logger.info(f"Fetched {len(groups)} groups from Active Directory")
        return groups
        
    async def fetch_reporting_relationships(self) -> List[Dict[str, Any]]:
        """
        Fetch reporting relationships from Active Directory by analyzing user managers.
        
        Returns:
            List of reporting relationship dictionaries
        """
        await self._connect()
        
        # We need to have users already fetched to extract reporting relationships
        users = await self.fetch_users()
        
        # Extract manager relationships from user metadata
        relationships = []
        for user in users:
            external_id = user["external_id"]
            manager_dn = user.get("metadata", {}).get("manager_dn", "")
            
            if manager_dn and manager_dn in self._dn_to_samaccountname:
                manager_id = self._dn_to_samaccountname[manager_dn]
                
                relationship = {
                    "manager_id": manager_id,
                    "direct_report_id": external_id,
                    "metadata": {
                        "source": "active_directory",
                        "last_updated": datetime.utcnow().isoformat()
                    }
                }
                
                relationships.append(relationship)
        
        logger.info(f"Fetched {len(relationships)} reporting relationships from Active Directory")
        return relationships
        
    async def synchronize(self) -> Dict[str, Any]:
        """
        Synchronize all data from Active Directory.
        
        Returns:
            Dictionary with all synchronized data and metadata
        """
        result = {
            "source": "active_directory",
            "timestamp": datetime.utcnow().isoformat(),
            "errors": {}
        }
        
        try:
            result["users"] = await self.fetch_users()
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            result["errors"]["users"] = str(e)
            result["users"] = []
            
        try:
            result["groups"] = await self.fetch_groups()
        except Exception as e:
            logger.error(f"Error fetching groups: {str(e)}")
            result["errors"]["groups"] = str(e)
            result["groups"] = []
            
        try:
            result["relationships"] = await self.fetch_reporting_relationships()
        except Exception as e:
            logger.error(f"Error fetching reporting relationships: {str(e)}")
            result["errors"]["relationships"] = str(e)
            result["relationships"] = []
            
        # Remove errors key if no errors occurred
        if not result["errors"]:
            del result["errors"]
            
        return result


class OktaConnector(IdentityConnector):
    """
    Okta identity connector implementation using the Okta API.
    
    This connector uses the Okta API to connect to and query Okta
    for user, group, and reporting relationship information.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Okta connector.
        
        Args:
            config: Configuration dictionary with Okta connection details
                - api_token: Okta API token
                - base_url: Okta organization URL (e.g. https://your-org.okta.com)
        """
        self.config = config
        self.api_token = config.get("api_token")
        self.base_url = config.get("base_url")
        
        # Ensure base URL doesn't end with a slash
        if self.base_url and self.base_url.endswith('/'):
            self.base_url = self.base_url[:-1]
        
        # API version
        self.api_version = config.get("api_version", "v1")
        
        # Dictionary to map user IDs to usernames for relationship resolution
        self._user_id_mapping = {}
        
        # Last manager lookup results cache to minimize API calls
        self._manager_cache = {}
    
    async def _api_request(self, endpoint: str, method: str = "GET", params: Dict[str, Any] = None, data: Dict[str, Any] = None) -> Any:
        """
        Make a request to the Okta API.
        
        Args:
            endpoint: API endpoint (without base URL)
            method: HTTP method to use
            params: Optional query parameters
            data: Optional request body
            
        Returns:
            API response parsed from JSON
            
        Raises:
            ConnectionError: If request fails
            DataMappingError: If response cannot be parsed
        """
        import aiohttp
        
        # Construct full URL
        url = f"{self.base_url}/api/{self.api_version}{endpoint}"
        
        # Prepare headers
        headers = {
            "Authorization": f"SSWS {self.api_token}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                # Prepare request parameters
                request_kwargs = {
                    "headers": headers,
                    "params": params
                }
                
                # Add JSON body if provided
                if data:
                    request_kwargs["json"] = data
                
                # Make the request
                async with session.request(method, url, **request_kwargs) as response:
                    if response.status >= 400:
                        error_text = await response.text()
                        raise ConnectionError(f"Okta API request failed ({response.status}): {error_text}")
                    
                    # Parse JSON response
                    return await response.json()
                    
        except aiohttp.ClientError as e:
            raise ConnectionError(f"Failed to connect to Okta API: {str(e)}")
        except json.JSONDecodeError as e:
            raise DataMappingError(f"Failed to parse Okta API response: {str(e)}")
        except Exception as e:
            raise ConnectionError(f"Unexpected error in Okta API request: {str(e)}")
    
    async def _get_all_paged_results(self, endpoint: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Get all results for a paged Okta API endpoint.
        
        Args:
            endpoint: API endpoint
            params: Optional query parameters
            
        Returns:
            List of all items across pages
        """
        all_items = []
        next_url = None
        
        # Make initial request
        response = await self._api_request(endpoint, params=params)
        
        # Add items from first page
        if isinstance(response, list):
            all_items.extend(response)
        else:
            # Some endpoints return objects with embedded arrays
            if "embedded" in response and isinstance(response["embedded"], dict):
                # Find the first array in the embedded object
                for key, value in response["embedded"].items():
                    if isinstance(value, list):
                        all_items.extend(value)
                        break
        
        # Check for pagination link in headers
        next_url = self._get_next_link(response)
        
        # Follow pagination links until we reach the end
        while next_url:
            # Extract path from the full next URL
            path = next_url.replace(f"{self.base_url}/api/{self.api_version}", "")
            
            # Make request to next page URL
            response = await self._api_request(path)
            
            # Add items from this page
            if isinstance(response, list):
                all_items.extend(response)
            
            # Get next link, if any
            next_url = self._get_next_link(response)
        
        return all_items
    
    def _get_next_link(self, response: Any) -> Optional[str]:
        """
        Extract next pagination link from Okta response.
        
        Args:
            response: Response from Okta API
            
        Returns:
            URL for next page or None if there is no next page
        """
        # Okta API returns links in the response body
        if isinstance(response, list) and len(response) > 0:
            # For list responses, the links are in the HTTP headers
            # which we can't access directly here, but the list itself might have links
            next_link = next((link for link in getattr(response, "links", []) if link.get("rel") == "next"), None)
            if next_link:
                return next_link.get("href")
        elif isinstance(response, dict):
            # For object responses with _links property
            links = response.get("_links", {})
            next_link = links.get("next", {})
            if next_link:
                return next_link.get("href")
        
        return None
    
    async def fetch_users(self) -> List[Dict[str, Any]]:
        """
        Fetch users from Okta.
        
        Returns:
            List of user dictionaries with standardized format
        """
        # Reset the user ID mapping and manager cache
        self._user_id_mapping = {}
        self._manager_cache = {}
        
        # Fetch all users with expanded attributes
        endpoint = "/users"
        params = {
            "limit": 200,  # Maximum page size
        }
        
        okta_users = await self._get_all_paged_results(endpoint, params)
        
        # Convert Okta users to standardized format
        users = []
        for okta_user in okta_users:
            user_id = okta_user.get("id", "")
            profile = okta_user.get("profile", {})
            login = profile.get("login", "")
            
            # Build mapping for later relationship resolution
            if login and user_id:
                self._user_id_mapping[user_id] = login
            
            # Map to standardized format
            user = {
                "external_id": login,
                "email": profile.get("email", login),
                "full_name": f"{profile.get('firstName', '')} {profile.get('lastName', '')}".strip(),
                "department": profile.get("department", ""),
                "title": profile.get("title", ""),
                "location": profile.get("city", ""),
                "metadata": {
                    "source": "okta",
                    "last_updated": datetime.utcnow().isoformat(),
                    "okta_id": user_id
                }
            }
            
            # Add manager reference if present in profile
            manager_id = profile.get("managerId", "")
            if manager_id:
                user["metadata"]["manager_id"] = manager_id
            
            users.append(user)
        
        logger.info(f"Fetched {len(users)} users from Okta")
        return users
    
    async def fetch_groups(self) -> List[Dict[str, Any]]:
        """
        Fetch groups from Okta.
        
        Returns:
            List of group dictionaries with standardized format
        """
        # Fetch all groups
        endpoint = "/groups"
        params = {
            "limit": 200  # Maximum page size
        }
        
        okta_groups = await self._get_all_paged_results(endpoint, params)
        
        # Convert Okta groups to standardized format
        groups = []
        for okta_group in okta_groups:
            group_id = okta_group.get("id", "")
            
            # Fetch group members
            members = await self._get_group_members(group_id)
            
            group = {
                "external_id": group_id,
                "name": okta_group.get("profile", {}).get("name", ""),
                "description": okta_group.get("profile", {}).get("description", ""),
                "members": members,
                "metadata": {
                    "source": "okta",
                    "last_updated": datetime.utcnow().isoformat(),
                    "okta_id": group_id,
                    "group_type": okta_group.get("type", "")
                }
            }
            
            groups.append(group)
        
        logger.info(f"Fetched {len(groups)} groups from Okta")
        return groups
    
    async def _get_group_members(self, group_id: str) -> List[str]:
        """
        Get members of a group by ID.
        
        Args:
            group_id: Group ID
            
        Returns:
            List of member logins/usernames
        """
        try:
            endpoint = f"/groups/{group_id}/users"
            
            # Fetch users in the group
            group_users = await self._get_all_paged_results(endpoint)
            
            # Extract usernames
            members = []
            for user in group_users:
                user_id = user.get("id", "")
                profile = user.get("profile", {})
                login = profile.get("login", "")
                
                # Record user ID to login mapping if not already done
                if user_id and login and user_id not in self._user_id_mapping:
                    self._user_id_mapping[user_id] = login
                
                if login:
                    members.append(login)
            
            return members
        except Exception as e:
            logger.error(f"Error getting group members for {group_id}: {str(e)}")
            return []
    
    async def _get_user_manager(self, user_id: str) -> Optional[str]:
        """
        Get a user's manager based on profile attributes.
        
        Args:
            user_id: User ID
            
        Returns:
            Manager's username if found, None otherwise
        """
        # Check cache first
        if user_id in self._manager_cache:
            return self._manager_cache[user_id]
        
        try:
            endpoint = f"/users/{user_id}"
            
            # Fetch user details
            user = await self._api_request(endpoint)
            profile = user.get("profile", {})
            
            # Check for manager ID in profile
            manager_id = profile.get("managerId", "")
            
            if not manager_id:
                self._manager_cache[user_id] = None
                return None
            
            # Resolve manager ID to username
            if manager_id in self._user_id_mapping:
                manager_username = self._user_id_mapping[manager_id]
                self._manager_cache[user_id] = manager_username
                return manager_username
            else:
                # Need to fetch the manager's details
                try:
                    manager_endpoint = f"/users/{manager_id}"
                    manager = await self._api_request(manager_endpoint)
                    manager_profile = manager.get("profile", {})
                    manager_username = manager_profile.get("login", "")
                    
                    # Update mappings
                    if manager_username:
                        self._user_id_mapping[manager_id] = manager_username
                        self._manager_cache[user_id] = manager_username
                        return manager_username
                except:
                    # Manager lookup failed
                    self._manager_cache[user_id] = None
                    return None
        except Exception as e:
            logger.error(f"Error getting manager for user {user_id}: {str(e)}")
            self._manager_cache[user_id] = None
            return None
    
    async def fetch_reporting_relationships(self) -> List[Dict[str, Any]]:
        """
        Fetch reporting relationships from Okta.
        
        Returns:
            List of reporting relationship dictionaries
        """
        # Ensure we have users fetched first to build ID to username mapping
        if not self._user_id_mapping:
            await self.fetch_users()
        
        # Extract reporting relationships from user metadata
        relationships = []
        
        # For each user ID, try to determine their manager
        for user_id, username in self._user_id_mapping.items():
            manager_username = await self._get_user_manager(user_id)
            
            if manager_username:
                relationship = {
                    "manager_id": manager_username,
                    "direct_report_id": username,
                    "metadata": {
                        "source": "okta",
                        "last_updated": datetime.utcnow().isoformat()
                    }
                }
                relationships.append(relationship)
        
        logger.info(f"Fetched {len(relationships)} reporting relationships from Okta")
        return relationships
    
    async def synchronize(self) -> Dict[str, Any]:
        """
        Synchronize all data from Okta.
        
        Returns:
            Dictionary with all synchronized data and metadata
        """
        result = {
            "source": "okta",
            "timestamp": datetime.utcnow().isoformat(),
            "errors": {}
        }
        
        try:
            result["users"] = await self.fetch_users()
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            result["errors"]["users"] = str(e)
            result["users"] = []
            
        try:
            result["groups"] = await self.fetch_groups()
        except Exception as e:
            logger.error(f"Error fetching groups: {str(e)}")
            result["errors"]["groups"] = str(e)
            result["groups"] = []
            
        try:
            result["relationships"] = await self.fetch_reporting_relationships()
        except Exception as e:
            logger.error(f"Error fetching reporting relationships: {str(e)}")
            result["errors"]["relationships"] = str(e)
            result["relationships"] = []
            
        # Remove errors key if no errors occurred
        if not result["errors"]:
            del result["errors"]
            
        return result


class AzureADConnector(IdentityConnector):
    """
    Azure AD identity connector implementation using Microsoft Graph API.
    
    This connector uses the Microsoft Graph API to connect to and query Azure AD
    for user, group, and reporting relationship information.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the Azure AD connector.
        
        Args:
            config: Configuration dictionary with Azure AD connection details
                - tenant_id: Azure AD tenant ID
                - client_id: Application (client) ID
                - client_secret: Application secret
                - scopes: List of API permissions required (default: ["https://graph.microsoft.com/.default"])
        """
        self.config = config
        self.tenant_id = config.get("tenant_id")
        self.client_id = config.get("client_id")
        self.client_secret = config.get("client_secret")
        self.scopes = config.get("scopes", ["https://graph.microsoft.com/.default"])
        
        # Will be set when acquiring a token
        self.token = None
        self.token_expires_at = None
        
        # Base URL for Microsoft Graph API
        self.graph_url = "https://graph.microsoft.com/v1.0"
        
        # Will be populated during user fetching for resolving relationship references
        self._user_id_mapping = {}
    
    async def _get_token(self) -> str:
        """
        Get an authentication token for Microsoft Graph API.
        
        Returns:
            Authentication token
            
        Raises:
            AuthenticationError: If token acquisition fails
        """
        # Check if we have a valid token already
        if self.token and self.token_expires_at and datetime.utcnow() < self.token_expires_at:
            return self.token
        
        import aiohttp
        
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        payload = {
            "client_id": self.client_id,
            "scope": " ".join(self.scopes),
            "client_secret": self.client_secret,
            "grant_type": "client_credentials"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(token_url, data=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise AuthenticationError(f"Failed to acquire token: {error_text}")
                        
                    token_data = await response.json()
                    self.token = token_data.get("access_token")
                    expires_in = token_data.get("expires_in", 3600)
                    
                    # Set token expiration time (with a buffer)
                    self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in - 300)
                    
                    return self.token
                    
        except aiohttp.ClientError as e:
            raise ConnectionError(f"Failed to connect to Azure AD: {str(e)}")
        except Exception as e:
            raise AuthenticationError(f"Unexpected error acquiring token: {str(e)}")
    
    async def _graph_request(self, endpoint: str, method: str = "GET", params: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make a request to the Microsoft Graph API.
        
        Args:
            endpoint: API endpoint (without base URL)
            method: HTTP method to use
            params: Optional query parameters
            
        Returns:
            API response as dictionary
            
        Raises:
            ConnectionError: If request fails
            DataMappingError: If response cannot be parsed
        """
        import aiohttp
        
        # Get token for authentication
        token = await self._get_token()
        
        # Construct full URL
        url = f"{self.graph_url}{endpoint}"
        
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(method, url, headers=headers, params=params) as response:
                    if response.status >= 400:
                        error_text = await response.text()
                        raise ConnectionError(f"Graph API request failed ({response.status}): {error_text}")
                        
                    return await response.json()
                    
        except aiohttp.ClientError as e:
            raise ConnectionError(f"Failed to connect to Graph API: {str(e)}")
        except json.JSONDecodeError as e:
            raise DataMappingError(f"Failed to parse Graph API response: {str(e)}")
        except Exception as e:
            raise ConnectionError(f"Unexpected error in Graph API request: {str(e)}")
    
    async def _get_all_paged_results(self, endpoint: str, params: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Get all results for a paged Graph API endpoint.
        
        Args:
            endpoint: API endpoint
            params: Optional query parameters
            
        Returns:
            List of all items across pages
        """
        all_items = []
        params = params or {}
        
        response = await self._graph_request(endpoint, params=params)
        items = response.get("value", [])
        all_items.extend(items)
        
        # Follow nextLink for pagination if it exists
        while "@odata.nextLink" in response:
            next_url = response["@odata.nextLink"]
            # Extract relative path from next URL
            relative_path = next_url.split(self.graph_url)[1]
            response = await self._graph_request(relative_path)
            items = response.get("value", [])
            all_items.extend(items)
        
        return all_items
    
    async def fetch_users(self) -> List[Dict[str, Any]]:
        """
        Fetch users from Azure AD.
        
        Returns:
            List of user dictionaries with standardized format
        """
        # Reset the user ID mapping
        self._user_id_mapping = {}
        
        # Select specific user properties
        params = {
            "$select": "id,userPrincipalName,displayName,mail,department,jobTitle,officeLocation,manager"
        }
        
        # Fetch all users
        azure_users = await self._get_all_paged_results("/users", params)
        
        # Map Azure AD users to standardized format
        users = []
        for azure_user in azure_users:
            user_id = azure_user.get("id", "")
            upn = azure_user.get("userPrincipalName", "")
            
            # Build mapping for later relationship resolution
            if upn and user_id:
                self._user_id_mapping[user_id] = upn
            
            # Extract manager reference if present
            manager_ref = None
            if "manager" in azure_user:
                manager_id = azure_user.get("manager", {}).get("id", "")
                if manager_id:
                    manager_ref = manager_id
            
            # Map to standardized format
            user = {
                "external_id": upn,
                "email": azure_user.get("mail", upn),
                "full_name": azure_user.get("displayName", ""),
                "department": azure_user.get("department", ""),
                "title": azure_user.get("jobTitle", ""),
                "location": azure_user.get("officeLocation", ""),
                "metadata": {
                    "source": "azure_ad",
                    "last_updated": datetime.utcnow().isoformat(),
                    "object_id": user_id
                }
            }
            
            # Add manager reference if present
            if manager_ref:
                user["metadata"]["manager_id"] = manager_ref
            
            users.append(user)
        
        logger.info(f"Fetched {len(users)} users from Azure AD")
        return users
    
    async def fetch_groups(self) -> List[Dict[str, Any]]:
        """
        Fetch groups from Azure AD.
        
        Returns:
            List of group dictionaries with standardized format
        """
        # Select specific group properties
        params = {
            "$select": "id,displayName,description",
            # Only fetch security groups and Office 365 groups
            "$filter": "groupTypes/any(c:c eq 'Unified') or securityEnabled eq true"
        }
        
        # Fetch all groups
        azure_groups = await self._get_all_paged_results("/groups", params)
        
        # Map Azure AD groups to standardized format
        groups = []
        for azure_group in azure_groups:
            group_id = azure_group.get("id", "")
            
            # Get group members
            members = await self._get_group_members(group_id)
            
            group = {
                "external_id": group_id,
                "name": azure_group.get("displayName", ""),
                "description": azure_group.get("description", ""),
                "members": members,
                "metadata": {
                    "source": "azure_ad",
                    "last_updated": datetime.utcnow().isoformat(),
                    "object_id": group_id
                }
            }
            
            groups.append(group)
        
        logger.info(f"Fetched {len(groups)} groups from Azure AD")
        return groups
    
    async def _get_group_members(self, group_id: str) -> List[str]:
        """
        Get members of a group by ID.
        
        Args:
            group_id: Group object ID
            
        Returns:
            List of member userPrincipalNames
        """
        try:
            # Get members endpoint
            members_endpoint = f"/groups/{group_id}/members"
            params = {
                "$select": "id,userPrincipalName"
            }
            
            # Only return users (not nested groups or other objects)
            members = await self._get_all_paged_results(members_endpoint, params)
            
            # Extract UPNs for user members
            upns = []
            for member in members:
                # Check if this is a user object
                if "@odata.type" in member and "#microsoft.graph.user" in member["@odata.type"]:
                    upn = member.get("userPrincipalName")
                    if upn:
                        upns.append(upn)
                    else:
                        # If no UPN, try to get it from our mapping using the ID
                        user_id = member.get("id")
                        if user_id and user_id in self._user_id_mapping:
                            upns.append(self._user_id_mapping[user_id])
            
            return upns
        except Exception as e:
            logger.error(f"Error getting group members for {group_id}: {str(e)}")
            return []
    
    async def fetch_reporting_relationships(self) -> List[Dict[str, Any]]:
        """
        Fetch reporting relationships from Azure AD using manager references.
        
        Returns:
            List of reporting relationship dictionaries
        """
        # We need users already fetched to extract manager relationships
        users = await self.fetch_users()
        
        # Extract manager relationships from user metadata
        relationships = []
        for user in users:
            external_id = user["external_id"]
            manager_id = user.get("metadata", {}).get("manager_id", "")
            
            if manager_id and manager_id in self._user_id_mapping:
                manager_upn = self._user_id_mapping[manager_id]
                
                relationship = {
                    "manager_id": manager_upn,
                    "direct_report_id": external_id,
                    "metadata": {
                        "source": "azure_ad",
                        "last_updated": datetime.utcnow().isoformat()
                    }
                }
                
                relationships.append(relationship)
        
        logger.info(f"Fetched {len(relationships)} reporting relationships from Azure AD")
        return relationships
    
    async def synchronize(self) -> Dict[str, Any]:
        """
        Synchronize all data from Azure AD.
        
        Returns:
            Dictionary with all synchronized data and metadata
        """
        result = {
            "source": "azure_ad",
            "timestamp": datetime.utcnow().isoformat(),
            "errors": {}
        }
        
        try:
            result["users"] = await self.fetch_users()
        except Exception as e:
            logger.error(f"Error fetching users: {str(e)}")
            result["errors"]["users"] = str(e)
            result["users"] = []
            
        try:
            result["groups"] = await self.fetch_groups()
        except Exception as e:
            logger.error(f"Error fetching groups: {str(e)}")
            result["errors"]["groups"] = str(e)
            result["groups"] = []
            
        try:
            result["relationships"] = await self.fetch_reporting_relationships()
        except Exception as e:
            logger.error(f"Error fetching reporting relationships: {str(e)}")
            result["errors"]["relationships"] = str(e)
            result["relationships"] = []
            
        # Remove errors key if no errors occurred
        if not result["errors"]:
            del result["errors"]
            
        return result


class IdentitySynchronizer:
    """
    Service for synchronizing identity data from external providers to the application.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.connectors = {}
    
    def register_connector(self, name: str, connector: IdentityConnector):
        """
        Register an identity connector.
        
        Args:
            name: Name of the connector
            connector: Identity connector instance
        """
        self.connectors[name] = connector
    
    async def synchronize_provider(self, provider_name: str, tenant_id: int) -> Dict[str, Any]:
        """
        Synchronize data from a specific identity provider.
        
        Args:
            provider_name: Name of the provider to synchronize
            tenant_id: Tenant ID to associate with synchronized data
            
        Returns:
            Dict with synchronization results
            
        Raises:
            ValueError: If the provider is not registered
        """
        if provider_name not in self.connectors:
            raise ValueError(f"Identity provider '{provider_name}' is not registered")
            
        connector = self.connectors[provider_name]
        sync_data = await connector.synchronize()
        
        # Process users
        users_created = 0
        users_updated = 0
        for user_data in sync_data["users"]:
            # Check if user exists by external_id
            user = self.db.query(User).filter(
                User.external_id == user_data["external_id"],
                User.tenant_id == tenant_id
            ).first()
            
            if user:
                # Update existing user
                user.email = user_data["email"]
                user.full_name = user_data["full_name"]
                users_updated += 1
            else:
                # Create new user
                user = User(
                    external_id=user_data["external_id"],
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    tenant_id=tenant_id
                )
                self.db.add(user)
                users_created += 1
        
        # Process groups/teams
        teams_created = 0
        teams_updated = 0
        for group_data in sync_data["groups"]:
            # Check if team exists by external_id
            team = self.db.query(Team).filter(
                Team.external_id == group_data["external_id"],
                Team.tenant_id == tenant_id
            ).first()
            
            if team:
                # Update existing team
                team.name = group_data["name"]
                team.description = group_data["description"]
                teams_updated += 1
            else:
                # Create new team
                team = Team(
                    external_id=group_data["external_id"],
                    name=group_data["name"],
                    description=group_data["description"],
                    tenant_id=tenant_id
                )
                self.db.add(team)
                teams_created += 1
                
            # Process team memberships
            for member_id in group_data["members"]:
                user = self.db.query(User).filter(
                    User.external_id == member_id,
                    User.tenant_id == tenant_id
                ).first()
                
                if user and team:
                    # Add user to team if not already a member
                    if user not in team.members:
                        team.members.append(user)
        
        # Process reporting relationships
        # This is a simplified implementation - in a real system, you would create relationships
        # between users in a more sophisticated way
        
        self.db.commit()
        
        return {
            "provider": provider_name,
            "tenant_id": tenant_id,
            "users_created": users_created,
            "users_updated": users_updated,
            "teams_created": teams_created,
            "teams_updated": teams_updated,
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def synchronize_all_providers(self, tenant_id: int) -> List[Dict[str, Any]]:
        """
        Synchronize data from all registered identity providers.
        
        Args:
            tenant_id: Tenant ID to associate with synchronized data
            
        Returns:
            List of dictionaries with synchronization results
        """
        results = []
        for provider_name in self.connectors:
            result = await self.synchronize_provider(provider_name, tenant_id)
            results.append(result)
        return results