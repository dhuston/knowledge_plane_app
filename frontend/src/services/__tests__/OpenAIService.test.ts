import OpenAIService from '../OpenAIService';
import { ActivityData } from '../PatternDetectionService';
import { Insight, InsightCategory, InsightSourceType } from '../../types/insight';

// Mock fetch
global.fetch = jest.fn();

// Sample test data
const mockActivities: ActivityData[] = [
  {
    id: 'activity-1',
    type: 'collaboration',
    timestamp: new Date().toISOString(),
    user: {
      id: 'user-1',
      name: 'Test User'
    },
    details: {
      collaboratorId: 'user-2',
      collaboratorName: 'Collaborator',
      projectId: 'project-1',
      projectName: 'Test Project',
      durationType: 'meeting'
    }
  },
  {
    id: 'activity-2',
    type: 'meeting-attendance',
    timestamp: new Date().toISOString(),
    user: {
      id: 'user-1',
      name: 'Test User'
    },
    details: {
      meetingId: 'meeting-1',
      meetingName: 'Project Sync',
      attendees: [
        { id: 'user-2', name: 'Attendee 1' },
        { id: 'user-3', name: 'Attendee 2' }
      ],
      duration: 30
    }
  }
];

const mockInsight: Insight = {
  id: 'insight-1',
  title: 'Test Insight',
  description: 'This is a test insight',
  category: InsightCategory.COLLABORATION,
  createdAt: new Date().toISOString(),
  relevanceScore: 0.8,
  source: {
    type: InsightSourceType.ACTIVITY,
    id: 'source-1'
  }
};

// Mock response data
const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify([
          {
            title: 'Enhanced Collaboration with Collaborator',
            description: 'You have been working closely with Collaborator on Test Project. This pattern suggests a strong working relationship that could benefit from more structured collaboration.',
            category: 'collaboration',
            relevanceScore: 0.9,
            source: {
              type: 'activity',
              id: 'collaboration-pattern'
            },
            relatedEntities: [
              {
                id: 'user-2',
                type: 'user',
                name: 'Collaborator',
                connection: 'frequent collaborator'
              }
            ],
            suggestedActions: [
              {
                label: 'Schedule weekly sync',
                type: 'schedule'
              }
            ]
          }
        ])
      }
    }
  ]
};

describe('OpenAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockReset();
  });

  // Helper to set up fetch mock
  const setupFetchMock = (responseData: any) => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => responseData
    });
  };

  describe('isAvailable', () => {
    it('should return false when API key is not available', () => {
      // Force API key to be undefined for this test
      Object.defineProperty(OpenAIService, 'apiKey', {
        value: '',
        writable: true
      });
      
      const result = OpenAIService.isAvailable();
      expect(result).toBe(false);
    });
  });

  describe('generateInsights', () => {
    it('should return insights when the API call is successful', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      setupFetchMock(mockOpenAIResponse);
      
      const insights = await OpenAIService.generateInsights(mockActivities);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].title).toBe('Enhanced Collaboration with Collaborator');
    });
    
    it('should return empty array when the API call fails', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      const insights = await OpenAIService.generateInsights(mockActivities);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(insights).toEqual([]);
    });
    
    it('should not make API call when API key is not available', async () => {
      // Mock API key as not available
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(false)
      });
      
      await OpenAIService.generateInsights(mockActivities);
      
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('enhanceInsight', () => {
    it('should return enhanced insight when API call is successful', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      setupFetchMock({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Enhanced Test Insight',
                description: 'This is an enhanced test insight with more context',
                relevanceScore: 0.9
              })
            }
          }
        ]
      });
      
      const enhanced = await OpenAIService.enhanceInsight(mockInsight);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(enhanced.title).toBe('Enhanced Test Insight');
      expect(enhanced.relevanceScore).toBe(0.9);
      expect(enhanced.id).toBe(mockInsight.id); // ID should be preserved
    });
    
    it('should return original insight when API call fails', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      const enhanced = await OpenAIService.enhanceInsight(mockInsight);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(enhanced).toEqual(mockInsight);
    });
  });

  describe('generateInsightSummary', () => {
    it('should return summary when API call is successful', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      setupFetchMock({
        choices: [
          {
            message: {
              content: '## Daily Insights\n\nYou have strong collaboration patterns with team members.'
            }
          }
        ]
      });
      
      const summary = await OpenAIService.generateInsightSummary([mockInsight]);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(summary).toContain('Daily Insights');
    });
    
    it('should return default message when API call fails', async () => {
      // Mock the API key to be available for this test
      Object.defineProperty(OpenAIService, 'isAvailable', {
        value: jest.fn().mockReturnValue(true)
      });
      
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      const summary = await OpenAIService.generateInsightSummary([mockInsight]);
      
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(summary).toContain('Unable to generate insights summary');
    });
  });
});