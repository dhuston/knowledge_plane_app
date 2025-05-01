from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user_tenant_id
from app.services.emergent_model_service import EmergentModelService
from app.services.clustering_engine import ClusteringEngine
from app.schemas.emergent_model import (
    RelationshipStrength,
    RelationshipStrengthCreate,
    RelationshipStrengthUpdate,
    EmergentPattern,
    EmergentPatternCreate,
    EmergentPatternWithNodes,
    FeedbackItem,
    FeedbackItemCreate,
    ModelVersion,
    Cluster,
    CrossClusterRelationship
)


router = APIRouter()


@router.get("/relationships/{source_id}/{target_id}", response_model=RelationshipStrength)
def get_relationship_strength(
    source_id: int,
    target_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get the relationship strength between two nodes.
    """
    service = EmergentModelService(db)
    relationship = service.get_relationship_strength(source_id, target_id, tenant_id)
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relationship between nodes {source_id} and {target_id} not found"
        )
        
    return relationship


@router.post("/relationships/calculate", response_model=List[RelationshipStrength])
def calculate_relationship_strengths(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Calculate relationship strengths for all entities in the tenant.
    """
    service = EmergentModelService(db)
    return service.calculate_relationship_strengths(tenant_id)


@router.put("/relationships/{relationship_id}", response_model=RelationshipStrength)
def update_relationship_strength(
    relationship_id: int,
    update_data: RelationshipStrengthUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Update a relationship's strength and confidence values.
    """
    service = EmergentModelService(db)
    relationship = service.update_relationship_strength(
        relationship_id=relationship_id,
        strength_value=update_data.strength_value,
        confidence_score=update_data.confidence_score,
        tenant_id=tenant_id
    )
    
    if not relationship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Relationship with ID {relationship_id} not found"
        )
        
    return relationship


@router.get("/patterns", response_model=List[EmergentPattern])
def get_patterns(
    pattern_type: Optional[str] = None,
    min_confidence: float = 0.0,
    is_validated: Optional[bool] = None,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get detected organizational patterns with optional filtering.
    """
    # This would typically fetch patterns from the database
    # For now, return a placeholder response
    return []


@router.post("/patterns/detect", response_model=List[EmergentPattern])
def detect_patterns(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Trigger pattern detection for the organization.
    """
    service = EmergentModelService(db)
    return service.detect_patterns(tenant_id)


@router.get("/patterns/{pattern_id}", response_model=EmergentPatternWithNodes)
def get_pattern_with_nodes(
    pattern_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get a specific pattern with its associated nodes.
    """
    # This would typically fetch a pattern and its nodes from the database
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Pattern with ID {pattern_id} not found"
    )


@router.post("/feedback", response_model=FeedbackItem)
def submit_feedback(
    feedback: FeedbackItemCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Submit user feedback on a relationship or pattern.
    """
    service = EmergentModelService(db)
    return service.process_feedback(feedback, tenant_id)


@router.get("/model/versions", response_model=List[ModelVersion])
def get_model_versions(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get all versions of the emergent model for the tenant.
    """
    # This would typically fetch model versions from the database
    # For now, return a placeholder response
    return []


@router.get("/model/active", response_model=ModelVersion)
def get_active_model(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get the currently active model version.
    """
    # This would typically fetch the active model version from the database
    # For now, return a placeholder response
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="No active model version found"
    )
    

@router.get("/clusters", response_model=List[Cluster])
def get_clusters(
    node_type: Optional[str] = None,
    force_recalculate: bool = False,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get clusters of entities based on relationship strengths.
    
    - **node_type**: Optional filter for node type (e.g., "user", "team", "project", "goal")
    - **force_recalculate**: Force recalculation of clusters even if cached
    """
    engine = ClusteringEngine(db, tenant_id)
    return engine.detect_clusters(node_type=node_type, force_recalculate=force_recalculate)


@router.get("/clusters/{cluster_id}", response_model=Cluster)
def get_cluster(
    cluster_id: str,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get a specific cluster by ID.
    """
    engine = ClusteringEngine(db, tenant_id)
    cluster = engine.get_cluster(cluster_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster with ID {cluster_id} not found"
        )
        
    return cluster


@router.get("/nodes/{node_id}/cluster", response_model=Cluster)
def get_node_cluster(
    node_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get the cluster a node belongs to.
    """
    engine = ClusteringEngine(db, tenant_id)
    cluster = engine.get_node_cluster(node_id)
    
    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No cluster found for node with ID {node_id}"
        )
        
    return cluster


@router.get("/clusters/relationships", response_model=List[CrossClusterRelationship])
def get_cross_cluster_relationships(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Get relationships between clusters.
    """
    engine = ClusteringEngine(db, tenant_id)
    return engine.detect_cross_cluster_relationships()


@router.post("/clusters/patterns", response_model=List[EmergentPattern])
def store_clusters_as_patterns(
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_user_tenant_id)
):
    """
    Store detected clusters as emergent patterns in the database.
    """
    engine = ClusteringEngine(db, tenant_id)
    patterns = engine.store_clusters_as_patterns()
    return patterns