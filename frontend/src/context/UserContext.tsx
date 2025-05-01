import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  manager?: {
    id: string;
    name: string;
  };
  teamId?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  updateUserPreferences: (preferences: Record<string, any>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch user data from an API
    const fetchUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock user data
        const mockUser: User = {
          id: '1',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'Product Manager',
          department: 'Research & Development',
          avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
          manager: {
            id: '5',
            name: 'Alex Johnson'
          },
          teamId: '3'
        };
        
        setUser(mockUser);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const updateUserPreferences = async (preferences: Record<string, any>): Promise<void> => {
    // In a real implementation, this would call an API to update user preferences
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local user object with new preferences
      setUser(currentUser => {
        if (!currentUser) return null;
        return {
          ...currentUser,
          preferences: {
            ...currentUser.preferences,
            ...preferences
          }
        };
      });
      
      console.log('User preferences updated:', preferences);
    } catch (err) {
      console.error('Error updating user preferences:', err);
      throw new Error('Failed to update user preferences');
    }
  };

  const value = {
    user,
    isLoading,
    error,
    updateUserPreferences
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
}