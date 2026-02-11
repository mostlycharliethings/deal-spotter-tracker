
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
            <p className="text-xl font-semibold text-forest-700">Strategic Operator | Organizational Systems Design</p>
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
                Most companies know what they want to achieve. The problem is execution—they lack the operational infrastructure to get there.
              </p>

              <p className="leading-relaxed text-lg">
                I design and build the systems that connect strategy to results. Not consulting decks. Not recommendations. Actual operational architecture: the frameworks, processes, and execution systems that turn strategic intent into measurable performance.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                The problems I solve:
              </p>

              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li>Revenue operations breaking down under growth pressure</li>
                <li>Service delivery gaps bleeding customers and margin</li>
                <li>Disconnected systems creating manual work and data chaos</li>
                <li>Teams executing without clear processes or accountability structures</li>
                <li>Strategic initiatives stalling because nobody owns the "how"</li>
              </ul>

              <p className="leading-relaxed text-lg">
                I specialize in untangling complex "people + process + product" problems where fixing one piece without addressing the system makes things worse.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Result: Operational infrastructure that executes strategy. Performance improvement within 90 days. Systems that scale without you.
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
                15+ years building operational systems for SaaS, technology, and regulated industries.
              </p>

              <p className="leading-relaxed text-lg">
                I've led transformations at companies scaling from $10M to $100M+ revenue—consistently delivering 30-40% cost reductions while improving customer outcomes and team performance.
              </p>

              <p className="leading-relaxed text-lg">
                What makes my approach different: I don't diagnose and leave. I design the operational infrastructure, implement it, and transfer it to your team. You get both the strategic roadmap and the execution system to make it real.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Core Capabilities:
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Systems Design & Integration
              </p>
              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li>Designed operational frameworks supporting 500K+ users across customer success, support, and revenue operations</li>
                <li>Built cross-functional execution systems eliminating workflow bottlenecks and improving productivity 170% in under nine months</li>
                <li>Architected documentation and knowledge management systems enabling distributed teams to operate consistently</li>
              </ul>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Customer Experience & Journey Optimization
              </p>
              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li>Redesigned end-to-end service delivery reducing response times 97% while cutting costs $750K annually</li>
                <li>Mapped and optimized customer journeys identifying friction points driving churn</li>
                <li>Built measurement frameworks connecting operational metrics to business outcomes</li>
              </ul>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Operational Transformation
              </p>
              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li>Led process reengineering initiatives saving $2M+ through automation and waste elimination</li>
                <li>Managed operational consolidation during M&A integrations and rapid scaling phases</li>
                <li>Developed performance management systems creating accountability without bureaucracy</li>
              </ul>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Technical & Strategic Fluency
              </p>
              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li>Implemented Salesforce, API integrations, and automation platforms across operational workflows</li>
                <li>Translated technical capabilities into business value for executive stakeholders</li>
                <li>Evaluated and selected technology platforms balancing capability, cost, and adoption</li>
              </ul>

              <p className="leading-relaxed text-lg">
                <span className="font-semibold">Industries:</span> SaaS platforms, enterprise software, regulated financial services, federal contracting, transportation technology
              </p>

              <p className="leading-relaxed text-lg">
                <span className="font-semibold">Currently:</span> I operate specialized consulting practices serving growth-stage companies and maintain advisory relationships focused on operational transformation. I also serve as Director of Operations (functional COO) for a 15-year sensory solutions company managing coast-to-coast operational consolidation.
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
