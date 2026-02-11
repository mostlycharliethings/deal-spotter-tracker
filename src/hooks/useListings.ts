
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { TieringService } from '@/services/tieringService';

export const useListings = () => {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      console.log('Fetching listings from Supabase');
      const { data, error } = await (supabase as any)
        .from('listings')
        .select('*')
        .order('date_scraped', { ascending: false });
      
      if (error) {
        console.error('Error fetching listings:', error);
        throw error;
      }
      
      console.log('Fetched listings:', data);
      
      // Apply tier and proximity sorting
      const sortedListings = TieringService.sortListingsByTierAndProximity(data as Listing[]);
      return sortedListings;
    },
  });
};

export const useCreateListings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (listings: Omit<Listing, 'id' | 'date_scraped' | 'last_seen_at'>[]) => {
      console.log('Creating listings:', listings);
      const { data, error } = await (supabase as any)
        .from('listings')
        .insert(listings)
        .select();

      if (error) {
        console.error('Error creating listings:', error);
        throw error;
      }

      console.log('Created listings:', data);
      return data as Listing[];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: "Listings Added",
        description: `Found ${data.length} new listings.`
      });
    },
  });
};

export const useIgnoreListing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ listingId, reason }: { listingId: string; reason?: string }) => {
      console.log('Ignoring listing:', listingId, reason);
      const { data, error } = await (supabase as any)
        .from('listings')
        .update({
          is_ignored: true,
          ignored_at: new Date().toISOString(),
          ignore_reason: reason
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) {
        console.error('Error ignoring listing:', error);
        throw error;
      }

      console.log('Ignored listing:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};

export const useUnignoreListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      console.log('Unignoring listing:', listingId);
      const { data, error } = await (supabase as any)
        .from('listings')
        .update({
          is_ignored: false,
          ignored_at: null,
          ignore_reason: null
        })
        .eq('id', listingId)
        .select()
        .single();

      if (error) {
        console.error('Error unignoring listing:', error);
        throw error;
      }

      console.log('Unignored listing:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
};
