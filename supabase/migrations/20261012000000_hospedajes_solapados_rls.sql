-- Views run with their owner's privileges by default. Without security_invoker,
-- authenticated users could see stays from other clinics through this diagnostic view.
ALTER VIEW public.hospedajes_solapados SET (security_invoker = true);
