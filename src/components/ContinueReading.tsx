import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';

interface ReadingHistoryItem {
  id: string;
  manga_id: string;
  chapter_id: string;
  page: number;
  last_read: string;
  manga: {
    id: string;
    title: string;
    cover_url: string | null;
  };
  chapter: {
    id: string;
    number: number;
    title: string | null;
    images?: string[] | null;
  };
}

export function ContinueReading() {
  const { user } = useAuth();
  const { getAllHistory } = useReadingProgress();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAllHistory();
        setHistory((data?.slice(0, 6) || []) as ReadingHistoryItem[]);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, getAllHistory]);

  if (!user) return null;
  if (loading) return null;
  if (history.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-display font-bold">Continue Reading</h2>
          </div>
          <Link to="/library">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {history.map((item, index) => {
            const totalPages = item.chapter?.images?.length || 1;
            const progressPercent = Math.round((item.page / totalPages) * 100);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={`/read/${item.manga_id}/${item.chapter_id}`}>
                  <Card className="group overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all">
                    <div className="relative aspect-[3/4]">
                      <img
                        src={item.manga?.cover_url || '/placeholder.svg'}
                        alt={item.manga?.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                      
                      {/* Progress overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <Progress value={progressPercent} className="h-1 mb-2" />
                        <p className="text-xs text-muted-foreground truncate">
                          Ch. {item.chapter?.number} • Page {item.page + 1}/{totalPages}
                        </p>
                      </div>

                      {/* Continue badge */}
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.last_read), { addSuffix: false })}
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {item.manga?.title}
                      </h3>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
