
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import EmailPreview from '@/components/EmailPreview';

const EmailPreviewPage = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/tools/feedmehaystacks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Feed Me Haystacks
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Daily Digest Email Preview</h1>
          <p className="text-muted-foreground">
            Preview and test your daily digest emails
          </p>
        </div>

        <EmailPreview />
      </div>
    </div>
  );
};

export default EmailPreviewPage;
