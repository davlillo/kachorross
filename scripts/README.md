# Scripts de catálogo

## Regenerar datos desde el PDF

```bash
npm run parse-catalogo
```

Genera:
- `scripts/output/catalogo-corregido.json`
- `scripts/output/catalogo-seed.sql`
- `supabase/migrations/20260601_fix_catalogo_descriptions.sql`

Fuente: `scripts/data/codigo-vete.pdf`

## Aplicar correcciones a Supabase

**Opción A — SQL Editor (recomendado)**

1. Abre Supabase → SQL Editor
2. Ejecuta en orden:
   - `supabase/migrations/20260601_fix_catalogo_categorias.sql` (4 categorías)
   - `supabase/migrations/20260601_fix_catalogo_descriptions.sql` (nombres jerárquicos)

**Opción B — Script local**

1. Añade `SUPABASE_SERVICE_ROLE_KEY` a tu `.env` (Dashboard → Settings → API → service_role)
2. Ejecuta:

```bash
npm run apply-catalogo
```
