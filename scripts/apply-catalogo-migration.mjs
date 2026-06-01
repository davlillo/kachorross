#!/usr/bin/env node
/**
 * Apply catalogo corrections to Supabase using service role key.
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (Dashboard → Settings → API).
 * Usage: npm run apply-catalogo
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const JSON_PATH = path.join(__dirname, 'output', 'catalogo-corregido.json')

function loadEnv() {
  const envPath = path.join(ROOT, '.env')
  if (!fs.existsSync(envPath)) return {}
  const env = {}
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

async function main() {
  const env = loadEnv()
  const url = env.VITE_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    console.error('Faltan variables en .env:')
    if (!url) console.error('  - VITE_SUPABASE_URL')
    if (!serviceKey) console.error('  - SUPABASE_SERVICE_ROLE_KEY (Settings → API → service_role)')
    console.error('\nAlternativa: ejecuta en Supabase SQL Editor:')
    console.error('  supabase/migrations/20260601_fix_catalogo_descriptions.sql')
    process.exit(1)
  }

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`No existe ${JSON_PATH}. Ejecuta primero: npm run parse-catalogo`)
    process.exit(1)
  }

  const items = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const supabase = createClient(url, serviceKey)

  console.log(`Actualizando ${items.length} ítems del catálogo...`)

  let ok = 0
  let fail = 0

  for (const item of items) {
    const { error, count } = await supabase
      .from('catalogo')
      .update({
        nombre: item.nombre,
        descripcion: item.descripcion,
        categoria: item.categoria,
      })
      .eq('codigo', item.codigo)
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error(`  ✗ ${item.codigo}: ${error.message}`)
      fail++
    } else if (count === 0) {
      console.warn(`  ? ${item.codigo}: no encontrado en BD`)
      fail++
    } else {
      ok++
    }
  }

  console.log(`\nListo: ${ok} actualizados, ${fail} con error o no encontrados.`)

  // Spot-check
  const checks = ['PEL-0010', 'CON-0046', 'PEL-0002']
  for (const code of checks) {
    const { data } = await supabase.from('catalogo').select('codigo,nombre,descripcion').eq('codigo', code).maybeSingle()
    if (data) console.log(`\n${code}: ${data.descripcion}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
