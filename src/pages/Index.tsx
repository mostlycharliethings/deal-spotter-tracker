
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
        <img 
          src="/lovable-uploads/aa4e6dc4-ee27-43d6-95ee-12d1b41d5843.png" 
          alt="Charlie Scheid" 
          className="h-12 w-auto"
        />
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
            <h2 className="text-6xl font-bold text-forest-700 tracking-tight">Operations excellence that drives bottom-line results.</h2>
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
              <p className="text-2xl leading-relaxed text-forest-700 font-bold">
                Most companies know their operations could be better. Few know exactly where to start—or have the bandwidth to execute while running the business.
              </p>

              <p className="leading-relaxed text-lg">
                I solve the operational problems that keep executives awake at night. Revenue teams missing targets due to process bottlenecks. Customer churn from service delivery gaps. Operational costs spiraling without clear ROI. Technology investments that never deliver promised efficiency gains.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                The result: measurable performance improvement within 90 days.
              </p>

              <div className="flex justify-center pt-2 pb-6">
                <Button asChild className="bg-copper-500 hover:bg-copper-600 text-white font-medium px-8 py-3 text-lg">
                  <a href="mailto:charlie@foxtonsolutionsgroup.com">Let's discuss your operational challenges.</a>
                </Button>
              </div>

              <p className="leading-relaxed text-lg font-semibold text-forest-700 text-xl">
                About Charlie Scheid
              </p>

              <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                13+ years optimizing operations for SaaS, technology, and regulated industries.
              </p>

              <p className="leading-relaxed text-lg">
                I've led operational transformations at companies scaling from $10M to $100M+ in revenue, consistently delivering cost reductions of 30-40% while improving customer satisfaction and team performance.
              </p>

              <p className="leading-relaxed text-lg">
                My approach combines strategic assessment with hands-on implementation. I don't deliver PowerPoints—I fix what's broken and build what's missing.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Core Expertise:
              </p>

              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li><span className="font-semibold">Customer Operations:</span> Redesigned support and success processes serving 500K+ users, reducing response times 97% while cutting operational costs $750K annually</li>
                <li><span className="font-semibold">Process Optimization:</span> Led cross-functional initiatives eliminating manual workflows, improving team productivity 170% in under nine months</li>
                <li><span className="font-semibold">Technology Integration:</span> Implemented automation solutions saving $2M+ in operational expenses across SaaS platforms</li>
                <li><span className="font-semibold">Team Leadership:</span> Built and scaled operational teams through M&A integrations and rapid growth phases</li>
              </ul>

              <p className="leading-relaxed text-lg">
                <span className="font-semibold">Industry Experience:</span> SaaS platforms, enterprise software, regulated financial services, federal contracting, transportation technology.
              </p>

              <p className="leading-relaxed text-lg">
                Currently, I operate two specialized consulting practices serving different market segments while maintaining active advisory relationships with growth-stage companies.
              </p>

              <div className="pl-8 space-y-6 border-l-4 border-copper-300">
                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                     <a 
                       href="https://Foxton.Group" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="font-bold text-forest-700 text-xl hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                     >
                       Foxton Group
                     </a>
                   </p>
                  <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                    Strategic operations consulting for growth-stage companies
                  </p>
                  <p className="leading-relaxed text-lg">
                    When operational friction threatens your growth trajectory, Foxton Group delivers systematic solutions that scale.
                  </p>
                  
                  <p className="leading-relaxed text-lg font-bold text-forest-700">
                    What We Do:
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                    <li>Operational assessments identifying specific bottlenecks limiting growth</li>
                    <li>Process redesign and automation implementation</li>
                    <li>Cross-functional team alignment around operational excellence</li>
                    <li>Performance measurement frameworks driving continuous improvement</li>
                  </ul>

                  <p className="leading-relaxed text-lg font-bold text-forest-700">
                    Typical Engagements:
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                    <li>Pre-Series B operational readiness (ensuring systems can handle 3-5x growth)</li>
                    <li>Customer operations optimization (reducing churn while scaling support)</li>
                    <li>Technology stack consolidation (eliminating redundant tools and processes)</li>
                    <li>M&A operational integration (maintaining service levels during transitions)</li>
                  </ul>

                  <p className="leading-relaxed text-lg">
                    <span className="font-semibold">Client Profile:</span> VC-backed SaaS companies, $5M-$50M revenue, preparing for significant scale.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="leading-relaxed text-lg">
                     <a 
                       href="https://FoxtonSolutionsGroup.com" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="font-bold text-forest-700 text-xl hover:opacity-80 transition-opacity duration-200 cursor-pointer"
                     >
                       Foxton Solutions Group
                     </a>
                   </p>
                  <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                    Mission-critical technology consulting for federal agencies
                  </p>
                  <p className="leading-relaxed text-lg">
                    Certified Woman-Owned Small Disadvantaged Business (WOSDB) delivering specialized IT services to federal agencies and prime contractors.
                  </p>
                  
                  <p className="leading-relaxed text-lg font-bold text-forest-700">
                    Core Services:
                  </p>
                  <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                    <li>Technology modernization strategy and implementation</li>
                    <li>Vendor evaluation and procurement support</li>
                    <li>System integration and process improvement</li>
                    <li>Compliance and security framework development</li>
                  </ul>

                  <p className="leading-relaxed text-lg">
                    <span className="font-semibold">Clearance:</span> Public Trust. Additional clearances available upon engagement requirements.
                  </p>
                  
                  <p className="leading-relaxed text-lg">
                    <span className="font-semibold">Past Performance:</span> Operational assessments for federal agencies, technology evaluation projects for prime contractors, system modernization support for mission-critical applications.
                  </p>
                </div>
              </div>

              <div className="pt-8 space-y-4 border-t border-sage-200">
                <p className="leading-relaxed text-lg font-bold text-forest-700 text-xl">
                  Let's discuss your operational challenges.
                </p>
                <p className="leading-relaxed text-lg">
                  <span className="font-semibold">Email:</span> charlie@foxtonsolutionsgroup.com<br/>
                  <span className="font-semibold">Phone:</span> Available upon request<br/>
                  <span className="font-semibold">Location:</span> Denver, Colorado (Travel as required)
                </p>
                <p className="leading-relaxed text-lg italic">
                  Initial consultation includes operational assessment and recommended next steps.
                </p>
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
