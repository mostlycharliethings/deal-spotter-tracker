
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import SearchConfigForm from '@/components/SearchConfigForm';
import { useCreateSearchConfig } from '@/hooks/useSearchConfigs';
import { SearchConfig } from '@/types/database';

const FeedMeHaystacks = () => {
  const navigate = useNavigate();
  const createSearchConfig = useCreateSearchConfig();

  const handleSearchCreated = async (searchConfig: Omit<SearchConfig, 'id' | 'created_at'>) => {
    try {
      await createSearchConfig.mutateAsync(searchConfig);
    } catch (error) {
      console.error('Failed to create search config:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Feed Me Haystacks</h1>
          <p className="text-muted-foreground">
            Configure your price tracking searches and monitor listings
          </p>
        </div>

        <div className="flex justify-center">
          <SearchConfigForm onSearchCreated={handleSearchCreated} />
        </div>

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
