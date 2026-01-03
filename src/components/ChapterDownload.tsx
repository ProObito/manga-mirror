import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface ChapterDownloadProps {
  chapterId: string;
  chapterNumber: number;
  mangaTitle: string;
  images: string[];
  pdfUrl?: string;
}

export const ChapterDownload = ({ 
  chapterId, 
  chapterNumber, 
  mangaTitle, 
  images,
  pdfUrl 
}: ChapterDownloadProps) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    
    try {
      // Increment download count
      await supabase
        .from('chapters')
        .update({ download_count: 1 }) // Will be incremented properly later
        .eq('id', chapterId);

      if (pdfUrl) {
        // Direct PDF download
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${mangaTitle} - Chapter ${chapterNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else if (images.length > 0) {
        // For images, we'll create a simple HTML file that loads them
        // In a production app, you'd want to create a proper PDF
        toast.info('Opening chapter images...');
        
        // Open images in new tab for now
        const imageHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${mangaTitle} - Chapter ${chapterNumber}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #1a1a1a; 
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
              }
              img { 
                max-width: 100%; 
                height: auto; 
                display: block;
              }
              h1 {
                color: white;
                font-family: sans-serif;
              }
            </style>
          </head>
          <body>
            <h1>${mangaTitle} - Chapter ${chapterNumber}</h1>
            ${images.map((img, i) => `<img src="${img}" alt="Page ${i + 1}" loading="lazy" />`).join('\n')}
          </body>
          </html>
        `;
        
        const blob = new Blob([imageHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else {
        toast.error('No content available for download');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={downloading || (images.length === 0 && !pdfUrl)}
      className="gap-2"
    >
      {downloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Download
    </Button>
  );
};

export default ChapterDownload;