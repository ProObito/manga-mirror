import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  X,
  Home,
  Maximize,
  Minimize,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockManga } from '@/lib/mock-data';

const Reader = () => {
  const { mangaId, chapterId } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showChapterList, setShowChapterList] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const manga = mockManga.find((m) => m.id === mangaId);
  const chapter = manga?.chapters.find((c) => c.id === chapterId);
  const chapterIndex = manga?.chapters.findIndex((c) => c.id === chapterId) || 0;

  // Sample pages for demo
  const pages = [
    'https://images.unsplash.com/photo-1612178537253-bccd437b730e?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800&h=1200&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=1200&fit=crop',
  ];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setShowChapterList(false);
      }
    },
    [pages.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const goToPrevChapter = () => {
    if (manga && chapterIndex > 0) {
      const prevChapter = manga.chapters[chapterIndex - 1];
      navigate(`/read/${mangaId}/${prevChapter.id}`);
      setCurrentPage(0);
    }
  };

  const goToNextChapter = () => {
    if (manga && chapterIndex < manga.chapters.length - 1) {
      const nextChapter = manga.chapters[chapterIndex + 1];
      navigate(`/read/${mangaId}/${nextChapter.id}`);
      setCurrentPage(0);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!manga || !chapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chapter not found</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${chapter.title} - ${manga.title} | MangaHub`}</title>
      </Helmet>

      <div
        className="min-h-screen bg-black text-foreground relative select-none"
        onClick={() => setShowControls(!showControls)}
      >
        {/* Top Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background to-transparent p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Link to={`/manga/${mangaId}`}>
                    <Button variant="glass" size="icon">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                  </Link>
                  <div>
                    <h1 className="text-foreground font-medium line-clamp-1">{manga.title}</h1>
                    <p className="text-sm text-muted-foreground">{chapter.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={() => setShowChapterList(true)}
                  >
                    <List className="h-5 w-5" />
                  </Button>
                  <Button variant="glass" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                  <Link to="/">
                    <Button variant="glass" size="icon">
                      <Home className="h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen">
          <motion.img
            key={currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-h-screen max-w-full object-contain"
          />
        </div>

        {/* Navigation Areas */}
        <div
          className="fixed left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPage((prev) => Math.max(prev - 1, 0));
          }}
        />
        <div
          className="fixed right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
          }}
        />

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background to-transparent p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="container mx-auto">
                {/* Progress Bar */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm text-muted-foreground w-12">
                    {currentPage + 1}/{pages.length}
                  </span>
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Chapter Navigation */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="glass"
                    onClick={goToPrevChapter}
                    disabled={chapterIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Prev Chapter
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1))
                      }
                      disabled={currentPage === pages.length - 1}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    variant="glass"
                    onClick={goToNextChapter}
                    disabled={chapterIndex === manga.chapters.length - 1}
                  >
                    Next Chapter
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chapter List Sidebar */}
        <AnimatePresence>
          {showChapterList && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                onClick={() => setShowChapterList(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween' }}
                className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border z-50 overflow-y-auto"
              >
                <div className="sticky top-0 bg-card p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display text-lg">Chapters</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChapterList(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-2">
                  {manga.chapters.slice().reverse().map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        navigate(`/read/${mangaId}/${ch.id}`);
                        setCurrentPage(0);
                        setShowChapterList(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        ch.id === chapterId
                          ? 'bg-primary/20 text-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <span className="font-medium">{ch.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Reader;
