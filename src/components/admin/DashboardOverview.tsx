import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, Users, Eye, TrendingUp, Clock, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface Stats {
  totalManga: number;
  totalUsers: number;
  totalViews: number;
  totalChapters: number;
}

const DashboardOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalManga: 0,
    totalUsers: 0,
    totalViews: 0,
    totalChapters: 0,
  });
  const [recentManga, setRecentManga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentManga();
  }, []);

  const fetchStats = async () => {
    try {
      const [mangaRes, usersRes, chaptersRes] = await Promise.all([
        supabase.from('manga').select('id, view_count'),
        supabase.from('profiles').select('id'),
        supabase.from('chapters').select('id'),
      ]);

      const totalViews = mangaRes.data?.reduce((acc, m) => acc + (m.view_count || 0), 0) || 0;

      setStats({
        totalManga: mangaRes.data?.length || 0,
        totalUsers: usersRes.data?.length || 0,
        totalViews,
        totalChapters: chaptersRes.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentManga = async () => {
    try {
      const { data } = await supabase
        .from('manga')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentManga(data || []);
    } catch (error) {
      console.error('Error fetching recent manga:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Manga', value: stats.totalManga, icon: BookMarked, color: 'text-primary' },
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-accent' },
    { title: 'Total Views', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-green-500' },
    { title: 'Total Chapters', value: stats.totalChapters, icon: TrendingUp, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display tracking-wide">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome to the admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Manga */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Recent Manga
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : recentManga.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No manga found</p>
          ) : (
            <div className="space-y-4">
              {recentManga.map((manga) => (
                <div
                  key={manga.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <img
                    src={manga.cover_url || '/placeholder.svg'}
                    alt={manga.title}
                    className="h-14 w-10 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{manga.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {manga.status} • {manga.genres?.slice(0, 3).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {manga.rating?.toFixed(1) || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
