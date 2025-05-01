import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
import json
import pytest
import asyncio

from sqlalchemy.orm import Session
from app.services.identity_connector_service import (
    IdentityConnector, ActiveDirectoryConnector, AzureADConnector,
    OktaConnector, IdentitySynchronizer, ConnectionError,
    AuthenticationError, DataMappingError
)
from app.models.user import User
from app.models.team import Team
from app.models.department import Department


class TestActiveDirectoryConnector(unittest.IsolatedAsyncioTestCase):
    """Tests for the ActiveDirectoryConnector class."""

    async def asyncSetUp(self):
        """Set up test fixtures before each test method."""
        self.config = {
            "domain": "example.com",
            "server": "ldap.example.com",
            "username": "admin",
            "password": "password",
            "use_ssl": True,
            "base_dn": "dc=example,dc=com"
        }
        self.connector = ActiveDirectoryConnector(self.config)

    async def test_initialization(self):
        """Test connector initialization."""
        self.assertEqual(self.connector.domain, "example.com")
        self.assertEqual(self.connector.server, "ldap.example.com")
        self.assertEqual(self.connector.username, "admin")
        self.assertEqual(self.connector.password, "password")
        self.assertTrue(self.connector.use_ssl)
        self.assertEqual(self.connector.base_dn, "dc=example,dc=com")

    async def test_connect_success(self):
        """Test successful connection to Active Directory."""
        # Mock the ldap3 library
        with patch('app.services.identity_connector_service.ldap3') as mock_ldap:
            # Configure mocks
            mock_server = MagicMock()
            mock_connection = MagicMock()
            mock_ldap.Server.return_value = mock_server
            mock_ldap.Connection.return_value = mock_connection
            mock_connection.bind.return_value = True
            
            # Call method
            await self.connector._connect()
            
            # Verify
            mock_ldap.Server.assert_called_once_with(
                self.connector.server,
                use_ssl=self.connector.use_ssl
            )
            mock_ldap.Connection.assert_called_once_with(
                mock_server,
                user=f"{self.connector.domain}\\{self.connector.username}",
                password=self.connector.password,
                auto_bind=False
            )
            mock_connection.bind.assert_called_once()
            self.assertEqual(self.connector.connection, mock_connection)

    async def test_connect_failure(self):
        """Test connection failure to Active Directory."""
        # Mock the ldap3 library
        with patch('app.services.identity_connector_service.ldap3') as mock_ldap:
            # Configure mocks
            mock_server = MagicMock()
            mock_connection = MagicMock()
            mock_ldap.Server.return_value = mock_server
            mock_ldap.Connection.return_value = mock_connection
            mock_connection.bind.return_value = False
            mock_connection.result = {"description": "Invalid credentials"}
            
            # Call method and check exception
            with self.assertRaises(AuthenticationError):
                await self.connector._connect()

    async def test_fetch_users(self):
        """Test fetching users from Active Directory."""
        # Mock the _connect and _query_ad methods
        self.connector._connect = AsyncMock()
        mock_response = [
            {
                "attributes": {
                    "sAMAccountName": "jdoe",
                    "displayName": "John Doe",
                    "mail": "jdoe@example.com",
                    "department": "Engineering",
                    "title": "Software Engineer",
                    "physicalDeliveryOfficeName": "New York",
                    "manager": "CN=Jane Smith,OU=Users,DC=example,DC=com"
                },
                "dn": "CN=John Doe,OU=Users,DC=example,DC=com"
            },
            {
                "attributes": {
                    "sAMAccountName": "jsmith",
                    "displayName": "Jane Smith", 
                    "mail": "jsmith@example.com",
                    "department": "Marketing",
                    "title": "Marketing Manager",
                    "physicalDeliveryOfficeName": "San Francisco"
                },
                "dn": "CN=Jane Smith,OU=Users,DC=example,DC=com"
            }
        ]
        self.connector._query_ad = AsyncMock(return_value=mock_response)
        
        # Call method
        users = await self.connector.fetch_users()
        
        # Verify
        self.connector._connect.assert_called_once()
        self.connector._query_ad.assert_called_once()
        self.assertEqual(len(users), 2)
        
        # Verify first user
        self.assertEqual(users[0]["external_id"], "jdoe")
        self.assertEqual(users[0]["full_name"], "John Doe")
        self.assertEqual(users[0]["email"], "jdoe@example.com")
        self.assertEqual(users[0]["department"], "Engineering")
        self.assertEqual(users[0]["title"], "Software Engineer")
        self.assertEqual(users[0]["location"], "New York")
        self.assertEqual(users[0]["metadata"]["source"], "active_directory")
        self.assertEqual(users[0]["metadata"]["dn"], "CN=John Doe,OU=Users,DC=example,DC=com")
        self.assertEqual(users[0]["metadata"]["manager_dn"], "CN=Jane Smith,OU=Users,DC=example,DC=com")

        # Verify second user
        self.assertEqual(users[1]["external_id"], "jsmith")
        self.assertEqual(users[1]["full_name"], "Jane Smith")
        self.assertEqual(users[1]["email"], "jsmith@example.com")

    async def test_fetch_users_empty_attributes(self):
        """Test fetching users with missing attributes."""
        # Mock the _connect and _query_ad methods
        self.connector._connect = AsyncMock()
        mock_response = [
            {
                "attributes": {
                    "sAMAccountName": "jdoe",
                    # Missing other attributes
                },
                "dn": "CN=John Doe,OU=Users,DC=example,DC=com"
            }
        ]
        self.connector._query_ad = AsyncMock(return_value=mock_response)
        
        # Call method
        users = await self.connector.fetch_users()
        
        # Verify defaults are used for missing attributes
        self.assertEqual(len(users), 1)
        self.assertEqual(users[0]["external_id"], "jdoe")
        self.assertEqual(users[0]["full_name"], "")  # Default
        self.assertEqual(users[0]["email"], "")  # Default
        self.assertEqual(users[0]["department"], "")  # Default
        self.assertEqual(users[0]["title"], "")  # Default
        self.assertEqual(users[0]["location"], "")  # Default

    async def test_fetch_groups(self):
        """Test fetching groups from Active Directory."""
        # Mock the _connect and _query_ad methods
        self.connector._connect = AsyncMock()
        mock_response = [
            {
                "attributes": {
                    "cn": "Engineering",
                    "description": "Engineering Team",
                    "member": [
                        "CN=John Doe,OU=Users,DC=example,DC=com"
                    ]
                },
                "dn": "CN=Engineering,OU=Groups,DC=example,DC=com"
            },
            {
                "attributes": {
                    "cn": "Marketing",
                    "description": "Marketing Team",
                    "member": [
                        "CN=Jane Smith,OU=Users,DC=example,DC=com"
                    ]
                },
                "dn": "CN=Marketing,OU=Groups,DC=example,DC=com"
            }
        ]
        self.connector._query_ad = AsyncMock(return_value=mock_response)
        
        # Mock the _resolve_group_members method
        self.connector._resolve_group_members = AsyncMock()
        self.connector._resolve_group_members.side_effect = [
            ["jdoe"],  # Members for Engineering
            ["jsmith"]  # Members for Marketing
        ]
        
        # Call method
        groups = await self.connector.fetch_groups()
        
        # Verify
        self.connector._connect.assert_called_once()
        self.connector._query_ad.assert_called_once()
        self.assertEqual(len(groups), 2)
        
        # Verify first group
        self.assertEqual(groups[0]["external_id"], "Engineering")
        self.assertEqual(groups[0]["name"], "Engineering")
        self.assertEqual(groups[0]["description"], "Engineering Team")
        self.assertEqual(groups[0]["members"], ["jdoe"])
        self.assertEqual(groups[0]["metadata"]["source"], "active_directory")
        self.assertEqual(groups[0]["metadata"]["dn"], "CN=Engineering,OU=Groups,DC=example,DC=com")
        
        # Verify second group
        self.assertEqual(groups[1]["external_id"], "Marketing")
        self.assertEqual(groups[1]["members"], ["jsmith"])

    async def test_resolve_group_members(self):
        """Test resolving group members from DNs to sAMAccountNames."""
        # Create mock mapping of DNs to sAMAccountNames
        dn_to_samaccountname = {
            "CN=John Doe,OU=Users,DC=example,DC=com": "jdoe",
            "CN=Jane Smith,OU=Users,DC=example,DC=com": "jsmith"
        }
        self.connector._dn_to_samaccountname = dn_to_samaccountname
        
        # Call method with list of DNs
        member_dns = [
            "CN=John Doe,OU=Users,DC=example,DC=com",
            "CN=Jane Smith,OU=Users,DC=example,DC=com",
            "CN=Unknown User,OU=Users,DC=example,DC=com"  # This one is not in the mapping
        ]
        samaccountnames = await self.connector._resolve_group_members(member_dns)
        
        # Verify only the known DNs are resolved
        self.assertEqual(len(samaccountnames), 2)
        self.assertIn("jdoe", samaccountnames)
        self.assertIn("jsmith", samaccountnames)

    async def test_fetch_reporting_relationships(self):
        """Test fetching reporting relationships from Active Directory."""
        # Mock the _connect method
        self.connector._connect = AsyncMock()
        
        # Create mock user data with manager attributes
        users = [
            {
                "external_id": "jdoe",
                "metadata": {
                    "manager_dn": "CN=Jane Smith,OU=Users,DC=example,DC=com"
                }
            },
            {
                "external_id": "alee",
                "metadata": {
                    "manager_dn": "CN=Jane Smith,OU=Users,DC=example,DC=com"
                }
            },
            {
                "external_id": "jsmith",
                "metadata": {
                    "manager_dn": "CN=Bob Johnson,OU=Users,DC=example,DC=com"
                }
            },
            {
                "external_id": "bjohnson",
                "metadata": {}  # No manager
            }
        ]
        
        # Mock the _dn_to_samaccountname mapping
        self.connector._dn_to_samaccountname = {
            "CN=Jane Smith,OU=Users,DC=example,DC=com": "jsmith",
            "CN=Bob Johnson,OU=Users,DC=example,DC=com": "bjohnson"
        }
        
        # Mock the fetch_users method to return our test data
        self.connector.fetch_users = AsyncMock(return_value=users)
        
        # Call method
        relationships = await self.connector.fetch_reporting_relationships()
        
        # Verify
        self.connector.fetch_users.assert_called_once()
        self.assertEqual(len(relationships), 3)  # Three relationships defined above
        
        # Find and verify specific relationships
        jdoe_rel = next(r for r in relationships if r["direct_report_id"] == "jdoe")
        self.assertEqual(jdoe_rel["manager_id"], "jsmith")
        
        alee_rel = next(r for r in relationships if r["direct_report_id"] == "alee")
        self.assertEqual(alee_rel["manager_id"], "jsmith")
        
        jsmith_rel = next(r for r in relationships if r["direct_report_id"] == "jsmith")
        self.assertEqual(jsmith_rel["manager_id"], "bjohnson")

    async def test_synchronize(self):
        """Test synchronizing all data from Active Directory."""
        # Mock the fetch methods
        mock_users = [{"external_id": "jdoe", "email": "jdoe@example.com"}]
        mock_groups = [{"external_id": "engineering", "members": ["jdoe"]}]
        mock_relationships = [{"manager_id": "jsmith", "direct_report_id": "jdoe"}]
        
        self.connector.fetch_users = AsyncMock(return_value=mock_users)
        self.connector.fetch_groups = AsyncMock(return_value=mock_groups)
        self.connector.fetch_reporting_relationships = AsyncMock(return_value=mock_relationships)
        
        # Call method
        result = await self.connector.synchronize()
        
        # Verify
        self.connector.fetch_users.assert_called_once()
        self.connector.fetch_groups.assert_called_once()
        self.connector.fetch_reporting_relationships.assert_called_once()
        self.assertEqual(result["source"], "active_directory")
        self.assertEqual(result["users"], mock_users)
        self.assertEqual(result["groups"], mock_groups)
        self.assertEqual(result["relationships"], mock_relationships)
        self.assertIn("timestamp", result)

    async def test_query_ad_success(self):
        """Test successful LDAP query execution."""
        # Mock connection
        mock_connection = MagicMock()
        self.connector.connection = mock_connection
        
        # Mock search results
        mock_entry1 = MagicMock()
        mock_entry1.entry_dn = "CN=John Doe,OU=Users,DC=example,DC=com"
        mock_entry1.entry_attributes_as_dict = {
            "sAMAccountName": ["jdoe"],
            "displayName": ["John Doe"]
        }
        
        mock_entry2 = MagicMock()
        mock_entry2.entry_dn = "CN=Jane Smith,OU=Users,DC=example,DC=com"
        mock_entry2.entry_attributes_as_dict = {
            "sAMAccountName": ["jsmith"],
            "displayName": ["Jane Smith"]
        }
        
        # Configure search method
        mock_connection.entries = [mock_entry1, mock_entry2]
        mock_connection.search.return_value = True
        mock_connection.result = {"result": 0}  # Success
        
        # Call method with users query
        query_params = {
            "search_base": "OU=Users,DC=example,DC=com",
            "search_filter": "(objectClass=user)",
            "attributes": ["sAMAccountName", "displayName"]
        }
        
        results = await self.connector._query_ad("users", query_params)
        
        # Verify search was executed and results processed
        mock_connection.search.assert_called_once()
        self.assertEqual(len(results), 2)
        
        # Verify entry attributes were extracted
        self.assertEqual(results[0]["dn"], "CN=John Doe,OU=Users,DC=example,DC=com")
        self.assertEqual(results[0]["attributes"]["sAMAccountName"], "jdoe")
        self.assertEqual(results[0]["attributes"]["displayName"], "John Doe")
        
        self.assertEqual(results[1]["attributes"]["sAMAccountName"], "jsmith")

    async def test_query_ad_failure(self):
        """Test LDAP query failure handling."""
        # Mock connection
        mock_connection = MagicMock()
        self.connector.connection = mock_connection
        
        # Configure search method to fail
        mock_connection.search.return_value = False
        mock_connection.result = {"description": "Operations error"}
        
        # Call method and check exception
        query_params = {
            "search_base": "OU=Users,DC=example,DC=com",
            "search_filter": "(objectClass=user)",
            "attributes": ["sAMAccountName", "displayName"]
        }
        
        with self.assertRaises(ConnectionError):
            await self.connector._query_ad("users", query_params)
            
    async def test_get_query_params_users(self):
        """Test getting query parameters for users."""
        params = self.connector._get_query_params("users")
        
        # Verify user query parameters
        self.assertEqual(params["search_base"], self.connector.base_dn)
        self.assertIn("objectClass=user", params["search_filter"])
        self.assertIn("sAMAccountName", params["attributes"])
        self.assertIn("displayName", params["attributes"])
        self.assertIn("mail", params["attributes"])
        self.assertIn("department", params["attributes"])
        
    async def test_get_query_params_groups(self):
        """Test getting query parameters for groups."""
        params = self.connector._get_query_params("groups")
        
        # Verify group query parameters
        self.assertEqual(params["search_base"], self.connector.base_dn)
        self.assertIn("objectClass=group", params["search_filter"])
        self.assertIn("cn", params["attributes"])
        self.assertIn("description", params["attributes"])
        self.assertIn("member", params["attributes"])

    async def test_error_handling(self):
        """Test error handling during synchronization."""
        # Make fetch_users throw an exception
        error_message = "Failed to connect to Active Directory"
        self.connector.fetch_users = AsyncMock(side_effect=ConnectionError(error_message))
        self.connector.fetch_groups = AsyncMock()
        self.connector.fetch_reporting_relationships = AsyncMock()
        
        # Call method and check error handling
        result = await self.connector.synchronize()
        
        # Verify error is captured in result
        self.assertIn("errors", result)
        self.assertIn("users", result["errors"])
        self.assertEqual(result["errors"]["users"], error_message)
        
        # Verify other methods were still called
        self.connector.fetch_groups.assert_called_once()
        self.connector.fetch_reporting_relationships.assert_called_once()


class TestOktaConnector(unittest.IsolatedAsyncioTestCase):
    """Tests for the OktaConnector class."""
    
    async def asyncSetUp(self):
        """Set up test fixtures before each test method."""
        self.config = {
            "api_token": "test-token",
            "base_url": "https://test-org.okta.com",
            "api_version": "v1"
        }
        self.connector = OktaConnector(self.config)
    
    async def test_initialization(self):
        """Test connector initialization."""
        self.assertEqual(self.connector.api_token, "test-token")
        self.assertEqual(self.connector.base_url, "https://test-org.okta.com")
        self.assertEqual(self.connector.api_version, "v1")
    
    async def test_api_request_success(self):
        """Test successful API request."""
        # Mock aiohttp ClientSession
        with patch('aiohttp.ClientSession') as mock_session:
            # Configure mock response
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"id": "test-user"})
            mock_session.return_value.__aenter__.return_value.request.return_value.__aenter__.return_value = mock_response
            
            # Call method
            result = await self.connector._api_request("/users/test-user")
            
            # Verify
            self.assertEqual(result, {"id": "test-user"})
            
    async def test_api_request_error(self):
        """Test API request with error response."""
        # Mock aiohttp ClientSession
        with patch('aiohttp.ClientSession') as mock_session:
            # Configure mock response for error
            mock_response = AsyncMock()
            mock_response.status = 404
            mock_response.text = AsyncMock(return_value='{"error":"Not found"}')
            mock_session.return_value.__aenter__.return_value.request.return_value.__aenter__.return_value = mock_response
            
            # Call method and check exception
            with self.assertRaises(ConnectionError):
                await self.connector._api_request("/users/nonexistent")
    
    async def test_fetch_users(self):
        """Test fetching users from Okta."""
        # Mock the _get_all_paged_results method
        self.connector._get_all_paged_results = AsyncMock()
        self.connector._get_all_paged_results.return_value = [
            {
                "id": "user1",
                "profile": {
                    "login": "jdoe@example.com",
                    "email": "jdoe@example.com",
                    "firstName": "John",
                    "lastName": "Doe",
                    "department": "Engineering",
                    "title": "Software Engineer",
                    "city": "New York",
                    "managerId": "manager1"
                }
            },
            {
                "id": "user2",
                "profile": {
                    "login": "jsmith@example.com",
                    "email": "jsmith@example.com",
                    "firstName": "Jane",
                    "lastName": "Smith",
                    "department": "Marketing"
                }
            }
        ]
        
        # Call method
        users = await self.connector.fetch_users()
        
        # Verify
        self.connector._get_all_paged_results.assert_called_once()
        self.assertEqual(len(users), 2)
        
        # Check first user
        self.assertEqual(users[0]["external_id"], "jdoe@example.com")
        self.assertEqual(users[0]["email"], "jdoe@example.com")
        self.assertEqual(users[0]["full_name"], "John Doe")
        self.assertEqual(users[0]["department"], "Engineering")
        self.assertEqual(users[0]["title"], "Software Engineer")
        self.assertEqual(users[0]["location"], "New York")
        self.assertEqual(users[0]["metadata"]["source"], "okta")
        self.assertEqual(users[0]["metadata"]["okta_id"], "user1")
        self.assertEqual(users[0]["metadata"]["manager_id"], "manager1")
        
        # Check ID mapping
        self.assertEqual(self.connector._user_id_mapping["user1"], "jdoe@example.com")
        self.assertEqual(self.connector._user_id_mapping["user2"], "jsmith@example.com")
    
    async def test_fetch_groups(self):
        """Test fetching groups from Okta."""
        # Mock the _get_all_paged_results method
        self.connector._get_all_paged_results = AsyncMock()
        self.connector._get_all_paged_results.return_value = [
            {
                "id": "group1",
                "profile": {
                    "name": "Engineering",
                    "description": "Engineering Team"
                },
                "type": "OKTA_GROUP"
            },
            {
                "id": "group2",
                "profile": {
                    "name": "Marketing",
                    "description": "Marketing Team"
                },
                "type": "OKTA_GROUP"
            }
        ]
        
        # Mock the _get_group_members method
        self.connector._get_group_members = AsyncMock()
        self.connector._get_group_members.side_effect = [
            ["jdoe@example.com"],  # Members for group1
            ["jsmith@example.com"]  # Members for group2
        ]
        
        # Call method
        groups = await self.connector.fetch_groups()
        
        # Verify
        self.connector._get_all_paged_results.assert_called_once()
        self.assertEqual(len(groups), 2)
        
        # Check first group
        self.assertEqual(groups[0]["external_id"], "group1")
        self.assertEqual(groups[0]["name"], "Engineering")
        self.assertEqual(groups[0]["description"], "Engineering Team")
        self.assertEqual(groups[0]["members"], ["jdoe@example.com"])
        self.assertEqual(groups[0]["metadata"]["source"], "okta")
        self.assertEqual(groups[0]["metadata"]["group_type"], "OKTA_GROUP")
        
        # Verify _get_group_members was called for each group
        self.assertEqual(self.connector._get_group_members.call_count, 2)
        self.connector._get_group_members.assert_any_call("group1")
        self.connector._get_group_members.assert_any_call("group2")
    
    async def test_get_group_members(self):
        """Test getting group members."""
        # Mock the _get_all_paged_results method
        self.connector._get_all_paged_results = AsyncMock()
        self.connector._get_all_paged_results.return_value = [
            {
                "id": "user1",
                "profile": {
                    "login": "jdoe@example.com"
                }
            },
            {
                "id": "user2",
                "profile": {
                    "login": "jsmith@example.com"
                }
            }
        ]
        
        # Call method
        members = await self.connector._get_group_members("group1")
        
        # Verify
        self.connector._get_all_paged_results.assert_called_once_with("/groups/group1/users")
        self.assertEqual(len(members), 2)
        self.assertEqual(members[0], "jdoe@example.com")
        self.assertEqual(members[1], "jsmith@example.com")
        
        # Verify ID mapping was updated
        self.assertEqual(self.connector._user_id_mapping["user1"], "jdoe@example.com")
        self.assertEqual(self.connector._user_id_mapping["user2"], "jsmith@example.com")
    
    async def test_get_user_manager(self):
        """Test getting a user's manager."""
        # Set up ID mapping
        self.connector._user_id_mapping = {
            "manager1": "manager@example.com"
        }
        
        # Mock the _api_request method
        self.connector._api_request = AsyncMock()
        self.connector._api_request.return_value = {
            "id": "user1",
            "profile": {
                "login": "jdoe@example.com",
                "managerId": "manager1"
            }
        }
        
        # Call method
        manager = await self.connector._get_user_manager("user1")
        
        # Verify
        self.connector._api_request.assert_called_once_with("/users/user1")
        self.assertEqual(manager, "manager@example.com")
        
        # Verify result was cached
        self.assertEqual(self.connector._manager_cache["user1"], "manager@example.com")
        
        # Call again to test cache
        self.connector._api_request.reset_mock()
        manager = await self.connector._get_user_manager("user1")
        
        # Verify API was not called again
        self.connector._api_request.assert_not_called()
        self.assertEqual(manager, "manager@example.com")
    
    async def test_get_user_manager_not_in_mapping(self):
        """Test getting a user's manager when not in mapping."""
        # Mock the _api_request method for user and then manager
        self.connector._api_request = AsyncMock()
        self.connector._api_request.side_effect = [
            {
                "id": "user1",
                "profile": {
                    "login": "jdoe@example.com",
                    "managerId": "manager1"  # Not in mapping yet
                }
            },
            {
                "id": "manager1",
                "profile": {
                    "login": "manager@example.com"
                }
            }
        ]
        
        # Call method
        manager = await self.connector._get_user_manager("user1")
        
        # Verify
        self.assertEqual(manager, "manager@example.com")
        self.assertEqual(self.connector._api_request.call_count, 2)
        
        # Verify mappings were updated
        self.assertEqual(self.connector._user_id_mapping["manager1"], "manager@example.com")
        self.assertEqual(self.connector._manager_cache["user1"], "manager@example.com")
    
    async def test_fetch_reporting_relationships(self):
        """Test fetching reporting relationships."""
        # Set up ID mapping
        self.connector._user_id_mapping = {
            "user1": "jdoe@example.com",
            "user2": "jsmith@example.com",
            "user3": "alee@example.com"
        }
        
        # Mock the _get_user_manager method
        self.connector._get_user_manager = AsyncMock()
        self.connector._get_user_manager.side_effect = [
            "manager@example.com",  # For user1
            None,                  # For user2 (no manager)
            "jsmith@example.com"    # For user3
        ]
        
        # Call method
        relationships = await self.connector.fetch_reporting_relationships()
        
        # Verify
        self.assertEqual(len(relationships), 2)  # Only two users have managers
        
        # Check first relationship
        self.assertEqual(relationships[0]["manager_id"], "manager@example.com")
        self.assertEqual(relationships[0]["direct_report_id"], "jdoe@example.com")
        
        # Check second relationship
        self.assertEqual(relationships[1]["manager_id"], "jsmith@example.com")
        self.assertEqual(relationships[1]["direct_report_id"], "alee@example.com")
    
    async def test_synchronize(self):
        """Test synchronizing all data."""
        # Mock the fetch methods
        mock_users = [{"external_id": "jdoe@example.com"}]
        mock_groups = [{"external_id": "engineering", "members": ["jdoe@example.com"]}]
        mock_relationships = [{"manager_id": "manager@example.com", "direct_report_id": "jdoe@example.com"}]
        
        self.connector.fetch_users = AsyncMock(return_value=mock_users)
        self.connector.fetch_groups = AsyncMock(return_value=mock_groups)
        self.connector.fetch_reporting_relationships = AsyncMock(return_value=mock_relationships)
        
        # Call method
        result = await self.connector.synchronize()
        
        # Verify
        self.connector.fetch_users.assert_called_once()
        self.connector.fetch_groups.assert_called_once()
        self.connector.fetch_reporting_relationships.assert_called_once()
        
        self.assertEqual(result["source"], "okta")
        self.assertEqual(result["users"], mock_users)
        self.assertEqual(result["groups"], mock_groups)
        self.assertEqual(result["relationships"], mock_relationships)
        self.assertNotIn("errors", result)
    
    async def test_synchronize_with_errors(self):
        """Test synchronization with errors."""
        # Mock methods to throw exceptions
        self.connector.fetch_users = AsyncMock(side_effect=ConnectionError("API error"))
        self.connector.fetch_groups = AsyncMock(return_value=[])
        self.connector.fetch_reporting_relationships = AsyncMock(return_value=[])
        
        # Call method
        result = await self.connector.synchronize()
        
        # Verify
        self.assertEqual(result["source"], "okta")
        self.assertEqual(result["users"], [])
        self.assertEqual(result["groups"], [])
        self.assertEqual(result["relationships"], [])
        self.assertIn("errors", result)
        self.assertEqual(result["errors"]["users"], "API error")


class TestIdentitySynchronizer(unittest.IsolatedAsyncioTestCase):
    """Tests for the IdentitySynchronizer class."""

    async def asyncSetUp(self):
        """Set up test fixtures before each test method."""
        self.mock_db = MagicMock(spec=Session)
        self.synchronizer = IdentitySynchronizer(self.mock_db)
        self.tenant_id = 1
        
        # Create mock connector
        self.mock_connector = MagicMock(spec=IdentityConnector)
        self.mock_connector.synchronize = AsyncMock(return_value={
            "users": [
                {
                    "external_id": "jdoe",
                    "email": "jdoe@example.com",
                    "full_name": "John Doe",
                    "department": "Engineering"
                }
            ],
            "groups": [
                {
                    "external_id": "engineering",
                    "name": "Engineering",
                    "description": "Engineering Team",
                    "members": ["jdoe"]
                }
            ],
            "relationships": [
                {
                    "manager_id": "manager1",
                    "direct_report_id": "jdoe"
                }
            ]
        })
        
        # Register mock connector
        self.synchronizer.register_connector("mock_provider", self.mock_connector)

    async def test_register_connector(self):
        """Test registering a connector."""
        new_connector = MagicMock(spec=IdentityConnector)
        self.synchronizer.register_connector("new_provider", new_connector)
        self.assertEqual(self.synchronizer.connectors["new_provider"], new_connector)

    async def test_synchronize_provider(self):
        """Test synchronizing data from a specific provider."""
        # Setup mock user query
        mock_user_query = self.mock_db.query.return_value.filter.return_value
        mock_user_query.first.return_value = None  # User doesn't exist
        
        # Setup mock team query
        mock_team_query = self.mock_db.query.return_value.filter.return_value
        mock_team_query.first.return_value = None  # Team doesn't exist
        
        # Call method
        result = await self.synchronizer.synchronize_provider("mock_provider", self.tenant_id)
        
        # Verify
        self.mock_connector.synchronize.assert_called_once()
        self.mock_db.add.assert_called()  # User and team should be added
        self.mock_db.commit.assert_called_once()
        self.assertEqual(result["provider"], "mock_provider")
        self.assertEqual(result["users_created"], 1)
        self.assertEqual(result["teams_created"], 1)

    async def test_synchronize_provider_update_existing(self):
        """Test synchronizing data with existing entities."""
        # Setup mock existing user
        mock_user = MagicMock(spec=User)
        mock_user_query = self.mock_db.query.return_value.filter.return_value
        mock_user_query.first.return_value = mock_user
        
        # Setup mock existing team
        mock_team = MagicMock(spec=Team)
        mock_team.members = []
        mock_team_query = self.mock_db.query.return_value.filter.return_value
        mock_team_query.first.return_value = mock_team
        
        # Call method
        result = await self.synchronizer.synchronize_provider("mock_provider", self.tenant_id)
        
        # Verify
        self.assertEqual(result["users_updated"], 1)
        self.assertEqual(result["teams_updated"], 1)
        self.assertEqual(mock_user.email, "jdoe@example.com")
        self.assertEqual(mock_user.full_name, "John Doe")
        self.assertEqual(mock_team.name, "Engineering")

    async def test_synchronize_all_providers(self):
        """Test synchronizing data from all providers."""
        # Add another mock connector
        another_mock_connector = MagicMock(spec=IdentityConnector)
        another_mock_connector.synchronize = AsyncMock(return_value={
            "users": [], "groups": [], "relationships": []
        })
        self.synchronizer.register_connector("another_provider", another_mock_connector)
        
        # Mock the synchronize_provider method
        self.synchronizer.synchronize_provider = AsyncMock(return_value={"provider": "mock_result"})
        
        # Call method
        results = await self.synchronizer.synchronize_all_providers(self.tenant_id)
        
        # Verify
        self.assertEqual(len(results), 2)
        self.synchronizer.synchronize_provider.assert_called()
        self.assertEqual(self.synchronizer.synchronize_provider.call_count, 2)


if __name__ == "__main__":
    unittest.main()