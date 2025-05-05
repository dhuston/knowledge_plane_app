// import { UUID } from 'crypto'; // Removed unused import

// Mirroring backend schemas/map.py

export enum MapNodeTypeEnum {
    USER = "user",
    TEAM = "team",
    PROJECT = "project",
    GOAL = "goal",
    KNOWLEDGE_ASSET = "knowledge_asset",
    DEPARTMENT = "department",
    TEAM_CLUSTER = "team_cluster",
    UNKNOWN = "unknown" // Safe default type for placeholder nodes
}

export enum MapEdgeTypeEnum {
    REPORTS_TO = "REPORTS_TO",
    MEMBER_OF = "MEMBER_OF",
    LEADS = "LEADS",
    OWNS = "OWNS",
    PARTICIPATES_IN = "PARTICIPATES_IN",
    ALIGNED_TO = "ALIGNED_TO",
    PARENT_OF = "PARENT_OF",
    RELATED_TO = "RELATED_TO",
}

export interface MapNode {
    id: string; // UUID as string
    type: MapNodeTypeEnum;
    label: string;
    data: Record<string, unknown>; // Use unknown for safer typing
    position?: { x: number; y: number }; // Optional position hint
    x?: number; // Direct x coordinate - some APIs return this format
    y?: number; // Direct y coordinate - some APIs return this format
}

export interface MapEdge {
    id: string;
    source: string; // Source node ID (UUID as string)
    target: string; // Target node ID (UUID as string)
    type?: MapEdgeTypeEnum; // Type might be undefined in API responses
    label?: string | null; // Label is sometimes used instead of type in API responses
    data?: Record<string, unknown> | null; // Use unknown for safer typing
    animated?: boolean | null;
}

export interface MapData {
    nodes: MapNode[];
    edges: MapEdge[];
}

// Response type for project overlaps insight
export interface ProjectOverlapResponse {
    overlaps: Record<string, string[]>; // { [projectId: string]: string[] }
} 