
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Edit, Trash2, Play, Calendar, Settings, Zap } from 'lucide-react';
import { SearchConfig } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useUpdateSearchConfig, useDeleteSearchConfig } from '@/hooks/useSearchConfigs';
import { RealScraper } from '@/services/realScraper';
import { format } from 'date-fns';

interface SearchConfigsManagerProps {
  searchConfigs: SearchConfig[];
  onManualRun: (searchId: string) => void;
  onEditSearch: (search: SearchConfig) => void;
  isRunning: boolean;
}

const SearchConfigsManager: React.FC<SearchConfigsManagerProps> = ({ 
  searchConfigs, 
  onManualRun,
  onEditSearch,
  isRunning 
}) => {
  const { toast } = useToast();
  const updateSearchConfig = useUpdateSearchConfig();
  const deleteSearchConfig = useDeleteSearchConfig();
  const [isSettingUpAutomation, setIsSettingUpAutomation] = useState(false);
  const [isTriggeringAutomated, setIsTriggeringAutomated] = useState(false);

  const handleToggleActive = async (searchId: string, isActive: boolean) => {
    try {
      await updateSearchConfig.mutateAsync({
        id: searchId,
        is_active: !isActive
      });
      toast({
        title: isActive ? "Search Deactivated" : "Search Activated",
        description: `Search monitoring has been ${isActive ? 'paused' : 'resumed'}.`
      });
    } catch (error) {
      console.error('Error toggling search:', error);
      toast({
        title: "Error",
        description: "Failed to update search status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (searchId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete the search for "${itemName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteSearchConfig.mutateAsync(searchId);
      toast({
        title: "Search Deleted",
        description: `Search for "${itemName}" has been removed.`
      });
    } catch (error) {
      console.error('Error deleting search:', error);
      toast({
        title: "Error",
        description: "Failed to delete search. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSetupAutomation = async () => {
    setIsSettingUpAutomation(true);
    try {
      console.log('Setting up automated scraping...');
      
      const response = await fetch('/functions/v1/setup-automated-scraping-cron', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Automation setup result:', result);

      toast({
        title: "🤖 Automation Enabled!",
        description: "Your searches will now run automatically 5 times per day. You'll receive email alerts for new findings.",
        duration: 5000
      });

    } catch (error) {
      console.error('Error setting up automation:', error);
      toast({
        title: "Setup Failed",
        description: `Failed to enable automation: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSettingUpAutomation(false);
    }
  };

  const handleTriggerAutomatedScraping = async () => {
    setIsTriggeringAutomated(true);
    try {
      const result = await RealScraper.triggerAutomatedScraping();
      
      if (result.success) {
        toast({
          title: "🚀 Automated Scraping Started",
          description: result.message,
          duration: 5000
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error triggering automated scraping:', error);
      toast({
        title: "Error",
        description: `Failed to start automated scraping: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsTriggeringAutomated(false);
    }
  };

  if (searchConfigs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Searches Yet</h3>
          <p className="text-muted-foreground">
            Create your first search configuration to start monitoring prices!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Automation Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Automation Controls
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up automated scraping and manage your search monitoring
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSetupAutomation}
              disabled={isSettingUpAutomation}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              {isSettingUpAutomation ? 'Setting Up...' : 'Enable Auto-Scraping (5x Daily)'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleTriggerAutomatedScraping}
              disabled={isTriggeringAutomated || isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isTriggeringAutomated ? 'Running...' : 'Run All Searches Now'}
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>🤖 Auto-Scraping Schedule:</strong> Your searches will run automatically at 6 AM, 10 AM, 2 PM, 6 PM, and 10 PM Eastern time. 
              Email alerts are sent immediately when new matching listings are found.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Search Configurations Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Search Configurations</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your price monitoring searches ({searchConfigs.filter(s => s.is_active).length} active)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Years</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchConfigs.map((search) => (
                <TableRow key={search.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {search.manufacturer} {search.item_name}
                      </div>
                      {(search.qualifier || search.sub_qualifier) && (
                        <div className="text-sm text-muted-foreground">
                          {[search.qualifier, search.sub_qualifier].filter(Boolean).join(' • ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Threshold: ${search.price_threshold}</div>
                      <div className="text-muted-foreground">
                        Max: ${search.max_price_allowed}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {search.year_start} - {search.year_end}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={search.is_active}
                        onCheckedChange={() => handleToggleActive(search.id, search.is_active)}
                        disabled={updateSearchConfig.isPending}
                      />
                      <Badge variant={search.is_active ? "default" : "secondary"}>
                        {search.is_active ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(search.created_at), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManualRun(search.id)}
                        disabled={isRunning}
                        title="Run search now"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditSearch(search)}
                        title="Edit search configuration"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(search.id, `${search.manufacturer} ${search.item_name}`)}
                        disabled={deleteSearchConfig.isPending}
                        title="Delete search"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchConfigsManager;
