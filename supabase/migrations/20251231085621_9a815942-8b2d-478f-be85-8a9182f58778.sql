-- Create storage bucket for manga chapters
INSERT INTO storage.buckets (id, name, public) 
VALUES ('manga-chapters', 'manga-chapters', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to manga chapters
CREATE POLICY "Public read access for manga chapters"
ON storage.objects FOR SELECT
USING (bucket_id = 'manga-chapters');

-- Allow admins/owners to upload manga chapters
CREATE POLICY "Admins can upload manga chapters"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'manga-chapters' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

-- Allow admins/owners to update manga chapters
CREATE POLICY "Admins can update manga chapters"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'manga-chapters' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);

-- Allow admins/owners to delete manga chapters
CREATE POLICY "Admins can delete manga chapters"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'manga-chapters' 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'owner'::app_role))
);