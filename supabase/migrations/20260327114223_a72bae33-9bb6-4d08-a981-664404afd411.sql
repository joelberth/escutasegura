CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id uuid REFERENCES public.denuncias(id) ON DELETE CASCADE,
  gestor_id uuid REFERENCES public.gestores(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data_hora timestamp with time zone NOT NULL,
  duracao_minutos integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'agendado',
  tipo text NOT NULL DEFAULT 'presencial',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all agendamentos" ON public.agendamentos
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestores can view their agendamentos" ON public.agendamentos
  FOR SELECT TO authenticated
  USING (gestor_id IN (SELECT id FROM public.gestores WHERE user_id = auth.uid()));

CREATE POLICY "Gestores can create agendamentos" ON public.agendamentos
  FOR INSERT TO authenticated
  WITH CHECK (gestor_id IN (SELECT id FROM public.gestores WHERE user_id = auth.uid()));

CREATE POLICY "Gestores can update their agendamentos" ON public.agendamentos
  FOR UPDATE TO authenticated
  USING (gestor_id IN (SELECT id FROM public.gestores WHERE user_id = auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.agendamentos;