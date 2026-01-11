import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, FileText, FolderUp, ChevronDown, ChevronUp, GripVertical, Save } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChapterUploader from './ChapterUploader';

interface Chapter {
  id?: string;
  number: number;
  title: string;
  images: string[];
  is_locked: boolean;
  token_cost: number;
}

interface MangaData {
  title: string;
  alternative_names: string[];
  cover_url: string;
  summary: string;
  genres: string[];
  author: string;
  artist: string;
  status: string;
  released: string;
}

const MangaEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manga, setManga] = useState<MangaData>({
    title: '',
    alternative_names: [],
    cover_url: '',
    summary: '',
    genres: [],
    author: '',
    artist: '',
    status: 'ongoing',
    released: '',
  });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const [altNameInput, setAltNameInput] = useState('');
  const [openUploaderIndex, setOpenUploaderIndex] = useState<number | null>(null);
  
  // Autosave and dirty state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const initialDataRef = useRef<{ manga: MangaData; chapters: Chapter[] } | null>(null);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Check if data has changed
  const checkForChanges = useCallback(() => {
    if (!initialDataRef.current) return false;
    const mangaChanged = JSON.stringify(manga) !== JSON.stringify(initialDataRef.current.manga);
    const chaptersChanged = JSON.stringify(chapters) !== JSON.stringify(initialDataRef.current.chapters);
    return mangaChanged || chaptersChanged;
  }, [manga, chapters]);

  // Update dirty state when data changes
  useEffect(() => {
    if (initialDataRef.current) {
      setHasUnsavedChanges(checkForChanges());
    }
  }, [manga, chapters, checkForChanges]);

  // Autosave effect
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges || !id) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 3000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [manga, chapters, isEditing, hasUnsavedChanges, id]);

  // Browser beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

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

      const loadedManga: MangaData = {
        title: mangaData.title || '',
        alternative_names: mangaData.alternative_names || [],
        cover_url: mangaData.cover_url || '',
        summary: mangaData.summary || '',
        genres: mangaData.genres || [],
        author: mangaData.author || '',
        artist: mangaData.artist || '',
        status: mangaData.status || 'ongoing',
        released: mangaData.released || '',
      };
      setManga(loadedManga);

      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .eq('manga_id', mangaId)
        .order('number', { ascending: true });

      const loadedChapters: Chapter[] = chaptersData
        ? chaptersData.map((c) => ({
            id: c.id,
            number: Number(c.number),
            title: c.title || '',
            images: c.images || [],
            is_locked: c.is_locked || false,
            token_cost: c.token_cost || 0,
          }))
        : [];
      setChapters(loadedChapters);

      // Store initial data for comparison
      initialDataRef.current = { manga: loadedManga, chapters: loadedChapters };
    } catch (error) {
      console.error('Error fetching manga:', error);
      toast.error('Failed to fetch manga');
    } finally {
      setLoading(false);
    }
  };

  const handleAutosave = async () => {
    if (!id || saving) return;

    setSaving(true);
    try {
      await supabase
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
          const { data } = await supabase
            .from('chapters')
            .insert({
              manga_id: id,
              number: chapter.number,
              title: chapter.title,
              images: chapter.images,
              is_locked: chapter.is_locked,
              token_cost: chapter.token_cost,
            })
            .select()
            .single();
          
          if (data) {
            // Update the chapter with the new ID
            setChapters(prev => prev.map(c => 
              c.number === chapter.number && !c.id ? { ...c, id: data.id } : c
            ));
          }
        }
      }

      // Update initial data reference
      initialDataRef.current = { manga, chapters };
      setHasUnsavedChanges(false);
      toast.success('Auto-saved', { duration: 1500 });
    } catch (error) {
      console.error('Autosave error:', error);
    } finally {
      setSaving(false);
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

      setHasUnsavedChanges(false);
      toast.success(isEditing ? 'Manga updated' : 'Manga created');
      navigate('/admin/manga');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save manga';
      console.error('Error saving manga:', error);
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation('/admin/manga');
      setShowExitDialog(true);
    } else {
      navigate('/admin/manga');
    }
  };

  const confirmNavigation = () => {
    setShowExitDialog(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
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
    setOpenUploaderIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      if (current > index) return current - 1;
      return current;
    });

    toast.success('Chapter removed');
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newChapters = [...chapters];
    const [draggedChapter] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, draggedChapter);

    // Renumber chapters based on new order
    const renumberedChapters = newChapters.map((chapter, index) => ({
      ...chapter,
      number: index + 1,
    }));

    setChapters(renumberedChapters);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
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
      {/* Unsaved changes dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleNavigateBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-display tracking-wide">
              {isEditing ? 'Edit Manga' : 'Add New Manga'}
            </h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
            {saving && (
              <span className="text-xs text-primary flex items-center gap-1">
                <Save className="h-3 w-3 animate-pulse" />
                Saving...
              </span>
            )}
          </div>
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
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Chapters
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Drag to reorder chapters</p>
              </div>
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
                <div className="space-y-2">
                  {chapters.map((chapter, index) => {
                    const showUploader = openUploaderIndex === index;
                    const isDragging = draggedIndex === index;
                    const isDragOver = dragOverIndex === index;

                    return (
                      <div
                        key={chapter.id ?? `new-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={() => handleDrop(index)}
                        onDragEnd={handleDragEnd}
                        className={`border rounded-lg p-4 space-y-3 transition-all cursor-move ${
                          isDragging ? 'opacity-50 border-primary' : 'border-border'
                        } ${isDragOver ? 'border-primary border-2 bg-primary/5' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Chapter {chapter.number}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setOpenUploaderIndex(showUploader ? null : index)}
                              className="gap-1"
                            >
                              <FolderUp className="h-4 w-4" />
                              Upload
                              {showUploader ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeChapter(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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

                        {showUploader && id && (
                          <ChapterUploader
                            mangaId={id}
                            chapterNumber={chapter.number}
                            existingImages={chapter.images}
                            onUploadComplete={(urls) => updateChapter(index, { images: urls })}
                          />
                        )}

                        {!showUploader && (
                          <div className="space-y-1">
                            <Label className="text-xs">Image URLs ({chapter.images.length} images)</Label>
                            <Textarea
                              value={chapter.images.join('\n')}
                              onChange={(e) =>
                                updateChapter(index, {
                                  images: e.target.value.split('\n').filter(Boolean),
                                })
                              }
                              placeholder="https://example.com/page1.jpg&#10;https://example.com/page2.jpg"
                              rows={3}
                            />
                          </div>
                        )}

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
                    );
                  })}
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
