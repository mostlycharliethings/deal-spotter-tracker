
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Tools from "./pages/Tools";
import FeedMeHaystacks from "./pages/FeedMeHaystacks";
import Testing from "./pages/Testing";
import DailyDigestPreview from "./pages/DailyDigestPreview";
import ScrapeLogs from "./pages/ScrapeLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/index.html" element={<Index />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/tools/feedmehaystacks" element={<FeedMeHaystacks />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/tools/feedmehaystacks/preview" element={<DailyDigestPreview />} />
          <Route path="/tools/feedmehaystacks/logs" element={<ScrapeLogs />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
