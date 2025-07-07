
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
          description: `Found ${sources.length} specialized sources for ${manufacturer} ${itemName}`
        });
      } else {
        toast({
          title: "No Additional Sources Found",
          description: "Will search standard marketplaces only",
          variant: "destructive"
        });
      }
      
      return sources;
    } catch (error) {
      console.error('Source discovery failed:', error);
      toast({
        title: "Source Discovery Failed",
        description: "Unable to discover additional sources. Using standard sources only.",
        variant: "destructive"
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
