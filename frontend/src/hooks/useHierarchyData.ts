/**
 * useHierarchyData.ts
 * Hook for fetching and managing organizational hierarchy data
 */

import { useState, useEffect } from 'react';
import { useApiClient } from './useApiClient';
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../types/hierarchy';

interface UseHierarchyDataProps {
  initialUnitId?: string;
  includeChildren?: boolean;
}

interface HierarchyDataState {
  units: Record<string, OrganizationalUnitEntity>;
  rootUnits: OrganizationalUnitEntity[];
  userPath: string[];
  isLoading: boolean;
  error: string | null;
}

export const useHierarchyData = ({
  initialUnitId,
  includeChildren = true,
}: UseHierarchyDataProps = {}) => {
  // State
  const [state, setState] = useState<HierarchyDataState>({
    units: {},
    rootUnits: [],
    userPath: [],
    isLoading: false,
    error: null,
  });

  // API client
  const apiClient = useApiClient();

  // Fetch user's position in hierarchy
  useEffect(() => {
    const fetchUserPath = async () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        // In a real implementation, this would come from the API
        // For now, we'll simulate the hierarchy with mock data
        
        // Create mock organizational units
        const mockOrg: Record<string, OrganizationalUnitEntity> = {
          'org-1': {
            id: 'org-1',
            type: OrganizationalUnitTypeEnum.ORGANIZATION,
            name: 'Acme Corporation',
            description: 'Global technology company',
            memberCount: 5000,
            level: 0,
            path: ['org-1'],
          },
          'div-1': {
            id: 'div-1',
            type: OrganizationalUnitTypeEnum.DIVISION,
            name: 'Research Division',
            description: 'Research and innovation',
            parentId: 'org-1',
            memberCount: 1200,
            level: 1,
            path: ['org-1', 'div-1'],
          },
          'dept-1': {
            id: 'dept-1',
            type: OrganizationalUnitTypeEnum.DEPARTMENT,
            name: 'AI Department',
            description: 'Artificial intelligence research',
            parentId: 'div-1',
            memberCount: 150,
            level: 2,
            path: ['org-1', 'div-1', 'dept-1'],
          },
          'team-1': {
            id: 'team-1',
            type: OrganizationalUnitTypeEnum.TEAM,
            name: 'ML Team',
            description: 'Machine learning researchers',
            parentId: 'dept-1',
            leaderId: 'user-2',
            memberCount: 8,
            level: 3,
            path: ['org-1', 'div-1', 'dept-1', 'team-1'],
          },
          'user-1': {
            id: 'user-1',
            type: OrganizationalUnitTypeEnum.USER,
            name: 'John Smith',
            description: 'Research Scientist',
            parentId: 'team-1',
            memberCount: 1,
            level: 4,
            path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-1'],
          },
          'user-2': {
            id: 'user-2',
            type: OrganizationalUnitTypeEnum.USER,
            name: 'Sarah Johnson',
            description: 'Team Lead',
            parentId: 'team-1',
            memberCount: 1,
            level: 4,
            path: ['org-1', 'div-1', 'dept-1', 'team-1', 'user-2'],
          },
        };

        // Default path - goes from user to organization
        const userPath = ['org-1', 'div-1', 'dept-1', 'team-1', 'user-1'];
        
        // Get root units (organization level)
        const rootUnits = Object.values(mockOrg).filter(
          unit => unit.level === 0
        );

        setState({
          units: mockOrg,
          rootUnits,
          userPath,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error fetching hierarchy path:', err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load organizational data',
        }));
      }
    };

    fetchUserPath();
  }, [apiClient]);

  // Fetch a specific unit and its children
  const fetchUnit = async (unitId: string) => {
    if (!unitId) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // In a real app, this would be an API call
      // For now, we'll just return the unit from our mock data
      const unit = state.units[unitId];
      
      if (!unit) {
        throw new Error(`Unit ${unitId} not found`);
      }

      // We'll pretend we got updated data
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
      
      return unit;
    } catch (err) {
      console.error(`Error fetching unit ${unitId}:`, err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load organizational unit',
      }));
      return null;
    }
  };

  return {
    ...state,
    fetchUnit,
  };
};