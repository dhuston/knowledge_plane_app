import pytest
from unittest.mock import Mock, patch
from uuid import UUID

from app.services.insight_service import insight_service, STOP_WORDS
from app.crud.crud_project import project as crud_project

class TestInsightService:
    
    def test_extract_keywords(self):
        """Test that the keyword extraction function correctly identifies key terms."""
        # Test with a typical project description
        text = "Building an AI-based recommendation engine for product discovery"
        keywords = insight_service._extract_keywords(text)
        
        # Should extract important terms, ignoring stop words
        assert "ai-based" not in keywords  # Contains punctuation that gets stripped
        assert "aibased" in keywords  # Hyphenated words become merged
        assert "based" not in keywords  # Is part of aibased after punctuation removal
        assert "recommendation" in keywords
        assert "engine" in keywords
        assert "product" in keywords
        assert "discovery" in keywords
        
        # The words "for" and "an" should be removed as stop words
        assert "for" not in keywords
        assert "an" not in keywords
        
        # Test with empty string
        assert insight_service._extract_keywords("") == set()
        
        # Test with None
        assert insight_service._extract_keywords(None) == set()
        
        # Test with short words and stop words only
        assert insight_service._extract_keywords("a an the in by") == set()
    
    @pytest.mark.asyncio
    async def test_find_project_overlaps(self):
        """Test the project overlap detection functionality."""
        # Create mock projects
        mock_projects = [
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000001"),
                description="AI machine learning recommendation system for customer data"
            ),
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000002"),
                description="Building a machine learning recommendation engine"
            ),
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000003"),
                description="Website redesign with new color scheme"
            ),
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000004"),
                description="Mobile app interface design" 
            )
        ]
        
        # Mock the database session and crud operation
        mock_db = Mock()
        mock_tenant_id = UUID("10000000-0000-0000-0000-000000000001")
        
        with patch.object(crud_project, "get_multi_by_tenant") as mock_get_projects:
            mock_get_projects.return_value = mock_projects
            
            # Execute the function
            overlaps = await insight_service.find_project_overlaps(
                db=mock_db, 
                tenant_id=mock_tenant_id,
                min_overlap_keywords=2  # Set lower threshold for test
            )
            
            # Verify the results
            
            # Projects 1 and 2 should overlap (machine learning, recommendation)
            assert UUID("00000000-0000-0000-0000-000000000001") in overlaps
            assert UUID("00000000-0000-0000-0000-000000000002") in overlaps
            assert UUID("00000000-0000-0000-0000-000000000002") in overlaps[UUID("00000000-0000-0000-0000-000000000001")]
            assert UUID("00000000-0000-0000-0000-000000000001") in overlaps[UUID("00000000-0000-0000-0000-000000000002")]
            
            # Projects 3 and 4 should not overlap much (maybe "design", but that's only 1 word)
            assert UUID("00000000-0000-0000-0000-000000000003") not in overlaps
            assert UUID("00000000-0000-0000-0000-000000000004") not in overlaps
            
            # Verify the function was called with the correct parameters
            mock_get_projects.assert_called_once_with(db=mock_db, tenant_id=mock_tenant_id, limit=1000)
    
    @pytest.mark.asyncio
    async def test_find_project_overlaps_empty(self):
        """Test overlap detection with empty or insufficient projects."""
        mock_db = Mock()
        mock_tenant_id = UUID("10000000-0000-0000-0000-000000000001")
        
        # Test with no projects
        with patch.object(crud_project, "get_multi_by_tenant") as mock_get_projects:
            mock_get_projects.return_value = []
            
            overlaps = await insight_service.find_project_overlaps(
                db=mock_db, 
                tenant_id=mock_tenant_id
            )
            
            # Should return empty dict when no projects
            assert overlaps == {}
        
        # Test with single project
        with patch.object(crud_project, "get_multi_by_tenant") as mock_get_projects:
            mock_get_projects.return_value = [
                Mock(
                    id=UUID("00000000-0000-0000-0000-000000000001"),
                    description="AI project with machine learning"
                )
            ]
            
            overlaps = await insight_service.find_project_overlaps(
                db=mock_db, 
                tenant_id=mock_tenant_id
            )
            
            # Should return empty dict when only one project
            assert overlaps == {}
    
    @pytest.mark.asyncio
    async def test_find_project_overlaps_with_missing_descriptions(self):
        """Test overlap detection with projects missing descriptions."""
        mock_projects = [
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000001"),
                description="AI machine learning recommendation system"
            ),
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000002"),
                description=None  # Missing description
            ),
            Mock(
                id=UUID("00000000-0000-0000-0000-000000000003"),
                description="AI and machine learning techniques"
            )
        ]
        
        mock_db = Mock()
        mock_tenant_id = UUID("10000000-0000-0000-0000-000000000001")
        
        with patch.object(crud_project, "get_multi_by_tenant") as mock_get_projects:
            mock_get_projects.return_value = mock_projects
            
            overlaps = await insight_service.find_project_overlaps(
                db=mock_db, 
                tenant_id=mock_tenant_id,
                min_overlap_keywords=2
            )
            
            # Projects 1 and 3 should overlap (AI, machine, learning)
            assert UUID("00000000-0000-0000-0000-000000000001") in overlaps
            assert UUID("00000000-0000-0000-0000-000000000003") in overlaps
            assert UUID("00000000-0000-0000-0000-000000000003") in overlaps[UUID("00000000-0000-0000-0000-000000000001")]
            assert UUID("00000000-0000-0000-0000-000000000001") in overlaps[UUID("00000000-0000-0000-0000-000000000003")]
            
            # Project 2 should not appear in overlaps (no description)
            assert UUID("00000000-0000-0000-0000-000000000002") not in overlaps