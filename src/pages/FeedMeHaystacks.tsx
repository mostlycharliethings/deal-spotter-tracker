
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, List, Settings, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import SearchConfigForm from '@/components/SearchConfigForm';
import ListingsDashboard from '@/components/ListingsDashboard';
import ScrapingStatus from '@/components/ScrapingStatus';
import { SearchConfig } from '@/types/database';
import { MockScraper, scrapingSources } from '@/services/mockScraper';
import { useToast } from '@/hooks/use-toast';
import { useSearchConfigs, useCreateSearchConfig } from '@/hooks/useSearchConfigs';
import { useListings, useCreateListings, useIgnoreListing, useUnignoreListing } from '@/hooks/useListings';

const FeedMeHaystacks = () => {
  const { toast } = useToast();
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Use Supabase hooks
  const { data: searches = [], isLoading: searchesLoading } = useSearchConfigs();
  const { data: listings = [], isLoading: listingsLoading } = useListings();
  const createSearchConfig = useCreateSearchConfig();
  const createListings = useCreateListings();
  const ignoreListing = useIgnoreListing();
  const unignoreListing = useUnignoreListing();

  console.log('FeedMeHaystacks render:', {
    searchesCount: searches.length,
    listingsCount: listings.length
  });

  const handleSearchCreated = async (searchConfigData: Omit<SearchConfig, 'id' | 'created_at'>) => {
    console.log('Creating search configuration:', searchConfigData);
    
    // Create the search config in Supabase
    const searchConfig = await createSearchConfig.mutateAsync(searchConfigData);
    
    // Immediately run a scrape for the new search
    setIsLoading(true);
    try {
      const newListings = await MockScraper.scrapeSearch(searchConfig);
      console.log('Generated mock listings:', newListings);
      
      if (newListings.length > 0) {
        await createListings.mutateAsync(newListings);
        toast({
          title: "Search Active",
          description: `Found ${newListings.length} initial listings. Monitoring will continue automatically.`
        });
      } else {
        toast({
          title: "Search Active",
          description: "No listings found initially. Monitoring will continue automatically."
        });
      }
    } catch (error) {
      console.error('Error running initial scrape:', error);
      toast({
        title: "Error",
        description: "Failed to run initial scrape. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleIgnoreListing = async (listingId: string, reason?: string) => {
    try {
      await ignoreListing.mutateAsync({ listingId, reason });
      const listing = listings.find(l => l.id === listingId);
      toast({
        title: "Listing Ignored",
        description: `"${listing?.title}" has been ignored and will not appear in future alerts.`
      });
    } catch (error) {
      console.error('Error ignoring listing:', error);
      toast({
        title: "Error",
        description: "Failed to ignore listing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUnignoreListing = async (listingId: string) => {
    try {
      await unignoreListing.mutateAsync(listingId);
    } catch (error) {
      console.error('Error unignoring listing:', error);
      toast({
        title: "Error",
        description: "Failed to unignore listing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleManualScrape = async (sourceName: string) => {
    if (searches.length === 0) {
      toast({
        title: "No Active Searches",
        description: "Create a search configuration first.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLastRunTimes(prev => ({ ...prev, [sourceName]: new Date().toISOString() }));

    try {
      // Run scrape for all active searches
      const allNewListings = [];
      
      for (const search of searches) {
        if (search.is_active) {
          const newListings = await MockScraper.scrapeSearch(search);
          // Filter to only include listings from the requested source
          const sourceListings = newListings.filter(listing => listing.source_name === sourceName);
          allNewListings.push(...sourceListings);
        }
      }

      if (allNewListings.length > 0) {
        await createListings.mutateAsync(allNewListings);
      }

      toast({
        title: "Scrape Complete",
        description: `Found ${allNewListings.length} new listings from ${sourceName}.`
      });
    } catch (error) {
      console.error('Error running manual scrape:', error);
      toast({
        title: "Scrape Failed",
        description: `Failed to scrape ${sourceName}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getListingStats = () => {
    const total = listings.filter(l => !l.is_ignored).length;
    const underThreshold = listings.filter(l => !l.is_ignored && l.is_within_threshold).length;
    const inRange = listings.filter(l => !l.is_ignored && l.is_within_slider_range).length;
    const ignored = listings.filter(l => l.is_ignored).length;
    
    return { total, underThreshold, inRange, ignored };
  };

  const stats = getListingStats();

  // Show loading state only for a brief moment
  if (searchesLoading && listingsLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">Feed Me Haystacks</h1>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/tools">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tools
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Feed Me Haystacks</h1>
          <p className="text-muted-foreground">
            Automated price monitoring across multiple marketplaces
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Searches</p>
                  <p className="text-2xl font-bold">{searches.filter(s => s.is_active).length}</p>
                </div>
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Under Threshold</p>
                  <p className="text-2xl font-bold text-green-600">{stats.underThreshold}</p>
                </div>
                <Badge variant="default" className="bg-green-500">Good Deals</Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ignored</p>
                  <p className="text-2xl font-bold text-muted-foreground">{stats.ignored}</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              New Search
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listings ({listings.length})
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Scraping Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-6">
            <div className="flex justify-center">
              <SearchConfigForm onSearchCreated={handleSearchCreated} />
            </div>
          </TabsContent>

          <TabsContent value="listings" className="mt-6">
            {listings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <List className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first search configuration to start finding deals!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Once you create a search, listings will appear here automatically.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <ListingsDashboard
                listings={listings}
                onIgnoreListing={handleIgnoreListing}
                onUnignoreListing={handleUnignoreListing}
              />
            )}
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <ScrapingStatus
              sources={scrapingSources}
              lastRunTimes={lastRunTimes}
              onManualScrape={handleManualScrape}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeedMeHaystacks;
