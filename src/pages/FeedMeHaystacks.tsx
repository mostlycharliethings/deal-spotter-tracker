import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import SearchConfigForm from '@/components/SearchConfigForm';
import ListingsDashboard from '@/components/ListingsDashboard';
import ScrapingStatus from '@/components/ScrapingStatus';
import SearchMatrixPreview from '@/components/SearchMatrixPreview';

const FeedMeHaystacks = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Feed Me Haystacks</h1>
        <p className="text-muted-foreground">
          Configure your price tracking searches and monitor listings
        </p>
      </div>

      <ScrapingStatus />

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/2">
          <SearchConfigForm />
        </div>
        <div className="lg:w-1/2 space-y-6">
          <SearchMatrixPreview />
          <div className="flex gap-4">
            <Button
              onClick={() => navigate('/email-preview')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Preview Daily Digest Email
            </Button>
          </div>
        </div>
      </div>

      <ListingsDashboard />
    </div>
  );
};

export default FeedMeHaystacks;
