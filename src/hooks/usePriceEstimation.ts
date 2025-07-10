import { useState } from 'react';
import { PriceEstimationService, PriceEstimate, PriceEstimateRequest } from '@/services/priceEstimation';
import { useToast } from '@/hooks/use-toast';

export const usePriceEstimation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<PriceEstimate | null>(null);
  const { toast } = useToast();

  const getPriceEstimate = async (request: PriceEstimateRequest): Promise<PriceEstimate | null> => {
    setIsLoading(true);
    try {
      console.log('Getting price estimate for:', request);

      // First try to get cached estimate
      const cachedEstimate = await PriceEstimationService.getCachedPriceEstimate(request);
      if (cachedEstimate) {
        console.log('Using cached price estimate');
        setPriceEstimate(cachedEstimate);
        toast({
          title: "Price Estimate Ready",
          description: PriceEstimationService.getPriceEstimateSummary(cachedEstimate),
        });
        return cachedEstimate;
      }

      // If no cached data, fetch new estimate
      const estimate = await PriceEstimationService.getPriceEstimate(request);
      setPriceEstimate(estimate);

      if (estimate) {
        toast({
          title: "Price Estimate Complete",
          description: PriceEstimationService.getPriceEstimateSummary(estimate),
        });
      } else {
        toast({
          title: "Price Data Unavailable",
          description: "Unable to find sufficient pricing data for this item.",
          variant: "destructive"
        });
      }

      return estimate;
    } catch (error) {
      console.error('Price estimation failed:', error);
      toast({
        title: "Price Estimation Failed",
        description: "Unable to get price estimate at this time. Please try again later.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearPriceEstimate = () => {
    setPriceEstimate(null);
  };

  const formatPrice = (price: number): string => {
    return PriceEstimationService.formatPrice(price);
  };

  const getPriceRecommendation = (estimate: PriceEstimate) => {
    return PriceEstimationService.getPriceRecommendation(estimate);
  };

  const getPriceConfidence = (samples: number) => {
    return PriceEstimationService.getPriceConfidence(samples);
  };

  return {
    isLoading,
    priceEstimate,
    getPriceEstimate,
    clearPriceEstimate,
    formatPrice,
    getPriceRecommendation,
    getPriceConfidence
  };
};