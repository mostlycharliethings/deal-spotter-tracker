
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, TestTube } from 'lucide-react';
import { ScraperApiTest } from '@/components/ScraperApiTest';
import { ManualScrapeTrigger } from '@/components/ManualScrapeTrigger';

const Tools = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-background to-sage-100">
      {/* Navigation */}
      <nav className="flex items-center p-6 max-w-6xl mx-auto backdrop-blur-sm bg-white/10 rounded-lg mx-4 mt-4 border border-sage-200/50">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2 mr-6 border-copper-400 text-copper-600 hover:bg-copper-50 hover:text-copper-700 font-medium">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold font-playfair text-forest-700">Charlie Scheid</h1>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="space-y-12">
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-6xl font-bold font-playfair text-forest-700 tracking-tight">Tools</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-copper-400 to-copper-600 mx-auto rounded-full"></div>
            <p className="text-2xl text-forest-600 font-medium">
              Helpful utilities I've built
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 justify-center">
            <Card className="hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-sage-200/50 hover:border-copper-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 font-playfair text-forest-700 text-2xl">
                  <Search className="h-8 w-8 text-copper-500" />
                  Price Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6 pt-0">
                <p className="text-forest-600 text-lg leading-relaxed">
                  Automated price monitoring across multiple marketplaces
                </p>
                <Link to="/tools/feedmehaystacks">
                  <Button size="lg" className="w-full text-xl py-8 bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                    Feed Me Haystacks
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-sage-200/50 hover:border-copper-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 font-playfair text-forest-700 text-2xl">
                  <TestTube className="h-8 w-8 text-copper-500" />
                  API Diagnostics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ScraperApiTest />
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-sage-200/50 hover:border-copper-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 font-playfair text-forest-700 text-2xl">
                  <TestTube className="h-8 w-8 text-copper-500" />
                  Manual Scrape
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ManualScrapeTrigger />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
