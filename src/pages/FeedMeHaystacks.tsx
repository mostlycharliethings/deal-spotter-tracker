
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

      <div className="flex justify-center mt-8">
        <Button
          onClick={() => navigate('/email-preview')}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Preview Daily Digest Email
        </Button>
      </div>

      <div className="mt-8 text-center text-muted-foreground">
        <p>Daily digest email functionality is ready for testing!</p>
        <p>Click the button above to preview and send test emails.</p>
      </div>
    </div>
  );
};

export default FeedMeHaystacks;
