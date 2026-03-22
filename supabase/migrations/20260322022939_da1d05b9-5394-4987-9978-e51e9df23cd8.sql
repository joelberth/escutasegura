
-- Allow authenticated users to insert their own gestor registration
CREATE POLICY "Gestores podem se cadastrar"
ON public.gestores FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow gestores to see their own record
CREATE POLICY "Gestores podem ver seu próprio registro"
ON public.gestores FOR SELECT
TO authenticated
USING (user_id = auth.uid());
