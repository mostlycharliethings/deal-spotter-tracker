
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center p-6 max-w-6xl mx-auto">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2 mr-4">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Charlie Scheid</h1>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold">Tools</h2>
            <p className="text-xl text-muted-foreground">
              Helpful utilities I've built
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Search className="h-6 w-6" />
                  Price Tracker
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Automated price monitoring across multiple marketplaces
                </p>
                <Link to="/tools/feedmehaystacks">
                  <Button size="lg" className="w-full text-lg py-6">
                    Feed Me Haystacks
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
