import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookMarked, Plus, Search, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import MangaEditor from './MangaEditor';

interface MangaItem {
  id: string;
  title: string;
  cover_url: string | null;
  status: string | null;
  genres: string[] | null;
  view_count: number | null;
  rating: number | null;
  created_at: string | null;
}

const MangaList = () => {
  const [manga, setManga] = useState<MangaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchManga();
  }, []);

  const fetchManga = async () => {
    try {
      const { data, error } = await supabase
        .from('manga')
        .select('id, title, cover_url, status, genres, view_count, rating, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setManga(data || []);
    } catch (error) {
      console.error('Error fetching manga:', error);
      toast.error('Failed to fetch manga');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // First delete all chapters
      await supabase.from('chapters').delete().eq('manga_id', id);
      
      // Then delete the manga
      const { error } = await supabase.from('manga').delete().eq('id', id);
      if (error) throw error;

      toast.success('Manga deleted successfully');
      fetchManga();
    } catch (error) {
      console.error('Error deleting manga:', error);
      toast.error('Failed to delete manga');
    }
  };

  const filteredManga = manga.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Ongoing</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">Completed</Badge>;
      case 'hiatus':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Hiatus</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display tracking-wide flex items-center gap-3">
            <BookMarked className="h-8 w-8 text-primary" />
            Manga Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage your manga library</p>
        </div>
        <Button variant="hero" className="gap-2" onClick={() => navigate('/admin/manga/new')}>
          <Plus className="h-4 w-4" />
          Add Manga
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search manga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredManga.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No manga found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredManga.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={m.cover_url || '/placeholder.svg'}
                          alt={m.title}
                          className="h-12 w-9 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium">{m.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.genres?.slice(0, 2).join(', ')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(m.status)}</TableCell>
                    <TableCell>{m.view_count?.toLocaleString() || 0}</TableCell>
                    <TableCell>{m.rating?.toFixed(1) || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/manga/${m.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/admin/manga/edit/${m.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Manga?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{m.title}" and all its chapters.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(m.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const MangaManagement = () => {
  return (
    <Routes>
      <Route index element={<MangaList />} />
      <Route path="new" element={<MangaEditor />} />
      <Route path="edit/:id" element={<MangaEditor />} />
    </Routes>
  );
};

export default MangaManagement;
