import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Star } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import SectionHeader from '@/components/SectionHeader';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface MangaItem {
  id: string;
  title: string;
  cover_url: string | null;
  summary: string | null;
  genres: string[] | null;
  author: string | null;
  artist: string | null;
  status: string | null;
  released: string | null;
  rating: number | null;
  rating_count: number | null;
  view_count: number | null;
  created_at: string | null;
  updated_at: string | null;
  alternative_names: string[] | null;
  chapterCount?: number;
}

const MangaGrid = () => {
  const [trendingManga, setTrendingManga] = useState<MangaItem[]>([]);
  const [newlyAddedManga, setNewlyAddedManga] = useState<MangaItem[]>([]);
  const [topRatedManga, setTopRatedManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        // Fetch all manga with chapter counts
        const { data: mangaData, error } = await supabase
          .from('manga')
          .select('*');

        if (error) throw error;

        if (mangaData && mangaData.length > 0) {
          // Get chapter counts for each manga
          const mangaWithCounts = await Promise.all(
            mangaData.map(async (manga) => {
              const { count } = await supabase
                .from('chapters')
                .select('*', { count: 'exact', head: true })
                .eq('manga_id', manga.id);
              return { ...manga, chapterCount: count || 0 };
            })
          );

          // Sort for different sections
          const byViews = [...mangaWithCounts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
          const byDate = [...mangaWithCounts].sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
          const byRating = [...mangaWithCounts].sort((a, b) => (b.rating || 0) - (a.rating || 0));

          setTrendingManga(byViews.slice(0, 6));
          setNewlyAddedManga(byDate.slice(0, 6));
          setTopRatedManga(byRating.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching manga:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManga();
  }, []);

  // Transform database manga to component format
  const transformManga = (item: MangaItem) => ({
    id: item.id,
    title: item.title,
    alternativeNames: item.alternative_names || [],
    cover: item.cover_url || '/placeholder.svg',
    summary: item.summary || '',
    genres: item.genres || [],
    author: item.author || undefined,
    artist: item.artist || undefined,
    status: (item.status as 'ongoing' | 'completed' | 'hiatus') || 'ongoing',
    released: item.released || undefined,
    rating: item.rating || 0,
    ratingCount: item.rating_count || 0,
    viewCount: item.view_count || 0,
    chapters: Array(item.chapterCount || 0).fill({ id: '' }), // For chapter count display
    source: 'manual' as const,
    createdAt: new Date(item.created_at || Date.now()),
    updatedAt: new Date(item.updated_at || Date.now()),
  });

  if (loading) {
    return (
      <div className="space-y-16">
        <section>
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  const hasNoManga = trendingManga.length === 0 && newlyAddedManga.length === 0 && topRatedManga.length === 0;

  if (hasNoManga) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No manga available yet.</p>
        <p className="text-sm text-muted-foreground mt-2">Add manga from the admin dashboard to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Trending Section */}
      {trendingManga.length > 0 && (
        <section>
          <SectionHeader
            title="Trending Now"
            subtitle="Most popular on the platform"
            icon={<Flame className="h-5 w-5" />}
            viewAllLink="/trending"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {trendingManga.map((manga, index) => (
              <MangaCard key={manga.id} manga={transformManga(manga)} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Newly Added Section */}
      {newlyAddedManga.length > 0 && (
        <section>
          <SectionHeader
            title="Newly Added"
            subtitle="Fresh content just for you"
            icon={<Clock className="h-5 w-5" />}
            viewAllLink="/latest"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {newlyAddedManga.map((manga, index) => (
              <MangaCard key={manga.id} manga={transformManga(manga)} index={index} />
            ))}
          </div>
        </section>
      )}

      {/* Top Rated Featured */}
      {topRatedManga.length > 0 && (
        <section>
          <SectionHeader
            title="Top Rated"
            subtitle="Highest rated by the community"
            icon={<Star className="h-5 w-5" />}
            viewAllLink="/top-rated"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {topRatedManga.map((manga, index) => (
              <MangaCard key={manga.id} manga={transformManga(manga)} index={index} variant="featured" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MangaGrid;