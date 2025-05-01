// import { User } from './user'; // Uncomment when members are included
// import { UUID } from 'crypto'; // Removed unused import

// Basic Team structure based on common fields and potential relationships
// Mirroring backend schemas/team.py if possible

export interface Team {
    id: string; // Assuming UUID
    name: string;
    description?: string | null;
    lead_id?: string | null; // Foreign key to User
    // members?: User[]; // Might be fetched separately or included depending on API
    // Add other relevant fields as needed, e.g., parent_team_id, department_id
}

// Optional: Define create/update types if needed elsewhere
export interface TeamCreate {
    name: string;
    description?: string | null;
    lead_id?: string | null;
    // ...
}

export interface TeamUpdate {
    name?: string;
    description?: string | null;
    lead_id?: string | null;
    // ...
}

// Based on backend/app/schemas/team.py TeamRead
// Adapt fields as needed for frontend use
export interface TeamRead {
    id: string; // Keep as string for consistency
    name: string;
    tenant_id: string; // Keep as string
    lead_id?: string | null;
    dept_id?: string | null;
    description?: string | null;
    created_at: string; // Or Date if preferred
    updated_at: string; // Or Date if preferred
    // Add other relevant fields like members if included in backend schema
} 