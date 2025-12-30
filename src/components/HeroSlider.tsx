import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star, Eye, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMostRatedManga } from '@/lib/mock-data';
import { Manga } from '@/lib/types';

const HeroSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const topRatedManga = getMostRatedManga().slice(0, 5);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % topRatedManga.length);
  }, [topRatedManga.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + topRatedManga.length) % topRatedManga.length);
  }, [topRatedManga.length]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const currentManga = topRatedManga[currentIndex];

  return (
    <section className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentManga.cover})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <Badge variant="glow" className="text-sm px-3 py-1">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  #{currentIndex + 1} Top Rated
                </Badge>
                <Badge variant="status">
                  {currentManga.status}
                </Badge>
              </div>

              <h1 className="font-display text-5xl md:text-7xl lg:text-8xl tracking-wide leading-none">
                {currentManga.title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {currentManga.genres.slice(0, 4).map((genre) => (
                  <Badge key={genre} variant="genre">
                    {genre}
                  </Badge>
                ))}
              </div>

              <p className="text-muted-foreground text-lg max-w-xl line-clamp-3">
                {currentManga.summary}
              </p>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-primary fill-primary" />
                  <span className="text-foreground font-semibold">{currentManga.rating}</span>
                  <span>({currentManga.ratingCount.toLocaleString()} ratings)</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>{currentManga.chapters.length} chapters</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Link to={`/manga/${currentManga.id}`}>
                  <Button variant="hero" size="xl">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Start Reading
                  </Button>
                </Link>
                <Link to={`/manga/${currentManga.id}`}>
                  <Button variant="glass" size="xl">
                    View Details
                  </Button>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Cover Image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 50, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="relative mx-auto w-80">
                <div className="absolute -inset-4 bg-gradient-primary rounded-2xl blur-2xl opacity-30 animate-pulse-glow" />
                <img
                  src={currentManga.cover}
                  alt={currentManga.title}
                  className="relative w-full h-[480px] object-cover rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
        <Button
          variant="glass"
          size="icon"
          onClick={() => {
            setIsAutoPlaying(false);
            prevSlide();
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex gap-2">
          {topRatedManga.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/50 hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        <Button
          variant="glass"
          size="icon"
          onClick={() => {
            setIsAutoPlaying(false);
            nextSlide();
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </section>
  );
};

export default HeroSlider;
