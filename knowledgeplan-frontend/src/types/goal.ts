// import { Project } from './project'; // Assuming relationship

// Basic Goal/OKR structure based on common fields and potential relationships
// Mirroring backend schemas/goal.py if possible

export interface Goal {
    id: string; // Assuming UUID
    name: string; // Use title preferably from GoalRead
    description?: string | null;
    // status?: string | null; // Or an enum (e.g., On Track, At Risk)
    // progress?: number | null; // e.g., 0-100
    parent_id?: string | null; // For parent/child OKR relationships
    project_id?: string | null; // Link to a specific project
    // project?: Project; // Eager/lazy loaded relationship
    // children?: Goal[]; // Eager/lazy loaded relationship
    // Add other relevant fields as needed, e.g., target_date, owner_id
}

// Optional: Define create/update types if needed elsewhere
export interface GoalCreate {
    name: string;
    description?: string | null;
    parent_id?: string | null;
    project_id?: string | null;
    // ...
}

export interface GoalUpdate {
    name?: string;
    description?: string | null;
    status?: string | null;
    progress?: number | null;
    parent_id?: string | null;
    // ...
}

// Added based on backend schemas/goal.py GoalRead
export interface GoalRead {
    id: string;
    tenant_id: string;
    title: string;
    type?: string | null; // Enum: Enterprise/Dept/Team
    parentId?: string | null; // Note: Backend schema might use parent_id
    parent_id?: string | null; // Adding based on backend schema convention
    status?: string | null;
    progress?: number | null;
    dueDate?: string | null; // Date as string
    created_at: string;
    updated_at: string;
    properties?: Record<string, unknown> | null;
    // Add description if available in backend schema
    description?: string | null;
} 