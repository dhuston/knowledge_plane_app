from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.alignment import Recommendation, RecommendationFeedback
from app.models.project import Project
from app.models.goal import Goal
from app.models.edge import Edge
from app.models.user import User
from app.schemas.strategic_alignment import RecommendationType, RecommendationDifficulty


class AlignmentRecommendationService:
    """
    Service for generating strategic alignment recommendations.
    
    This service analyzes organizational data to provide recommendations
    for improving alignment between projects, goals, and teams.
    """
    
    def __init__(self, db: Session):
        """Initialize the service with a database session."""
        self.db = db
    
    def recommend_goals_for_project(self, project_id: int, tenant_id: int) -> List[Recommendation]:
        """
        Recommend goals that an unaligned project should consider aligning with.
        
        Uses text similarity between project and goal descriptions to identify
        potential alignments.
        
        Args:
            project_id: The ID of the project
            tenant_id: The tenant ID
            
        Returns:
            List of goal recommendations
        """
        # Get the project
        project = self.db.query(Project).filter(
            Project.id == project_id, 
            Project.tenant_id == tenant_id
        ).first()
        
        if not project:
            return []
        
        # Get all active goals for this tenant
        # Assuming there's an is_active field, if not, remove that condition
        goals = self.db.query(Goal).filter(
            Goal.tenant_id == tenant_id
        ).all()
        
        if not goals:
            return []
        
        # Use TF-IDF and cosine similarity to find similar goals based on text
        vectorizer = TfidfVectorizer(stop_words='english')
        
        # Combine project name and description
        project_text = f"{project.name} {project.description or ''}"
        
        # Combine goal names and descriptions
        goal_texts = [f"{goal.name} {goal.description or ''}" for goal in goals]
        
        # If we have no text to analyze, return empty list
        if not project_text.strip() or not any(goal_text.strip() for goal_text in goal_texts):
            return []
        
        try:
            # Create the document-term matrix
            all_texts = [project_text] + goal_texts
            tfidf_matrix = vectorizer.fit_transform(all_texts)
            
            # Calculate cosine similarities between project and each goal
            project_vector = tfidf_matrix[0:1]
            goal_vectors = tfidf_matrix[1:]
            similarities = cosine_similarity(project_vector, goal_vectors).flatten()
            
            # Sort goals by similarity and keep only those with similarity > threshold
            threshold = 0.1  # Minimum similarity score to consider
            similar_goals = []
            
            for i, similarity in enumerate(similarities):
                if similarity > threshold:
                    similar_goals.append((goals[i], float(similarity)))
            
            # Sort by similarity (highest first)
            similar_goals.sort(key=lambda x: x[1], reverse=True)
            
            # Take top 3 most similar goals
            top_goals = similar_goals[:3]
            
            if not top_goals:
                return []
                
        except Exception as e:
            # If text analysis fails, return empty list
            print(f"Error in goal recommendation: {str(e)}")
            return []
        
        # Create recommendation record
        recommendation = Recommendation(
            tenant_id=tenant_id,
            type=RecommendationType.GOAL_ALIGNMENT,
            title=f"Align Project '{project.name}' with Strategic Goals",
            description=f"This project appears to align with {len(top_goals)} strategic goals based on content analysis.",
            difficulty=RecommendationDifficulty.MEDIUM,
            project_id=project_id,
            details={
                "recommended_goals": [
                    {
                        "goal_id": goal.id,
                        "goal_name": goal.name,
                        "similarity_score": float(similarity),
                        "confidence": min(float(similarity) * 2, 1.0)  # Convert similarity to confidence
                    }
                    for goal, similarity in top_goals
                ],
                "analysis_method": "text_similarity"
            }
        )
        
        self.db.add(recommendation)
        self.db.commit()
        self.db.refresh(recommendation)
        
        return [recommendation]
    
    def recommend_team_collaborations(self, tenant_id: int) -> List[Recommendation]:
        """
        Recommend team collaborations based on goal alignment.
        
        Identifies teams working on similar or complementary goals
        who might benefit from collaboration.
        
        Args:
            tenant_id: The tenant ID
            
        Returns:
            List of team collaboration recommendations
        """
        from app.models.team import Team
        
        # Get all teams in this tenant
        teams = self.db.query(Team).filter(
            Team.tenant_id == tenant_id
        ).all()
        
        if len(teams) < 2:
            return []  # Need at least 2 teams to recommend collaborations
        
        # Build dictionary of team_id -> set of goal_ids
        team_goals = {}
        recommendations = []
        
        for team in teams:
            # Get all goals associated with this team
            goals = self.db.query(Goal).join(
                Edge,
                (Edge.target_id == Goal.id) &
                (Edge.target_type == "goal") &
                (Edge.source_id == team.id) &
                (Edge.source_type == "team") &
                (Edge.tenant_id == tenant_id)
            ).all()
            
            # Store as set for efficient overlap calculation
            team_goals[team.id] = {goal.id for goal in goals}
        
        # Compare each pair of teams to find overlapping goals
        for i, team1 in enumerate(teams):
            for team2 in teams[i+1:]:
                # Skip if either team has no goals
                if not team_goals.get(team1.id) or not team_goals.get(team2.id):
                    continue
                
                # Find overlapping goals
                common_goals = team_goals[team1.id].intersection(team_goals[team2.id])
                
                # If teams share goals, create a collaboration recommendation
                if common_goals:
                    # Get details of common goals
                    goals = self.db.query(Goal).filter(Goal.id.in_(common_goals)).all()
                    
                    recommendation = Recommendation(
                        tenant_id=tenant_id,
                        type=RecommendationType.TEAM_COLLABORATION,
                        title=f"Collaboration Opportunity: {team1.name} and {team2.name}",
                        description=f"These teams are working on {len(common_goals)} shared goals and could benefit from collaboration.",
                        difficulty=RecommendationDifficulty.MEDIUM,
                        details={
                            "teams": [
                                {"id": team1.id, "name": team1.name},
                                {"id": team2.id, "name": team2.name}
                            ],
                            "common_goals": [
                                {"id": goal.id, "name": goal.name} for goal in goals
                            ],
                            "collaboration_score": len(common_goals) / max(len(team_goals[team1.id]), len(team_goals[team2.id]))
                        }
                    )
                    
                    self.db.add(recommendation)
                    recommendations.append(recommendation)
        
        if recommendations:
            self.db.commit()
            
        return recommendations
    
    def record_recommendation_feedback(
        self, 
        recommendation_id: int, 
        user_id: int, 
        is_helpful: bool, 
        feedback_text: Optional[str] = None,
        implemented: Optional[bool] = None
    ) -> RecommendationFeedback:
        """
        Record user feedback for a recommendation.
        
        Args:
            recommendation_id: The recommendation ID
            user_id: The user ID providing feedback
            is_helpful: Whether the recommendation was helpful
            feedback_text: Optional textual feedback
            implemented: Whether the recommendation was implemented
            
        Returns:
            The created feedback record
        """
        # Check if recommendation exists
        recommendation = self.db.query(Recommendation).filter(
            Recommendation.id == recommendation_id
        ).first()
        
        if not recommendation:
            raise ValueError(f"Recommendation with ID {recommendation_id} not found")
        
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise ValueError(f"User with ID {user_id} not found")
        
        # Create feedback record
        feedback = RecommendationFeedback(
            recommendation_id=recommendation_id,
            user_id=user_id,
            is_helpful=is_helpful,
            feedback_text=feedback_text,
            implemented=implemented,
        )
        
        self.db.add(feedback)
        self.db.commit()
        self.db.refresh(feedback)
        
        return feedback
    
    def get_recommendations_for_project(self, project_id: int, tenant_id: int) -> List[Recommendation]:
        """
        Get all recommendations for a specific project.
        
        Args:
            project_id: The ID of the project
            tenant_id: The tenant ID
            
        Returns:
            List of recommendations
        """
        return self.db.query(Recommendation).filter(
            Recommendation.project_id == project_id,
            Recommendation.tenant_id == tenant_id
        ).all()
    
    def get_all_recommendations(self, tenant_id: int) -> List[Recommendation]:
        """
        Get all recommendations for a tenant.
        
        Args:
            tenant_id: The tenant ID
            
        Returns:
            List of all recommendations
        """
        return self.db.query(Recommendation).filter(
            Recommendation.tenant_id == tenant_id
        ).all()
    
    def generate_all_recommendations(self, tenant_id: int) -> List[Recommendation]:
        """
        Generate all types of recommendations for a tenant.
        
        Args:
            tenant_id: The tenant ID
            
        Returns:
            List of all generated recommendations
        """
        recommendations = []
        
        # Find unaligned projects and recommend goals
        unaligned_projects = []
        projects = self.db.query(Project).filter(Project.tenant_id == tenant_id).all()
        
        for project in projects:
            # Check if project has goals
            has_goals = self.db.query(Edge).filter(
                Edge.source_id == project.id,
                Edge.source_type == "project",
                Edge.target_type == "goal",
                Edge.tenant_id == tenant_id
            ).count() > 0
            
            if not has_goals:
                unaligned_projects.append(project)
        
        # Generate goal recommendations for unaligned projects
        for project in unaligned_projects:
            project_recommendations = self.recommend_goals_for_project(project.id, tenant_id)
            recommendations.extend(project_recommendations)
        
        # Generate team collaboration recommendations
        team_recommendations = self.recommend_team_collaborations(tenant_id)
        recommendations.extend(team_recommendations)
        
        return recommendations