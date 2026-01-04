import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PDFUploaderProps {
  mangaId: string;
  chapterNumber: number;
  onUploadComplete: (pdfUrl: string) => void;
  existingPdfUrl?: string;
}

export function PDFUploader({
  mangaId,
  chapterNumber,
  onUploadComplete,
  existingPdfUrl,
}: PDFUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const pdfFile = files[0];
    if (pdfFile.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    setFile(pdfFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const uploadPDF = async () => {
    if (!file) {
      toast.error('No PDF file selected');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileName = `chapter-${chapterNumber}.pdf`;
      const storagePath = `${mangaId}/pdf/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('manga-chapters')
        .upload(storagePath, file, {
          contentType: 'application/pdf',
          upsert: true,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Failed to upload PDF');
        return;
      }

      const { data: publicUrl } = supabase.storage
        .from('manga-chapters')
        .getPublicUrl(storagePath);

      setProgress(100);
      toast.success('PDF uploaded successfully');
      onUploadComplete(publicUrl.publicUrl);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload PDF Chapter
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
          <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            Drag and drop a PDF file here
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Supports: PDF files only
          </p>
          <Label className="cursor-pointer">
            <Input
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Button variant="outline" asChild>
              <span className="gap-2">
                <Upload className="h-4 w-4" />
                Select PDF
              </span>
            </Button>
          </Label>
        </div>

        {/* Selected File */}
        {file && (
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            {!uploading && (
              <Button variant="ghost" size="icon" onClick={removeFile}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-center text-muted-foreground">
              Uploading... {progress}%
            </p>
          </div>
        )}

        {/* Upload Button */}
        {file && (
          <Button 
            onClick={uploadPDF} 
            disabled={uploading}
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
                Upload PDF
              </>
            )}
          </Button>
        )}

        {/* Existing PDF */}
        {existingPdfUrl && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium text-sm text-green-500">PDF Uploaded</p>
                  <a 
                    href={existingPdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    View PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
