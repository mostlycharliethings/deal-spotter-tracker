
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
        <Link to="/tools">
          <Button variant="outline" className="flex items-center gap-2 border-copper-400 text-copper-600 hover:bg-copper-50 hover:text-copper-700 font-medium">
            <Wrench className="h-4 w-4" />
            Tools
          </Button>
        </Link>
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
                I'm a systems thinker, builder, and problem solver with a track record of turning complexity into clarity.
              </p>

              <p className="leading-relaxed text-lg">
                I specialize in transforming legacy operations, reengineering flawed systems, and aligning technical execution with business outcomes. Over the last decade, I've helped companies—from growth-stage startups to enterprise giants—scale more intelligently, operate more efficiently, and retain more customers.
              </p>

              <p className="leading-relaxed text-lg">
                While leading Production Support for Shell Energy, I redesigned their CI/CD pipeline, rebuilt their incident intake workflows, and overhauled component tracking—saving them an estimated <span className="font-semibold text-copper-600">$2.88 million</span> and positioning their Salesforce platform to support 350,000 new customers across 7 brands. At CG Infinity and Lightbox RE, I built customer success operations from the ground up, cut attrition rates from <span className="font-semibold text-copper-600">15% to under 2%</span>, and turned at-risk teams into enterprise-grade operations.
              </p>

              <p className="leading-relaxed text-lg font-medium text-forest-700">
                I'm the founder of two companies:
              </p>

              <div className="pl-8 space-y-6 border-l-4 border-copper-300">
                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                    <span className="font-bold text-forest-700 font-playfair text-xl">Foxton Group</span> — a private consulting firm focused on business process reengineering for small and mid-sized companies. There, I developed the <span className="font-semibold text-copper-600">IPE Methodology</span> ("Idiot Proof Everything") and the proprietary <span className="font-semibold text-copper-600">C.L.A.R.I.T.Y.™ Framework</span>, a 7-step system designed to uncover blind spots, eliminate waste, and streamline performance at every level of the organization.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                    <span className="font-bold text-forest-700 font-playfair text-xl">Foxton Solutions Group</span> — a Woman-Owned, HUBZone-certified government contractor delivering IT professional services to the federal sector.
                  </p>
                </div>
              </div>

              <p className="leading-relaxed text-lg">
                I approach problem-solving with a unique mix of empathy, precision, and obsession with simplification. Whether I'm working with SaaS execs, government procurement officers, or mom-and-pop operators, my goal is always the same: <span className="font-semibold text-forest-700 italic">make smart people's lives easier by making systems smarter.</span>
              </p>
            </div>
          </div>

          {/* Tools Button */}
          <div className="flex justify-center pt-8 clear-both">
            <Card className="w-full max-w-md hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-sage-200/50 hover:border-copper-300">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center gap-3 font-playfair text-forest-700">
                  <Wrench className="h-7 w-7 text-copper-500" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6 pt-0">
                <p className="text-forest-600 text-lg">
                  Helpful utilities I've built
                </p>
                <Link to="/tools">
                  <Button size="lg" className="w-full bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 text-white font-medium py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300">
                    Explore Tools
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

export default Index;
