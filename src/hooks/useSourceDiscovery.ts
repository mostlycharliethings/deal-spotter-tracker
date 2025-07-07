
import { useState } from 'react';
import { SourceDiscoveryService, DiscoveredSource } from '@/services/sourceDiscovery';
import { useToast } from '@/hooks/use-toast';

export const useSourceDiscovery = () => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredSource[]>([]);
  const { toast } = useToast();

  const discoverSources = async (
    manufacturer: string,
    itemName: string,
    qualifier?: string,
    subQualifier?: string
  ) => {
    setIsDiscovering(true);
    try {
      console.log('Starting source discovery for:', { manufacturer, itemName });
      
      const sources = await SourceDiscoveryService.discoverSources(
        manufacturer,
        itemName,
        qualifier,
        subQualifier
      );
      
      setDiscoveredSources(sources);
      
      if (sources.length > 0) {
        toast({
          title: "Novel Sources Discovered",
          description: `Found ${sources.length} specialized sources for ${manufacturer} ${itemName}. These will be included in your search.`
        });
      } else {
        toast({
          title: "Using Standard Sources",
          description: "No additional specialized sources found. Your search will use our standard marketplace coverage.",
          variant: "default"
        });
      }
      
      return sources;
    } catch (error) {
      console.error('Source discovery failed:', error);
      setDiscoveredSources([]);
      toast({
        title: "Using Standard Sources",
        description: "Source discovery is temporarily unavailable. Your search will use our standard marketplace coverage.",
        variant: "default"
      });
      return [];
    } finally {
      setIsDiscovering(false);
    }
  };

  const clearDiscoveredSources = () => {
    setDiscoveredSources([]);
  };

  return {
    discoverSources,
    discoveredSources,
    isDiscovering,
    clearDiscoveredSources
  };
};
