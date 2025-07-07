
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from './pages/Index';
import Tools from './pages/Tools';
import NotFound from './pages/NotFound';
import FeedMeHaystacks from './pages/FeedMeHaystacks';
import FeedMeHaystacksPreview from './pages/FeedMeHaystacksPreview';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/feedmehaystacks" element={<FeedMeHaystacks />} />
            <Route path="/tools/feedmehaystacks/preview" element={<FeedMeHaystacksPreview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
