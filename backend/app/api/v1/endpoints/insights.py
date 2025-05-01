from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime, timedelta

from app.crud.crud_user import user as crud_user
from app.crud.crud_team import team as crud_team
from app.crud.crud_project import project as crud_project
from app.crud.crud_goal import goal as crud_goal
from app import models, schemas
from app.core import security
from app.db.session import get_db_session
from app.services.insight_service import insight_service

router = APIRouter()

@router.get("/project_overlaps", response_model=schemas.ProjectOverlapResponse)
async def get_project_overlaps(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict:
    """Retrieve potential project overlaps within the user's tenant."""
    overlap_data = await insight_service.find_project_overlaps(
        db=db, 
        tenant_id=current_user.tenant_id
    )
    return {"overlaps": overlap_data}

@router.get("/network_metrics", response_model=Dict)
async def get_network_metrics(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
    include_historical: bool = False
) -> Dict:
    """
    Retrieve network-level metrics for the organization graph.
    
    When include_historical=True, the response includes metrics from the past
    30 days for trend analysis.
    """
    metrics = await insight_service.calculate_network_metrics(
        db=db, 
        tenant_id=current_user.tenant_id,
        include_historical=include_historical
    )
    return metrics

@router.get("/timeseries/{metric_type}")
async def get_metric_timeseries(
    metric_type: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    interval: str = "daily",
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict:
    """
    Retrieve time-series data for network metrics.
    
    Parameters:
    - metric_type: The type of metric to retrieve (e.g., "density", "centrality", "clustering")
    - start_date: Start date for the time series (ISO format, default: 30 days ago)
    - end_date: End date for the time series (ISO format, default: current date)
    - interval: Data interval ("hourly", "daily", "weekly", "monthly")
    """
    # Set default dates if not provided
    if not end_date:
        end_date = datetime.now().isoformat()
        
    if not start_date:
        start_date = (datetime.fromisoformat(end_date) - timedelta(days=30)).isoformat()
        
    data = await insight_service.get_metric_timeseries(
        db=db,
        tenant_id=current_user.tenant_id,
        metric_type=metric_type,
        start_date=start_date,
        end_date=end_date,
        interval=interval
    )
    return {"timeseries": data}

@router.get("/heatmap/{entity_type}")
async def get_heatmap_data(
    entity_type: str,
    metric: str = "connections",
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict:
    """
    Generate heatmap data for specific entity types.
    
    Parameters:
    - entity_type: The type of entity to analyze (e.g., "user", "team", "project")
    - metric: The metric to visualize (e.g., "connections", "collaboration", "activity")
    """
    data = await insight_service.generate_heatmap_data(
        db=db,
        tenant_id=current_user.tenant_id,
        entity_type=entity_type,
        metric=metric
    )
    return {"heatmap_data": data}