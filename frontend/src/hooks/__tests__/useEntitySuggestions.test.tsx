/**
 * Tests for useEntitySuggestions hook
 */
import { renderHook, act } from '@testing-library/react-hooks';
import axios from 'axios';
import { useEntitySuggestions } from '../useEntitySuggestions';
import EntitySuggestionService from '../../services/EntitySuggestionService';
import { MapNodeTypeEnum } from '../../types/map';

// Mock the dependencies
jest.mock('axios');
jest.mock('../../services/EntitySuggestionService');
jest.mock('../useApiClient', () => ({
  useApiClient: () => axios,
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    setAuthenticated: jest.fn(),
  }),
}));

describe('useEntitySuggestions', () => {
  const mockSuggestions = [
    {
      id: 'suggestion1',
      type: MapNodeTypeEnum.USER,
      label: 'Test User',
      reason: 'You might be interested in this user',
      confidence: 0.8,
      priority: 'high',
    },
    {
      id: 'suggestion2',
      type: MapNodeTypeEnum.PROJECT,
      label: 'Test Project',
      reason: 'Related to your recent activity',
      confidence: 0.6,
      priority: 'medium',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful API response
    (axios.get as jest.Mock).mockResolvedValue({ data: mockSuggestions });
    // Mock local service
    (EntitySuggestionService.getEntitySuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
  });

  it('should return empty suggestions when entityId is null', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useEntitySuggestions(null));
    
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should fetch suggestions when entityId is provided', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useEntitySuggestions('entity123'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(axios.get).toHaveBeenCalledWith('/entities/entity123/suggestions', expect.anything());
  });

  it('should handle API errors by falling back to local service', async () => {
    // Make the API call fail
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useEntitySuggestions('entity123'));
    
    await waitForNextUpdate();
    
    expect(result.current.suggestions).toEqual(mockSuggestions);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(EntitySuggestionService.getEntitySuggestions).toHaveBeenCalledWith('entity123', expect.anything());
  });

  it('should set error state when both API and local service fail', async () => {
    // Make both API and local service fail
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('API error'));
    (EntitySuggestionService.getEntitySuggestions as jest.Mock).mockRejectedValueOnce(new Error('Service error'));
    
    const { result, waitForNextUpdate } = renderHook(() => useEntitySuggestions('entity123'));
    
    await waitForNextUpdate();
    
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should submit feedback to API and refresh suggestions', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({});
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useEntitySuggestions('entity123', { refreshOnFeedback: true })
    );
    
    await waitForNextUpdate();
    
    // Reset the axios.get mock to verify it gets called again
    (axios.get as jest.Mock).mockClear();
    
    await act(async () => {
      await result.current.submitFeedback('suggestion1', true);
    });
    
    expect(axios.post).toHaveBeenCalledWith(
      '/entities/suggestions/suggestion1/feedback', 
      { helpful: true }
    );
    
    // Verify it triggered a refresh
    expect(axios.get).toHaveBeenCalledWith('/entities/entity123/suggestions', expect.anything());
  });

  it('should clear suggestions when called', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useEntitySuggestions('entity123'));
    
    await waitForNextUpdate();
    expect(result.current.suggestions).toEqual(mockSuggestions);
    
    act(() => {
      result.current.clearSuggestions();
    });
    
    expect(result.current.suggestions).toEqual([]);
  });

  it('should respect options when fetching suggestions', async () => {
    const options = {
      maxResults: 5,
      types: [MapNodeTypeEnum.USER, MapNodeTypeEnum.TEAM],
      excludeIds: ['exclude1', 'exclude2'],
      includeTags: true,
      includeReason: false
    };
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useEntitySuggestions('entity123', options)
    );
    
    await waitForNextUpdate();
    
    expect(axios.get).toHaveBeenCalledWith(
      '/entities/entity123/suggestions', 
      expect.objectContaining({
        params: expect.objectContaining({
          max_results: 5,
          types: `${MapNodeTypeEnum.USER},${MapNodeTypeEnum.TEAM}`,
          exclude_ids: 'exclude1,exclude2',
          include_tags: true,
          include_reason: false
        })
      })
    );
  });
});