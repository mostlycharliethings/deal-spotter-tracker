
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const Tools = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Tools</h1>
          <p className="text-xl text-muted-foreground">
            Helpful utilities and applications
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md">
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
  );
};

export default Tools;
