
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { ScrapingSource } from '@/types/database';

interface ScrapingStatusProps {
  sources: ScrapingSource[];
  lastRunTimes: Record<string, string>;
  onManualScrape: (sourceName: string) => void;
}

const ScrapingStatus: React.FC<ScrapingStatusProps> = ({ 
  sources, 
  lastRunTimes, 
  onManualScrape 
}) => {
  const getNextRunTime = (source: ScrapingSource, lastRun: string) => {
    if (!lastRun) return 'Not run yet';
    
    const lastRunDate = new Date(lastRun);
    const hoursInterval = 24 / source.scrapeFrequency;
    const nextRun = new Date(lastRunDate.getTime() + (hoursInterval * 60 * 60 * 1000));
    
    return nextRun.toLocaleTimeString();
  };

  const getStatusIcon = (source: ScrapingSource, lastRun: string) => {
    if (!lastRun) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    
    const lastRunDate = new Date(lastRun);
    const hoursInterval = 24 / source.scrapeFrequency;
    const nextRunTime = lastRunDate.getTime() + (hoursInterval * 60 * 60 * 1000);
    
    if (Date.now() > nextRunTime) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Scraping Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tier 1 Sources (5x/day)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.filter(s => s.tier === 1).map((source) => (
                <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(source, lastRunTimes[source.name] || '')}
                    <div>
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last: {lastRunTimes[source.name] ? 
                          new Date(lastRunTimes[source.name]).toLocaleTimeString() : 
                          'Never'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Next: {getNextRunTime(source, lastRunTimes[source.name] || '')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={source.isActive ? "default" : "secondary"}>
                      {source.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onManualScrape(source.name)}
                      disabled={!source.isActive}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Tier 2 Sources (2x/day)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.filter(s => s.tier === 2).map((source) => (
                <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(source, lastRunTimes[source.name] || '')}
                    <div>
                      <div className="font-medium">{source.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last: {lastRunTimes[source.name] ? 
                          new Date(lastRunTimes[source.name]).toLocaleTimeString() : 
                          'Never'
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Next: {getNextRunTime(source, lastRunTimes[source.name] || '')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={source.isActive ? "default" : "secondary"}>
                      {source.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onManualScrape(source.name)}
                      disabled={!source.isActive}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScrapingStatus;
