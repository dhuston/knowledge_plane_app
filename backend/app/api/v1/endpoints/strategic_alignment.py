from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api import deps
from app.services.strategic_alignment_service import StrategicAlignmentService
from app.services.alignment_recommendation_service import AlignmentRecommendationService
from app.services.strategic_impact_service import StrategicImpactService
from app.schemas.strategic_alignment import (
    Misalignment, 
    AlignmentMetrics, 
    Recommendation, 
    RecommendationFeedback,
    ImpactAnalysis,
    ImpactScenario,
    ScenarioResult
)
from app.core.permissions import get_current_active_user
from app.models.user import User

router = APIRouter()

# Misalignment Detection Endpoints

@router.get("/misalignments/", response_model=List[Misalignment])
def get_misalignments(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all detected misalignments for the current tenant.
    """
    service = StrategicAlignmentService(db)
    misalignments = service.get_all_misalignments(tenant_id=current_user.tenant_id)
    return misalignments


@router.post("/misalignments/analyze/", response_model=Dict[str, Any])
def run_alignment_analysis(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Run a full alignment analysis to detect misalignments.
    """
    service = StrategicAlignmentService(db)
    misalignments, metrics = service.run_full_alignment_analysis(tenant_id=current_user.tenant_id)
    
    return {
        "misalignments": misalignments,
        "metrics": metrics
    }


@router.get("/metrics/", response_model=AlignmentMetrics)
def get_alignment_metrics(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get alignment metrics for the current tenant.
    """
    service = StrategicAlignmentService(db)
    metrics = service.calculate_alignment_metrics(tenant_id=current_user.tenant_id)
    return metrics


# Recommendation Endpoints

@router.get("/recommendations/", response_model=List[Recommendation])
def get_recommendations(
    project_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get recommendations for improving strategic alignment.
    
    Args:
        project_id: Optional filter by project ID
    """
    service = AlignmentRecommendationService(db)
    
    if project_id:
        recommendations = service.get_recommendations_for_project(
            project_id=project_id, 
            tenant_id=current_user.tenant_id
        )
    else:
        recommendations = service.get_all_recommendations(tenant_id=current_user.tenant_id)
    
    return recommendations


@router.post("/recommendations/generate/", response_model=List[Recommendation])
def generate_recommendations(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Generate new recommendations for improving strategic alignment.
    """
    service = AlignmentRecommendationService(db)
    recommendations = service.generate_all_recommendations(tenant_id=current_user.tenant_id)
    return recommendations


@router.post("/recommendations/{recommendation_id}/feedback/", response_model=Dict[str, Any])
def provide_recommendation_feedback(
    recommendation_id: int,
    feedback: RecommendationFeedback,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Provide feedback on a recommendation.
    """
    service = AlignmentRecommendationService(db)
    
    try:
        feedback_record = service.record_recommendation_feedback(
            recommendation_id=recommendation_id,
            user_id=current_user.id,
            is_helpful=feedback.is_helpful,
            feedback_text=feedback.feedback_text,
            implemented=feedback.implemented
        )
        
        return {
            "status": "success",
            "message": "Feedback recorded successfully",
            "feedback_id": feedback_record.id
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Impact Analysis Endpoints

@router.post("/impact-analysis/goal-change/", response_model=ImpactAnalysis)
def analyze_goal_change_impact(
    goal_id: int,
    changes: Dict[str, Any],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Analyze the impact of changing a goal on aligned projects and teams.
    
    Args:
        goal_id: ID of the goal to change
        changes: Dictionary of proposed changes
    """
    service = StrategicImpactService(db)
    
    try:
        impact = service.analyze_goal_change_impact(
            goal_id=goal_id, 
            changes=changes, 
            tenant_id=current_user.tenant_id,
            user_id=current_user.id
        )
        return impact
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/scenarios/", response_model=ImpactScenario)
def create_impact_scenario(
    scenario_data: Dict[str, Any],
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Create a new impact scenario for simulation.
    """
    service = StrategicImpactService(db)
    
    try:
        created_scenario = service.create_impact_scenario(
            tenant_id=current_user.tenant_id,
            name=scenario_data.get("name"),
            description=scenario_data.get("description"),
            scenario_type=scenario_data.get("scenario_type"),
            parameters=scenario_data.get("parameters", {}),
            created_by_user_id=current_user.id
        )
        return created_scenario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/scenarios/{scenario_id}/simulate/", response_model=ScenarioResult)
def run_scenario_simulation(
    scenario_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Run a simulation for an impact scenario.
    
    Args:
        scenario_id: ID of the scenario to simulate
    """
    service = StrategicImpactService(db)
    
    try:
        result = service.run_scenario_simulation(
            scenario_id=scenario_id,
            tenant_id=current_user.tenant_id
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/scenarios/", response_model=List[ImpactScenario])
def get_all_scenarios(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get all impact scenarios for the current tenant.
    """
    service = StrategicImpactService(db)
    scenarios = service.get_all_scenarios(tenant_id=current_user.tenant_id)
    return scenarios


@router.get("/scenarios/{scenario_id}/results/", response_model=List[ScenarioResult])
def get_scenario_results(
    scenario_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get results for a specific scenario.
    
    Args:
        scenario_id: ID of the scenario
    """
    service = StrategicImpactService(db)
    
    try:
        results = service.get_scenario_results(
            scenario_id=scenario_id,
            tenant_id=current_user.tenant_id
        )
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# Map Integration Endpoints

@router.get("/map/misalignments/", response_model=Dict[str, Any])
def get_misalignment_map_data(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """
    Get misalignment data formatted for the Living Map visualization.
    """
    # This would normally use a specialized map service
    # For now, return simplified format
    service = StrategicAlignmentService(db)
    misalignments = service.get_all_misalignments(tenant_id=current_user.tenant_id)
    
    # Format for map visualization
    overlays = []
    for m in misalignments:
        # Extract affected entity IDs
        for entity_type, ids in m.affected_entities.items():
            for entity_id in ids:
                overlays.append({
                    "node_id": entity_id,
                    "node_type": entity_type[:-1] if entity_type.endswith('s') else entity_type,  # Remove plural
                    "overlay_type": "misalignment",
                    "overlay_data": {
                        "type": m.type,
                        "severity": m.severity,
                        "description": m.description
                    },
                    "visual": {
                        "color": "#ff0000" if m.severity in ["high", "critical"] else "#ffa500",
                        "icon": "warning"
                    }
                })
    
    return {"overlays": overlays}