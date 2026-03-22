CREATE TABLE public.log_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gestor_id uuid NOT NULL REFERENCES public.gestores(id) ON DELETE CASCADE,
  denuncia_id uuid NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  UNIQUE(gestor_id, denuncia_id)
);

ALTER TABLE public.log_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestores podem solicitar acesso" ON public.log_access_requests
  FOR INSERT TO authenticated
  WITH CHECK (gestor_id IN (SELECT id FROM public.gestores WHERE user_id = auth.uid()));

CREATE POLICY "Gestores podem ver suas solicitações" ON public.log_access_requests
  FOR SELECT TO authenticated
  USING (gestor_id IN (SELECT id FROM public.gestores WHERE user_id = auth.uid()));

CREATE POLICY "Admins podem ver todas solicitações" ON public.log_access_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar solicitações" ON public.log_access_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

ALTER PUBLICATION supabase_realtime ADD TABLE public.log_access_requests;