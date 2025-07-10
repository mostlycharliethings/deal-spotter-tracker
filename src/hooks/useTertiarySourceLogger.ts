import { useState, useEffect } from 'react';
import { TertiarySourceLogger, TertiarySource } from '@/services/tertiarySourceLogger';
import { useToast } from '@/hooks/use-toast';

export const useTertiarySourceLogger = () => {
  const [tertiarySources, setTertiarySources] = useState<TertiarySource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total_sources: 0,
    total_usage: 0,
    top_domains: [] as Array<{ domain: string; times_used: number }>
  });
  const { toast } = useToast();

  const logTertiarySource = async (url: string, sourceType?: string): Promise<boolean> => {
    try {
      const sourceId = await TertiarySourceLogger.logTertiarySourceIfNew(url, sourceType);
      if (sourceId) {
        console.log(`Logged tertiary source: ${url}`);
        // Refresh the sources list
        await loadTertiarySources();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging tertiary source:', error);
      return false;
    }
  };

  const loadTertiarySources = async (minUsage: number = 1) => {
    setIsLoading(true);
    try {
      const sources = await TertiarySourceLogger.getTertiarySources(minUsage);
      setTertiarySources(sources);
    } catch (error) {
      console.error('Error loading tertiary sources:', error);
      toast({
        title: "Loading Failed",
        description: "Unable to load tertiary sources.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const sourceStats = await TertiarySourceLogger.getTertiarySourceStats();
      setStats(sourceStats);
    } catch (error) {
      console.error('Error loading tertiary source stats:', error);
    }
  };

  const checkIfTertiary = async (url: string): Promise<boolean> => {
    try {
      return await TertiarySourceLogger.isTertiarySource(url);
    } catch (error) {
      console.error('Error checking if tertiary source:', error);
      return false;
    }
  };

  const categorizeSource = (url: string): string => {
    return TertiarySourceLogger.categorizeSourceType(url);
  };

  const extractDomain = (url: string): string => {
    return TertiarySourceLogger.extractDomain(url);
  };

  // Load data on mount
  useEffect(() => {
    loadTertiarySources();
    loadStats();
  }, []);

  return {
    tertiarySources,
    stats,
    isLoading,
    logTertiarySource,
    loadTertiarySources,
    loadStats,
    checkIfTertiary,
    categorizeSource,
    extractDomain
  };
};