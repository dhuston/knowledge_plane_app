// import { Project } from './project'; // Uncomment when relationships are included
// import { User } from './user'; // Uncomment when relationships are included
import { UserReadBasic } from './user'; // Import UserReadBasic

// Basic Knowledge Asset structure based on common fields and potential relationships
// Mirroring backend schemas/knowledge_asset.py if possible

// Type definitions for Knowledge Assets
// import { UUID } from 'crypto'; // Removed unused import

// Enum mirroring backend
export enum KnowledgeAssetTypeEnum {
    NOTE = "NOTE",
    DOCUMENT = "DOCUMENT",
    MESSAGE = "MESSAGE",
    MEETING = "MEETING",
    REPORT = "REPORT",
    SUBMISSION = "SUBMISSION",
    PRESENTATION = "PRESENTATION",
}

// --- Note Specific Types ---

// What the frontend needs to send to create a note
// Matches backend NoteCreate which inherits content, title?, properties?
// Backend derives project_id, owner_id, type.
export interface NoteCreate {
    content: string;
    title?: string | null;
    properties?: Record<string, unknown> | null;
}

// What the backend returns for a note (based on NoteRead schema)
export interface Note {
    id: string;
    tenant_id: string;
    project_id: string;
    // owner_id: string; // Use created_by object instead
    type: KnowledgeAssetTypeEnum; // Should always be NOTE
    content: string;
    title?: string | null;
    properties?: Record<string, unknown> | null;
    created_at: string; // Or Date
    updated_at: string; // Or Date
    // Add creator info based on backend schema
    created_by?: UserReadBasic | null;
}

// Frontend equivalent for NoteRead schema
export interface NoteRead {
    id: string;
    tenant_id: string;
    project_id: string;
    author_id: string;
    title?: string | null;
    content: string;
    created_at: string; // ISO string
    updated_at: string; // ISO string
    author?: { // Minimal author info
        id: string;
        name?: string | null;
        avatar_url?: string | null;
    } | null;
}

// Frontend equivalent for NoteReadRecent schema
export interface NoteReadRecent {
    id: string;
    title?: string | null;
    created_at: string; // ISO string
}

// // Optional: If needed, define Update schema
// export interface NoteUpdate {
//     title?: string | null;
//     content?: string | null;
// }

// --- Generic Knowledge Asset Interface ---
export interface KnowledgeAssetRead {
    id: string;
    tenant_id: string;
    type: KnowledgeAssetTypeEnum;
    title?: string | null;
    source?: string | null;
    link?: string | null;
    properties?: Record<string, unknown> | null;
    project_id?: string | null;
    created_at: string;
    updated_at: string;
    created_by_user_id: string;
    created_by?: UserReadBasic | null;
}

// --- REMOVED Conflicting Generic Definitions ---
// export type KnowledgeAssetType = 'note' | 'link' | 'document';
// export interface KnowledgeAsset { ... }
// export interface Note extends KnowledgeAsset { ... }
// export interface NoteUpdate { ... }