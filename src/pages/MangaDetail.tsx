import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  Star,
  BookOpen,
  Eye,
  Clock,
  User,
  Heart,
  Share2,
  Bookmark,
  ChevronRight,
  Lock,
  Unlock,
  Play,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { mockManga } from '@/lib/mock-data';
import { Manga } from '@/lib/types';

const MangaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [manga, setManga] = useState<Manga | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const found = mockManga.find((m) => m.id === id);
    setManga(found || null);
  }, [id]);

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Manga not found</p>
      </div>
    );
  }

  const handleStartReading = () => {
    const firstChapter = manga.chapters[0];
    if (firstChapter) {
      navigate(`/read/${manga.id}/${firstChapter.id}`);
    }
  };

  return (
    <>
      <Helmet>
        <title>{manga.title} - Read on MangaHub</title>
        <meta name="description" content={manga.summary.slice(0, 160)} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Banner */}
        <div className="relative pt-16">
          <div
            className="absolute inset-0 h-[500px] bg-cover bg-center"
            style={{ backgroundImage: `url(${manga.cover})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
          </div>

          <div className="relative container mx-auto px-4 pt-12">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cover Image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-shrink-0"
              >
                <div className="relative w-64 mx-auto lg:mx-0">
                  <div className="absolute -inset-2 bg-gradient-primary rounded-2xl blur-xl opacity-30" />
                  <img
                    src={manga.cover}
                    alt={manga.title}
                    className="relative w-full aspect-[2/3] object-cover rounded-xl shadow-2xl"
                  />
                </div>
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="status">{manga.status}</Badge>
                    <Badge variant="outline">{manga.source === 'scraped' ? 'Mirrored' : 'Original'}</Badge>
                  </div>
                  <h1 className="font-display text-4xl md:text-6xl tracking-wide text-foreground">
                    {manga.title}
                  </h1>
                  {manga.alternativeNames && manga.alternativeNames.length > 0 && (
                    <p className="text-muted-foreground mt-2">
                      Also known as: {manga.alternativeNames.join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {manga.genres.map((genre) => (
                    <Badge key={genre} variant="genre">
                      {genre}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary fill-primary" />
                    <span className="text-foreground font-semibold text-lg">{manga.rating}</span>
                    <span className="text-muted-foreground">
                      ({manga.ratingCount.toLocaleString()} ratings)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{manga.viewCount.toLocaleString()} views</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{manga.chapters.length} chapters</span>
                  </div>
                </div>

                {manga.author && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Author: {manga.author}</span>
                    </div>
                    {manga.artist && manga.artist !== manga.author && (
                      <span>Artist: {manga.artist}</span>
                    )}
                  </div>
                )}

                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {manga.summary}
                </p>

                <div className="flex flex-wrap gap-4 pt-4">
                  <Button variant="hero" size="xl" onClick={handleStartReading}>
                    <Play className="h-5 w-5 mr-2" />
                    Start Reading
                  </Button>
                  <Button
                    variant="glass"
                    size="lg"
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className={isBookmarked ? 'text-primary' : ''}
                  >
                    <Bookmark className={`h-5 w-5 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={isFavorite ? 'text-destructive' : ''}
                  >
                    <Heart className={`h-5 w-5 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="ghost" size="lg">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <section className="container mx-auto px-4 py-12">
          <Card variant="elevated" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-foreground">Chapters</h2>
              <span className="text-muted-foreground text-sm">
                {manga.chapters.length} total
              </span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {manga.chapters.slice().reverse().map((chapter, index) => (
                <Link
                  key={chapter.id}
                  to={`/read/${manga.id}/${chapter.id}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {chapter.number}
                    </div>
                    <div>
                      <h4 className="text-foreground font-medium group-hover:text-primary transition-colors">
                        {chapter.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(chapter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {chapter.isLocked ? (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="h-3 w-3" />
                        {chapter.tokenCost} tokens
                      </Badge>
                    ) : (
                      <Badge variant="ghost" className="gap-1">
                        <Unlock className="h-3 w-3" />
                        Free
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MangaDetail;
