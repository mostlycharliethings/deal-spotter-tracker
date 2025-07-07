
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchConfig } from '@/types/database';
import SearchYearSelector from './SearchYearSelector';
import SearchPriceConfig from './SearchPriceConfig';
import SearchMatrixPreview from './SearchMatrixPreview';
import { useUpdateSearchConfig } from '@/hooks/useSearchConfigs';
import { useToast } from '@/hooks/use-toast';

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

  // Update form when editing a search
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      // Update existing search
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
      // Create new search
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
      onSearchCreated(searchConfig);
    }
    
    // Reset form only if not editing
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
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
    // Reset form to default values
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
