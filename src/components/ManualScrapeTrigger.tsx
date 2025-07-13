import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Play, RefreshCw } from "lucide-react";

export const ManualScrapeTrigger = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const triggerManualScrape = async () => {
    setIsRunning(true);
    try {
      console.log('🚀 Triggering manual scrape...');
      console.log('⚠️ Note: Function may take up to 2-3 minutes to complete');
      
      const { data, error } = await supabase.functions.invoke('automated-scraping', {
        body: { 
          manual_trigger: true,
          test_mode: true,
          max_listings_per_source: 5 // Limit for testing
        }
      });
      
      if (error) {
        console.error('❌ Scrape error (full object):', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        toast.error(`Scrape failed: ${error.message || 'Unknown error'}`);
        setLastResult({ 
          error: error.message || 'Unknown error', 
          errorDetails: error,
          timestamp: new Date().toISOString() 
        });
      } else {
        console.log('✅ Scrape result:', data);
        toast.success(`Scrape completed! Found ${data?.total_listings || 0} listings`);
        setLastResult({ 
          success: true, 
          data, 
          timestamp: new Date().toISOString() 
        });
        
        // Refresh the page data after successful scrape
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error) {
      console.error('❌ Scrape exception:', error);
      toast.error("Failed to trigger scrape");
      setLastResult({ error: error.message, timestamp: new Date().toISOString() });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Manual Scrape Test
        </CardTitle>
        <CardDescription>
          Manually trigger the automated scraping function to test functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={triggerManualScrape} 
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Scrape...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Trigger Manual Scrape
            </>
          )}
        </Button>
        
        {lastResult && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Last Result:</p>
            <pre className="text-xs overflow-auto max-h-32">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          <p>This will trigger a test scrape of your active search configurations.</p>
          <p>Check the Edge Function logs for detailed output.</p>
        </div>
      </CardContent>
    </Card>
  );
};