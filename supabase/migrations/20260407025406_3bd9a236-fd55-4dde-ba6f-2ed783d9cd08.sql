ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS payment_completed_at timestamptz;