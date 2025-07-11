import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, TestTube } from 'lucide-react';
import { ComprehensiveScrapingProof } from '@/components/ComprehensiveScrapingProof';
import { ScraperApiTest } from '@/components/ScraperApiTest';
import { ManualScrapeTrigger } from '@/components/ManualScrapeTrigger';

const Testing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-background to-sage-100">
      {/* Navigation */}
      <nav className="flex items-center p-6 max-w-6xl mx-auto backdrop-blur-sm bg-white/10 rounded-lg mx-4 mt-4 border border-sage-200/50">
        <Link to="/tools/feedmehaystacks">
          <Button variant="outline" className="flex items-center gap-2 mr-6 border-copper-400 text-copper-600 hover:bg-copper-50 hover:text-copper-700 font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back to Feed Me Haystacks
          </Button>
        </Link>
        <h1 className="text-3xl font-bold font-playfair text-forest-700">Testing Suite</h1>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="space-y-12">
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-6xl font-bold font-playfair text-forest-700 tracking-tight">Testing Suite</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-copper-400 to-copper-600 mx-auto rounded-full"></div>
            <p className="text-2xl text-forest-600 font-medium">
              Comprehensive testing and diagnostics for the scraping engine
            </p>
          </div>

          {/* Comprehensive Scraping Proof - Full Width */}
          <div className="mb-12">
            <ComprehensiveScrapingProof />
          </div>

          {/* API Diagnostics and Manual Scrape */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-sm border border-sage-200/50 rounded-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <TestTube className="h-8 w-8 text-copper-500" />
                <h3 className="text-2xl font-bold font-playfair text-forest-700">API Diagnostics</h3>
              </div>
              <ScraperApiTest />
            </div>

            <div className="bg-white/80 backdrop-blur-sm border border-sage-200/50 rounded-lg p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <TestTube className="h-8 w-8 text-copper-500" />
                <h3 className="text-2xl font-bold font-playfair text-forest-700">Manual Scrape</h3>
              </div>
              <ManualScrapeTrigger />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testing;