-- Add publish status to manga
ALTER TABLE public.manga ADD COLUMN IF NOT EXISTS publish_status text NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published'));

-- Add download count to chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;

-- Add chapter type for PDF vs images
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS chapter_type text DEFAULT 'images' CHECK (chapter_type IN ('images', 'pdf'));

-- Add PDF URL for PDF chapters
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS pdf_url text;

-- Add user theme preference to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'dark';

-- Create scraper queue table
CREATE TABLE IF NOT EXISTS public.scraper_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL,
  manga_url text NOT NULL,
  manga_id uuid REFERENCES public.manga(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority integer DEFAULT 0,
  retry_count integer DEFAULT 0,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on scraper_queue
ALTER TABLE public.scraper_queue ENABLE ROW LEVEL SECURITY;

-- Only admins/owners can manage queue
CREATE POLICY "Admins can manage scraper queue" ON public.scraper_queue
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role));

-- Create index for queue processing
CREATE INDEX IF NOT EXISTS idx_scraper_queue_status ON public.scraper_queue(status, priority DESC, created_at ASC);