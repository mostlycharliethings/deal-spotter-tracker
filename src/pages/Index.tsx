
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, List, Settings, Activity } from 'lucide-react';
import SearchConfigForm from '@/components/SearchConfigForm';
import ListingsDashboard from '@/components/ListingsDashboard';
import ScrapingStatus from '@/components/ScrapingStatus';
import { SearchConfig, Listing } from '@/types/database';
import { MockScraper, scrapingSources } from '@/services/mockScraper';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [searches, setSearches] = useState<SearchConfig[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [lastRunTimes, setLastRunTimes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on component mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('price-tracker-searches');
    const savedListings = localStorage.getItem('price-tracker-listings');
    
    if (savedSearches) {
      setSearches(JSON.parse(savedSearches));
    }
    
    if (savedListings) {
      setListings(JSON.parse(savedListings));
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('price-tracker-searches', JSON.stringify(searches));
  }, [searches]);

  useEffect(() => {
    localStorage.setItem('price-tracker-listings', JSON.stringify(listings));
  }, [listings]);

  const handleSearchCreated = async (searchConfig: SearchConfig) => {
    setSearches(prev => [...prev, searchConfig]);
    
    // Immediately run a scrape for the new search
    setIsLoading(true);
    try {
      const newListings = await MockScraper.scrapeSearch(searchConfig);
      setListings(prev => [...prev, ...newListings]);
      
      toast({
        title: "Search Active",
        description: `Found ${newListings.length} initial listings. Monitoring will continue automatically.`
      });
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

  const handleIgnoreListing = (listingId: string, reason?: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === listingId 
        ? { 
            ...listing, 
            is_ignored: true, 
            ignored_at: new Date().toISOString(),
            ignore_reason: reason 
          }
        : listing
    ));
  };

  const handleUnignoreListing = (listingId: string) => {
    setListings(prev => prev.map(listing => 
      listing.id === listingId 
        ? { 
            ...listing, 
            is_ignored: false, 
            ignored_at: undefined,
            ignore_reason: undefined 
          }
        : listing
    ));
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
      const allNewListings: Listing[] = [];
      
      for (const search of searches) {
        if (search.is_active) {
          const newListings = await MockScraper.scrapeSearch(search);
          // Filter to only include listings from the requested source
          const sourceListings = newListings.filter(listing => listing.source_name === sourceName);
          allNewListings.push(...sourceListings);
        }
      }

      // Add new listings, avoiding duplicates
      setListings(prev => {
        const existingIds = new Set(prev.map(l => l.source_listing_id));
        const uniqueNewListings = allNewListings.filter(l => !existingIds.has(l.source_listing_id));
        return [...prev, ...uniqueNewListings];
      });

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Price Tracker Dashboard</h1>
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

        <Tabs defaultValue="listings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              New Search
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Scraping Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="mt-6">
            <ListingsDashboard
              listings={listings}
              onIgnoreListing={handleIgnoreListing}
              onUnignoreListing={handleUnignoreListing}
            />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <div className="flex justify-center">
              <SearchConfigForm onSearchCreated={handleSearchCreated} />
            </div>
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

export default Index;
