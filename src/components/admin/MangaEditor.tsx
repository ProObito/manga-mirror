import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Chapter {
  id?: string;
  number: number;
  title: string;
  images: string[];
  is_locked: boolean;
  token_cost: number;
}

const MangaEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manga, setManga] = useState({
    title: '',
    alternative_names: [] as string[],
    cover_url: '',
    summary: '',
    genres: [] as string[],
    author: '',
    artist: '',
    status: 'ongoing',
    released: '',
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [altNameInput, setAltNameInput] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      fetchManga(id);
    }
  }, [id, isEditing]);

  const fetchManga = async (mangaId: string) => {
    setLoading(true);
    try {
      const { data: mangaData, error: mangaError } = await supabase
        .from('manga')
        .select('*')
        .eq('id', mangaId)
        .single();

      if (mangaError) throw mangaError;

      setManga({
        title: mangaData.title || '',
        alternative_names: mangaData.alternative_names || [],
        cover_url: mangaData.cover_url || '',
        summary: mangaData.summary || '',
        genres: mangaData.genres || [],
        author: mangaData.author || '',
        artist: mangaData.artist || '',
        status: mangaData.status || 'ongoing',
        released: mangaData.released || '',
      });

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', mangaId)
        .order('number', { ascending: true });

      if (chaptersData) {
        setChapters(
          chaptersData.map((c) => ({
            id: c.id,
            number: Number(c.number),
            title: c.title || '',
            images: c.images || [],
            is_locked: c.is_locked || false,
            token_cost: c.token_cost || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching manga:', error);
      toast.error('Failed to fetch manga');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!manga.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      let mangaId = id;

      if (isEditing) {
        const { error } = await supabase
          .from('manga')
          .update({
            title: manga.title,
            alternative_names: manga.alternative_names,
            cover_url: manga.cover_url,
            summary: manga.summary,
            genres: manga.genres,
            author: manga.author,
            artist: manga.artist,
            status: manga.status,
            released: manga.released,
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('manga')
          .insert({
            title: manga.title,
            alternative_names: manga.alternative_names,
            cover_url: manga.cover_url,
            summary: manga.summary,
            genres: manga.genres,
            author: manga.author,
            artist: manga.artist,
            status: manga.status,
            released: manga.released,
          })
          .select()
          .single();

        if (error) throw error;
        mangaId = data.id;
      }

      // Save chapters
      for (const chapter of chapters) {
        if (chapter.id) {
          await supabase
            .from('chapters')
            .update({
              number: chapter.number,
              title: chapter.title,
              images: chapter.images,
              is_locked: chapter.is_locked,
              token_cost: chapter.token_cost,
            })
            .eq('id', chapter.id);
        } else {
          await supabase.from('chapters').insert({
            manga_id: mangaId,
            number: chapter.number,
            title: chapter.title,
            images: chapter.images,
            is_locked: chapter.is_locked,
            token_cost: chapter.token_cost,
          });
        }
      }

      toast.success(isEditing ? 'Manga updated' : 'Manga created');
      navigate('/admin/manga');
    } catch (error: any) {
      console.error('Error saving manga:', error);
      toast.error(error.message || 'Failed to save manga');
    } finally {
      setSaving(false);
    }
  };

  const addGenre = () => {
    if (genreInput && !manga.genres.includes(genreInput)) {
      setManga({ ...manga, genres: [...manga.genres, genreInput] });
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setManga({ ...manga, genres: manga.genres.filter((g) => g !== genre) });
  };

  const addAltName = () => {
    if (altNameInput && !manga.alternative_names.includes(altNameInput)) {
      setManga({ ...manga, alternative_names: [...manga.alternative_names, altNameInput] });
      setAltNameInput('');
    }
  };

  const addChapter = () => {
    const nextNumber = chapters.length > 0 ? Math.max(...chapters.map((c) => c.number)) + 1 : 1;
    setChapters([
      ...chapters,
      {
        number: nextNumber,
        title: `Chapter ${nextNumber}`,
        images: [],
        is_locked: false,
        token_cost: 0,
      },
    ]);
  };

  const updateChapter = (index: number, updates: Partial<Chapter>) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], ...updates };
    setChapters(updated);
  };

  const removeChapter = async (index: number) => {
    const chapter = chapters[index];
    if (chapter.id) {
      await supabase.from('chapters').delete().eq('id', chapter.id);
    }
    setChapters(chapters.filter((_, i) => i !== index));
    toast.success('Chapter removed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/manga')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display tracking-wide">
            {isEditing ? 'Edit Manga' : 'Add New Manga'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? 'Update manga details and chapters' : 'Create a new manga entry'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={manga.title}
                  onChange={(e) => setManga({ ...manga, title: e.target.value })}
                  placeholder="Enter manga title"
                />
              </div>

              <div className="space-y-2">
                <Label>Alternative Names</Label>
                <div className="flex gap-2">
                  <Input
                    value={altNameInput}
                    onChange={(e) => setAltNameInput(e.target.value)}
                    placeholder="Add alternative name"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAltName())}
                  />
                  <Button variant="outline" onClick={addAltName}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {manga.alternative_names.map((name) => (
                    <span
                      key={name}
                      className="bg-muted px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {name}
                      <button onClick={() => setManga({ ...manga, alternative_names: manga.alternative_names.filter(n => n !== name) })}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Summary</Label>
                <Textarea
                  value={manga.summary}
                  onChange={(e) => setManga({ ...manga, summary: e.target.value })}
                  placeholder="Enter manga summary"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  <Input
                    value={manga.author}
                    onChange={(e) => setManga({ ...manga, author: e.target.value })}
                    placeholder="Author name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Artist</Label>
                  <Input
                    value={manga.artist}
                    onChange={(e) => setManga({ ...manga, artist: e.target.value })}
                    placeholder="Artist name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={manga.status}
                    onValueChange={(value) => setManga({ ...manga, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="hiatus">Hiatus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Released Year</Label>
                  <Input
                    value={manga.released}
                    onChange={(e) => setManga({ ...manga, released: e.target.value })}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Genres</Label>
                <div className="flex gap-2">
                  <Input
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    placeholder="Add genre"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                  />
                  <Button variant="outline" onClick={addGenre}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {manga.genres.map((genre) => (
                    <span
                      key={genre}
                      className="bg-primary/20 text-primary px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {genre}
                      <button onClick={() => removeGenre(genre)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapters */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chapters
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addChapter} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Chapter
              </Button>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No chapters yet. Click "Add Chapter" to create one.
                </p>
              ) : (
                <div className="space-y-4">
                  {chapters.map((chapter, index) => (
                    <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Chapter {chapter.number}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeChapter(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Chapter Number</Label>
                          <Input
                            type="number"
                            value={chapter.number}
                            onChange={(e) => updateChapter(index, { number: parseFloat(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={chapter.title}
                            onChange={(e) => updateChapter(index, { title: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Image URLs (one per line)</Label>
                        <Textarea
                          value={chapter.images.join('\n')}
                          onChange={(e) => updateChapter(index, { images: e.target.value.split('\n').filter(Boolean) })}
                          placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Token Cost</Label>
                          <Input
                            type="number"
                            value={chapter.token_cost}
                            onChange={(e) => updateChapter(index, { token_cost: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-5">
                          <input
                            type="checkbox"
                            checked={chapter.is_locked}
                            onChange={(e) => updateChapter(index, { is_locked: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <Label className="text-xs">Locked</Label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-[3/4] rounded-lg border border-border overflow-hidden bg-muted">
                {manga.cover_url ? (
                  <img
                    src={manga.cover_url}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No cover
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Cover URL</Label>
                <Input
                  value={manga.cover_url}
                  onChange={(e) => setManga({ ...manga, cover_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <Button
                variant="hero"
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  isEditing ? 'Update Manga' : 'Create Manga'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MangaEditor;
