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
      // Updated to use the correct map endpoint
      const response = await this.apiClient.get<HierarchyUnitResponse>(`/map/unit/${unitId}`);
      return response.data;
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
      // Updated to use the correct map endpoint
      const response = await this.apiClient.get<HierarchyPathResponse>('/map/path');
      return response.data;
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
      // Updated to use the correct map endpoint
      let url = `/map/search?query=${encodeURIComponent(query)}`;
      
      if (type) {
        url += `&type=${type}`;
      }
      
      const response = await this.apiClient.get<{ results: OrganizationalUnitEntity[] }>(url);
      return response.data.results;
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
      const response = await this.apiClient.get<{ children: OrganizationalUnitEntity[] }>(`/map/unit/${unitId}?children_only=true`);
      return response.data.children || [];
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
      // This endpoint might not exist in the map API
      // If needed, we could implement a local cache or use an alternative endpoint
      try {
        const response = await this.apiClient.get<{ units: OrganizationalUnitEntity[] }>('/map/recent');
        return response.data.units;
      } catch (e) {
        console.warn('Recent units endpoint not available, returning empty array');
        return [];
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
      // This endpoint might not exist in the map API
      // Attempt to call it, but don't throw if it fails
      try {
        await this.apiClient.post(`/map/unit/${unitId}/view`, {});
      } catch (e) {
        // Silently ignore - this is not critical functionality
      }
    } catch (error) {
      console.error(`Error tracking view for unit ${unitId}:`, error);
      // Silently fail - this is not critical functionality
    }
  }
}