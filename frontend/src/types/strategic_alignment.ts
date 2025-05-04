export enum MisalignmentType {
  UNALIGNED_PROJECT = "unaligned_project",
  CONFLICTING_GOALS = "conflicting_goals",
  RESOURCE_MISALLOCATION = "resource_misallocation",
  STRATEGIC_GAP = "strategic_gap",
  DUPLICATED_EFFORT = "duplicated_effort"
}

export enum MisalignmentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export interface Misalignment {
  id: number;
  tenant_id: number;
  type: MisalignmentType;
  severity: MisalignmentSeverity;
  description: string;
  affected_entities: Record<string, number[]>;
  context?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AlignmentMetrics {
  total_projects: number;
  aligned_projects: number;
  alignment_percentage: number;
  misalignment_count_by_type: Record<string, number>;
  misalignment_count_by_severity: Record<string, number>;
  overall_alignment_score: number;
}

export enum RecommendationType {
  GOAL_ALIGNMENT = "goal_alignment",
  PROJECT_RESTRUCTURING = "project_restructuring",
  TEAM_COLLABORATION = "team_collaboration",
  RESOURCE_REALLOCATION = "resource_reallocation"
}

export enum RecommendationDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard"
}

export interface Recommendation {
  id: number;
  tenant_id: number;
  type: RecommendationType;
  title: string;
  description: string;
  difficulty: RecommendationDifficulty;
  context?: Record<string, any>;
  project_id?: number;
  details: Record<string, any>;
  created_at: string;
}

export interface RecommendationFeedback {
  id?: number;
  recommendation_id: number;
  is_helpful: boolean;
  feedback_text?: string;
  implemented?: boolean;
}

export enum ImpactSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

export enum ImpactTimeframe {
  IMMEDIATE = "immediate",
  SHORT_TERM = "short_term",
  MEDIUM_TERM = "medium_term",
  LONG_TERM = "long_term"
}

export interface ImpactAnalysis {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  severity: ImpactSeverity;
  timeframe: ImpactTimeframe;
  affected_entities: Record<string, Array<Record<string, any>>>;
  metrics_impact: Record<string, number>;
  created_at: string;
  created_by_user_id: number;
}

export interface ImpactScenario {
  id: number;
  tenant_id: number;
  name: string;
  description: string;
  scenario_type: string;
  parameters: Record<string, any>;
  created_by_user_id: number;
  created_at: string;
}

export interface ScenarioResult {
  id: number;
  scenario_id: number;
  result_summary: Record<string, any>;
  affected_entities: Record<string, number[]>;
  metrics_before: Record<string, number>;
  metrics_after: Record<string, number>;
  recommendation?: string;
  visualization_data?: Record<string, any>;
  created_at: string;
}

export interface MapOverlay {
  node_id: number;
  node_type: string;
  overlay_type: string;
  overlay_data: Record<string, any>;
  visual: {
    color: string;
    icon: string;
  };
}

export interface MisalignmentMapData {
  overlays: MapOverlay[];
}