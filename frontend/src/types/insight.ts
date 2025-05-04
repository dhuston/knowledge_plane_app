/**
 * Types for the AI-Powered Insights Dashboard
 */

// Categories of insights that can be detected and displayed
export enum InsightCategory {
  COLLABORATION = 'collaboration',
  PRODUCTIVITY = 'productivity',
  KNOWLEDGE = 'knowledge',
  PROJECT = 'project',
  COMMUNICATION = 'communication'
}

// Source types that insights can be derived from
export enum InsightSourceType {
  ACTIVITY = 'activity',
  PROJECT = 'project',
  TEAM = 'team',
  USER = 'user',
  DOCUMENT = 'document',
  SYSTEM = 'system'
}

// Time periods for insights
export type InsightTimePeriod = 'daily' | 'weekly' | 'monthly';

// Sort options for insights list
export type InsightSortOption = 'relevance' | 'newest' | 'category';

// Related entity in an insight
export interface RelatedEntity {
  id: string;
  type: string; // user, team, project, document, etc.
  name: string;
  connection: string; // description of relationship, e.g., "frequent collaborator"
}

// Insight suggestion/action
export interface InsightAction {
  label: string;
  type: 'schedule' | 'message' | 'task' | 'view' | 'other';
  icon?: string;
  data?: Record<string, any>;
}

// Main insight interface
export interface Insight {
  id: string;
  title: string;
  description: string;
  category: InsightCategory | string; // Using string to support future categories
  createdAt: string; // ISO date string
  relevanceScore: number; // 0 to 1, indicating relevance to the user
  source: {
    type: InsightSourceType | string;
    id: string;
  };
  relatedEntities?: RelatedEntity[];
  suggestedActions?: InsightAction[];
  saved?: boolean;
  dismissed?: boolean;
  feedback?: {
    isRelevant?: boolean;
    comment?: string;
    timestamp?: string;
  };
}

// Filter options for insights display
export interface InsightFilters {
  category?: InsightCategory | 'all';
  timePeriod: InsightTimePeriod;
  sortBy: InsightSortOption;
  searchTerm?: string;
  minRelevance?: number; // Min relevance score (0-1)
}

// Insight feedback provided by users
export interface InsightFeedback {
  insightId: string;
  userId: string;
  isRelevant: boolean;
  comment?: string;
  timestamp: string;
}