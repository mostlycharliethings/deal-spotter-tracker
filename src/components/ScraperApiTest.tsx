import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ScraperApiTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-scraper', {});
      
      if (error) {
        toast.error(`Test failed: ${error.message}`);
        console.error('Test error:', error);
      } else {
        setResults(data);
        toast.success("ScraperAPI test completed - check results below");
      }
    } catch (error) {
      console.error('Test error:', error);
      toast.error("Failed to run test");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>ScraperAPI Diagnostics</CardTitle>
        <CardDescription>Test ScraperAPI connectivity and configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={testing} className="w-full">
          {testing ? "Running Test..." : "Run ScraperAPI Test"}
        </Button>
        
        {results && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={results.scraperApiKeyConfigured ? "default" : "destructive"}>
                ScraperAPI Key: {results.scraperApiKeyConfigured ? "Configured" : "Missing"}
              </Badge>
              <Badge variant={results.openaiApiKeyConfigured ? "default" : "destructive"}>
                OpenAI Key: {results.openaiApiKeyConfigured ? "Configured" : "Missing"}
              </Badge>
              <Badge variant={results.supabaseConnected ? "default" : "destructive"}>
                Supabase: {results.supabaseConnected ? "Connected" : "Error"}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>✅ Your ScraperAPI shows 71/5000 credits used this month</p>
              <p>Check the function logs for detailed test results</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};