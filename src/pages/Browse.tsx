import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Filter, Grid, List, SortAsc } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SearchBar from '@/components/SearchBar';
import MangaCard from '@/components/MangaCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { mockManga, genres, searchManga } from '@/lib/mock-data';
import { Manga, ViewMode, SortOption } from '@/lib/types';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [filteredManga, setFilteredManga] = useState<Manga[]>(mockManga);

  const genreFromUrl = searchParams.get('genre');

  useEffect(() => {
    if (genreFromUrl) {
      setSelectedGenres([genreFromUrl]);
    }
  }, [genreFromUrl]);

  useEffect(() => {
    let result = [...mockManga];

    // Filter by genres
    if (selectedGenres.length > 0) {
      result = result.filter((manga) =>
        selectedGenres.some((genre) => manga.genres.includes(genre))
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'views':
        result.sort((a, b) => b.viewCount - a.viewCount);
        break;
      case 'newest':
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    setFilteredManga(result);
  }, [selectedGenres, sortBy]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  return (
    <>
      <Helmet>
        <title>Browse Manga - MangaHub</title>
        <meta
          name="description"
          content="Browse our extensive collection of manga and webtoons. Filter by genre, sort by rating, and discover your next favorite read."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h1 className="font-display text-4xl md:text-6xl tracking-wide text-foreground mb-4">
                Browse <span className="text-gradient">Manga</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Explore our vast library of manga and webtoons
              </p>
            </motion.div>

            {/* Search */}
            <div className="mb-8">
              <SearchBar />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters Sidebar */}
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:w-64 flex-shrink-0"
              >
                <Card variant="elevated" className="p-6 sticky top-24">
                  <h3 className="font-display text-xl mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" />
                    Filters
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Genres</h4>
                      <div className="flex flex-wrap gap-2">
                        {genres.map((genre) => (
                          <Badge
                            key={genre}
                            variant={selectedGenres.includes(genre) ? 'default' : 'genre'}
                            className="cursor-pointer"
                            onClick={() => toggleGenre(genre)}
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {selectedGenres.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedGenres([])}
                        className="w-full"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.aside>

              {/* Main Content */}
              <div className="flex-1">
                {/* Controls */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    {filteredManga.length} titles found
                  </p>

                  <div className="flex items-center gap-4">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                      <SortAsc className="h-4 w-4 text-muted-foreground" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                      >
                        <option value="rating">Top Rated</option>
                        <option value="views">Most Viewed</option>
                        <option value="newest">Newest</option>
                        <option value="title">A-Z</option>
                      </select>
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 ${
                          viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <Grid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 ${
                          viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {filteredManga.map((manga, index) => (
                      <MangaCard key={manga.id} manga={manga} index={index} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredManga.map((manga, index) => (
                      <MangaCard key={manga.id} manga={manga} index={index} variant="compact" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Browse;
