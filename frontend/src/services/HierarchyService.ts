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
      const response = await this.apiClient.get<HierarchyUnitResponse>(`/api/v1/hierarchy/unit/${unitId}`);
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
      const response = await this.apiClient.get<HierarchyPathResponse>('/api/v1/hierarchy/path');
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
      let url = `/api/v1/hierarchy/search?query=${encodeURIComponent(query)}`;
      
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
   */
  async getUnitChildren(unitId: string): Promise<OrganizationalUnitEntity[]> {
    try {
      const response = await this.apiClient.get<{ children: OrganizationalUnitEntity[] }>(`/api/v1/hierarchy/unit/${unitId}/children`);
      return response.data.children;
    } catch (error) {
      console.error(`Error fetching children of unit ${unitId}:`, error);
      throw new Error('Failed to fetch organizational unit children. Please try again later.');
    }
  }
  
  /**
   * Get recently viewed units
   */
  async getRecentlyViewedUnits(): Promise<OrganizationalUnitEntity[]> {
    try {
      const response = await this.apiClient.get<{ units: OrganizationalUnitEntity[] }>('/api/v1/hierarchy/recent');
      return response.data.units;
    } catch (error) {
      console.error('Error fetching recently viewed units:', error);
      throw new Error('Failed to fetch recently viewed units. Please try again later.');
    }
  }

  /**
   * Track unit view
   */
  async trackUnitView(unitId: string): Promise<void> {
    try {
      await this.apiClient.post(`/api/v1/hierarchy/unit/${unitId}/view`, {});
    } catch (error) {
      console.error(`Error tracking view for unit ${unitId}:`, error);
      // Silently fail - this is not critical functionality
    }
  }
}