import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import HeroSlider from '@/components/HeroSlider';
import SearchBar from '@/components/SearchBar';
import MangaGrid from '@/components/MangaGrid';
import FeaturesSection from '@/components/FeaturesSection';
import Footer from '@/components/Footer';
import { ContinueReading } from '@/components/ContinueReading';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>ComickTown - Read Manga & Webtoons Online Free</title>
        <meta 
          name="description" 
          content="Discover and read thousands of manga and webtoons for free. ComickTown offers the best reading experience with high-quality scans, fast updates, and a vast library." 
        />
        <meta name="keywords" content="manga, webtoon, manhwa, manhua, read manga, free manga" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main>
          {/* Hero Section with Auto-Slider */}
          <HeroSlider />
          
          {/* Search Section */}
          <section className="py-12 -mt-16 relative z-20">
            <div className="container mx-auto px-4">
              <SearchBar />
            </div>
          </section>

          {/* Continue Reading Section */}
          <ContinueReading />
          
          {/* Manga Grid Sections */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <MangaGrid />
            </div>
          </section>
          
          {/* Features Section */}
          <FeaturesSection />
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default Index;
