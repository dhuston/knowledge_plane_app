// import { UUID } from 'crypto'; // Removed unused import

// Mirroring backend schemas/map.py

export enum MapNodeTypeEnum {
    USER = "USER",
    TEAM = "TEAM",
    PROJECT = "PROJECT",
    GOAL = "GOAL",
    KNOWLEDGE_ASSET = "KNOWLEDGE_ASSET",
    DEPARTMENT = "DEPARTMENT",
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
}

export interface MapEdge {
    id: string;
    source: string; // Source node ID (UUID as string)
    target: string; // Target node ID (UUID as string)
    type: MapEdgeTypeEnum;
    data?: Record<string, unknown> | null; // Use unknown for safer typing
    animated?: boolean | null;
    label?: string | null;
}

export interface MapData {
    nodes: MapNode[];
    edges: MapEdge[];
} 