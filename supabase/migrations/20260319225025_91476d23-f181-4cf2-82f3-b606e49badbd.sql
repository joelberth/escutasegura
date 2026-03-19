
-- Create enum for report types
CREATE TYPE public.tipo_denuncia AS ENUM ('bullying', 'estrutural', 'comunicacao', 'outro');

-- Create enum for urgency levels
CREATE TYPE public.nivel_urgencia AS ENUM ('baixa', 'media', 'alta');

-- Create enum for report status
CREATE TYPE public.status_denuncia AS ENUM ('pendente', 'em_analise', 'resolvida');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create escolas table for autocomplete
CREATE TABLE public.escolas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cidade TEXT NOT NULL DEFAULT 'Fortaleza',
  estado TEXT NOT NULL DEFAULT 'CE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Escolas são visíveis por todos" ON public.escolas
  FOR SELECT USING (true);

-- Create denuncias table
CREATE TABLE public.denuncias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo tipo_denuncia NOT NULL,
  escola TEXT NOT NULL,
  descricao TEXT NOT NULL,
  urgencia nivel_urgencia NOT NULL DEFAULT 'media',
  status status_denuncia NOT NULL DEFAULT 'pendente',
  codigo_acompanhamento TEXT NOT NULL UNIQUE,
  arquivo_urls TEXT[] DEFAULT '{}',
  response_text TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer pessoa pode criar denúncia" ON public.denuncias
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Acompanhamento por código" ON public.denuncias
  FOR SELECT USING (true);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Admins podem ver roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem ver todas denúncias" ON public.denuncias
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar denúncias" ON public.denuncias
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket for evidence
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true);

CREATE POLICY "Upload de evidências" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'evidencias');

CREATE POLICY "Evidências públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'evidencias');

-- Seed schools
INSERT INTO public.escolas (nome, cidade, estado) VALUES
  ('E.E. Professor João Hipólito - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Liceu do Ceará - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Adauto Bezerra - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Estado do Paraná - Fortaleza', 'Fortaleza', 'CE'),
  ('Colégio Militar do Corpo de Bombeiros - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Justiniano de Serpa - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Paulo VI - Fortaleza', 'Fortaleza', 'CE'),
  ('E.E.F.M. Presidente Roosevelt - Fortaleza', 'Fortaleza', 'CE');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.denuncias;
