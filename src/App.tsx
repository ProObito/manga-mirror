import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/hooks/useAuth";

import Browse from "./pages/Browse";
import MangaDetail from "./pages/MangaDetail";
import Reader from "./pages/Reader";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { MangaLibrary } from "./components/MangaLibrary";

// ✅ NEW IMPORTS (jo tu chahta tha)
import MangaList from "./components/MangaList";
import SearchBar from "./components/SearchBar";
import LatestUpdates from "./components/LatestUpdates";
import StatsWidget from "./components/StatsWidget";

const queryClient = new QueryClient();

// ✅ HOME UI (router ke liye alag component)
function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">COMICKTOWN</h1>
          <p className="text-sm text-gray-400">8 Sites • Unlimited Manga</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <StatsWidget />
        </div>

        <div className="mb-8 flex justify-center">
          <SearchBar />
        </div>

        <div className="mb-12">
          <LatestUpdates />
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">All Manga</h2>
          <MangaList />
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />

          <BrowserRouter>
            <Routes>
              {/* ✅ HOME */}
              <Route path="/" element={<Home />} />

              <Route path="/browse" element={<Browse />} />
              <Route path="/trending" element={<Browse />} />
              <Route path="/latest" element={<Browse />} />
              <Route path="/top-rated" element={<Browse />} />
              <Route path="/search" element={<Browse />} />

              <Route path="/library" element={<MangaLibrary />} />
              <Route path="/manga/:id" element={<MangaDetail />} />
              <Route path="/read/:mangaId/:chapterId" element={<Reader />} />

              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
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
