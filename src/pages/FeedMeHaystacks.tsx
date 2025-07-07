
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import SearchConfigForm from '@/components/SearchConfigForm';
import ListingsDashboard from '@/components/ListingsDashboard';
import ScrapingStatus from '@/components/ScrapingStatus';
import { useCreateSearchConfig, useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useListings } from '@/hooks/useListings';
import { SearchConfig, ScrapingSource } from '@/types/database';

const FeedMeHaystacks = () => {
  const navigate = useNavigate();
  const createSearchConfig = useCreateSearchConfig();
  const { data: searchConfigs = [] } = useSearchConfigs();
  const { data: listings = [] } = useListings();

  // Mock scraping sources data
  const scrapingSources: ScrapingSource[] = [
    { name: 'Craigslist', tier: 1, baseUrl: 'craigslist.org', scrapeFrequency: 5, isActive: true },
    { name: 'Facebook Marketplace', tier: 1, baseUrl: 'facebook.com/marketplace', scrapeFrequency: 5, isActive: true },
    { name: 'OfferUp', tier: 2, baseUrl: 'offerup.com', scrapeFrequency: 2, isActive: true },
    { name: 'Mercari', tier: 2, baseUrl: 'mercari.com', scrapeFrequency: 2, isActive: false },
  ];

  // Mock last run times
  const lastRunTimes = {
    'Craigslist': new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    'Facebook Marketplace': new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    'OfferUp': new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    'Mercari': '',
  };

  const handleSearchCreated = async (searchConfig: Omit<SearchConfig, 'id' | 'created_at'>) => {
    try {
      await createSearchConfig.mutateAsync(searchConfig);
    } catch (error) {
      console.error('Failed to create search config:', error);
    }
  };

  const handleManualScrape = (sourceName: string) => {
    console.log(`Manual scrape triggered for ${sourceName}`);
    // TODO: Implement manual scraping functionality
  };

  // Calculate statistics
  const activeSearches = searchConfigs.filter(config => config.is_active).length;
  const totalListings = listings.length;
  const underThreshold = listings.filter(listing => listing.is_within_threshold).length;
  const ignored = listings.filter(listing => listing.is_ignored).length;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Feed Me Haystacks</h1>
          <p className="text-muted-foreground">
            Configure your price tracking searches and monitor listings
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">{activeSearches}</div>
            <div className="text-sm text-muted-foreground">Active Searches</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-primary">{totalListings}</div>
            <div className="text-sm text-muted-foreground">Total Listings</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{underThreshold}</div>
            <div className="text-sm text-muted-foreground">Under Threshold</div>
          </div>
          <div className="bg-card p-4 rounded-lg border">
            <div className="text-2xl font-bold text-muted-foreground">{ignored}</div>
            <div className="text-sm text-muted-foreground">Ignored</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Configuration Form */}
          <div>
            <SearchConfigForm onSearchCreated={handleSearchCreated} />
          </div>

          {/* Listings Dashboard */}
          <div>
            <ListingsDashboard />
          </div>
        </div>

        {/* Scraping Status */}
        <ScrapingStatus 
          sources={scrapingSources}
          lastRunTimes={lastRunTimes}
          onManualScrape={handleManualScrape}
        />

        {/* Daily Digest Preview Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate('/tools/feedmehaystacks/preview')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Send a Daily Digest Preview Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedMeHaystacks;
