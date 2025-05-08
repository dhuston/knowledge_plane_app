"""LDAP connector implementation."""

import asyncio
import logging
import ssl
from datetime import datetime
from typing import Dict, Any, AsyncIterator, Optional, List

import ldap3
from ldap3 import Server, Connection, ALL, SUBTREE, ALL_ATTRIBUTES
from ldap3.core.exceptions import LDAPException, LDAPInvalidCredentialsResult

from app.integrations.base_connector import BaseConnector
from app.integrations.exceptions import ConnectionError, AuthenticationError

logger = logging.getLogger(__name__)


class LDAPConnector(BaseConnector):
    """
    Connector for LDAP directory services.
    
    This connector provides access to organizational structure data from LDAP.
    
    Attributes:
        INTEGRATION_TYPE: The integration type identifier
        SUPPORTED_ENTITY_TYPES: The entity types supported by this connector
    """
    
    INTEGRATION_TYPE = "ldap"
    SUPPORTED_ENTITY_TYPES = ["user", "group", "organizational_unit", "department"]
    
    def __init__(self, config: Dict[str, Any], credentials: Dict[str, Any]):
        """
        Initialize the LDAP connector.
        
        Args:
            config: Configuration parameters including server_uri, base_dn, etc.
            credentials: Authentication credentials including bind_dn and password
        """
        super().__init__(config, credentials)
        self.server_uri = config.get("server_uri")
        self.base_dn = config.get("base_dn")
        self.use_ssl = config.get("use_ssl", True)
        self.verify_ssl = config.get("verify_ssl", True)
        self.page_size = config.get("page_size", 1000)
        self.connection = None
    
    async def _connect(self) -> bool:
        """
        Establish connection to LDAP server.
        
        Returns:
            True if connection was successful
            
        Raises:
            ConnectionError: If connection cannot be established
            AuthenticationError: If authentication fails
        """
        if not self.server_uri:
            raise ConnectionError("LDAP server URI is required in configuration")
        
        if not self.base_dn:
            raise ConnectionError("Base DN is required in configuration")
        
        # Get authentication details
        bind_dn = self.credentials.get("bind_dn")
        password = self.credentials.get("password")
        
        if not bind_dn or not password:
            raise AuthenticationError("Bind DN and password are required")
        
        try:
            # Synchronous operations (LDAP binding) need to be executed in a separate thread
            def connect_sync():
                # Configure SSL if enabled
                tls_config = None
                if self.use_ssl:
                    tls_config = ldap3.Tls(
                        validate=ssl.CERT_REQUIRED if self.verify_ssl else ssl.CERT_NONE,
                        version=ssl.PROTOCOL_TLS_CLIENT
                    )
                
                # Create server object
                server = Server(
                    self.server_uri,
                    get_info=ALL,
                    use_ssl=self.use_ssl,
                    tls=tls_config
                )
                
                # Create connection object
                connection = Connection(
                    server,
                    user=bind_dn,
                    password=password,
                    auto_bind=True,
                    raise_exceptions=True
                )
                
                return connection
            
            # Execute connection in a separate thread
            self.connection = await asyncio.to_thread(connect_sync)
            return True
            
        except LDAPInvalidCredentialsResult as e:
            raise AuthenticationError(f"Invalid LDAP credentials: {str(e)}")
        
        except LDAPException as e:
            raise ConnectionError(f"Failed to connect to LDAP server: {str(e)}")
        
        except Exception as e:
            raise ConnectionError(f"Error connecting to LDAP server: {str(e)}")
    
    async def _test_connection(self) -> Dict[str, Any]:
        """
        Test if the connection to LDAP is working.
        
        Returns:
            Dict containing status and message about the connection
        """
        if not self.connection:
            try:
                await self._connect()
            except Exception as e:
                return {
                    "status": "error",
                    "message": str(e)
                }
        
        try:
            # Test by getting basic server info and doing a simple search
            def test_sync():
                # Get server info
                server_info = {
                    "vendor": self.connection.server.info.vendor_name if self.connection.server.info else "Unknown",
                    "version": self.connection.server.info.vendor_version if self.connection.server.info else "Unknown"
                }
                
                # Do a simple search to validate connection and permissions
                self.connection.search(
                    search_base=self.base_dn,
                    search_filter="(objectClass=*)",
                    search_scope=SUBTREE,
                    attributes=['objectClass'],
                    size_limit=1
                )
                
                return server_info
            
            server_info = await asyncio.to_thread(test_sync)
            
            return {
                "status": "success",
                "message": "Successfully connected to LDAP server",
                "details": {
                    "vendor": server_info.get("vendor"),
                    "version": server_info.get("version"),
                    "base_dn": self.base_dn
                }
            }
        
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error testing LDAP connection: {str(e)}"
            }
    
    async def _fetch_data(self, entity_type: str, last_sync: Optional[datetime] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Fetch data from LDAP directory.
        
        Args:
            entity_type: Type of entity to fetch (user, group, organizational_unit, department)
            last_sync: Optional timestamp of last synchronization for incremental sync
            
        Returns:
            AsyncIterator yielding LDAP entities
            
        Raises:
            ConnectionError: If not connected or connection fails
        """
        if not self.connection:
            await self._connect()
        
        if entity_type not in self.SUPPORTED_ENTITY_TYPES:
            logger.warning(f"Unsupported entity type for LDAP: {entity_type}")
            return
        
        # Define search filter based on entity type
        search_filter = self._get_search_filter(entity_type, last_sync)
        
        # Define search base DN
        search_base = self._get_search_base(entity_type)
        
        try:
            # Define search parameters
            search_params = {
                "search_base": search_base,
                "search_filter": search_filter,
                "search_scope": SUBTREE,
                "attributes": ALL_ATTRIBUTES,
                "paged_size": self.page_size
            }
            
            # We need to execute LDAP search in a thread
            def search_sync(params):
                self.connection.search(**params)
                entries = []
                
                if self.connection.entries:
                    entries = [entry.entry_attributes_as_dict for entry in self.connection.entries]
                    # Add DN to each entry
                    for i, entry in enumerate(entries):
                        entry['dn'] = self.connection.entries[i].entry_dn
                
                return entries
            
            # First page of results
            entries = await asyncio.to_thread(search_sync, search_params)
            
            # Transform and yield each entity
            for entry in entries:
                yield self._transform_entry(entry, entity_type)
            
            # Handle paged results if the server supports it
            cookie = self.connection.result.get('controls', {}).get('1.2.840.113556.1.4.319', {}).get('value', {}).get('cookie')
            
            while cookie:
                # Update search params with the cookie
                search_params["paged_cookie"] = cookie
                
                # Get next page
                entries = await asyncio.to_thread(search_sync, search_params)
                
                # Transform and yield each entity
                for entry in entries:
                    yield self._transform_entry(entry, entity_type)
                
                # Check for another cookie
                cookie = self.connection.result.get('controls', {}).get('1.2.840.113556.1.4.319', {}).get('value', {}).get('cookie')
        
        except Exception as e:
            logger.error(f"Error fetching {entity_type} data from LDAP: {e}")
            raise ConnectionError(f"Error fetching {entity_type} data: {str(e)}")
    
    def _get_search_filter(self, entity_type: str, last_sync: Optional[datetime] = None) -> str:
        """
        Get LDAP search filter for the given entity type.
        
        Args:
            entity_type: Type of entity to search for
            last_sync: Optional timestamp of last synchronization
            
        Returns:
            LDAP search filter string
        """
        # Basic filters for each entity type
        filters = {
            "user": "(objectClass=person)",
            "group": "(objectClass=group)",
            "organizational_unit": "(objectClass=organizationalUnit)",
            "department": "(&(objectClass=organizationalUnit)(ou=*))"
        }
        
        base_filter = filters.get(entity_type, "(objectClass=*)")
        
        # Add time-based filter for incremental sync if supported by the directory
        # Note: This is directory-specific and may need customization
        if last_sync and entity_type in ["user", "group"]:
            # Format timestamp in LDAP generalized time format (YYYYMMDDHHmmssZ)
            ts = last_sync.strftime("%Y%m%d%H%M%SZ")
            
            # Modify filter to include only entries modified since last sync
            # Active Directory uses whenChanged attribute, other directories may use modifyTimestamp
            time_filter = f"(|(whenChanged>={ts})(modifyTimestamp>={ts}))"
            
            return f"(&{base_filter}{time_filter})"
        
        return base_filter
    
    def _get_search_base(self, entity_type: str) -> str:
        """
        Get search base DN for the given entity type.
        
        Args:
            entity_type: Type of entity to search for
            
        Returns:
            Search base DN
        """
        # Use entity-specific bases from config if available
        entity_bases = {
            "user": self.config.get("users_dn"),
            "group": self.config.get("groups_dn"),
            "organizational_unit": self.config.get("ou_dn"),
            "department": self.config.get("departments_dn")
        }
        
        return entity_bases.get(entity_type) or self.base_dn
    
    def _transform_entry(self, entry: Dict[str, Any], entity_type: str) -> Dict[str, Any]:
        """
        Transform an LDAP entry into a standardized entity.
        
        Args:
            entry: Raw LDAP entry data
            entity_type: Type of entity
            
        Returns:
            Transformed entity data
        """
        # Extract DN and unique ID
        dn = entry.get('dn')
        
        # Common base entity
        entity = {
            "dn": dn,
            "id": self._get_entity_id(entry, entity_type),
            "source": "ldap",
            "raw_data": entry
        }
        
        # Apply entity-specific transformations
        if entity_type == "user":
            return self._transform_user(entry, entity)
        elif entity_type == "group":
            return self._transform_group(entry, entity)
        elif entity_type == "organizational_unit" or entity_type == "department":
            return self._transform_ou(entry, entity)
        else:
            return entity
    
    def _get_entity_id(self, entry: Dict[str, Any], entity_type: str) -> str:
        """
        Get a unique ID for an LDAP entry.
        
        Args:
            entry: LDAP entry
            entity_type: Entity type
            
        Returns:
            Unique ID string
        """
        # Try various common unique identifiers
        for attr in ['objectGUID', 'entryUUID', 'nsUniqueId', 'uid', 'sAMAccountName']:
            if attr in entry and entry[attr]:
                return str(entry[attr][0])
        
        # Fall back to DN
        return entry.get('dn')
    
    def _transform_user(self, entry: Dict[str, Any], base_entity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform an LDAP user entry.
        
        Args:
            entry: Raw LDAP entry
            base_entity: Base entity data
            
        Returns:
            Transformed user entity
        """
        entity = base_entity.copy()
        entity.update({
            "entity_type": "user",
            "name": self._get_first_value(entry, ['displayName', 'cn']),
            "email": self._get_first_value(entry, ['mail', 'email']),
            "username": self._get_first_value(entry, ['sAMAccountName', 'uid']),
            "given_name": self._get_first_value(entry, ['givenName']),
            "surname": self._get_first_value(entry, ['sn']),
            "title": self._get_first_value(entry, ['title']),
            "department": self._get_first_value(entry, ['department']),
            "manager_dn": self._get_first_value(entry, ['manager']),
            "employee_id": self._get_first_value(entry, ['employeeID']),
            "phone": self._get_first_value(entry, ['telephoneNumber', 'mobile']),
            "active": not self._is_disabled(entry),
            "member_of": entry.get('memberOf', [])
        })
        return entity
    
    def _transform_group(self, entry: Dict[str, Any], base_entity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform an LDAP group entry.
        
        Args:
            entry: Raw LDAP entry
            base_entity: Base entity data
            
        Returns:
            Transformed group entity
        """
        entity = base_entity.copy()
        entity.update({
            "entity_type": "group",
            "name": self._get_first_value(entry, ['cn']),
            "description": self._get_first_value(entry, ['description']),
            "email": self._get_first_value(entry, ['mail']),
            "members": entry.get('member', []),
            "member_count": len(entry.get('member', [])),
            "group_type": self._determine_group_type(entry)
        })
        return entity
    
    def _transform_ou(self, entry: Dict[str, Any], base_entity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform an LDAP organizational unit entry.
        
        Args:
            entry: Raw LDAP entry
            base_entity: Base entity data
            
        Returns:
            Transformed OU entity
        """
        entity = base_entity.copy()
        entity.update({
            "entity_type": "organizational_unit",
            "name": self._get_first_value(entry, ['ou']),
            "description": self._get_first_value(entry, ['description']),
            "parent_dn": self._get_parent_dn(entry.get('dn'))
        })
        return entity
    
    def _get_first_value(self, entry: Dict[str, Any], attributes: List[str]) -> Optional[str]:
        """
        Get the first available value from a list of potential attributes.
        
        Args:
            entry: LDAP entry dictionary
            attributes: List of attribute names to try
            
        Returns:
            First found attribute value or None
        """
        for attr in attributes:
            if attr in entry and entry[attr]:
                value = entry[attr][0]
                # Handle binary values
                if isinstance(value, bytes):
                    try:
                        return value.decode('utf-8')
                    except UnicodeDecodeError:
                        return None
                return str(value)
        return None
    
    def _is_disabled(self, entry: Dict[str, Any]) -> bool:
        """
        Check if an AD/LDAP user account is disabled.
        
        Args:
            entry: User entry
            
        Returns:
            True if account is disabled, False otherwise
        """
        # Check userAccountControl for AD
        if 'userAccountControl' in entry and entry['userAccountControl']:
            # 0x0002 is the ACCOUNTDISABLE flag in AD
            return (int(entry['userAccountControl'][0]) & 2) == 2
        
        # For non-AD directories
        if 'nsAccountLock' in entry:
            return entry['nsAccountLock'][0].lower() == 'true'
            
        return False
    
    def _get_parent_dn(self, dn: str) -> Optional[str]:
        """
        Get parent DN from a DN string.
        
        Args:
            dn: Distinguished Name
            
        Returns:
            Parent DN or None
        """
        if not dn:
            return None
        
        # Remove the first component of the DN to get the parent
        parts = dn.split(',')
        if len(parts) > 1:
            return ','.join(parts[1:])
        return None
    
    def _determine_group_type(self, entry: Dict[str, Any]) -> str:
        """
        Determine the type of group based on attributes.
        
        Args:
            entry: Group entry
            
        Returns:
            Group type: security, distribution, etc.
        """
        # For Active Directory
        if 'groupType' in entry and entry['groupType']:
            group_type_value = int(entry['groupType'][0])
            
            # 0x80000000 is ADS_GROUP_TYPE_SECURITY_ENABLED
            if group_type_value & 0x80000000:
                return "security"
            else:
                return "distribution"
                
        # Try to determine from objectClass
        object_classes = [oc.lower() for oc in entry.get('objectClass', [])]
        
        if 'groupofnames' in object_classes:
            return "static"
        elif 'groupofuniquenames' in object_classes:
            return "static_unique"
        elif 'dynamicgroup' in object_classes:
            return "dynamic"
            
        return "unknown"
        
    async def __aenter__(self):
        """Enter async context manager."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Exit async context manager and close resources."""
        if self.connection:
            def disconnect_sync():
                if self.connection.bound:
                    self.connection.unbind()
            
            await asyncio.to_thread(disconnect_sync)