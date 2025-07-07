import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SearchConfig } from '@/types/database';
import SearchYearSelector from './SearchYearSelector';
import SearchPriceConfig from './SearchPriceConfig';
import SearchMatrixPreview from './SearchMatrixPreview';
import { useUpdateSearchConfig } from '@/hooks/useSearchConfigs';
import { useSourceDiscovery } from '@/hooks/useSourceDiscovery';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SearchConfigFormProps {
  onSearchCreated: (search: Omit<SearchConfig, 'id' | 'created_at'>) => void;
  editingSearch?: SearchConfig | null;
  onCancelEdit?: () => void;
}

const SearchConfigForm: React.FC<SearchConfigFormProps> = ({ 
  onSearchCreated, 
  editingSearch,
  onCancelEdit 
}) => {
  const currentYear = new Date().getFullYear();
  const { toast } = useToast();
  const updateSearchConfig = useUpdateSearchConfig();
  const { discoverSources, discoveredSources, isDiscovering, clearDiscoveredSources } = useSourceDiscovery();
  
  const [formData, setFormData] = useState({
    item_name: '',
    manufacturer: '',
    year_start: 2000,
    year_end: currentYear,
    qualifier: '',
    sub_qualifier: '',
    price_threshold: 500,
    slider_percent: 50,
    email_address: '',
    include_years: false
  });

  const [isSendingConfirmation, setIsSendingConfirmation] = useState(false);

  useEffect(() => {
    if (editingSearch) {
      setFormData({
        item_name: editingSearch.item_name,
        manufacturer: editingSearch.manufacturer,
        year_start: editingSearch.year_start,
        year_end: editingSearch.year_end,
        qualifier: editingSearch.qualifier || '',
        sub_qualifier: editingSearch.sub_qualifier || '',
        price_threshold: editingSearch.price_threshold,
        slider_percent: editingSearch.slider_percent,
        email_address: editingSearch.email_address,
        include_years: editingSearch.year_start !== 1900 || editingSearch.year_end !== currentYear
      });
    }
  }, [editingSearch, currentYear]);

  const maxPrice = formData.price_threshold * (1 + formData.slider_percent / 100);
  const isEditing = !!editingSearch;

  const handleDiscoverSources = async () => {
    if (!formData.manufacturer || !formData.item_name) {
      toast({
        title: "Missing Information",
        description: "Please enter manufacturer and item name first",
        variant: "destructive"
      });
      return;
    }

    await discoverSources(
      formData.manufacturer,
      formData.item_name,
      formData.qualifier || undefined,
      formData.sub_qualifier || undefined
    );
  };

  const sendConfirmationEmail = async (searchConfig: Omit<SearchConfig, 'id' | 'created_at'>) => {
    try {
      setIsSendingConfirmation(true);
      
      const { error } = await supabase.functions.invoke('send-search-confirmation', {
        body: {
          email: searchConfig.email_address,
          manufacturer: searchConfig.manufacturer,
          itemName: searchConfig.item_name,
          yearStart: searchConfig.year_start,
          yearEnd: searchConfig.year_end,
          qualifier: searchConfig.qualifier,
          subQualifier: searchConfig.sub_qualifier,
          priceThreshold: searchConfig.price_threshold,
          maxPrice: searchConfig.max_price_allowed,
        },
      });

      if (error) {
        console.error('Error sending confirmation email:', error);
        // Don't throw error here - we don't want to fail the search creation if email fails
        toast({
          title: "Search Created",
          description: "Your search is active, but we couldn't send a confirmation email. Check back soon for results!",
          variant: "default"
        });
      } else {
        console.log('Confirmation email sent successfully');
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      // Don't throw - email is nice-to-have, not critical
    } finally {
      setIsSendingConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      try {
        await updateSearchConfig.mutateAsync({
          id: editingSearch.id,
          item_name: formData.item_name,
          manufacturer: formData.manufacturer,
          year_start: formData.include_years ? formData.year_start : 1900,
          year_end: formData.include_years ? formData.year_end : currentYear,
          qualifier: formData.qualifier,
          sub_qualifier: formData.sub_qualifier,
          price_threshold: formData.price_threshold,
          slider_percent: formData.slider_percent,
          max_price_allowed: maxPrice,
          email_address: formData.email_address,
        });

        toast({
          title: "Search Updated",
          description: "Your search configuration has been updated successfully."
        });

        if (onCancelEdit) {
          onCancelEdit();
        }
      } catch (error) {
        console.error('Error updating search:', error);
        toast({
          title: "Error",
          description: "Failed to update search configuration. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      const tempUserId = crypto.randomUUID();
      
      const searchConfig = {
        user_id: tempUserId,
        item_name: formData.item_name,
        manufacturer: formData.manufacturer,
        year_start: formData.include_years ? formData.year_start : 1900,
        year_end: formData.include_years ? formData.year_end : currentYear,
        qualifier: formData.qualifier,
        sub_qualifier: formData.sub_qualifier,
        price_threshold: formData.price_threshold,
        slider_percent: formData.slider_percent,
        max_price_allowed: maxPrice,
        email_address: formData.email_address,
        is_active: true
      };

      console.log('Submitting search config:', searchConfig);
      
      // Send confirmation email in the background
      sendConfirmationEmail(searchConfig);
      
      // Create the search
      onSearchCreated(searchConfig);
    }
    
    if (!isEditing) {
      setFormData({
        item_name: '',
        manufacturer: '',
        year_start: 2000,
        year_end: currentYear,
        qualifier: '',
        sub_qualifier: '',
        price_threshold: 500,
        slider_percent: 50,
        email_address: '',
        include_years: false
      });
      clearDiscoveredSources();
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
    setFormData({
      item_name: '',
      manufacturer: '',
      year_start: 2000,
      year_end: currentYear,
      qualifier: '',
      sub_qualifier: '',
      price_threshold: 500,
      slider_percent: 50,
      email_address: '',
      include_years: false
    });
    clearDiscoveredSources();
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit Search Configuration' : 'Configure Price Tracking Search'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {isEditing 
            ? 'Modify your existing search parameters'
            : 'Search for any item across multiple marketplaces and get notified when deals appear'
          }
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Brand/Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                placeholder="e.g., Apple, Gibson, Rolex"
                required
              />
            </div>
            <div>
              <Label htmlFor="item_name">Item/Model</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                placeholder="e.g., MacBook Pro, Les Paul, Submariner"
                required
              />
            </div>
          </div>

          {/* Source Discovery Section */}
          {!isEditing && formData.manufacturer && formData.item_name && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                  <Label className="text-sm font-medium">AI Source Discovery</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDiscoverSources}
                  disabled={isDiscovering}
                >
                  {isDiscovering ? 'Discovering...' : 'Find Novel Sources'}
                </Button>
              </div>
              
              {discoveredSources.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    AI discovered {discoveredSources.length} specialized sources for this search:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {discoveredSources.map((source, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs flex items-center gap-1"
                      >
                        {source.name}
                        <ExternalLink className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-green-600">
                    These sources will be included in your search alongside standard marketplaces.
                  </p>
                </div>
              )}
            </div>
          )}

          <SearchYearSelector
            includeYears={formData.include_years}
            yearStart={formData.year_start}
            yearEnd={formData.year_end}
            currentYear={currentYear}
            onIncludeYearsChange={(checked) => setFormData({...formData, include_years: checked})}
            onYearStartChange={(year) => setFormData({...formData, year_start: year})}
            onYearEndChange={(year) => setFormData({...formData, year_end: year})}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qualifier" className="block min-h-[20px]">Qualifier (Optional)</Label>
              <Input
                id="qualifier"
                value={formData.qualifier}
                onChange={(e) => setFormData({...formData, qualifier: e.target.value})}
                placeholder="e.g., 16-inch, Standard, Black"
              />
            </div>
            <div>
              <Label htmlFor="sub_qualifier" className="block min-h-[20px]">Sub-Qualifier (Optional)</Label>
              <Input
                id="sub_qualifier"
                value={formData.sub_qualifier}
                onChange={(e) => setFormData({...formData, sub_qualifier: e.target.value})}
                placeholder="e.g., M1 Max, Mint Condition"
              />
            </div>
          </div>

          <SearchPriceConfig
            priceThreshold={formData.price_threshold}
            sliderPercent={formData.slider_percent}
            onPriceThresholdChange={(price) => setFormData({...formData, price_threshold: price})}
            onSliderPercentChange={(percent) => setFormData({...formData, slider_percent: percent})}
          />

          <div>
            <Label htmlFor="email_address">Email Address</Label>
            <Input
              id="email_address"
              type="email"
              value={formData.email_address}
              onChange={(e) => setFormData({...formData, email_address: e.target.value})}
              placeholder="your@email.com"
              required
            />
          </div>

          <SearchMatrixPreview
            manufacturer={formData.manufacturer}
            itemName={formData.item_name}
            includeYears={formData.include_years}
            yearStart={formData.year_start}
            yearEnd={formData.year_end}
            qualifier={formData.qualifier}
            subQualifier={formData.sub_qualifier}
          />

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={updateSearchConfig.isPending}>
              {isEditing ? 'Update Search Configuration' : 'Create Search Configuration'}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchConfigForm;
