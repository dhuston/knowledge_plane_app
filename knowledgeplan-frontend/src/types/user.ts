// Basic User structure based on common fields and potential relationships
// Mirroring backend schemas/user.py if possible

export interface User {
  id: string; // Assuming UUIDs are used
  name: string;
  email: string;
  title?: string | null;
  avatar_url?: string | null;
  is_active?: boolean; // Common flag
  team_id?: string | null; // Foreign key
  manager_id?: string | null; // Foreign key (self-referential)
  // Add other relevant fields as needed, e.g., roles, department_id
}

// Optional: Define create/update types if needed elsewhere
export interface UserCreate {
  // Fields required to create a user (might not be needed for frontend if creation happens elsewhere)
  name: string;
  email: string;
  // ...
}

export interface UserUpdate {
  // Fields allowed for update
  name?: string;
  email?: string;
  title?: string | null;
  // ...
} 