/**
 * HierarchyService.ts
 * API service for the organizational hierarchy
 */
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../../../types/hierarchy';
import { MapData, MapNode, MapNodeTypeEnum } from '../../../types/map';

// Type for the API client
export type ApiClient = {
  get: <T>(url: string) => Promise<{ data: T }>;
};

// API response types
export interface HierarchyPathResponse {
  path: string[];
  units: Record<string, OrganizationalUnitEntity>;
}

export interface HierarchyUnitResponse {
  unit: OrganizationalUnitEntity;
  children: OrganizationalUnitEntity[];
}

export interface HierarchySearchResponse {
  results: OrganizationalUnitEntity[];
}

/**
 * Service for fetching hierarchy data
 */
export class HierarchyService {
  constructor(private apiClient: ApiClient) {}

  /**
   * Fetch the user's position in the hierarchy
   */
  async fetchUserPath(): Promise<HierarchyPathResponse> {
    try {
      // Check if authentication token exists
      const token = localStorage.getItem('knowledge_plane_token');
      if (!token) {
        console.log('No authentication token available, returning mock data');
        return this.getMockHierarchyPath();
      }
      
      try {
        // Use the map endpoint with center_node_id as the current user
        const response = await this.apiClient.get<MapData>('/map/data');
        
        // Convert the map data response to the expected HierarchyPathResponse format
        const mapData = response.data;
        
        // Create a placeholder response since the real endpoint isn't available yet
        const pathResponse: HierarchyPathResponse = {
          path: [],
          units: {}
        };
        
        // Extract units from nodes
        if (mapData && mapData.nodes) {
          mapData.nodes.forEach((node: MapNode) => {
            pathResponse.units[node.id] = {
              id: node.id,
              name: node.label || (node.data?.name as string) || 'Unknown',
              type: this.convertNodeTypeToOrgType(node.type),
              level: 0, // Default level
              memberCount: (node.data?.memberCount as number) || 0,
              path: [],
            };
            
            // Add this node ID to the path if it's a team or higher level
            if (node.type !== MapNodeTypeEnum.USER) {
              pathResponse.path.push(node.id);
            }
          });
        }
        
        return pathResponse;
      } catch (error: any) {
        console.error('Error fetching hierarchy position:', error);
        
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.log('Authentication or endpoint error, returning mock data');
          return this.getMockHierarchyPath();
        }
        
        throw new Error('Failed to load your position in the organization');
      }
    } catch (error) {
      console.error('Error in fetchUserPath:', error);
      throw new Error('Failed to load your position in the organization');
    }
  }
  
  /**
   * Return mock hierarchy data for testing when API is unavailable
   */
  private getMockHierarchyPath(): HierarchyPathResponse {
    console.log('Providing mock hierarchy data');
    const orgId = 'org-001';
    const divisionId = 'div-001';
    const deptId = 'dept-001';
    const teamId = 'team-001';
    const userId = 'user-001';
    
    return {
      path: [orgId, divisionId, deptId, teamId],
      units: {
        [orgId]: {
          id: orgId,
          name: 'Mock Organization',
          type: OrganizationalUnitTypeEnum.ORGANIZATION,
          memberCount: 500,
          level: 0,
          path: [],
        },
        [divisionId]: {
          id: divisionId,
          name: 'Mock Division',
          type: OrganizationalUnitTypeEnum.DIVISION,
          memberCount: 200,
          level: 1,
          path: [orgId],
          parentId: orgId,
        },
        [deptId]: {
          id: deptId,
          name: 'Mock Department',
          type: OrganizationalUnitTypeEnum.DEPARTMENT,
          memberCount: 50,
          level: 2, 
          path: [orgId, divisionId],
          parentId: divisionId,
        },
        [teamId]: {
          id: teamId,
          name: 'Mock Team',
          type: OrganizationalUnitTypeEnum.TEAM,
          memberCount: 8,
          level: 3,
          path: [orgId, divisionId, deptId],
          parentId: deptId,
          leaderId: userId,
        },
        [userId]: {
          id: userId,
          name: 'Mock User',
          type: OrganizationalUnitTypeEnum.USER,
          memberCount: 1,
          level: 4,
          path: [orgId, divisionId, deptId, teamId],
          parentId: teamId,
        }
      }
    };
  }
  
  /**
   * Convert map node type to organizational unit type
   */
  private convertNodeTypeToOrgType(nodeType: MapNodeTypeEnum | string): OrganizationalUnitTypeEnum {
    switch (nodeType) {
      case MapNodeTypeEnum.USER:
        return OrganizationalUnitTypeEnum.USER;
      case MapNodeTypeEnum.TEAM:
      case MapNodeTypeEnum.TEAM_CLUSTER:
        return OrganizationalUnitTypeEnum.TEAM;
      case MapNodeTypeEnum.PROJECT:
        return OrganizationalUnitTypeEnum.DEPARTMENT; // Use department as closest match
      case MapNodeTypeEnum.GOAL:
        return OrganizationalUnitTypeEnum.ORGANIZATION; // Use organization as closest match
      case MapNodeTypeEnum.DEPARTMENT:
        return OrganizationalUnitTypeEnum.DEPARTMENT;
      default:
        return OrganizationalUnitTypeEnum.TEAM;
    }
  }

  /**
   * Fetch a specific unit and its children
   */
  async fetchUnit(unitId: string): Promise<HierarchyUnitResponse> {
    if (!unitId) {
      throw new Error('Unit ID is required');
    }

    try {
      // Check if authentication token exists
      const token = localStorage.getItem('knowledge_plane_token');
      if (!token) {
        console.log('No authentication token available, returning mock data for unit');
        return this.getMockHierarchyUnit(unitId);
      }
      
      try {
        // Use the map endpoint with center_node_id as the selected unit
        const response = await this.apiClient.get<MapData>(
          `/map/data?center_node_id=${unitId}&depth=1`
        );
        
        // Convert the map data response to the expected HierarchyUnitResponse format
        const mapData = response.data;
        
        // Create a placeholder response
        const unitResponse: HierarchyUnitResponse = {
          unit: {
            id: unitId,
            name: 'Unknown Unit',
            type: OrganizationalUnitTypeEnum.TEAM,
            memberCount: 0,
            level: 0,
            path: [],
          },
          children: []
        };
        
        // Find the unit in nodes
        if (mapData && mapData.nodes) {
          // Find the center node first
          const centerNode = mapData.nodes.find((node: MapNode) => node.id === unitId);
          if (centerNode) {
            unitResponse.unit = {
              id: centerNode.id,
              name: centerNode.label || (centerNode.data?.name as string) || 'Unknown',
              type: this.convertNodeTypeToOrgType(centerNode.type),
              memberCount: (centerNode.data?.memberCount as number) || 0,
              level: 0,
              path: [],
            };
            
            // Find children by looking at edges
            if (mapData.edges) {
              const childNodeIds = mapData.edges
                .filter(edge => edge.source === unitId)
                .map(edge => edge.target);
                
              // Create child unit objects
              unitResponse.children = mapData.nodes
                .filter(node => childNodeIds.includes(node.id))
                .map(node => ({
                  id: node.id,
                  name: node.label || (node.data?.name as string) || 'Unknown',
                  type: this.convertNodeTypeToOrgType(node.type),
                  memberCount: (node.data?.memberCount as number) || 0,
                  level: 1, // Children are one level down
                  path: [unitId], // Parent ID is in the path
                  parentId: unitId
                }));
            }
          }
        }
        
        return unitResponse;
      } catch (error: any) {
        console.error(`Error fetching hierarchy unit ${unitId}:`, error);
        
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.log('Authentication or endpoint error, returning mock data for unit');
          return this.getMockHierarchyUnit(unitId);
        }
        
        throw new Error('Failed to load organizational unit');
      }
    } catch (error) {
      console.error(`Error in fetchUnit ${unitId}:`, error);
      throw new Error('Failed to load organizational unit');
    }
  }
  
  /**
   * Get mock data for a specific hierarchy unit
   */
  private getMockHierarchyUnit(unitId: string): HierarchyUnitResponse {
    console.log(`Providing mock unit data for ${unitId}`);
    
    // If it's a special ID from our mock hierarchy, provide realistic mock data
    const mockHierarchy = this.getMockHierarchyPath();
    const mockUnit = mockHierarchy.units[unitId];
    
    if (mockUnit) {
      // Find children by looking at parentId in other units
      const children = Object.values(mockHierarchy.units).filter(unit => unit.parentId === unitId);
      
      return {
        unit: mockUnit,
        children: children
      };
    }
    
    // Generic mock data for any other ID
    return {
      unit: {
        id: unitId,
        name: `Mock Unit ${unitId.substring(0, 4)}`,
        type: OrganizationalUnitTypeEnum.TEAM,
        memberCount: 5,
        level: 3,
        path: ['org-001', 'div-001', 'dept-001'],
      },
      children: [
        {
          id: `child-1-${unitId.substring(0, 4)}`,
          name: 'Mock Child 1',
          type: OrganizationalUnitTypeEnum.USER,
          memberCount: 1,
          level: 4,
          path: ['org-001', 'div-001', 'dept-001', unitId],
          parentId: unitId
        },
        {
          id: `child-2-${unitId.substring(0, 4)}`,
          name: 'Mock Child 2',
          type: OrganizationalUnitTypeEnum.USER,
          memberCount: 1,
          level: 4,
          path: ['org-001', 'div-001', 'dept-001', unitId],
          parentId: unitId
        }
      ]
    };
  }

  /**
   * Search for units in the hierarchy
   */
  async searchUnits(
    searchTerm: string,
    filterType?: OrganizationalUnitTypeEnum | null
  ): Promise<HierarchySearchResponse> {
    if (!searchTerm || searchTerm.length < 2) {
      return { results: [] };
    }

    try {
      // Check if authentication token exists
      const token = localStorage.getItem('knowledge_plane_token');
      if (!token) {
        console.log('No authentication token available, returning mock search results');
        return this.getMockSearchResults(searchTerm, filterType);
      }
      
      try {
        // Get all possible results from map/data and filter manually
        const response = await this.apiClient.get<MapData>('/map/data');
        const mapData = response.data;
        
        // Create empty results list
        const searchResponse: HierarchySearchResponse = { results: [] };
        
        if (mapData && mapData.nodes) {
          // Filter nodes that match the search term (case insensitive)
          const matchingNodes = mapData.nodes.filter((node: MapNode) => {
            const nodeName = node.label || (node.data?.name as string) || '';
            const nodeDescription = node.data?.description as string || '';
            
            // Check if the node matches both search term and type filter
            const matchesSearchTerm = 
              nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              nodeDescription.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Apply type filter if provided
            let matchesType = true;
            if (filterType) {
              const orgType = this.convertNodeTypeToOrgType(node.type);
              matchesType = orgType === filterType;
            }
            
            return matchesSearchTerm && matchesType;
          });
          
          // Convert matching nodes to OrganizationalUnitEntity objects
          searchResponse.results = matchingNodes.map((node: MapNode) => ({
            id: node.id,
            name: node.label || (node.data?.name as string) || 'Unknown',
            type: this.convertNodeTypeToOrgType(node.type),
            memberCount: (node.data?.memberCount as number) || 0,
            level: 0,
            path: [],
            description: node.data?.description as string
          }));
        }
        
        return searchResponse;
      } catch (error: any) {
        console.error('Error searching hierarchy:', error);
        
        if (error?.response?.status === 401 || error?.response?.status === 404) {
          console.log('Authentication or endpoint error, returning mock search results');
          return this.getMockSearchResults(searchTerm, filterType);
        }
        
        throw new Error('Failed to search the organization');
      }
    } catch (error) {
      console.error('Error in searchUnits:', error);
      throw new Error('Failed to search the organization');
    }
  }
  
  /**
   * Get mock search results for the hierarchy
   */
  private getMockSearchResults(
    searchTerm: string, 
    filterType?: OrganizationalUnitTypeEnum | null
  ): HierarchySearchResponse {
    console.log(`Providing mock search results for "${searchTerm}"`);
    
    const mockHierarchy = this.getMockHierarchyPath();
    
    // Filter mock units by search term and type
    const matchingUnits = Object.values(mockHierarchy.units).filter(unit => {
      // Check if name matches search term
      const nameMatches = unit.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply type filter if provided
      let typeMatches = true;
      if (filterType) {
        typeMatches = unit.type === filterType;
      }
      
      return nameMatches && typeMatches;
    });
    
    // If no matches in mock data, create some fake matches based on the search term
    if (matchingUnits.length === 0) {
      const mockTypes = [
        OrganizationalUnitTypeEnum.TEAM,
        OrganizationalUnitTypeEnum.DEPARTMENT,
        OrganizationalUnitTypeEnum.USER
      ];
      
      // Create 3 mock results with the search term in their name
      matchingUnits.push(
        ...Array.from({ length: 3 }, (_, i) => ({
          id: `search-result-${i}-${Date.now()}`,
          name: `${searchTerm} Mock Result ${i+1}`,
          type: filterType || mockTypes[i % mockTypes.length],
          memberCount: Math.floor(Math.random() * 10) + 1,
          level: Math.floor(Math.random() * 4) + 1,
          path: ['org-001'],
          description: `Mock search result for "${searchTerm}"`
        }))
      );
    }
    
    return {
      results: matchingUnits
    };
  }
}