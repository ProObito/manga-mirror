import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, Flame, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { searchManga, genres } from '@/lib/mock-data';
import { Manga } from '@/lib/types';

interface SearchBarProps {
  isExpanded?: boolean;
  onClose?: () => void;
}

const SearchBar = ({ isExpanded = false, onClose }: SearchBarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Manga[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = searchManga(query);
      setResults(searchResults.slice(0, 5));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      onClose?.();
    }
  };

  const handleMangaClick = (id: string) => {
    navigate(`/manga/${id}`);
    setQuery('');
    onClose?.();
  };

  const handleGenreClick = (genre: string) => {
    navigate(`/browse?genre=${encodeURIComponent(genre)}`);
    onClose?.();
  };

  const showSuggestions = isFocused && (results.length > 0 || query.length === 0);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          variant="search"
          placeholder="Search manga by title, author, or genre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="h-14 text-base pr-12"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {results.length > 0 ? (
              <div className="divide-y divide-border">
                {results.map((manga) => (
                  <button
                    key={manga.id}
                    onClick={() => handleMangaClick(manga.id)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted transition-colors text-left"
                  >
                    <img
                      src={manga.cover}
                      alt={manga.title}
                      className="w-12 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{manga.title}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-primary fill-primary" />
                          {manga.rating}
                        </span>
                        <span>{manga.chapters.length} chapters</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Flame className="h-4 w-4 text-primary" />
                  Popular Genres
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.slice(0, 8).map((genre) => (
                    <Badge
                      key={genre}
                      variant="genre"
                      onClick={() => handleGenreClick(genre)}
                      className="cursor-pointer"
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
