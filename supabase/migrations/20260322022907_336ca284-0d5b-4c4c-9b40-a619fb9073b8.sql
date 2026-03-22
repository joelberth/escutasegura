
ALTER TABLE public.gestores
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN approved boolean NOT NULL DEFAULT false;
