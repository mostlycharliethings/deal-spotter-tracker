
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailPreview = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);

  const sendTestDigest = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending test digest to:', testEmail);
      
      const { data, error } = await supabase.functions.invoke('send-daily-digest', {
        body: { 
          email: testEmail,
          date: new Date().toISOString().split('T')[0]
        }
      });

      if (error) {
        console.error('Error sending test digest:', error);
        throw error;
      }

      console.log('Test digest response:', data);
      
      toast({
        title: "Test Email Sent",
        description: `Daily digest preview sent to ${testEmail}`
      });
    } catch (error: any) {
      console.error('Failed to send test digest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePreview = () => {
    // Mock data for preview
    const mockData = {
      user_email: testEmail || 'user@example.com',
      date: new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      totalListings: 5,
      goodDeals: 2,
      searchConfigs: [
        {
          id: '1',
          manufacturer: 'Apple',
          item_name: 'MacBook Pro',
          price_threshold: 1500,
          listings: [
            {
              id: '1',
              title: '2019 MacBook Pro 16" - Excellent Condition',
              price: 1299,
              source_name: 'Facebook Marketplace',
              source_url: 'https://facebook.com/marketplace/item/123',
              location: 'San Francisco, CA',
              listing_age: '2 hours ago',
              is_within_threshold: true,
              is_within_slider_range: true
            },
            {
              id: '2',
              title: 'MacBook Pro 13" M1 - Like New',
              price: 1100,
              source_name: 'Craigslist',
              source_url: 'https://craigslist.org/item/456',
              location: 'Berkeley, CA',
              listing_age: '4 hours ago',
              is_within_threshold: true,
              is_within_slider_range: true
            }
          ]
        },
        {
          id: '2',
          manufacturer: 'Gibson',
          item_name: 'Les Paul',
          price_threshold: 2000,
          listings: [
            {
              id: '3',
              title: 'Gibson Les Paul Standard 2020 - Mint',
              price: 2200,
              source_name: 'Reverb',
              source_url: 'https://reverb.com/item/789',
              location: 'Los Angeles, CA',
              listing_age: '1 hour ago',
              is_within_threshold: false,
              is_within_slider_range: true
            }
          ]
        }
      ]
    };
    setPreviewData(mockData);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Daily Digest Email Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generatePreview} variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Generate Preview
              </Button>
              <Button onClick={sendTestDigest} disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Test Email'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {previewData && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is what your daily digest email will look like
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-gray-50 space-y-4">
              {/* Email Header */}
              <div className="border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  🎯 Feed Me Haystacks Daily Digest
                </h1>
                <p className="text-gray-600">{previewData.date}</p>
              </div>

              {/* Summary Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📊 Today's Summary</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>• {previewData.totalListings} new listings found</p>
                  <p>• {previewData.goodDeals} listings under your price threshold</p>
                  <p>• {previewData.searchConfigs.length} active searches</p>
                </div>
              </div>

              {/* Search Results */}
              {previewData.searchConfigs.map((config: any) => (
                <div key={config.id} className="space-y-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {config.manufacturer} {config.item_name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Price threshold: ${config.price_threshold.toLocaleString()} • 
                      {config.listings.length} new listing{config.listings.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {config.listings.map((listing: any) => (
                    <div key={listing.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 flex-1 pr-4">
                          {listing.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${listing.is_within_threshold ? 'text-green-600' : 'text-gray-900'}`}>
                            ${listing.price.toLocaleString()}
                          </span>
                          {listing.is_within_threshold && <span>🎉</span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {listing.source_name} • {listing.location} • {listing.listing_age}
                      </p>
                      <Badge variant="outline" className="text-blue-600">
                        View Listing →
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}

              {/* Footer */}
              <div className="border-t pt-4 text-center text-sm text-gray-500">
                <p>
                  <span className="text-blue-600">Manage your searches</span> • 
                  <span className="text-blue-600 ml-1">Unsubscribe</span>
                </p>
                <p className="mt-2 text-xs">
                  You're receiving this because you have active price monitoring searches.
                  This digest was sent to {previewData.user_email}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailPreview;
