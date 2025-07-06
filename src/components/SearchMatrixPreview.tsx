
import React from 'react';

interface SearchMatrixPreviewProps {
  manufacturer: string;
  itemName: string;
  includeYears: boolean;
  yearStart: number;
  yearEnd: number;
  qualifier: string;
  subQualifier: string;
}

const SearchMatrixPreview: React.FC<SearchMatrixPreviewProps> = ({
  manufacturer,
  itemName,
  includeYears,
  yearStart,
  yearEnd,
  qualifier,
  subQualifier
}) => {
  const generateSearchMatrix = () => {
    const combinations = [];
    
    if (includeYears) {
      // Year-based searches (vehicles, vintage items, etc.)
      for (let year = yearStart; year <= yearEnd; year++) {
        combinations.push(`${year} ${manufacturer} ${itemName}`);
        
        if (qualifier) {
          combinations.push(`${year} ${manufacturer} ${itemName} ${qualifier}`);
          
          if (subQualifier) {
            combinations.push(`${year} ${manufacturer} ${itemName} ${qualifier} ${subQualifier}`);
          }
        }
      }
    } else {
      // General item searches (no specific years)
      combinations.push(`${manufacturer} ${itemName}`);
      
      if (qualifier) {
        combinations.push(`${manufacturer} ${itemName} ${qualifier}`);
        
        if (subQualifier) {
          combinations.push(`${manufacturer} ${itemName} ${qualifier} ${subQualifier}`);
        }
      }
    }
    
    return combinations.filter(combo => combo.trim().length > 0);
  };

  const searchTerms = generateSearchMatrix();

  if (!manufacturer && !itemName) {
    return null;
  }

  return (
    <div className="bg-muted p-4 rounded-md">
      <h4 className="font-medium mb-2">Search Matrix Preview:</h4>
      <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
        {searchTerms.slice(0, 10).map((term, index) => (
          <div key={index} className="text-muted-foreground">"{term}"</div>
        ))}
        {searchTerms.length > 10 && (
          <div className="text-muted-foreground">...and {searchTerms.length - 10} more combinations</div>
        )}
      </div>
    </div>
  );
};

export default SearchMatrixPreview;
