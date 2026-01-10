import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";

import Index from "./pages/Index";
import Browse from "./pages/Browse";
import MangaDetail from "./pages/MangaDetail";
import Reader from "./pages/Reader";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />

              <Route path="/browse" element={<Browse />} />
              <Route path="/trending" element={<Browse />} />
              <Route path="/latest" element={<Browse />} />
              <Route path="/top-rated" element={<Browse />} />
              <Route path="/search" element={<Browse />} />

              <Route path="/manga/:id" element={<MangaDetail />} />
              <Route path="/read/:mangaId/:chapterId" element={<Reader />} />

              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/library" element={<Library />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/*" element={<Admin />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
