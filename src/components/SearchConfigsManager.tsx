
import React from 'react';
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
import { Edit, Trash2, Play, Calendar } from 'lucide-react';
import { SearchConfig } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useUpdateSearchConfig, useDeleteSearchConfig } from '@/hooks/useSearchConfigs';
import { format } from 'date-fns';

interface SearchConfigsManagerProps {
  searchConfigs: SearchConfig[];
  onManualRun: (searchId: string) => void;
  isRunning: boolean;
}

const SearchConfigsManager: React.FC<SearchConfigsManagerProps> = ({ 
  searchConfigs, 
  onManualRun,
  isRunning 
}) => {
  const { toast } = useToast();
  const updateSearchConfig = useUpdateSearchConfig();
  const deleteSearchConfig = useDeleteSearchConfig();

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
    <Card>
      <CardHeader>
        <CardTitle>My Search Configurations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your price monitoring searches
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
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(search.id, `${search.manufacturer} ${search.item_name}`)}
                      disabled={deleteSearchConfig.isPending}
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
  );
};

export default SearchConfigsManager;
