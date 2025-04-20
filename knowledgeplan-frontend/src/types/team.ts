// import { User } from './user'; // Uncomment when members are included

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