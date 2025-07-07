
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import SearchConfigsManager from '@/components/SearchConfigsManager';
import ListingsDashboard from '@/components/ListingsDashboard';
import ScrapingStatus from '@/components/ScrapingStatus';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useListings, useCreateListings, useIgnoreListing, useUnignoreListing } from '@/hooks/useListings';
import { RealScraper, scrapingSources } from '@/services/realScraper';
import { useToast } from '@/hooks/use-toast';

const FeedMeHaystacks = () => {
  const { toast } = useToast();
  const [isScrapingInProgress, setIsScrapingInProgress] = useState(false);
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, string>>({});
  
  const { data: searchConfigs = [], isLoading: isLoadingConfigs } = useSearchConfigs();
  const { data: listings = [], isLoading: isLoadingListings } = useListings();
  const createListingsMutation = useCreateListings();
  const ignoreListingMutation = useIgnoreListing();
  const unignoreListingMutation = useUnignoreListing();

  const handleManualScrape = async (sourceName?: string) => {
    if (isScrapingInProgress) {
      toast({
        title: "Scraping in Progress",
        description: "Please wait for the current scraping operation to complete.",
        variant: "destructive"
      });
      return;
    }

    if (searchConfigs.length === 0) {
      toast({
        title: "No Search Configurations",
        description: "Please create at least one search configuration before scraping.",
        variant: "destructive"
      });
      return;
    }

    setIsScrapingInProgress(true);
    
    try {
      const allNewListings = [];
      
      for (const config of searchConfigs.filter(c => c.is_active)) {
        console.log(`Starting real scrape for search config: ${config.manufacturer} ${config.item_name}`);
        
        toast({
          title: "Scraping Started",
          description: `Searching for real listings: ${config.manufacturer} ${config.item_name}${sourceName ? ` on ${sourceName}` : ''}`
        });

        try {
          const newListings = await RealScraper.scrapeSearch(config);
          
          if (newListings.length > 0) {
            console.log(`Found ${newListings.length} real listings for ${config.manufacturer} ${config.item_name}`);
            allNewListings.push(...newListings);
          } else {
            console.log(`No real listings found for ${config.manufacturer} ${config.item_name}`);
          }
        } catch (error) {
          console.error(`Error scraping for config ${config.id}:`, error);
          toast({
            title: "Scraping Error",
            description: `Failed to scrape for ${config.manufacturer} ${config.item_name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: "destructive"
          });
        }
      }

      if (allNewListings.length > 0) {
        await createListingsMutation.mutateAsync(allNewListings);
        
        toast({
          title: "Real Listings Found",
          description: `Successfully found ${allNewListings.length} real listings from actual sources.`
        });
      } else {
        toast({
          title: "No Real Listings Found",
          description: "No listings were found from the scraped sources. This may be due to anti-bot measures or no matching items available.",
          variant: "destructive"
        });
      }

      // Update last run times
      const now = new Date().toISOString();
      if (sourceName) {
        setLastRunTimes(prev => ({ ...prev, [sourceName]: now }));
      } else {
        const updatedTimes = { ...lastRunTimes };
        scrapingSources.forEach(source => {
          updatedTimes[source.name] = now;
        });
        setLastRunTimes(updatedTimes);
      }

    } catch (error) {
      console.error('Manual scrape error:', error);
      toast({
        title: "Scraping Failed",
        description: `Failed to complete scraping operation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsScrapingInProgress(false);
    }
  };

  const handleIgnoreListing = async (listingId: string, reason?: string) => {
    try {
      await ignoreListingMutation.mutateAsync({ listingId, reason });
    } catch (error) {
      console.error('Error ignoring listing:', error);
      toast({
        title: "Error",
        description: "Failed to ignore listing",
        variant: "destructive"
      });
    }
  };

  const handleUnignoreListing = async (listingId: string) => {
    try {
      await unignoreListingMutation.mutateAsync(listingId);
    } catch (error) {
      console.error('Error unignoring listing:', error);
      toast({
        title: "Error",
        description: "Failed to unignore listing",
        variant: "destructive"
      });
    }
  };

  if (isLoadingConfigs || isLoadingListings) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Feed Me Haystacks</h1>
        <p className="text-muted-foreground">
          Real-time marketplace scraper - Find deals from actual listings across multiple platforms
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This system now uses only REAL data from actual marketplace sources. No mock or fake listings are generated.
          Due to anti-bot measures on many sites, results may be limited or require multiple attempts.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="searches" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="searches">New Search</TabsTrigger>
          <TabsTrigger value="configs">My Searches</TabsTrigger>
          <TabsTrigger value="listings">Listings ({listings.length})</TabsTrigger>
          <TabsTrigger value="status">Scraping Status</TabsTrigger>
        </TabsList>

        <TabsContent value="searches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Search Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchConfigsManager 
                onManualScrape={handleManualScrape}
                isScrapingInProgress={isScrapingInProgress}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-6">
          <SearchConfigsManager 
            onManualScrape={handleManualScrape}
            isScrapingInProgress={isScrapingInProgress}
          />
        </TabsContent>

        <TabsContent value="listings" className="space-y-6">
          <ListingsDashboard
            listings={listings}
            onIgnoreListing={handleIgnoreListing}
            onUnignoreListing={handleUnignoreListing}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <ScrapingStatus
            sources={scrapingSources}
            lastRunTimes={lastRunTimes}
            onManualScrape={handleManualScrape}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FeedMeHaystacks;
