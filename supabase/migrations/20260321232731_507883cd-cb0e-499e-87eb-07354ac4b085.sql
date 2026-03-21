
-- Enum for gestor types
CREATE TYPE public.tipo_gestor AS ENUM ('geral', 'administrativo', 'financeiro', 'administrativo_financeiro');

-- Gestores table
CREATE TABLE public.gestores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  escola_id UUID REFERENCES public.escolas(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  tipo tipo_gestor NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.gestores ENABLE ROW LEVEL SECURITY;

-- Admins can manage gestores
CREATE POLICY "Admins podem ver gestores" ON public.gestores FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem criar gestores" ON public.gestores FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar gestores" ON public.gestores FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar gestores" ON public.gestores FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add more columns to escolas
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS endereco TEXT DEFAULT '';
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS telefone TEXT DEFAULT '';
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.escolas ADD COLUMN IF NOT EXISTS tipo_instituicao TEXT DEFAULT 'pública';

-- Allow admins to insert/update/delete escolas
CREATE POLICY "Admins podem criar escolas" ON public.escolas FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem atualizar escolas" ON public.escolas FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins podem deletar escolas" ON public.escolas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
