
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Wrench, User, Menu } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold">Charlie Scheid</h1>
        <Link to="/tools">
          <Button variant="outline" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Tools
          </Button>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-5xl font-bold">About Me</h2>
          </div>

          {/* Bio Section with Profile Image */}
          <div className="relative">
            {/* Profile Image - Top Left */}
            <div className="float-left mr-6 mb-4">
              <img 
                src="/lovable-uploads/86ce0932-53b3-412c-af43-ddf4fbfcf6cd.png" 
                alt="Charlie Scheid" 
                className="w-32 h-32 rounded-lg object-cover opacity-80 shadow-lg"
              />
            </div>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <p className="text-xl leading-relaxed">
                I'm a systems thinker, builder, and problem solver with a track record of turning complexity into clarity.
              </p>

              <p className="leading-relaxed">
                I specialize in transforming legacy operations, reengineering flawed systems, and aligning technical execution with business outcomes. Over the last decade, I've helped companies—from growth-stage startups to enterprise giants—scale more intelligently, operate more efficiently, and retain more customers.
              </p>

              <p className="leading-relaxed">
                While leading Production Support for Shell Energy, I redesigned their CI/CD pipeline, rebuilt their incident intake workflows, and overhauled component tracking—saving them an estimated $2.88 million and positioning their Salesforce platform to support 350,000 new customers. At CG Infinity and Lightbox RE, I built customer success operations from the ground up, cut attrition rates from 15% to under 2%, and turned at-risk teams into enterprise-grade operations.
              </p>

              <p className="leading-relaxed">
                I'm the founder of two companies:
              </p>

              <div className="pl-6 space-y-4">
                <p className="leading-relaxed">
                  <strong>Foxton Solutions Group</strong> — a Woman-Owned, HUBZone-certified government contractor delivering IT professional services to the federal sector.
                </p>

                <p className="leading-relaxed">
                  <strong>Foxton Group</strong> — a private consulting firm focused on business process reengineering for small and mid-sized companies. There, I developed the IPE Methodology ("Idiot Proof Everything") and the proprietary C.L.A.R.I.T.Y.™ Framework, a 7-step system designed to uncover blind spots, eliminate waste, and streamline performance at every level of the organization.
                </p>
              </div>

              <p className="leading-relaxed">
                Neurodivergent myself (ADHD/AuDHD), I approach problem-solving with a unique mix of empathy, precision, and obsession with simplification. Whether I'm working with SaaS execs, government procurement officers, or mom-and-pop operators, my goal is always the same: make smart people's lives easier by making systems smarter.
              </p>
            </div>
          </div>

          {/* Tools Button */}
          <div className="flex justify-center pt-8 clear-both">
            <Card className="w-full max-w-md hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Wrench className="h-6 w-6" />
                  Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Helpful utilities I've built
                </p>
                <Link to="/tools">
                  <Button size="lg" className="w-full">
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
