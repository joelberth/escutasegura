-- 1. Add whatsapp column to denuncias
ALTER TABLE public.denuncias ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Create Audit Log Trigger
CREATE OR REPLACE FUNCTION public.log_denuncia_changes()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to get the current user ID if available (from auth.uid())
    v_user_id := auth.uid();
    
    -- Log status change
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.denuncia_audit_log (denuncia_id, user_id, action, details)
        VALUES (NEW.id, v_user_id, 'status_change', 'Status alterado de ' || OLD.status || ' para ' || NEW.status);
    END IF;

    -- Log response update
    IF (OLD.response_text IS DISTINCT FROM NEW.response_text AND NEW.response_text IS NOT NULL) THEN
        INSERT INTO public.denuncia_audit_log (denuncia_id, user_id, action, details)
        VALUES (NEW.id, v_user_id, 'response_added', 'Resposta adicionada/atualizada');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_denuncia_changes ON public.denuncias;
CREATE TRIGGER tr_log_denuncia_changes
AFTER UPDATE ON public.denuncias
FOR EACH ROW
EXECUTE FUNCTION public.log_denuncia_changes();

-- 3. Function to get manager satisfaction
CREATE OR REPLACE FUNCTION public.get_gestor_satisfaction()
RETURNS TABLE (
    gestor_id UUID,
    gestor_nome TEXT,
    escola_nome TEXT,
    media_satisfacao NUMERIC,
    total_feedbacks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as gestor_id,
        g.nome as gestor_nome,
        e.nome as escola_nome,
        ROUND(AVG(f.rating), 2) as media_satisfacao,
        COUNT(f.id) as total_feedbacks
    FROM 
        public.gestores g
    JOIN 
        public.escolas e ON g.escola_id = e.id
    JOIN 
        public.denuncias d ON d.escola = e.nome
    JOIN 
        public.denuncia_feedback f ON f.denuncia_id = d.id
    GROUP BY 
        g.id, g.nome, e.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Ensure RLS for feedback and audit logs
ALTER TABLE public.denuncia_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denuncia_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (for anonymous complainants)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.denuncia_feedback;
CREATE POLICY "Anyone can insert feedback" ON public.denuncia_feedback
    FOR INSERT WITH CHECK (true);

-- Allow admins/gestores to view audit logs
DROP POLICY IF EXISTS "Admins and gestores can view audit logs" ON public.denuncia_audit_log;
CREATE POLICY "Admins and gestores can view audit logs" ON public.denuncia_audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur 
            WHERE ur.user_id = auth.uid() AND (ur.role = 'admin' OR ur.role = 'user')
        )
    );
