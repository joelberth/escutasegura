-- Fix search path for set_denuncia_deadline
ALTER FUNCTION public.set_denuncia_deadline() SET search_path = public;
