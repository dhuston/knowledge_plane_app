// Basic User structure based on common fields and potential relationships
// Mirroring backend schemas/user.py if possible

// Base User interface
export interface UserBase {
  email?: string | null;
  name?: string | null;
  title?: string | null;
  avatar_url?: string;
  online_status?: boolean;
  description?: string;
  department?: string;
  skills?: string[];
}

// Interface for creating a user (matches backend UserCreate)
export interface UserCreate extends UserBase {
  email: string;
  name: string;
  // ... other fields matching backend ...
}

// Interface for updating a user (matches backend UserUpdate)
export interface UserUpdate extends UserBase {
  // ... fields allowed for update ...
}

// Interface for reading user data (matches backend UserRead)
export interface User extends UserBase {
  id: string; // UUID as string
  tenant_id?: string;
  created_at: string; // ISO date string
  updated_at?: string | null;
  last_login_at?: string | null;
  team_id?: string | null;
  manager_id?: string | null;
  auth_provider?: string | null;
  auth_provider_id?: string | null;
  status?: string;
}

// --- Add Basic User Type ---
export interface UserReadBasic {
  id: string; // UUID as string
  name?: string | null; // Also include name for display
} 

// Enhanced entity types matching our context panel entity types
export interface UserEntity {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  status?: string;
  email: string;
  title?: string;
  department?: string;
  avatar_url?: string;
  team_id?: string;
  manager_id?: string;
  skills?: string[];
}