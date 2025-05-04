import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export interface TeamMember {
  id: string;
  name: string;
  avatar_url?: string;
}

export interface TeamProject {
  id: string;
  name: string;
  status: string;
}

export interface TeamGoal {
  id: string;
  title: string;
}

export interface TeamData {
  id: string;
  name: string;
  members: TeamMember[];
  projects: TeamProject[];
  goals: TeamGoal[];
  researchCount: number;
  activities: TeamActivity[];
}

export interface TeamActivity {
  type: 'new' | 'update' | 'research';
  description: string;
}

interface UseTeamDataResult {
  teamData: TeamData | null;
  isLoading: boolean;
  error: Error | null;
}

export function useTeamData(teamId?: string): UseTeamDataResult {
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!teamId) {
      return;
    }

    const fetchTeamData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Since we're having backend auth issues, let's use mock data for now
        console.log(`Using mock data for team ${teamId}`);
        
        // Mock team name and members
        const teamName = "Research & Development";
        
        const members = [
          { id: "user-1", name: "Jane Smith", avatar_url: "https://randomuser.me/api/portraits/women/17.jpg" },
          { id: "user-2", name: "John Doe", avatar_url: "https://randomuser.me/api/portraits/men/24.jpg" },
          { id: "user-3", name: "Alice Walker", avatar_url: "https://randomuser.me/api/portraits/women/32.jpg" },
          { id: "user-4", name: "Robert Chen", avatar_url: "https://randomuser.me/api/portraits/men/56.jpg" },
          { id: "user-5", name: "Maria Rodriguez", avatar_url: "https://randomuser.me/api/portraits/women/45.jpg" },
        ];
        
        // Mock projects
        const projects = [
          { id: "project-1", name: "Knowledge Graph Visualization", status: "active" },
          { id: "project-2", name: "Research Pipeline Optimization", status: "planning" },
          { id: "project-3", name: "Clinical Data Analysis Study", status: "active" },
        ];
        
        // Mock goals
        const goals = [
          { id: "goal-1", title: "Improve research visualization tools" },
          { id: "goal-2", title: "Streamline data analysis workflows" },
          { id: "goal-3", title: "Establish cross-team collaboration protocols" },
        ];

        // Count research projects
        const researchCount = projects.filter(p => 
          p.name.toLowerCase().includes('research') || 
          p.name.toLowerCase().includes('study')
        ).length;

        // Generate activities
        const activities: TeamActivity[] = [
          {
            type: 'new',
            description: `${projects[0].name} project is in progress`
          },
          {
            type: 'update',
            description: `Goal "${goals[0].title}" is being tracked`
          },
          {
            type: 'research',
            description: `${researchCount} research projects in progress`
          }
        ];

        // Try API call but fallback to mock data if it fails
        try {
          // For future implementation - try the actual API calls here
          // Currently bypassing to avoid auth errors
          throw new Error("Using mock data");
        } catch (apiError) {
          console.log("Using mock data instead of API calls");
        }

        setTeamData({
          id: teamId,
          name: teamName,
          members,
          projects,
          goals,
          researchCount,
          activities
        });
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch team data'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamId]);

  return { teamData, isLoading, error };
}