
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

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

      <div className="mt-8 text-center text-muted-foreground">
        <p>Price tracking tool configuration will be implemented here.</p>
        <p>Set up your searches, price thresholds, and monitoring preferences.</p>
      </div>

      <div className="flex justify-center mt-8">
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
  );
};

export default FeedMeHaystacks;
