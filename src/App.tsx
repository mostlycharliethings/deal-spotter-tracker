import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient } from '@tanstack/react-query';
import Index from './pages';
import Tools from './pages/Tools';
import NotFound from './pages/NotFound';
import FeedMeHaystacks from './pages/FeedMeHaystacks';
import EmailPreviewPage from './pages/EmailPreviewPage';
import { Mail } from 'lucide-react';

function App() {
  return (
    <QueryClient>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          <Toaster />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/tools/feedmehaystacks" element={<FeedMeHaystacks />} />
            <Route path="/email-preview" element={<EmailPreviewPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClient>
  );
}

export default App;
