
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface SearchYearSelectorProps {
  includeYears: boolean;
  anyYear: boolean;
  yearStart: number;
  yearEnd: number;
  currentYear: number;
  onIncludeYearsChange: (checked: boolean) => void;
  onAnyYearChange: (checked: boolean) => void;
  onYearStartChange: (year: number) => void;
  onYearEndChange: (year: number) => void;
}

const SearchYearSelector: React.FC<SearchYearSelectorProps> = ({
  includeYears,
  anyYear,
  yearStart,
  yearEnd,
  currentYear,
  onIncludeYearsChange,
  onAnyYearChange,
  onYearStartChange,
  onYearEndChange
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="any_year"
          checked={anyYear}
          onCheckedChange={(checked) => onAnyYearChange(!!checked)}
        />
        <Label htmlFor="any_year" className="text-sm">
          Any year (search without specific years)
        </Label>
      </div>

      {!anyYear && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include_years"
            checked={includeYears}
            onCheckedChange={(checked) => onIncludeYearsChange(!!checked)}
          />
          <Label htmlFor="include_years" className="text-sm">
            Include specific years in search (useful for vehicles, vintage items)
          </Label>
        </div>
      )}

      {includeYears && !anyYear && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year_start">Start Year</Label>
            <Input
              id="year_start"
              type="number"
              value={yearStart}
              onChange={(e) => onYearStartChange(parseInt(e.target.value))}
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
              value={yearEnd}
              onChange={(e) => onYearEndChange(parseInt(e.target.value))}
              min="1900"
              max={currentYear}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchYearSelector;
