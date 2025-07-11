import { Badge } from '@/components/ui/badge';

const VersionIndicator = () => {
  // Simple semantic versioning - you can update this when making changes
  const version = "1.3.0002";
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <Badge variant="outline" className="text-xs font-mono bg-background/80 backdrop-blur-sm">
        v{version}
      </Badge>
    </div>
  );
};

export default VersionIndicator;