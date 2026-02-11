import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, AlertCircle, CheckCircle2, Clock, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActivityLog {
  id: string;
  search_config_id: string;
  stage: string;
  message: string;
  data?: any;
  error_details?: string;
  created_at: string;
}

const ScrapingPipelineDebugger = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('scrape_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: "Error fetching logs",
        description: "Could not load scraping activity logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerTestScrape = async () => {
    setIsTesting(true);
    try {
      const response = await supabase.functions.invoke('automated-scraping', {
        body: { trigger: 'manual_test', timestamp: new Date().toISOString() }
      });

      if (response.error) throw response.error;

      toast({
        title: "Test scrape triggered",
        description: "Manual scraping test initiated. Check logs for progress.",
      });

      // Refresh logs after a short delay
      setTimeout(fetchLogs, 2000);
    } catch (error) {
      console.error('Error triggering test scrape:', error);
      toast({
        title: "Test scrape failed",
        description: "Could not trigger manual scraping test",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'config_queued':
        return <Clock className="h-4 w-4" />;
      case 'variants_generated':
        return <Database className="h-4 w-4" />;
      case 'source_scraped':
      case 'listings_parsed':
        return <RefreshCw className="h-4 w-4" />;
      case 'db_insert_attempted':
        return <Database className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStageVariant = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'config_queued':
      case 'variants_generated':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Scraping Pipeline Debugger
          </CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={triggerTestScrape}
              disabled={isTesting}
              size="sm"
              variant="outline"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Test Scrape
            </Button>
            <Button
              onClick={fetchLogs}
              disabled={isLoading}
              size="sm"
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activity logs found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Trigger a test scrape to see pipeline activity
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStageIcon(log.stage)}
                    <Badge variant={getStageVariant(log.stage)}>
                      {log.stage.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {log.search_config_id.slice(0, 8)}...
                  </span>
                </div>
                
                <p className="text-sm mb-2">{log.message}</p>
                
                {log.data && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Data
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </details>
                )}
                
                {log.error_details && (
                  <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                    <p className="text-xs text-destructive font-medium">Error:</p>
                    <p className="text-xs text-destructive">{log.error_details}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ScrapingPipelineDebugger;