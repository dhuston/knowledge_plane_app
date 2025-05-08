/**
 * HierarchyService.ts
 * Service for fetching and managing organizational hierarchy data
 */
import { ApiClient } from '../api/client';
import { OrganizationalUnitEntity, OrganizationalUnitTypeEnum } from '../types/hierarchy';

// API response types
interface HierarchyUnitResponse {
  unit: OrganizationalUnitEntity;
  children?: OrganizationalUnitEntity[];
}

interface HierarchyPathResponse {
  path: string[];
  units: Record<string, OrganizationalUnitEntity>;
}

/**
 * Service for organizational hierarchy data
 */
export class HierarchyService {
  private apiClient: ApiClient;
  
  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }
  
  /**
   * Fetch unit details and children by ID
   */
  async fetchHierarchyUnit(unitId: string): Promise<HierarchyUnitResponse> {
    try {
      // Try organizations endpoint first
      try {
        const response = await this.apiClient.get<HierarchyUnitResponse>(`/organizations/unit/${unitId}`);
        return response.data;
      } catch (orgError) {
        console.log(`[HierarchyService] Organizations endpoint failed for unit ${unitId}, falling back to map endpoint`);
        // Fall back to map endpoint
        const response = await this.apiClient.get<HierarchyUnitResponse>(`/map/unit/${unitId}`);
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching hierarchy unit ${unitId}:`, error);
      throw new Error('Failed to fetch organizational unit. Please try again later.');
    }
  }
  
  /**
   * Fetch current user's position in hierarchy
   */
  async fetchUserPath(): Promise<HierarchyPathResponse> {
    try {
      // Try organizations endpoint first
      try {
        const response = await this.apiClient.get<HierarchyPathResponse>('/organizations/structure');
        // Transform to expected response format if needed
        if (response.data && response.data.structure) {
          return {
            path: response.data.structure.path || [],
            units: response.data.units || {}
          };
        }
        return response.data;
      } catch (orgError) {
        console.log('[HierarchyService] Organizations structure endpoint failed, falling back to map endpoint');
        // Fall back to map endpoint
        const response = await this.apiClient.get<HierarchyPathResponse>('/map/path');
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching user hierarchy path:', error);
      throw new Error('Failed to fetch your position in the organization. Please try again later.');
    }
  }
  
  /**
   * Search for organizational units
   */
  async searchUnits(query: string, type?: OrganizationalUnitTypeEnum): Promise<OrganizationalUnitEntity[]> {
    try {
      // Try organizations search first
      try {
        let url = `/organizations/search?query=${encodeURIComponent(query)}`;
        
        if (type) {
          url += `&type=${type}`;
        }
        
        const response = await this.apiClient.get<{ results: OrganizationalUnitEntity[] }>(url);
        return response.data.results;
      } catch (orgError) {
        console.log("[HierarchyService] Organizations search endpoint failed, falling back to map endpoint");
        // Fall back to map endpoint
        let url = `/map/search?query=${encodeURIComponent(query)}`;
        
        if (type) {
          url += `&type=${type}`;
        }
        
        const response = await this.apiClient.get<{ results: OrganizationalUnitEntity[] }>(url);
        return response.data.results;
      }
    } catch (error) {
      console.error('Error searching organizational units:', error);
      throw new Error('Failed to search organizational units. Please try again later.');
    }
  }
  
  /**
   * Get children of a specific unit
   * Note: This specific endpoint might not exist in the map API
   * so we'll need to extract children from the unit response
   */
  async getUnitChildren(unitId: string): Promise<OrganizationalUnitEntity[]> {
    try {
      // First try to get the unit with its children
      const unitResponse = await this.fetchHierarchyUnit(unitId);
      if (unitResponse.children) {
        return unitResponse.children;
      }
      
      // If no children property, fall back to a more generic approach
      console.warn(`No children property in unit response for ${unitId}, using fallback`);
      
      // Try organizations endpoint first
      try {
        const response = await this.apiClient.get<{ children: OrganizationalUnitEntity[] }>(`/organizations/unit/${unitId}?children_only=true`);
        return response.data.children || [];
      } catch (orgError) {
        console.log(`[HierarchyService] Organizations unit children endpoint failed for ${unitId}, falling back to map endpoint`);
        // Fall back to map endpoint
        const response = await this.apiClient.get<{ children: OrganizationalUnitEntity[] }>(`/map/unit/${unitId}?children_only=true`);
        return response.data.children || [];
      }
    } catch (error) {
      console.error(`Error fetching children of unit ${unitId}:`, error);
      throw new Error('Failed to fetch organizational unit children. Please try again later.');
    }
  }
  
  /**
   * Get recently viewed units
   * Note: This might not have a direct map API equivalent
   * but we're keeping the method for API compatibility
   */
  async getRecentlyViewedUnits(): Promise<OrganizationalUnitEntity[]> {
    try {
      // Try organizations recent first
      try {
        const response = await this.apiClient.get<{ units: OrganizationalUnitEntity[] }>('/organizations/recent');
        return response.data.units;
      } catch (orgError) {
        // Fall back to map recent endpoint
        try {
          const response = await this.apiClient.get<{ units: OrganizationalUnitEntity[] }>('/map/recent');
          return response.data.units;
        } catch (mapError) {
          console.warn('Recent units endpoint not available, returning empty array');
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching recently viewed units:', error);
      return []; // Return empty array instead of throwing to be less disruptive
    }
  }

  /**
   * Track unit view
   * Note: This might not have a direct map API equivalent
   * but we're keeping the method for API compatibility
   */
  async trackUnitView(unitId: string): Promise<void> {
    try {
      // Try organizations endpoint first
      try {
        await this.apiClient.post(`/organizations/unit/${unitId}/view`, {});
        return;
      } catch (orgError) {
        // Fall back to map endpoint
        try {
          await this.apiClient.post(`/map/unit/${unitId}/view`, {});
        } catch (mapError) {
          // Silently ignore - this is not critical functionality
        }
      }
    } catch (error) {
      console.error(`Error tracking view for unit ${unitId}:`, error);
      // Silently fail - this is not critical functionality
    }
  }
}