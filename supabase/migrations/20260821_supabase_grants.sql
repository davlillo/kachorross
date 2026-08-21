-- Otorga los permisos estándar de Supabase sobre el esquema public.
-- El esquema original creaba las tablas con owner postgres pero sin los GRANT
-- que otorga el entorno Supabase a los roles anon/authenticated/service_role.
-- Sin esto, PostgREST devuelve "permission denied for table ...".

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
