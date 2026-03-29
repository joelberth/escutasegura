-- Add public_response and deadline to denuncias
ALTER TABLE public.denuncias 
ADD COLUMN IF NOT EXISTS public_response TEXT,
ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE;

-- Add a trigger to set a default deadline (e.g., 7 days after creation) if not provided
CREATE OR REPLACE FUNCTION public.set_denuncia_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sla_deadline IS NULL THEN
    NEW.sla_deadline = NEW.created_at + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_denuncia_deadline
BEFORE INSERT ON public.denuncias
FOR EACH ROW
EXECUTE FUNCTION public.set_denuncia_deadline();
