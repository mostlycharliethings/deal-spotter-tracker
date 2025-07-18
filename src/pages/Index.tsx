
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wrench, User, Menu } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-background to-sage-100">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto backdrop-blur-sm bg-white/10 rounded-lg mx-4 mt-4 border border-sage-200/50">
        <h1 className="text-3xl font-bold font-playfair text-forest-700">Charlie Scheid</h1>
        <a href="https://haystacks.charliescheid.com" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="flex items-center gap-2 border-copper-400 text-copper-600 hover:bg-copper-50 hover:text-copper-700 font-medium">
            <Wrench className="h-4 w-4" />
            Tools
          </Button>
        </a>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div className="space-y-12">
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-6xl font-bold font-playfair text-forest-700 tracking-tight">About Me</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-copper-400 to-copper-600 mx-auto rounded-full"></div>
          </div>

          {/* Bio Section with Profile Image */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-sage-200/50">
            {/* Profile Image - Top Left */}
            <div className="float-left mr-8 mb-6">
              <img 
                src="/lovable-uploads/86ce0932-53b3-412c-af43-ddf4fbfcf6cd.png" 
                alt="Charlie Scheid" 
                className="w-40 h-40 rounded-2xl object-cover opacity-80 shadow-2xl border-4 border-white/50"
              />
            </div>

            <div className="prose prose-lg max-w-none space-y-8 text-forest-600">
              <p className="text-2xl leading-relaxed font-playfair text-forest-700 font-medium">
                I help teams solve operational problems that get in the way of growth.
              </p>

              <p className="leading-relaxed text-lg">
                Over the past decade, I've stepped into companies where processes were broken, teams were overwhelmed, and systems couldn't keep up. I simplify the mess, rebuild what matters, and align day-to-day execution with long-term goals. The result is usually more traction, better retention, and a faster path to scale.
              </p>

              <p className="leading-relaxed text-lg">
                My experience blends systems thinking, service design, customer operations, and strategic execution. I'm most useful in situations where there is no playbook, where decisions need to be made quickly, and where the path forward isn't yet clear.
              </p>

              <p className="leading-relaxed text-lg font-medium text-forest-700">
                I currently lead two companies:
              </p>

              <div className="pl-8 space-y-6 border-l-4 border-copper-300">
                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                    <span className="font-bold text-forest-700 font-playfair text-xl">Foxton Group</span>
                  </p>
                  <p className="leading-relaxed text-lg">
                    A modern strategy group helping businesses simplify, scale, and get out of their own way.
                  </p>
                  <p className="leading-relaxed text-lg">
                    We work directly with leadership teams to identify the root causes of friction. Whether it's misaligned tools, bloated workflows, or cultural drift, we focus on solving the real problems, not just the visible ones. We bring structure, clarity, and executional support without the overhead or canned frameworks typical of consulting firms.
                  </p>
                  <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                    We don't deal in theory. We deal in progress.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                    <span className="font-bold text-forest-700 font-playfair text-xl">Foxton Solutions Group</span>
                  </p>
                  <p className="leading-relaxed text-lg">
                    A Woman-Owned, Small Disadvantaged Business located in a HUBZone.
                  </p>
                  <p className="leading-relaxed text-lg">
                    We specialize in IT professional services and technology feasibility for federal clients. Our work supports mission-critical modernization efforts where clarity, compliance, and outcomes matter. Whether evaluating systems or delivering scoped execution, we bring sharp thinking and consistent results to high-stakes environments.
                  </p>
                </div>
              </div>
            </div>
          </div>


          {/* Archive Button */}
          <div className="flex justify-center pt-4">
            <Link to="/tools/v1testhaystacks">
              <Button variant="outline" className="flex items-center gap-2 border-sage-300 text-sage-600 hover:bg-sage-50 hover:text-sage-700 font-medium">
                Archive
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
