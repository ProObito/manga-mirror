import { motion } from 'framer-motion';
import { Flame, Clock, Star, TrendingUp } from 'lucide-react';
import MangaCard from '@/components/MangaCard';
import SectionHeader from '@/components/SectionHeader';
import { getTrendingManga, getNewlyAddedManga, getMostRatedManga } from '@/lib/mock-data';

const MangaGrid = () => {
  const trendingManga = getTrendingManga();
  const newlyAddedManga = getNewlyAddedManga();
  const topRatedManga = getMostRatedManga();

  return (
    <div className="space-y-16">
      {/* Trending Section */}
      <section>
        <SectionHeader
          title="Trending Now"
          subtitle="Most popular on the platform"
          icon={<Flame className="h-5 w-5" />}
          viewAllLink="/trending"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {trendingManga.slice(0, 6).map((manga, index) => (
            <MangaCard key={manga.id} manga={manga} index={index} />
          ))}
        </div>
      </section>

      {/* Newly Added Section */}
      <section>
        <SectionHeader
          title="Newly Added"
          subtitle="Fresh content just for you"
          icon={<Clock className="h-5 w-5" />}
          viewAllLink="/latest"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
          {newlyAddedManga.slice(0, 6).map((manga, index) => (
            <MangaCard key={manga.id} manga={manga} index={index} />
          ))}
        </div>
      </section>

      {/* Top Rated Featured */}
      <section>
        <SectionHeader
          title="Top Rated"
          subtitle="Highest rated by the community"
          icon={<Star className="h-5 w-5" />}
          viewAllLink="/top-rated"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topRatedManga.slice(0, 4).map((manga, index) => (
            <MangaCard key={manga.id} manga={manga} index={index} variant="featured" />
          ))}
        </div>
      </section>
    </div>
  );
};

export default MangaGrid;
