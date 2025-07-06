
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchConfig } from '@/types/database';
import SearchYearSelector from './SearchYearSelector';
import SearchPriceConfig from './SearchPriceConfig';
import SearchMatrixPreview from './SearchMatrixPreview';

interface SearchConfigFormProps {
  onSearchCreated: (search: Omit<SearchConfig, 'id' | 'created_at'>) => void;
}

const SearchConfigForm: React.FC<SearchConfigFormProps> = ({ onSearchCreated }) => {
  const currentYear = new Date().getFullYear();
  
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

  const maxPrice = formData.price_threshold * (1 + formData.slider_percent / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a proper UUID for the user_id
    const tempUserId = crypto.randomUUID();
    
    const searchConfig = {
      user_id: tempUserId,
      item_name: formData.item_name,
      manufacturer: formData.manufacturer,
      // If include_years is checked, use specified range. Otherwise, use default wide range.
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
    
    // Reset form
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
        <CardTitle>Configure Price Tracking Search</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search for any item across multiple marketplaces and get notified when deals appear
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
              <Label htmlFor="qualifier">Qualifier (Optional)</Label>
              <Input
                id="qualifier"
                value={formData.qualifier}
                onChange={(e) => setFormData({...formData, qualifier: e.target.value})}
                placeholder="e.g., 16-inch, Standard, Black"
              />
            </div>
            <div>
              <Label htmlFor="sub_qualifier">Sub-Qualifier (Optional)</Label>
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

          <Button type="submit" className="w-full">
            Create Search Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchConfigForm;
