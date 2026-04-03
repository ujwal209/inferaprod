-- ADD SOURCES COLUMN TO ALL CHAT MESSAGE TABLES
ALTER TABLE public.chat_messages ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.study_messages ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.project_messages ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.roadmap_messages ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.resume_messages ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN public.chat_messages.sources IS 'Structured citation data: array of {title, url, domain}';
