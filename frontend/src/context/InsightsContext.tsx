import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  Insight, 
  InsightTimePeriod, 
  InsightFeedback 
} from '../types/insight';
import { 
  fetchInsights as fetchInsightsApi,
  saveInsight as saveInsightApi, 
  dismissInsight as dismissInsightApi,
  submitInsightFeedback 
} from '../services/InsightService';

interface InsightsContextType {
  insights: Insight[];
  loading: boolean;
  error: string | null;
  fetchInsights: (timePeriod: InsightTimePeriod) => void;
  dismissInsight: (insightId: string) => void;
  saveInsight: (insightId: string) => void;
  provideFeedback: (insightId: string, isRelevant: boolean, comment?: string) => void;
  lastUpdated: Date | null;
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined);

export const useInsights = (): InsightsContextType => {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error('useInsights must be used within an InsightsProvider');
  }
  return context;
};

interface InsightsProviderProps {
  children: ReactNode;
}

export const InsightsProvider: React.FC<InsightsProviderProps> = ({ children }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const fetchInsights = useCallback(async (timePeriod: InsightTimePeriod) => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedInsights = await fetchInsightsApi(timePeriod);
      setInsights(fetchedInsights);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred fetching insights');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const dismissInsight = useCallback(async (insightId: string) => {
    try {
      await dismissInsightApi(insightId);
      setInsights(prevInsights => prevInsights.filter(insight => insight.id !== insightId));
    } catch (err) {
      console.error('Error dismissing insight:', err);
    }
  }, []);
  
  const saveInsight = useCallback(async (insightId: string) => {
    try {
      await saveInsightApi(insightId);
      setInsights(prevInsights => 
        prevInsights.map(insight => 
          insight.id === insightId ? { ...insight, saved: true } : insight
        )
      );
    } catch (err) {
      console.error('Error saving insight:', err);
    }
  }, []);
  
  const provideFeedback = useCallback(async (insightId: string, isRelevant: boolean, comment?: string) => {
    try {
      await submitInsightFeedback({
        insightId,
        userId: 'current-user', // In a real app, get from auth context
        isRelevant,
        comment,
        timestamp: new Date().toISOString()
      });
      
      // Update local state to reflect feedback
      setInsights(prevInsights => 
        prevInsights.map(insight => 
          insight.id === insightId 
            ? { 
                ...insight, 
                feedback: { 
                  isRelevant,
                  comment,
                  timestamp: new Date().toISOString() 
                } 
              }
            : insight
        )
      );
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  }, []);
  
  const value = {
    insights,
    loading,
    error,
    fetchInsights,
    dismissInsight,
    saveInsight,
    provideFeedback,
    lastUpdated
  };
  
  return (
    <InsightsContext.Provider value={value}>
      {children}
    </InsightsContext.Provider>
  );
};

export default InsightsProvider;