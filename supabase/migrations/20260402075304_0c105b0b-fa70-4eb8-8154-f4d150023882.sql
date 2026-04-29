
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chat_unlocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS projects_unlocked BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creators_unlocked BOOLEAN DEFAULT false;
