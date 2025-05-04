import { ActivityData } from './PatternDetectionService';
import { Insight } from '../types/insight';
import env from '../config/env';

/**
 * Service for interacting with OpenAI APIs to generate advanced insights
 */
class OpenAIService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  private model: string = 'gpt-4o';

  constructor() {
    // Get API key from environment variables using our config
    this.apiKey = env.OPENAI_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Advanced insights will be limited.');
    } else {
      console.log('OpenAI API key found. Advanced insights will be available.');
    }
  }

  /**
   * Check if the API key is available
   */
  public isAvailable(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Generic method to call OpenAI API
   */
  private async callAPI(endpoint: string, data: any): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }

  /**
   * Generate advanced insights based on user activity data
   */
  public async generateInsights(
    activities: ActivityData[], 
    userContext?: Record<string, any>
  ): Promise<Insight[]> {
    try {
      // Prepare context about the user and their activities
      const userContextStr = userContext 
        ? `Additional user context: ${JSON.stringify(userContext)}` 
        : '';
      
      // Prepare the prompt with activities data
      const prompt = `
        As an AI-powered analysis system for an organizational intelligence platform, 
        generate insights based on the following user activity data. 
        Focus on collaboration patterns, productivity trends, knowledge gaps, and project risks.
        
        ${userContextStr}
        
        The activities data is as follows:
        ${JSON.stringify(activities.slice(0, 50))}
        
        For each insight, provide:
        1. A concise, actionable title
        2. A detailed description with specific observations
        3. The category (COLLABORATION, PRODUCTIVITY, KNOWLEDGE, PROJECT, or COMMUNICATION)
        4. A relevance score between 0-1 (higher = more relevant)
        5. Any related entities (people, teams, projects) with their relationship
        6. Suggested actions the user could take
        
        Return the insights in a structured JSON format that matches the following TypeScript interface:
        
        interface Insight {
          id?: string; // Will be assigned automatically
          title: string;
          description: string;
          category: 'collaboration' | 'productivity' | 'knowledge' | 'project' | 'communication';
          relevanceScore: number; // Between 0-1
          source: {
            type: string;
            id: string;
          };
          relatedEntities?: Array<{
            id: string;
            type: string;
            name: string;
            connection: string;
          }>;
          suggestedActions?: Array<{
            label: string;
            type: 'schedule' | 'message' | 'task' | 'view' | 'other';
          }>;
        }
        
        Generate 3-5 high-quality insights. Focus on non-obvious patterns that would be valuable to the user.
      `;

      // Call OpenAI API to generate insights
      const data = {
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are an AI analyst specialized in organizational intelligence." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      };

      const response = await this.callAPI('chat/completions', data);
      
      // Parse the generated insights
      const content = response.choices[0].message.content;
      const parsedContent = JSON.parse(content);
      
      // Ensure the response is an array of insights
      const insights = Array.isArray(parsedContent) 
        ? parsedContent 
        : parsedContent.insights || [];
      
      // Add unique IDs if not present
      return insights.map((insight: Insight, index: number) => ({
        ...insight,
        id: insight.id || `openai-insight-${Date.now()}-${index}`,
        createdAt: insight.createdAt || new Date().toISOString()
      }));
      
    } catch (error) {
      console.error('Error generating insights with OpenAI:', error);
      // Return empty array in case of error
      return [];
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
      const prompt = `
        Enhance and improve the following insight from an organizational intelligence platform.
        Make the title more specific and actionable, enhance the description with more context,
        and suggest more specific actions the user could take.
        
        Current insight:
        ${JSON.stringify(insight)}
        
        Return the enhanced insight in a structured JSON format that matches the original structure.
        Do not change the id, category, or source fields. Only improve the title, description, 
        relevanceScore (if justified), relatedEntities (add more context), and suggestedActions (make more specific).
      `;

      const data = {
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are an AI analyst specialized in organizational intelligence." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      };

      const response = await this.callAPI('chat/completions', data);
      
      // Parse the enhanced insight
      const content = response.choices[0].message.content;
      const enhancedInsight = JSON.parse(content);
      
      return {
        ...insight,
        ...enhancedInsight,
        id: insight.id, // Ensure we keep the original ID
        source: insight.source, // Ensure we keep the original source
      };
      
    } catch (error) {
      console.error('Error enhancing insight with OpenAI:', error);
      // Return original insight in case of error
      return insight;
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
      const preferencesStr = userPreferences 
        ? `Consider user preferences: ${JSON.stringify(userPreferences)}.` 
        : '';

      const prompt = `
        Create a concise, personalized daily summary of the following insights.
        Highlight the most important patterns and actionable next steps.
        Focus on practical value and clarity.
        
        ${preferencesStr}
        
        Insights:
        ${JSON.stringify(insights)}
        
        Format the summary in markdown with:
        1. A brief introduction
        2. 2-3 key takeaways
        3. Suggested priorities for today
        
        Keep it under 200 words total.
      `;

      const data = {
        model: this.model,
        messages: [
          { 
            role: "system", 
            content: "You are an AI analyst specialized in organizational intelligence." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: 0.7
      };

      const response = await this.callAPI('chat/completions', data);
      return response.choices[0].message.content;
      
    } catch (error) {
      console.error('Error generating insight summary with OpenAI:', error);
      return "Unable to generate insights summary at this time.";
    }
  }
}

export default new OpenAIService();