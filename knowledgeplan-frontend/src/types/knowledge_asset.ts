// import { Project } from './project'; // Uncomment when relationships are included
// import { User } from './user'; // Uncomment when relationships are included

// Basic Knowledge Asset structure based on common fields and potential relationships
// Mirroring backend schemas/knowledge_asset.py if possible

// Could potentially be an enum later if more types are added
export type KnowledgeAssetType = 'note' | 'link' | 'document'; 

// Base interface for all knowledge assets
export interface KnowledgeAsset {
    id: string; // Assuming UUID
    type: KnowledgeAssetType;
    title?: string | null;
    created_at?: string; // ISO date string
    updated_at?: string; // ISO date string
    creator_id?: string | null; // Foreign key to User
    // creator?: User; // Eager/lazy loaded relationship
    project_id?: string | null; // Foreign key to Project
    // project?: Project; // Eager/lazy loaded relationship
    // Add other common fields as needed
}

// Specific type for Notes, extending the base
export interface Note extends KnowledgeAsset {
    type: 'note';
    content: string;
}

// Type for creating a new Note (based on BriefingPanel usage)
export interface NoteCreate {
    content: string;
    project_id: string; // Required for association
    type: 'note'; // Explicitly set type for backend endpoint differentiation
    title?: string | null; // Optional title
}

// Optional: Define update type if needed elsewhere
export interface NoteUpdate {
    content?: string;
    title?: string | null;
    // ... other updatable fields
} 