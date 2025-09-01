
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
            <h2 className="text-6xl font-bold text-forest-700 tracking-tight">About Me</h2>
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
                Operational clarity for companies that are ready to scale, not stall.
              </p>

              <p className="leading-relaxed text-lg">
                When growth stalls, it's rarely about market conditions—it's about operational friction. I architect scalable systems and eliminate structural bottlenecks that prevent high-potential companies from reaching their next inflection point. Whether you're navigating critical transitions, resolving costly operational inefficiencies, or building the foundation for exponential growth, I deliver the strategic clarity and systematic precision that transforms potential into performance.
              </p>

              <div className="flex justify-center pt-2 pb-6">
                <Button asChild className="bg-copper-500 hover:bg-copper-600 text-white font-medium px-8 py-3 text-lg">
                  <a href="mailto:charlie@foxtonsolutionsgroup.com">Let's Talk</a>
                </Button>
              </div>

              <p className="leading-relaxed text-lg font-semibold text-forest-700 text-xl">
                About Charlie
              </p>

              <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                Transforming operational complexity into competitive advantage across regulated industries, SaaS platforms, and hypergrowth environments.
              </p>

              <p className="leading-relaxed text-lg">
                For over a decade, I've specialized in high-stakes operational transformations where precision isn't optional—it's survival. My expertise spans regulated industries, enterprise SaaS platforms, and venture-backed companies scaling from startup to market leadership, consistently delivering results when traditional approaches fall short.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700">
                Core Competencies:
              </p>

              <ul className="leading-relaxed text-lg space-y-2 list-disc pl-6">
                <li><span className="font-semibold">Customer Experience Architecture:</span> Rebuilt and optimized customer journey systems supporting hundreds of thousands of users</li>
                <li><span className="font-semibold">Operational Process Design:</span> Modernized internal workflows that eliminated bottlenecks and reduced operational overhead by 40-60%</li>
                <li><span className="font-semibold">Platform Strategy & Execution:</span> Led comprehensive platform redesigns that increased user engagement and system reliability</li>
                <li><span className="font-semibold">Cross-Functional Alignment:</span> Unified leadership teams around data-driven operational strategies that accelerate sustainable growth</li>
              </ul>

              <p className="leading-relaxed text-lg">
                My methodology combines strategic vision with tactical execution. I don't deliver theoretical frameworks—I implement proven systems that create measurable impact from day one. Every engagement is built around actionable intelligence, not abstract consulting deliverables.
              </p>

              <p className="leading-relaxed text-lg">
                Currently, I lead two specialized consulting practices dedicated to operational excellence, each designed to address the unique challenges facing companies at critical scaling junctures. My clients range from venture-backed startups preparing for Series B growth to established enterprises navigating digital transformation.
              </p>

              <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                The difference is in the execution. Where others see complexity, I see opportunity for systematic optimization.
              </p>

              <p className="leading-relaxed text-lg font-bold text-forest-700 text-xl pt-4">
                Companies I've founded:
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
                    Strategic transformation for leadership teams demanding measurable results, not theoretical solutions.
                  </p>
                  <p className="leading-relaxed text-lg">
                    When growth stalls or operational friction threatens competitive position, executive teams turn to Foxton Group for precision-engineered solutions. We diagnose and eliminate the root causes of organizational inefficiency—whether systemic misalignment, fragmented processes, or critical decision bottlenecks—delivering clear, actionable pathways to sustainable performance improvement.
                  </p>
                  <p className="leading-relaxed text-lg font-bold">
                    Our proprietary methodologies transform complexity into competitive advantage, combining strategic intelligence with tactical precision tailored to each organization's unique operational DNA. We don't deliver generic frameworks—we architect bespoke solutions grounded in real-world complexity and organizational context.
                  </p>
                  <p className="leading-relaxed text-lg">
                    Every engagement is designed for lasting impact. Our objective is to embed the capabilities, clarity, and strategic alignment necessary for teams to excel independently. We establish sustainable systems, not dependencies. Our success is measured by your team's continued performance long after our engagement concludes.
                  </p>
                  <p className="leading-relaxed text-lg font-medium text-forest-700 italic">
                    We're not here to manage your operations. We're here to ensure you never need us to.
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
                    Mission-critical technology strategy and implementation for federal agencies and prime contractors operating in high-stakes environments.
                  </p>
                  <p className="leading-relaxed text-lg">
                    As a certified Woman-Owned Small Disadvantaged Business (WOSDB) strategically positioned in a designated HUBZone, Foxton Solutions Group delivers specialized IT professional services and technology feasibility solutions to the federal marketplace where precision, compliance, and execution excellence are mission-critical.
                  </p>
                  <p className="leading-relaxed text-lg">
                    Our expertise centers on modernization initiatives, strategic vendor evaluations, and system improvements where regulatory compliance, operational clarity, and flawless execution determine mission success. We operate in environments where failure is not an option—supporting federal agencies and integrators through complex technology transformations that directly impact national priorities.
                  </p>
                  <p className="leading-relaxed text-lg">
                    We deliver strategic insight with operational precision, ensuring agencies achieve their objectives with complete confidence and institutional credibility. Whether leading comprehensive technology assessments or executing embedded project roles, our approach is methodical, responsive, and engineered for measurable results that meet the highest standards of federal accountability.
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
