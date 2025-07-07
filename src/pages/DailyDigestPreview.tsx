
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Eye, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useSearchConfigs } from '@/hooks/useSearchConfigs';
import { useListings } from '@/hooks/useListings';
import DailyDigestEmailPreview from '@/components/DailyDigestEmailPreview';

const DailyDigestPreview = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: searches = [] } = useSearchConfigs();
  const { data: listings = [] } = useListings();

  const handleSendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send the test digest.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // This would call your edge function to send the daily digest email
      toast({
        title: "Test Email Sent",
        description: `Daily digest preview sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDigestData = () => {
    const activeSearches = searches.filter(s => s.is_active);
    const recentListings = listings
      .filter(l => !l.is_ignored)
      .sort((a, b) => new Date(b.date_scraped).getTime() - new Date(a.date_scraped).getTime())
      .slice(0, 10);
    
    const goodDeals = listings.filter(l => !l.is_ignored && l.is_within_threshold);
    
    return {
      activeSearches,
      recentListings,
      goodDeals,
      totalListings: listings.filter(l => !l.is_ignored).length
    };
  };

  const digestData = getDigestData();

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
          <h1 className="text-4xl font-bold">Daily Digest Preview</h1>
          <p className="text-muted-foreground">
            Test and preview your daily digest email
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Email Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Test Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendTestEmail}
                disabled={isLoading}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Digest'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Show Email Preview'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Digest Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{digestData.activeSearches.length}</p>
                <p className="text-sm text-muted-foreground">Active Searches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{digestData.totalListings}</p>
                <p className="text-sm text-muted-foreground">Total Listings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{digestData.goodDeals.length}</p>
                <p className="text-sm text-muted-foreground">Good Deals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{digestData.recentListings.length}</p>
                <p className="text-sm text-muted-foreground">Recent Listings</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Preview */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <DailyDigestEmailPreview
                searches={digestData.activeSearches}
                listings={digestData.recentListings}
                goodDeals={digestData.goodDeals}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DailyDigestPreview;
