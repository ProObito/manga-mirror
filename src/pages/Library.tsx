import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Heart, Bookmark, Clock, Settings, Crown, Download, User, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { formatDistanceToNow } from 'date-fns';

interface MangaItem {
  id: string;
  title: string;
  cover_url: string | null;
}

interface BookmarkItem {
  id: string;
  manga_id: string;
  created_at: string;
  manga: MangaItem;
}

interface FavoriteItem {
  id: string;
  manga_id: string;
  created_at: string;
  manga: MangaItem;
}

interface HistoryItem {
  id: string;
  manga_id: string;
  chapter_id: string;
  page: number | null;
  last_read: string;
  manga: MangaItem;
  chapter: { id: string; number: number; title: string | null };
}

const Library = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, getRemainingDownloads, maxFreeDownloads } = useUserProfile();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reading');

  useEffect(() => {
    if (user) {
      fetchLibraryData();
    }
  }, [user]);

  const fetchLibraryData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [bookmarksRes, favoritesRes, historyRes] = await Promise.all([
        supabase
          .from('bookmarks')
          .select(`*, manga:manga_id (id, title, cover_url)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('favorites')
          .select(`*, manga:manga_id (id, title, cover_url)`)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reading_history')
          .select(`*, manga:manga_id (id, title, cover_url), chapter:chapter_id (id, number, title)`)
          .eq('user_id', user.id)
          .order('last_read', { ascending: false })
          .limit(50),
      ]);

      if (bookmarksRes.data) setBookmarks(bookmarksRes.data as BookmarkItem[]);
      if (favoritesRes.data) setFavorites(favoritesRes.data as FavoriteItem[]);
      if (historyRes.data) setHistory(historyRes.data as HistoryItem[]);
    } catch (error) {
      console.error('Error fetching library data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const removeFavorite = async (id: string) => {
    await supabase.from('favorites').delete().eq('id', id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from('reading_history').delete().eq('user_id', user.id);
    setHistory([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const remainingDownloads = getRemainingDownloads();
  const downloadProgress = profile?.isPremium ? 100 : ((maxFreeDownloads - remainingDownloads) / maxFreeDownloads) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {profile?.displayName?.[0] || user.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile?.isPremium && profile.customLogoUrl && (
                  <img 
                    src={profile.customLogoUrl} 
                    alt="Custom Logo" 
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 border-background"
                  />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile?.displayName || 'Reader'}</h1>
                  {profile?.isPremium && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link to="/settings">
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </Link>
              {!profile?.isPremium && (
                <Button variant="hero" className="gap-2">
                  <Crown className="h-4 w-4" />
                  Upgrade to Premium
                </Button>
              )}
            </div>
          </div>

          {/* Download Limit Card */}
          <Card className="mb-8 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Download Limit</h3>
                    <p className="text-sm text-muted-foreground">
                      {profile?.isPremium 
                        ? 'Unlimited downloads with Premium'
                        : `${remainingDownloads} of ${maxFreeDownloads} chapters remaining this month`
                      }
                    </p>
                  </div>
                </div>
                {!profile?.isPremium && (
                  <Button variant="outline" size="sm">
                    <Crown className="h-4 w-4 mr-2 text-amber-500" />
                    Go Unlimited
                  </Button>
                )}
              </div>
              {!profile?.isPremium && (
                <Progress value={downloadProgress} className="h-2" />
              )}
            </CardContent>
          </Card>

          {/* Library Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="reading" className="gap-2">
                <Clock className="h-4 w-4" />
                History ({history.length})
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Bookmarks ({bookmarks.length})
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favorites ({favorites.length})
              </TabsTrigger>
            </TabsList>

            {/* Reading History */}
            <TabsContent value="reading">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Reading History
                  </CardTitle>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No reading history yet</p>
                      <Link to="/browse">
                        <Button variant="outline" className="mt-4">Browse Manga</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {history.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Link 
                              to={`/read/${item.manga_id}/${item.chapter_id}`}
                              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <img 
                                src={item.manga?.cover_url || '/placeholder.svg'} 
                                alt={item.manga?.title}
                                className="w-16 h-24 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate group-hover:text-primary transition-colors">
                                  {item.manga?.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Chapter {item.chapter?.number}{item.chapter?.title ? `: ${item.chapter.title}` : ''}
                                </p>
                                {item.page && (
                                  <p className="text-xs text-muted-foreground">Page {item.page}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(item.last_read), { addSuffix: true })}
                                </p>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </Link>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookmarks */}
            <TabsContent value="bookmarks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bookmark className="h-5 w-5 text-primary" />
                    Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                    </div>
                  ) : bookmarks.length === 0 ? (
                    <div className="text-center py-12">
                      <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No bookmarks yet</p>
                      <Link to="/browse">
                        <Button variant="outline" className="mt-4">Browse Manga</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {bookmarks.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative"
                          >
                            <Link to={`/manga/${item.manga_id}`}>
                              <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                                <img 
                                  src={item.manga?.cover_url || '/placeholder.svg'} 
                                  alt={item.manga?.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <h4 className="mt-2 text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {item.manga?.title}
                              </h4>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => { e.preventDefault(); removeBookmark(item.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                    </div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">No favorites yet</p>
                      <Link to="/browse">
                        <Button variant="outline" className="mt-4">Browse Manga</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {favorites.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: index * 0.05 }}
                            className="group relative"
                          >
                            <Link to={`/manga/${item.manga_id}`}>
                              <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                                <img 
                                  src={item.manga?.cover_url || '/placeholder.svg'} 
                                  alt={item.manga?.title}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <h4 className="mt-2 text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {item.manga?.title}
                              </h4>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => { e.preventDefault(); removeFavorite(item.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Library;
