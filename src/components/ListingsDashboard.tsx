
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, ExternalLink, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Listing } from '@/types/database';

interface ListingsDashboardProps {
  listings: Listing[];
  onIgnoreListing: (listingId: string, reason?: string) => void;
  onUnignoreListing: (listingId: string) => void;
}

const ListingsDashboard: React.FC<ListingsDashboardProps> = ({ 
  listings, 
  onIgnoreListing, 
  onUnignoreListing 
}) => {
  const { toast } = useToast();
  const [filteredListings, setFilteredListings] = useState<Listing[]>(listings);
  const [filters, setFilters] = useState({
    source: 'all',
    priceCategory: 'all',
    search: '',
    showIgnored: false
  });

  console.log('ListingsDashboard render:', {
    listingsReceived: listings.length,
    filteredCount: filteredListings.length
  });

  useEffect(() => {
    let filtered = [...listings];

    // Filter by source
    if (filters.source !== 'all') {
      filtered = filtered.filter(listing => listing.source_name === filters.source);
    }

    // Filter by price category
    if (filters.priceCategory !== 'all') {
      switch (filters.priceCategory) {
        case 'threshold':
          filtered = filtered.filter(listing => listing.is_within_threshold);
          break;
        case 'slider':
          filtered = filtered.filter(listing => listing.is_within_slider_range);
          break;
        case 'above':
          filtered = filtered.filter(listing => listing.is_above_slider);
          break;
      }
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(listing => 
        listing.title.toLowerCase().includes(searchLower) ||
        (listing.description && listing.description.toLowerCase().includes(searchLower)) ||
        (listing.location && listing.location.toLowerCase().includes(searchLower))
      );
    }

    // Show/hide ignored listings
    if (!filters.showIgnored) {
      filtered = filtered.filter(listing => !listing.is_ignored);
    }

    setFilteredListings(filtered);
  }, [listings, filters]);

  const handleIgnore = async (listing: Listing) => {
    const reason = prompt('Reason for ignoring (optional):');
    onIgnoreListing(listing.id, reason || undefined);
    
    toast({
      title: "Listing Ignored",
      description: `"${listing.title}" has been ignored and will not appear in future alerts.`
    });
  };

  const getPriceBadge = (listing: Listing) => {
    if (listing.is_within_threshold) {
      return <Badge variant="default" className="bg-green-500">Under Threshold</Badge>;
    } else if (listing.is_within_slider_range) {
      return <Badge variant="secondary">Within Range</Badge>;
    } else {
      return <Badge variant="outline">Above Range</Badge>;
    }
  };

  const getSourceBadge = (sourceName: string) => {
    const tier1Sources = ['Facebook Marketplace', 'Craigslist', 'eBay', 'OfferUp', 'Kijiji', 'Gumtree'];
    const isTier1 = tier1Sources.includes(sourceName);
    
    return (
      <Badge variant={isTier1 ? "default" : "secondary"}>
        {sourceName} {isTier1 ? '(T1)' : '(T2)'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search listings..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            
            <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {[...new Set(listings.map(l => l.source_name))].map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.priceCategory} onValueChange={(value) => setFilters({...filters, priceCategory: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="threshold">Under Threshold</SelectItem>
                <SelectItem value="slider">Within Range</SelectItem>
                <SelectItem value="above">Above Range</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={filters.showIgnored ? "default" : "outline"}
                size="sm"
                onClick={() => setFilters({...filters, showIgnored: !filters.showIgnored})}
              >
                {filters.showIgnored ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Show Ignored
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Listings ({filteredListings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No listings match your current filters.</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id} className={listing.is_ignored ? 'opacity-50' : ''}>
                      <TableCell className="font-medium max-w-md">
                        <div className="truncate">{listing.title}</div>
                        {listing.description && (
                          <div className="text-sm text-muted-foreground truncate mt-1">
                            {listing.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-bold">${listing.price.toLocaleString()}</div>
                        {listing.is_price_changed && (
                          <div className="text-xs text-orange-500">Price Changed</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getSourceBadge(listing.source_name)}
                      </TableCell>
                      <TableCell>{listing.location || 'N/A'}</TableCell>
                      <TableCell>
                        {getPriceBadge(listing)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {listing.listing_age || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(listing.source_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          
                          {listing.is_ignored ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onUnignoreListing(listing.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleIgnore(listing)}
                            >
                              <EyeOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingsDashboard;
