-- Create telegram sessions table for tracking upload sessions
CREATE TABLE public.telegram_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id text NOT NULL UNIQUE,
  manga_id uuid REFERENCES public.manga(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  images text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (bot uses service role)
CREATE POLICY "Service role can manage telegram sessions"
ON public.telegram_sessions
FOR ALL
USING (true)
WITH CHECK (true);