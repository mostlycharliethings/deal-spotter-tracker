
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface SearchPriceConfigProps {
  priceThreshold: number;
  sliderPercent: number;
  onPriceThresholdChange: (price: number) => void;
  onSliderPercentChange: (percent: number) => void;
}

const SearchPriceConfig: React.FC<SearchPriceConfigProps> = ({
  priceThreshold,
  sliderPercent,
  onPriceThresholdChange,
  onSliderPercentChange
}) => {
  const maxPrice = priceThreshold * (1 + sliderPercent / 100);

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="price_threshold">Price Threshold ($)</Label>
        <Input
          id="price_threshold"
          type="number"
          value={priceThreshold}
          onChange={(e) => onPriceThresholdChange(parseInt(e.target.value))}
          min="0"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          You'll get immediate alerts for items at or below this price
        </p>
      </div>

      <div>
        <Label>Price Range Slider ({sliderPercent}%)</Label>
        <div className="mt-2 mb-4">
          <Slider
            value={[sliderPercent]}
            onValueChange={(value) => onSliderPercentChange(value[0])}
            max={500}
            step={5}
            className="w-full"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Immediate Alert: ${priceThreshold.toLocaleString()}</p>
          <p>Monitor Up To: ${Math.round(maxPrice).toLocaleString()}</p>
          <p className="text-xs mt-1">Items above your threshold but below the max will be tracked for reference</p>
        </div>
      </div>
    </div>
  );
};

export default SearchPriceConfig;
