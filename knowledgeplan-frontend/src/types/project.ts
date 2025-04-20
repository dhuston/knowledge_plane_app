// import { Team } from './team'; // Uncomment when relationships are included
// import { Goal } from './goal'; // Uncomment when relationships are included
// import { User } from './user'; // Uncomment when relationships are included
// import { KnowledgeAsset } from './knowledge_asset'; // Uncomment when relationships are included

// Basic Project structure based on common fields and potential relationships
// Mirroring backend schemas/project.py if possible

export interface Project {
    id: string; // Assuming UUID
    name: string;
    description?: string | null;
    status?: string | null; // Or potentially an enum
    owning_team_id?: string | null; // Foreign key
    // owning_team?: Team; // Eager/lazy loaded relationship
    // goals?: Goal[]; // Eager/lazy loaded relationship
    // members?: User[]; // Eager/lazy loaded relationship (participants)
    // notes?: KnowledgeAsset[]; // Eager/lazy loaded relationship
    // Add other relevant fields as needed
}

// Type for creating a new project (based on modal usage)
export interface ProjectCreate {
    name: string;
    description?: string;
    // Add other required fields if backend needs them (e.g., owning_team_id)
}

// Optional: Define update type if needed elsewhere
export interface ProjectUpdate {
    name?: string;
    description?: string | null;
    status?: string | null;
    owning_team_id?: string | null;
    // ...
} 