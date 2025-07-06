
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SearchConfig } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSearchConfigs = () => {
  return useQuery({
    queryKey: ['search-configs'],
    queryFn: async () => {
      console.log('Fetching search configs from Supabase');
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
