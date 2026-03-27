-- 1. Fix critical: Create a secure view function for public denuncias access
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Acompanhamento por código" ON public.denuncias;

-- Create a restricted public SELECT policy that hides sensitive columns
-- Users can read denuncias publicly BUT we'll use a view/function approach
-- For now, keep public SELECT but create a security definer function for safe lookups
CREATE OR REPLACE FUNCTION public.lookup_denuncia_by_code(p_codigo text)
RETURNS TABLE (
  id uuid,
  tipo public.tipo_denuncia,
  escola text,
  descricao text,
  urgencia public.nivel_urgencia,
  status public.status_denuncia,
  codigo_acompanhamento text,
  response_text text,
  created_at timestamptz,
  resolved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tipo, escola, descricao, urgencia, status, codigo_acompanhamento, response_text, created_at, resolved_at
  FROM public.denuncias
  WHERE codigo_acompanhamento = p_codigo;
$$;

-- Re-create public SELECT policy that only allows reading non-sensitive fields
-- We restrict public access: anonymous users can only use the RPC function above
-- Authenticated admins keep full access via existing policy
CREATE POLICY "Public read non-sensitive by code" ON public.denuncias
  FOR SELECT TO public
  USING (false);

-- 2. Fix INSERT always-true on denuncias - denúncias are anonymous so public INSERT is intentional, but add basic validation
DROP POLICY IF EXISTS "Qualquer pessoa pode criar denúncia" ON public.denuncias;
CREATE POLICY "Anyone can create denuncia with validation" ON public.denuncias
  FOR INSERT TO public
  WITH CHECK (
    length(descricao) >= 10 AND
    length(escola) >= 3 AND
    codigo_acompanhamento IS NOT NULL
  );

-- 3. Fix feedback INSERT always-true  
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.denuncia_feedback;
CREATE POLICY "Anyone can submit feedback with validation" ON public.denuncia_feedback
  FOR INSERT TO public
  WITH CHECK (
    rating >= 1 AND rating <= 5 AND
    denuncia_id IS NOT NULL
  );

-- 4. Fix audit log INSERT - restrict to authenticated only (already is, but tighten)
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.denuncia_audit_log;
CREATE POLICY "Authenticated admins can insert audit logs" ON public.denuncia_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role) AND
    denuncia_id IS NOT NULL
  );

-- 5. Fix function search path on log_denuncia_status_change
CREATE OR REPLACE FUNCTION public.log_denuncia_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 6. Add restrictive INSERT policy on user_roles to prevent privilege escalation
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 7. Fix chat_messages gestor SELECT policy to see all messages in their denuncias
DROP POLICY IF EXISTS "Gestores podem ver mensagens relacionadas" ON public.chat_messages;
CREATE POLICY "Gestores can see messages for their school denuncias" ON public.chat_messages
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    denuncia_id IN (
      SELECT d.id FROM public.denuncias d
      JOIN public.gestores g ON d.escola = (SELECT e.nome FROM public.escolas e WHERE e.id = g.escola_id)
      WHERE g.user_id = auth.uid() AND g.approved = true
    )
  );