// import { Project } from './project'; // Assuming relationship

// Basic Goal/OKR structure based on common fields and potential relationships
// Mirroring backend schemas/goal.py if possible

// import uuid from 'uuid'; // Remove unused import

// Original structure - Keeping simple Goal interface for now
export interface Goal {
    id: string; // Assuming UUID
    name: string; // Use title preferably from GoalRead
    description?: string | null;
    status?: string | null; // Or an enum (e.g., On Track, At Risk)
    progress?: number | null; // e.g., 0-100
    parent_id?: string | null; // For parent/child OKR relationships
    project_id?: string | null; // Link to a specific project
}

// Added based on backend schemas/goal.py GoalRead
// Use this for the main entity fetch
export interface GoalRead {
    id: string;
    tenant_id: string;
    title: string;
    description?: string | null;
    type?: string | null; // Enum: Enterprise/Dept/Team
    parent_id?: string | null; 
    status?: string | null;
    progress?: number | null;
    dueDate?: string | null; // Date as string
    created_at: string;
    updated_at: string;
    properties?: Record<string, unknown> | null;
}

// Explicit definition matching backend GoalReadMinimal schema
export enum GoalTypeEnum {
    ENTERPRISE = "enterprise",
    DEPARTMENT = "department",
    TEAM = "team",
    INDIVIDUAL = "individual"
}

export interface GoalReadMinimal {
    id: string; // UUID
    tenant_id: string;
    title: string;
    description?: string | null;
    type: GoalTypeEnum; // Use the Enum here
    parent_id?: string | null;
    status?: string | null;
    progress?: number | null;
    // Use due_date to match backend query result if different from GoalRead
    due_date?: string | null; 
    created_at: string;
    updated_at: string;
}

// Keep Create/Update simple for now if not used heavily
export interface GoalCreate {
    title: string;
    description?: string | null;
    type?: string | null;
    parent_id?: string | null;
    // ... other fields needed on creation
}

export interface GoalUpdate {
    title?: string | null;
    description?: string | null;
    type?: string | null;
    status?: string | null;
    progress?: number | null;
    dueDate?: string | null;
    parent_id?: string | null;
    // ... other fields allowed for update
} 