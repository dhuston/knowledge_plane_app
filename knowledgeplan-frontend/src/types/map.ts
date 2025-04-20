// import { UUID } from 'crypto'; // Removed unused import

// Mirroring backend schemas/map.py

export enum MapNodeTypeEnum {
    USER = "user",
    TEAM = "team",
    PROJECT = "project",
    GOAL = "goal",
    KNOWLEDGE_ASSET = "knowledge_asset",
    DEPARTMENT = "department",
}

export enum MapEdgeTypeEnum {
    REPORTS_TO = "reports_to",
    MEMBER_OF = "member_of",
    LEADS = "leads",
    OWNS = "owns",
    PARTICIPATES_IN = "participates_in",
    ALIGNED_TO = "aligned_to",
    DEPENDS_ON = "depends_on",
    LINKS_TO = "links_to",
}

export interface MapNode {
    id: string; // Keep as string, consistent with react-flow
    type: MapNodeTypeEnum;
    label: string;
    data: { [key: string]: unknown }; // Use unknown instead of any
    position?: { x: number; y: number };
}

export interface MapEdge {
    id: string;
    source: string;
    target: string;
    type: MapEdgeTypeEnum;
    label?: string;
    data: { [key: string]: unknown }; // Use unknown instead of any
}

export interface MapData {
    nodes: MapNode[];
    edges: MapEdge[];
} 