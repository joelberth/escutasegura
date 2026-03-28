-- Create a table for site settings
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    logo_url TEXT,
    site_name TEXT DEFAULT 'Escola Segura Report',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for site settings
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Site settings are viewable by everyone') THEN
        CREATE POLICY "Site settings are viewable by everyone" 
        ON public.site_settings 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update site settings') THEN
        CREATE POLICY "Admins can update site settings" 
        ON public.site_settings 
        FOR ALL 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() AND role = 'admin'
          )
        );
    END IF;
END $$;

-- Initial row
INSERT INTO public.site_settings (id, logo_url, site_name) 
VALUES ('global', NULL, 'Escola Segura Report') 
ON CONFLICT (id) DO NOTHING;

-- Create bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('site_assets', 'site_assets', true) 
ON CONFLICT (id) DO NOTHING;

-- Policies for site assets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Site assets are publicly accessible') THEN
        CREATE POLICY "Site assets are publicly accessible" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'site_assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can upload site assets') THEN
        CREATE POLICY "Admins can upload site assets" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'site_assets' AND EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        ));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update/delete site assets') THEN
        CREATE POLICY "Admins can update/delete site assets" 
        ON storage.objects 
        FOR ALL 
        USING (bucket_id = 'site_assets' AND EXISTS (
          SELECT 1 FROM public.user_roles 
          WHERE user_id = auth.uid() AND role = 'admin'
        ));
    END IF;
END $$;
