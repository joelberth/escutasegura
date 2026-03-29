-- Fix search_path for functions
ALTER FUNCTION public.log_denuncia_changes() SET search_path = public;
ALTER FUNCTION public.get_gestor_satisfaction() SET search_path = public;

-- Refine feedback policy to be slightly more secure (check if denuncia exists)
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.denuncia_feedback;
CREATE POLICY "Anyone can insert feedback" ON public.denuncia_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.denuncias d 
            WHERE d.id = denuncia_id
        )
    );
