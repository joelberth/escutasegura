
ALTER TABLE public.denuncias ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE public.denuncias ADD COLUMN IF NOT EXISTS longitude double precision;

CREATE TABLE public.denuncia_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id uuid NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(denuncia_id)
);

ALTER TABLE public.denuncia_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback" ON public.denuncia_feedback
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can read feedback" ON public.denuncia_feedback
  FOR SELECT TO public USING (true);

CREATE TABLE public.denuncia_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denuncia_id uuid NOT NULL REFERENCES public.denuncias(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.denuncia_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.denuncia_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert audit logs" ON public.denuncia_audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.log_denuncia_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.denuncia_audit_log (denuncia_id, action, details)
    VALUES (NEW.id, 'status_change', 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
  END IF;
  IF OLD.response_text IS DISTINCT FROM NEW.response_text AND NEW.response_text IS NOT NULL THEN
    INSERT INTO public.denuncia_audit_log (denuncia_id, action, details)
    VALUES (NEW.id, 'response_added', 'Resposta adicionada');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_denuncia_status_audit
  AFTER UPDATE ON public.denuncias
  FOR EACH ROW
  EXECUTE FUNCTION public.log_denuncia_status_change();
