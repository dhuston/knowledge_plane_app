import pytest
from unittest.mock import Mock, patch, MagicMock
from sqlalchemy.orm import Session

from app.services.strategic_alignment_service import StrategicAlignmentService
from app.models.alignment import Misalignment
from app.models.project import Project
from app.models.goal import Goal
from app.models.edge import Edge
from app.models.team import Team
from app.schemas.strategic_alignment import MisalignmentType, MisalignmentSeverity


class TestStrategicAlignmentService:
    """Tests for the Strategic Alignment Service."""

    def test_detect_unaligned_projects(self, db_session_mock):
        """Test detection of projects without aligned goals."""
        # Setup
        service = StrategicAlignmentService(db_session_mock)
        tenant_id = 1
        
        # Mock projects
        projects = [
            Mock(id=1, name="Project A", tenant_id=tenant_id),
            Mock(id=2, name="Project B", tenant_id=tenant_id),
            Mock(id=3, name="Project C", tenant_id=tenant_id)
        ]
        
        # Mock query results
        db_session_mock.query.return_value.filter.return_value.all.return_value = projects
        
        # Project 1 has goals (edge count > 0)
        # Project 2 doesn't have goals (edge count = 0)
        # Project 3 doesn't have goals (edge count = 0)
        
        # Mock edge queries for each project
        def mock_query_filter(*args, **kwargs):
            query_mock = Mock()
            
            # Setup edge count based on project id
            def count_side_effect():
                # The third argument in call args should be the project ID from lambda
                call_args_list = db_session_mock.query.call_args_list
                if len(call_args_list) >= 1:
                    for arg in call_args_list[-1][0]:
                        if hasattr(arg, 'source_id') and arg.source_id == 1:
                            return 2  # Project 1 has 2 goals
                return 0  # Other projects have 0 goals
            
            query_mock.count.side_effect = count_side_effect
            return query_mock
        
        db_session_mock.query.return_value.filter.side_effect = mock_query_filter
        
        # Mock add and commit
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        
        # Execute
        result = service.detect_unaligned_projects(tenant_id)
        
        # Assert
        assert len(result) == 2  # Should find 2 unaligned projects
        
        # Verify that misalignments were created and added to db for unaligned projects
        added_misalignments = [call[0][0] for call in db_session_mock.add.call_args_list]
        assert len(added_misalignments) == 2
        
        # Check the properties of created misalignments
        for m in added_misalignments:
            assert isinstance(m, Misalignment)
            assert m.type == MisalignmentType.UNALIGNED_PROJECT
            assert m.tenant_id == tenant_id
            assert m.severity == MisalignmentSeverity.HIGH
            
            # Check that affected_entities contains the project ID
            project_id = list(m.affected_entities["projects"])[0]
            assert project_id in [2, 3]  # Should be either Project B or Project C
        
        # Verify commit was called
        db_session_mock.commit.assert_called_once()

    def test_detect_conflicting_goals(self, db_session_mock):
        """Test detection of teams with conflicting goal priorities."""
        # Setup
        service = StrategicAlignmentService(db_session_mock)
        tenant_id = 1
        
        # Mock teams
        teams = [
            Mock(id=1, name="Team A", tenant_id=tenant_id),
            Mock(id=2, name="Team B", tenant_id=tenant_id)
        ]
        
        # Mock team query
        mock_team_query = Mock()
        mock_team_query.filter.return_value.all.return_value = teams
        db_session_mock.query.return_value = mock_team_query
        
        # Setup goals for Team A (2 high priority goals = conflict)
        team_a_goals = [
            Mock(id=101, tenant_id=tenant_id, priority="high"),
            Mock(id=102, tenant_id=tenant_id, priority="high")
        ]
        
        # Setup goals for Team B (1 high priority goal = no conflict)
        team_b_goals = [
            Mock(id=201, tenant_id=tenant_id, priority="high"),
            Mock(id=202, tenant_id=tenant_id, priority="medium")
        ]
        
        # Mock goal queries for each team
        def mock_query_join(*args, **kwargs):
            query_mock = Mock()
            
            # Return different goals based on team ID
            def filter_side_effect(*args, **kwargs):
                # Extract team ID from filter args
                team_id = None
                for arg in db_session_mock.query.call_args_list[-1][0]:
                    if hasattr(arg, 'source_id'):
                        call = str(arg)
                        if '1' in call:
                            team_id = 1
                        elif '2' in call:
                            team_id = 2
                
                if team_id == 1:
                    return team_a_goals
                else:
                    return team_b_goals
            
            query_mock.filter.side_effect = filter_side_effect
            return query_mock
        
        # Mock join for goal query
        mock_team_query.join.side_effect = mock_query_join
        
        # Mock add and commit
        db_session_mock.add = Mock()
        db_session_mock.commit = Mock()
        
        # Execute
        result = service.detect_conflicting_goals(tenant_id)
        
        # Assert
        assert len(result) == 1  # Should find 1 team with conflicting goals
        
        # Verify that misalignment was created and added to db for the team with conflict
        assert db_session_mock.add.called
        added_misalignment = db_session_mock.add.call_args[0][0]
        assert isinstance(added_misalignment, Misalignment)
        assert added_misalignment.type == MisalignmentType.CONFLICTING_GOALS
        assert added_misalignment.tenant_id == tenant_id
        assert added_misalignment.severity == MisalignmentSeverity.MEDIUM
        
        # Check that affected_entities contains the team ID and both goal IDs
        assert 1 in added_misalignment.affected_entities["teams"]
        assert 101 in added_misalignment.affected_entities["goals"]
        assert 102 in added_misalignment.affected_entities["goals"]
        
        # Verify commit was called
        db_session_mock.commit.assert_called_once()

    def test_calculate_alignment_metrics(self, db_session_mock):
        """Test calculation of alignment metrics."""
        # Setup
        service = StrategicAlignmentService(db_session_mock)
        tenant_id = 1
        
        # Mock projects - 5 total, 3 aligned, 2 unaligned
        projects = [
            Mock(id=i, tenant_id=tenant_id) for i in range(1, 6)
        ]
        
        # Mock project query
        mock_project_query = Mock()
        mock_project_query.filter.return_value.count.return_value = 5  # Total projects
        mock_project_query.filter.return_value.all.return_value = projects
        db_session_mock.query.return_value = mock_project_query
        
        # Mock edge queries to determine aligned projects
        def mock_edge_query_filter(*args, **kwargs):
            edge_query_mock = Mock()
            
            # Return different counts based on project ID
            def count_side_effect():
                # Extract project ID from filter args
                project_id = None
                for call in db_session_mock.query.call_args_list:
                    if len(call[0]) > 0 and hasattr(call[0][0], 'source_id'):
                        source_id_expr = call[0][0].source_id
                        if hasattr(source_id_expr, 'expression'):
                            project_id = int(str(source_id_expr.expression)[-1])
                
                # Projects 1, 2, 3 have goals (aligned), 4 and 5 don't (unaligned)
                if project_id in [1, 2, 3]:
                    return 1  # Has goals
                else:
                    return 0  # No goals
            
            edge_query_mock.count.side_effect = count_side_effect
            return edge_query_mock
        
        db_session_mock.query.return_value.filter.side_effect = mock_edge_query_filter
        
        # Mock misalignments query
        misalignments = [
            Mock(type=MisalignmentType.UNALIGNED_PROJECT, severity=MisalignmentSeverity.HIGH),
            Mock(type=MisalignmentType.UNALIGNED_PROJECT, severity=MisalignmentSeverity.HIGH),
            Mock(type=MisalignmentType.CONFLICTING_GOALS, severity=MisalignmentSeverity.MEDIUM)
        ]
        
        mock_misalignment_query = Mock()
        mock_misalignment_query.filter.return_value.all.return_value = misalignments
        db_session_mock.query.return_value = mock_misalignment_query
        
        # Execute
        result = service.calculate_alignment_metrics(tenant_id)
        
        # Assert
        assert result["total_projects"] == 5
        assert result["aligned_projects"] == 3
        assert result["alignment_percentage"] == 60.0  # 3/5 * 100
        
        # Check misalignment counts by type
        assert result["misalignment_count_by_type"].get(MisalignmentType.UNALIGNED_PROJECT) == 2
        assert result["misalignment_count_by_type"].get(MisalignmentType.CONFLICTING_GOALS) == 1
        
        # Check misalignment counts by severity
        assert result["misalignment_count_by_severity"].get(MisalignmentSeverity.HIGH) == 2
        assert result["misalignment_count_by_severity"].get(MisalignmentSeverity.MEDIUM) == 1
        
        # Overall score should be calculated based on these metrics
        assert "overall_alignment_score" in result
        assert 0 <= result["overall_alignment_score"] <= 100

    def test_run_full_alignment_analysis(self, db_session_mock):
        """Test running a complete alignment analysis."""
        # Setup
        service = StrategicAlignmentService(db_session_mock)
        
        # Mock methods that will be called by the full analysis
        with patch.object(service, 'detect_unaligned_projects') as mock_detect_unaligned, \
             patch.object(service, 'detect_conflicting_goals') as mock_detect_conflicting, \
             patch.object(service, 'calculate_alignment_metrics') as mock_metrics:
            
            # Setup return values
            mock_detect_unaligned.return_value = [Mock(), Mock()]  # 2 unaligned projects
            mock_detect_conflicting.return_value = [Mock()]  # 1 team with conflicting goals
            mock_metrics.return_value = {"overall_alignment_score": 75.0}
            
            # Mock delete operation
            db_session_mock.query.return_value.filter.return_value.delete = Mock()
            
            # Execute
            tenant_id = 1
            misalignments, metrics = service.run_full_alignment_analysis(tenant_id)
            
            # Assert
            # Check that existing misalignments were deleted
            db_session_mock.query.return_value.filter.return_value.delete.assert_called_once()
            
            # Check that detection methods were called with correct args
            mock_detect_unaligned.assert_called_once_with(tenant_id)
            mock_detect_conflicting.assert_called_once_with(tenant_id)
            
            # Check that metrics were calculated
            mock_metrics.assert_called_once_with(tenant_id)
            
            # Check result structure
            assert len(misalignments) == 3  # 2 unaligned + 1 conflicting
            assert metrics["overall_alignment_score"] == 75.0


@pytest.fixture
def db_session_mock():
    """Create a mock database session."""
    return Mock(spec=Session)