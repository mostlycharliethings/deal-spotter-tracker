
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchConfig, Listing } from '@/types/database';
import { ExternalLink, Calendar, DollarSign, MapPin } from 'lucide-react';

interface DailyDigestEmailPreviewProps {
  searches: SearchConfig[];
  listings: Listing[];
  goodDeals: Listing[];
}

const DailyDigestEmailPreview = ({ searches, listings, goodDeals }: DailyDigestEmailPreviewProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border rounded-lg overflow-hidden" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Email Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">Feed Me Haystacks</h1>
        <p className="text-blue-100">Your Daily Digest - {formatDate(new Date().toISOString())}</p>
      </div>

      {/* Summary Stats */}
      <div className="p-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Daily Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{searches.length}</div>
            <div className="text-sm text-gray-600">Active Searches</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{goodDeals.length}</div>
            <div className="text-sm text-gray-600">Good Deals</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-700">{listings.length}</div>
            <div className="text-sm text-gray-600">New Listings</div>
          </div>
        </div>
      </div>

      {/* Good Deals Section */}
      {goodDeals.length > 0 && (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            🎉 Great Deals Found!
          </h2>
          <div className="space-y-4">
            {goodDeals.slice(0, 3).map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900 line-clamp-2">{listing.title}</h3>
                  <Badge className="bg-green-100 text-green-800 ml-2">
                    {formatPrice(listing.price)}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                  <span className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {listing.source_name}
                  </span>
                  {listing.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(listing.date_scraped)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-green-600 font-medium">
                    ${(listing.price_threshold - listing.price).toLocaleString()} under your threshold!
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Listings */}
      {listings.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Recent Listings</h2>
          <div className="space-y-3">
            {listings.slice(0, 5).map((listing) => (
              <div key={listing.id} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm line-clamp-1">{listing.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <span>{listing.source_name}</span>
                    <span>•</span>
                    <span>{formatDate(listing.date_scraped)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatPrice(listing.price)}</div>
                  {listing.is_within_threshold && (
                    <div className="text-xs text-green-600">Good Deal!</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Searches */}
      {searches.length > 0 && (
        <div className="p-6 border-t">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Your Active Searches</h2>
          <div className="space-y-3">
            {searches.map((search) => (
              <div key={search.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">
                    {search.year_start === search.year_end 
                      ? search.year_start 
                      : `${search.year_start}-${search.year_end}`} {search.manufacturer} {search.item_name}
                  </h4>
                  {search.qualifier && (
                    <p className="text-sm text-gray-600">{search.qualifier}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium text-gray-900">≤ {formatPrice(search.price_threshold)}</div>
                  <div className="text-gray-600">threshold</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 bg-gray-100 text-center">
        <p className="text-sm text-gray-600 mb-2">
          This digest was generated automatically by Feed Me Haystacks
        </p>
        <p className="text-xs text-gray-500">
          Visit your dashboard to manage your searches and view all listings
        </p>
      </div>
    </div>
  );
};

export default DailyDigestEmailPreview;
