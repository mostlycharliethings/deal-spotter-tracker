
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SearchConfig } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSearchConfigs = () => {
  return useQuery({
    queryKey: ['search-configs'],
    queryFn: async () => {
      console.log('Fetching search configs from Supabase');
      const { data, error } = await (supabase as any)
        .from('search_configs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching search configs:', error);
        throw error;
      }
      
      console.log('Fetched search configs:', data);
      return data as SearchConfig[];
    },
  });
};

export const useCreateSearchConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (searchConfig: Omit<SearchConfig, 'id' | 'created_at'>) => {
      console.log('Creating search config:', searchConfig);
      const { data, error } = await (supabase as any)
        .from('search_configs')
        .insert([searchConfig])
        .select()
        .single();

      if (error) {
        console.error('Error creating search config:', error);
        throw error;
      }

      console.log('Created search config:', data);
      return data as SearchConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-configs'] });
      toast({
        title: "Search Created",
        description: "Your price tracking search has been configured successfully."
      });
    },
    onError: (error) => {
      console.error('Failed to create search config:', error);
      toast({
        title: "Error",
        description: "Failed to create search configuration. Please try again.",
        variant: "destructive"
      });
    },
  });
};

export const useUpdateSearchConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (update: { id: string } & Partial<SearchConfig>) => {
      const { id, ...updateData } = update;
      console.log('Updating search config:', id, updateData);
      
      const { data, error } = await (supabase as any)
        .from('search_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating search config:', error);
        throw error;
      }

      console.log('Updated search config:', data);
      return data as SearchConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-configs'] });
    },
  });
};

export const useDeleteSearchConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (searchId: string) => {
      console.log('Deleting search config and related data:', searchId);
      
      // First, delete related scrape activity logs
      const { error: logError } = await (supabase as any)
        .from('scrape_activity_log')
        .delete()
        .eq('search_config_id', searchId);

      if (logError) {
        console.error('Error deleting scrape activity logs:', logError);
        throw logError;
      }

      // Then, delete related listings
      const { error: listingsError } = await (supabase as any)
        .from('listings')
        .delete()
        .eq('search_id', searchId);

      if (listingsError) {
        console.error('Error deleting listings:', listingsError);
        throw listingsError;
      }

      // Finally, delete the search config
      const { error } = await (supabase as any)
        .from('search_configs')
        .delete()
        .eq('id', searchId);

      if (error) {
        console.error('Error deleting search config:', error);
        throw error;
      }

      console.log('Deleted search config and related data:', searchId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-configs'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: "Search Deleted",
        description: "Search configuration and all related data have been removed."
      });
    },
    onError: (error) => {
      console.error('Failed to delete search config:', error);
      toast({
        title: "Error",
        description: "Failed to delete search configuration. Please try again.",
        variant: "destructive"
      });
    },
  });
};
