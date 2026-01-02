import { useState, useCallback } from 'react';
import { Upload, X, Loader2, FolderUp, Image as ImageIcon, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChapterUploaderProps {
  mangaId: string;
  chapterNumber: number;
  onUploadComplete: (imageUrls: string[]) => void;
  existingImages?: string[];
}

interface UploadedImage {
  file: File;
  preview: string;
  uploaded: boolean;
  url?: string;
}

export const ChapterUploader = ({
  mangaId,
  chapterNumber,
  onUploadComplete,
  existingImages = [],
}: ChapterUploaderProps) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') || file.type === 'application/pdf'
    );

    // Sort files by name to maintain order
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const newImages: UploadedImage[] = imageFiles.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      uploaded: false
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const items = e.dataTransfer.items;
    const files: File[] = [];

    const processEntry = async (entry: FileSystemEntry): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          (entry as FileSystemFileEntry).file((file) => {
            if (file.type.startsWith('image/')) {
              resolve([file]);
            } else {
              resolve([]);
            }
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
        return new Promise((resolve) => {
          dirReader.readEntries(async (entries) => {
            const allFiles: File[] = [];
            for (const ent of entries) {
              const entryFiles = await processEntry(ent);
              allFiles.push(...entryFiles);
            }
            resolve(allFiles);
          });
        });
      }
      return [];
    };

    const processItems = async () => {
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) {
          const entryFiles = await processEntry(entry);
          files.push(...entryFiles);
        }
      }

      // Sort files by name
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      const newImages: UploadedImage[] = files.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploaded: false
      }));

      setImages(prev => [...prev, ...newImages]);
    };

    processItems();
  }, []);

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const uploadImages = async () => {
    if (images.length === 0) {
      toast.error('No images to upload');
      return;
    }

    setUploading(true);
    setProgress(0);

    const uploadedUrls: string[] = [...existingImages];
    const totalImages = images.filter(img => !img.uploaded).length;
    let uploadedCount = 0;

    try {
      for (let i = 0; i < images.length; i++) {
        if (images[i].uploaded) continue;

        const image = images[i];
        const ext = image.file.name.split('.').pop() || 'jpg';
        const fileName = `${String(i + 1).padStart(3, '0')}.${ext}`;
        const storagePath = `${mangaId}/chapter-${chapterNumber}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('manga-chapters')
          .upload(storagePath, image.file, {
            contentType: image.file.type,
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Failed to upload ${image.file.name}`);
          continue;
        }

        const { data: publicUrl } = supabase.storage
          .from('manga-chapters')
          .getPublicUrl(storagePath);

        uploadedUrls.push(publicUrl.publicUrl);
        
        setImages(prev => {
          const updated = [...prev];
          updated[i] = { ...updated[i], uploaded: true, url: publicUrl.publicUrl };
          return updated;
        });

        uploadedCount++;
        setProgress(Math.round((uploadedCount / totalImages) * 100));
      }

      toast.success(`Uploaded ${uploadedCount} images`);
      onUploadComplete(uploadedUrls);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderUp className="h-5 w-5" />
          Upload Chapter Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-primary bg-primary/10' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            Drag and drop images or folders here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports: JPG, PNG, WEBP, GIF
          </p>
          <div className="flex gap-2 justify-center">
            <Label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Button variant="outline" asChild>
                <span className="gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Select Images
                </span>
              </Button>
            </Label>
            <Label className="cursor-pointer">
              <Input
                type="file"
                accept="image/*"
                multiple
                // @ts-ignore - webkitdirectory is valid but not in types
                webkitdirectory=""
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <Button variant="outline" asChild>
                <span className="gap-2">
                  <FolderUp className="h-4 w-4" />
                  Select Folder
                </span>
              </Button>
            </Label>
          </div>
        </div>

        {/* Preview Grid */}
        {images.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {images.length} images selected
              </span>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-muted/30 rounded-lg">
              {images.map((image, index) => (
                <div key={index} className="relative group aspect-[3/4]">
                  {image.preview ? (
                    <img
                      src={image.preview}
                      alt={`Page ${index + 1}`}
                      className={`w-full h-full object-cover rounded border ${
                        image.uploaded ? 'border-green-500' : 'border-border'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted rounded border border-border flex items-center justify-center">
                      <FileUp className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-0 left-0 right-0 bg-background/80 text-xs text-center py-0.5">
                    {index + 1}
                  </span>
                  {!uploading && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {image.uploaded && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-500 text-xs font-bold">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  Uploading... {progress}%
                </p>
              </div>
            )}

            <Button 
              onClick={uploadImages} 
              disabled={uploading || images.every(img => img.uploaded)}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {images.filter(img => !img.uploaded).length} Images
                </>
              )}
            </Button>
          </div>
        )}

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">
              {existingImages.length} existing images
            </p>
            <div className="grid grid-cols-6 gap-1">
              {existingImages.slice(0, 12).map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Existing ${index + 1}`}
                  className="w-full aspect-[3/4] object-cover rounded border border-border"
                />
              ))}
              {existingImages.length > 12 && (
                <div className="w-full aspect-[3/4] bg-muted rounded border border-border flex items-center justify-center text-muted-foreground text-sm">
                  +{existingImages.length - 12}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChapterUploader;
