/**
 * Search Bar Component
 */
import { useState } from 'react';
import { useSearch } from '../hooks/useManga';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query);
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search manga across all sites..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          className="pl-10 pr-4 py-6 text-lg"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && query.length >= 2 && (
        <Card className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto z-50 bg-gray-950 border-gray-800">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {results.map((manga) => (
                <a
                  key={manga._id || manga.url}
                  href={`/manga/${encodeURIComponent(manga.url)}`}
                  className="flex gap-3 p-3 hover:bg-gray-900 transition-colors"
                >
                  <img
                    src={manga.cover_image || '/placeholder.jpg'}
                    alt={manga.title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">{manga.title}</h4>
                    <Badge variant="secondary" className="text-xs capitalize mt-1">
                      {manga.site}
                    </Badge>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">No results found</div>
          )}
        </Card>
      )}
    </div>
  );
}
