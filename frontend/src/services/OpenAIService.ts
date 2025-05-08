import { ActivityData } from './PatternDetectionService';
import { Insight, InsightCategory, InsightSourceType } from '../types/insight';
import env, { IS_DEVELOPMENT } from '../config/env';
import { apiClient } from '../api/client';

/**
 * Service for interacting with OpenAI APIs to generate advanced insights
 * Supports both standard OpenAI and Azure OpenAI endpoints
 */
class OpenAIService {
  private apiKey: string;
  private baseUrl: string;
  private model: string = 'gpt-4o'; // Default model, can be overridden by env
  private isAzure: boolean = false;
  private apiVersion: string = '2023-05-15'; // Azure API version

  constructor() {
    // Get API key from environment variables using our config
    this.apiKey = env.OPENAI_API_KEY || '';
    this.isAzure = env.OPENAI_IS_AZURE === 'true';
    
    // Set up base URL - use Azure endpoint if available, otherwise default OpenAI
    if (this.isAzure && env.AZURE_OPENAI_ENDPOINT) {
      this.baseUrl = env.AZURE_OPENAI_ENDPOINT;
      this.model = env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4'; // Use deployment name for Azure
    } else {
      this.baseUrl = 'https://api.openai.com/v1';
      this.model = env.OPENAI_MODEL || 'gpt-4o';
    }
  }

  /**
   * Check if the API key is available
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Generic method to call OpenAI API through our backend proxy
   * All OpenAI API calls now go through the backend to avoid CORS and security issues
   */
  private async callAPI(endpoint: string, data: any): Promise<any> {
    // Check if we're in development mode - use the development endpoints if so
    const devMode = IS_DEVELOPMENT || localStorage.getItem('dev_mode') === 'true';
    
    try {
      if (devMode) {
        console.log('[DEV MODE] Using unauthenticated dev endpoints for AI proxy');
      
        // Get the current tenant from local storage
        const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
        console.log(`[DEV MODE] Using tenant ${currentTenant} for AI proxy`);
        
        // Call the appropriate dev endpoint based on the requested operation
        try {
          if (endpoint === 'chat/completions') {
            // For chat completion requests, extract the prompt from the messages
            const userMessage = data.messages.find((m: any) => m.role === 'user');
            const prompt = userMessage ? userMessage.content : 'No prompt provided';
            
            // Use the dev endpoint for custom prompts
            const result = await apiClient.devCustomPrompt(currentTenant, prompt);
            return {
              choices: [{
                message: {
                  content: result.response || "No response content available."
                }
              }]
            };
          } else if (endpoint === 'summarize-insights') {
            // For insight summary, use the dev endpoint
            const result = await apiClient.devSummarizeInsights(
              currentTenant,
              data.insights || [],
              data.user_preferences || {}
            );
            return {
              choices: [{
                message: {
                  content: result.summary || "No summary content available."
                }
              }]
            };
          } else if (endpoint === 'generate-insights') {
            // For insights generation, use the dev endpoint
            const result = await apiClient.devGenerateInsights(
              currentTenant,
              data.activities || [],
              data.context_data || {}
            );
            return {
              insights: result.insights || []
            };
          } else if (endpoint === 'enhance-insight') {
            // For insight enhancement, use the dev endpoint
            const result = await apiClient.devEnhanceInsight(
              currentTenant,
              data.insight || {}
            );
            return result || {}; // Return the enhanced insight directly
          }
        } catch (devError) {
          console.error("[DEV MODE] Error using dev endpoints:", devError);
          console.log("[DEV MODE] Falling back to standard approach");
          // Continue to standard approach as fallback
        }
      }
      
      // If not in dev mode or dev endpoint failed, use standard approach
      
      // Check if API key is configured
      if (!this.isAvailable()) {
        console.log('[Debug] AI Service not available (API key missing), returning service notice');
        return this.getServiceNotice(endpoint, data);
      }

      // Map OpenAI endpoints to our backend proxy endpoints with full paths
      const proxyEndpoints: Record<string, string> = {
        'chat/completions': '/api/v1/ai-proxy/custom-prompt',
        'generate-insights': '/api/v1/ai-proxy/generate-insights',
        'enhance-insight': '/api/v1/ai-proxy/enhance-insight',
        'summarize-insights': '/api/v1/ai-proxy/summarize-insights'
      };
      
      // Get the appropriate proxy endpoint or use custom-prompt as fallback
      const proxyEndpoint = proxyEndpoints[endpoint] || '/api/v1/ai-proxy/custom-prompt';
      
      // Check if the endpoint actually exists before trying to call it
      // AI proxy endpoints typically only accept POST requests, so specify POST method for check
      const endpointExists = await apiClient.isEndpointAvailable(proxyEndpoint, 'POST');
      
      if (!endpointExists) {
        console.log(`[Debug] AI proxy endpoint ${proxyEndpoint} is not available, returning service notice`);
        return this.getServiceNotice(endpoint, data);
      }
      
      // Prepare the request data based on the endpoint
      let requestData: Record<string, any> = {};
      if (endpoint === 'chat/completions') {
        // For chat completion requests, extract the prompt from the messages
        const userMessage = data.messages.find((m: any) => m.role === 'user');
        requestData = { prompt: userMessage ? userMessage.content : 'No prompt provided' };
      } else if (endpoint === 'summarize-insights') {
        // For insight summary, use the original data
        requestData = data;
      } else {
        // For other endpoints, just pass through the data
        requestData = data;
      }
      
      // Try calling the actual API endpoint
      console.log(`[Debug] AI proxy endpoint ${proxyEndpoint} exists, making API call`);
      try {
        // Use apiClient instead of fetch for consistent error handling
        const result = await apiClient.post(proxyEndpoint, requestData);
        
        // Format the response to match expected structure
        if (endpoint === 'chat/completions') {
          return {
            choices: [{
              message: {
                content: result.response || "No response content available."
              }
            }]
          };
        } else if (endpoint === 'summarize-insights') {
          return {
            choices: [{
              message: {
                content: result.summary || "No summary content available."
              }
            }]
          };
        } else if (endpoint === 'generate-insights') {
          return {
            insights: result.insights || []
          };
        } else if (endpoint === 'enhance-insight') {
          return result || {}; // Return the enhanced insight directly
        }
        
        return result;
      } catch (apiError) {
        // Try dev endpoints as a last resort in development mode
        if (IS_DEVELOPMENT) {
          console.log('[DEV MODE] Standard endpoint failed, trying dev endpoint as last resort');
          return this.callDevEndpoints(endpoint, data);
        }
        
        console.error(`[Debug] Error calling AI proxy via apiClient:`, apiError);
        return this.getServiceNotice(endpoint, data);
      }
    } catch (error) {
      console.error('[Debug] Error in callAPI:', error);
      return this.getServiceNotice(endpoint, data);
    }
  }
  
  /**
   * Helper method to call dev endpoints as a last fallback
   */
  private async callDevEndpoints(endpoint: string, data: any): Promise<any> {
    try {
      // Get the current tenant from local storage
      const currentTenant = localStorage.getItem('knowledge_plane_tenant') || '3fa85f64-5717-4562-b3fc-2c963f66afa6';
      
      if (endpoint === 'chat/completions') {
        // For chat completion requests, extract the prompt from the messages
        const userMessage = data.messages.find((m: any) => m.role === 'user');
        const prompt = userMessage ? userMessage.content : 'No prompt provided';
        
        // Use the dev endpoint for custom prompts
        const result = await apiClient.devCustomPrompt(currentTenant, prompt);
        return {
          choices: [{
            message: {
              content: result.response || "No response content available."
            }
          }]
        };
      } else if (endpoint === 'summarize-insights') {
        // For insight summary, use the dev endpoint
        const result = await apiClient.devSummarizeInsights(
          currentTenant,
          data.insights || [],
          data.user_preferences || {}
        );
        return {
          choices: [{
            message: {
              content: result.summary || "No summary content available."
            }
          }]
        };
      } else if (endpoint === 'generate-insights') {
        // For insights generation, use the dev endpoint
        const result = await apiClient.devGenerateInsights(
          currentTenant,
          data.activities || [],
          data.context_data || {}
        );
        return {
          insights: result.insights || []
        };
      } else if (endpoint === 'enhance-insight') {
        // For insight enhancement, use the dev endpoint
        const result = await apiClient.devEnhanceInsight(
          currentTenant,
          data.insight || {}
        );
        return result || {}; // Return the enhanced insight directly
      }
      
      // Fallback to service notice if we don't have a matching endpoint
      return this.getServiceNotice(endpoint, data);
    } catch (devError) {
      console.error("[DEV MODE] Error in callDevEndpoints:", devError);
      return this.getServiceNotice(endpoint, data);
    }
  }
  
  /**
   * Generate service notices for each endpoint type when API calls can't be made
   */
  private getServiceNotice(endpoint: string, data: any): any {
    
    // Return appropriate values based on endpoint type with proper error messaging
    if (endpoint === 'chat/completions') {
      return {
        choices: [{
          message: {
            content: `The AI service is currently not available. To enable this feature, please configure the BMS Azure OpenAI integration.`
          }
        }]
      };
    } else if (endpoint === 'summarize-insights') {
      return {
        choices: [{
          message: {
            content: "# Daily Summary\n\n## AI Service Status\nAI-powered insights are currently unavailable. Please configure the BMS Azure OpenAI integration to enable this feature.\n\n## Next Steps\n- Contact your system administrator to complete the Azure OpenAI integration\n- Ensure API keys are properly configured in the backend environment\n- Refer to the documentation at /docs/BMS_AZURE_OPENAI_INTEGRATION.md for setup instructions"
          }
        }]
      };
    } else if (endpoint === 'generate-insights') {
      // Return minimal insights with proper error message
      const insight = {
        id: `ai-service-notice-${Date.now()}`,
        title: `AI Service Configuration Required`,
        description: `The AI insights service requires proper configuration of BMS Azure OpenAI integration. Please refer to the documentation at /docs/BMS_AZURE_OPENAI_INTEGRATION.md for setup instructions.`,
        category: "system",
        relevanceScore: 1.0,
        createdAt: new Date().toISOString(),
        source: {
          type: "system",
          id: "system-notice"
        },
        relatedEntities: [],
        suggestedActions: [{
          label: "View Documentation",
          type: "view"
        }]
      };
      
      return { insights: [insight] };
    } else if (endpoint === 'enhance-insight') {
      // Return the original insight without modifications
      const originalInsight = data.insight || {};
      return originalInsight;
    }
    
    // Default fallback
    return { status: "unavailable", message: "AI service not available" };
  }

  /**
   * Generate advanced insights based on user activity data
   */
  public async generateInsights(
    activities: ActivityData[], 
    userContext?: Record<string, any>
  ): Promise<Insight[]> {
    try {
      // Use callAPI method to handle the API call or fallback to proper error message
      console.log("[Debug] Calling AI proxy endpoint for insights generation");
      // First check if we even have activities to process
      if (!activities || activities.length === 0) {
        console.log("[Debug] No activities to analyze, returning service status message");
        return [{
          id: `ai-notice-${Date.now()}`,
          title: 'No Data Available',
          description: 'There are no activities available to analyze.',
          category: 'system' as InsightCategory,
          createdAt: new Date().toISOString(),
          relevanceScore: 1.0,
          source: {
            type: 'system' as InsightSourceType,
            id: 'system-notice'
          },
          relatedEntities: [],
          suggestedActions: []
        }];
      }
      
      // Call the AI proxy with available activities
      const response = await this.callAPI('generate-insights', {
        activities: activities.slice(0, 50), // Limit to avoid token limits
        context_data: userContext || {}
      });
      
      // Get the insights from the response
      const insights = response.insights || [];
      console.log(`[Debug] Received ${insights.length} insights from AI proxy`);
      
      // Add unique IDs if not present
      return insights.map((insight: Insight, index: number) => ({
        ...insight,
        id: insight.id || `ai-insight-${Date.now()}-${index}`,
        createdAt: insight.createdAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error generating insights:', error);
      
      // Return a single system message about the service being unavailable
      return [{
        id: `ai-service-error-${Date.now()}`,
        title: 'AI Service Status',
        description: 'The AI insights service is currently unavailable. Please check your integration configuration.',
        category: 'system' as InsightCategory,
        createdAt: new Date().toISOString(),
        relevanceScore: 1.0,
        source: {
          type: 'system' as InsightSourceType,
          id: 'system-error'
        },
        relatedEntities: [],
        suggestedActions: []
      }];
    }
  }

  /**
   * Analyze an existing insight to improve its relevance and context
   */
  public async enhanceInsight(insight: Insight): Promise<Insight> {
    if (!this.isAvailable()) {
      return insight;
    }

    try {
      // Call our backend proxy to enhance the insight
      const enhancedInsight = await this.callAPI('enhance-insight', { insight });
      
      // Make sure we keep the original ID and source
      return {
        ...insight,
        ...enhancedInsight,
        id: insight.id,
        source: insight.source
      };
      
    } catch (error) {
      // Return original insight in case of error
      return insight;
    }
  }

  /**
   * Call OpenAI with a custom prompt (used by specialized components)
   */
  public async callCustomPrompt(prompt: string): Promise<string> {
    if (!this.isAvailable()) {
      return "OpenAI API is not available.";
    }

    try {
      // Use callAPI method for consistency and error handling
      const result = await this.callAPI('chat/completions', {
        messages: [{ role: 'user', content: prompt }]
      });
      
      return result.choices?.[0]?.message?.content || "No response generated.";
    } catch (error) {
      // Silent failure with fallback message
      return "Unable to generate a response at this time.";
    }
  }

  /**
   * Generate personalized summaries of insights
   */
  public async generateInsightSummary(
    insights: Insight[], 
    userPreferences?: Record<string, any>
  ): Promise<string> {
    if (!this.isAvailable()) {
      return "No insights available to summarize.";
    }
    
    if (insights.length === 0) {
      return "No insights available to summarize.";
    }

    try {
      const response = await this.callAPI('summarize-insights', {
        insights,
        user_preferences: userPreferences || {}
      });
      
      return response.choices[0].message.content;
      
    } catch (error) {
      return "Unable to generate insights summary at this time.";
    }
  }
}

export default new OpenAIService();