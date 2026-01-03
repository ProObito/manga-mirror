import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Upload, 
  BookOpen, 
  Image as ImageIcon,
  Save,
  Eye,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MangaData {
  title: string;
  summary: string;
  genres: string[];
  status: string;
  author: string;
  artist: string;
  cover_url: string;
  alternative_names: string[];
  released: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', icon: BookOpen },
  { id: 2, title: 'Cover Image', icon: ImageIcon },
  { id: 3, title: 'Details', icon: BookOpen },
  { id: 4, title: 'Review', icon: Eye },
];

const COMMON_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
  'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  'Thriller', 'Isekai', 'Martial Arts', 'School Life', 'Psychological', 'Historical'
];

export const MangaCreationWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [genreInput, setGenreInput] = useState('');
  
  const [manga, setManga] = useState<MangaData>({
    title: '',
    summary: '',
    genres: [],
    status: 'ongoing',
    author: '',
    artist: '',
    cover_url: '',
    alternative_names: [],
    released: '',
  });

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const addGenre = (genre: string) => {
    if (genre && !manga.genres.includes(genre)) {
      setManga({ ...manga, genres: [...manga.genres, genre] });
      setGenreInput('');
    }
  };

  const removeGenre = (genre: string) => {
    setManga({ ...manga, genres: manga.genres.filter(g => g !== genre) });
  };

  const handleSave = async (publish: boolean) => {
    if (!manga.title) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      let coverUrl = manga.cover_url;

      // Upload cover if file selected
      if (coverFile) {
        const ext = coverFile.name.split('.').pop() || 'jpg';
        const fileName = `covers/${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('manga-chapters')
          .upload(fileName, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('manga-chapters')
          .getPublicUrl(fileName);
        
        coverUrl = urlData.publicUrl;
      }

      const { data, error } = await supabase
        .from('manga')
        .insert({
          title: manga.title,
          summary: manga.summary,
          genres: manga.genres,
          status: manga.status,
          author: manga.author,
          artist: manga.artist,
          cover_url: coverUrl,
          alternative_names: manga.alternative_names,
          released: manga.released,
          publish_status: publish ? 'published' : 'draft',
          source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(publish ? 'Manga published!' : 'Manga saved as draft');
      navigate(`/admin/manga/edit/${data.id}`);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save manga');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return manga.title.length > 0;
      case 2: return true; // Cover is optional
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/manga')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-display tracking-wide">Create New Manga</h1>
          <p className="text-muted-foreground">Step-by-step manga creation wizard</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step > s.id ? 'bg-primary border-primary text-primary-foreground' :
                step === s.id ? 'border-primary' : 'border-muted'
              }`}>
                {step > s.id ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className="hidden sm:block text-sm font-medium">{s.title}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s.id ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-card border-border">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 1 && (
              <>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Enter the manga title and description</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                      value={manga.title}
                      onChange={(e) => setManga({ ...manga, title: e.target.value })}
                      placeholder="Enter manga title"
                      className="text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Textarea
                      value={manga.summary}
                      onChange={(e) => setManga({ ...manga, summary: e.target.value })}
                      placeholder="Enter manga description/summary"
                      rows={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alternative Names</Label>
                    <Input
                      placeholder="Press Enter to add alternative names"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const value = (e.target as HTMLInputElement).value.trim();
                          if (value && !manga.alternative_names.includes(value)) {
                            setManga({ ...manga, alternative_names: [...manga.alternative_names, value] });
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manga.alternative_names.map((name) => (
                        <Badge key={name} variant="secondary" className="gap-1">
                          {name}
                          <button onClick={() => setManga({ 
                            ...manga, 
                            alternative_names: manga.alternative_names.filter(n => n !== name) 
                          })}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {step === 2 && (
              <>
                <CardHeader>
                  <CardTitle>Cover Image</CardTitle>
                  <CardDescription>Upload or link a cover image for the manga</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Upload Cover</Label>
                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                          <Label className="cursor-pointer">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverSelect}
                            />
                            <Button variant="outline" asChild>
                              <span>Choose Image</span>
                            </Button>
                          </Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Or paste URL</Label>
                        <Input
                          value={manga.cover_url}
                          onChange={(e) => {
                            setManga({ ...manga, cover_url: e.target.value });
                            setCoverPreview(e.target.value);
                            setCoverFile(null);
                          }}
                          placeholder="https://example.com/cover.jpg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Preview</Label>
                      <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-border">
                        {coverPreview ? (
                          <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No cover selected
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {step === 3 && (
              <>
                <CardHeader>
                  <CardTitle>Additional Details</CardTitle>
                  <CardDescription>Add genres, author, and other metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                      <Select value={manga.status} onValueChange={(value) => setManga({ ...manga, status: value })}>
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
                        placeholder="Add custom genre"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre(genreInput))}
                      />
                      <Button variant="outline" onClick={() => addGenre(genreInput)}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COMMON_GENRES.filter(g => !manga.genres.includes(g)).slice(0, 12).map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary/20"
                          onClick={() => addGenre(genre)}
                        >
                          + {genre}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manga.genres.map((genre) => (
                        <Badge key={genre} className="bg-primary/20 text-primary gap-1">
                          {genre}
                          <button onClick={() => removeGenre(genre)}>×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </>
            )}

            {step === 4 && (
              <>
                <CardHeader>
                  <CardTitle>Review & Save</CardTitle>
                  <CardDescription>Review your manga details before saving</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-border">
                      {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No cover
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h3 className="text-2xl font-display">{manga.title || 'Untitled'}</h3>
                        {manga.alternative_names.length > 0 && (
                          <p className="text-sm text-muted-foreground">{manga.alternative_names.join(', ')}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {manga.genres.map((g) => (
                          <Badge key={g} variant="secondary">{g}</Badge>
                        ))}
                      </div>
                      <p className="text-muted-foreground">{manga.summary || 'No summary provided'}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Author:</span> {manga.author || 'Unknown'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Artist:</span> {manga.artist || 'Unknown'}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span> {manga.status}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Released:</span> {manga.released || 'Unknown'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {step === 4 ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                Publish
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MangaCreationWizard;