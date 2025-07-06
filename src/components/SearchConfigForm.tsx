import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SearchConfig } from '@/types/database';

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
    price_threshold: 50000,
    slider_percent: 50,
    email_address: ''
  });

  const maxPrice = formData.price_threshold * (1 + formData.slider_percent / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a proper UUID for the user_id
    const tempUserId = crypto.randomUUID();
    
    const searchConfig = {
      user_id: tempUserId,
      ...formData,
      max_price_allowed: maxPrice,
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
      price_threshold: 50000,
      slider_percent: 50,
      email_address: ''
    });
  };

  const generateSearchMatrix = () => {
    const combinations = [];
    // Priority: Start Year > End Year > Manufacturer > Item Name > Qualifier > Sub-Qualifier
    for (let year = formData.year_start; year <= formData.year_end; year++) {
      // Base search: Year + Manufacturer + Item Name
      combinations.push(`${year} ${formData.manufacturer} ${formData.item_name}`);
      
      if (formData.qualifier) {
        // Add qualifier
        combinations.push(`${year} ${formData.manufacturer} ${formData.item_name} ${formData.qualifier}`);
        
        if (formData.sub_qualifier) {
          // Add sub-qualifier
          combinations.push(`${year} ${formData.manufacturer} ${formData.item_name} ${formData.qualifier} ${formData.sub_qualifier}`);
        }
      }
    }
    return combinations;
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Configure Price Tracking Search</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                placeholder="e.g., Porsche"
                required
              />
            </div>
            <div>
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                placeholder="e.g., 911"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year_start">Start Year</Label>
              <Input
                id="year_start"
                type="number"
                value={formData.year_start}
                onChange={(e) => setFormData({...formData, year_start: parseInt(e.target.value)})}
                min="1900"
                max={currentYear}
                required
              />
            </div>
            <div>
              <Label htmlFor="year_end">End Year</Label>
              <Input
                id="year_end"
                type="number"
                value={formData.year_end}
                onChange={(e) => setFormData({...formData, year_end: parseInt(e.target.value)})}
                min="1900"
                max={currentYear}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="qualifier">Qualifier (Optional)</Label>
              <Input
                id="qualifier"
                value={formData.qualifier}
                onChange={(e) => setFormData({...formData, qualifier: e.target.value})}
                placeholder="e.g., 993"
              />
            </div>
            <div>
              <Label htmlFor="sub_qualifier">Sub-Qualifier (Optional)</Label>
              <Input
                id="sub_qualifier"
                value={formData.sub_qualifier}
                onChange={(e) => setFormData({...formData, sub_qualifier: e.target.value})}
                placeholder="e.g., Targa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="price_threshold">Price Threshold ($)</Label>
            <Input
              id="price_threshold"
              type="number"
              value={formData.price_threshold}
              onChange={(e) => setFormData({...formData, price_threshold: parseInt(e.target.value)})}
              min="0"
              required
            />
          </div>

          <div>
            <Label>Price Range Slider ({formData.slider_percent}%)</Label>
            <div className="mt-2 mb-4">
              <Slider
                value={[formData.slider_percent]}
                onValueChange={(value) => setFormData({...formData, slider_percent: value[0]})}
                max={500}
                step={5}
                className="w-full"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Threshold: ${formData.price_threshold.toLocaleString()}</p>
              <p>Max Price: ${Math.round(maxPrice).toLocaleString()}</p>
            </div>
          </div>

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

          <div className="bg-muted p-4 rounded-md">
            <h4 className="font-medium mb-2">Search Matrix Preview:</h4>
            <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {generateSearchMatrix().slice(0, 10).map((term, index) => (
                <div key={index} className="text-muted-foreground">"{term}"</div>
              ))}
              {generateSearchMatrix().length > 10 && (
                <div className="text-muted-foreground">...and {generateSearchMatrix().length - 10} more combinations</div>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Create Search Configuration
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SearchConfigForm;
