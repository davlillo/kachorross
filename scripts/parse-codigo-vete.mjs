#!/usr/bin/env node
/**
 * Parse codigo-vete.pdf and generate corrected catalog JSON + SQL migration.
 * Usage: node scripts/parse-codigo-vete.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PDFParse } from 'pdf-parse'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const PDF_PATH = path.join(__dirname, 'data', 'codigo-vete.pdf')
const OUT_JSON = path.join(__dirname, 'output', 'catalogo-corregido.json')
const OUT_SQL = path.join(ROOT, 'supabase', 'migrations', '20260601_fix_catalogo_descriptions.sql')
const OUT_SEED = path.join(__dirname, 'output', 'catalogo-seed.sql')

const PEL_SECTION_ROOTS = [
  'Baño + Deslanado',
  'Baño + Limpieza',
  'Corte especial + baño',
  'Corte + Baño',
  'Corte de uñas',
  'Baño',
]

const CON_SECTION_ROOTS = [
  'Cirugias de emergencia',
  'Cirugias electivas',
]

const SPECIES = /^(Canino|Felino)$/i
const PAGE_MARKER = /^--\s*\d+\s+of\s+\d+\s*--$/
const SECTION_HEADER = /^(FARMACIA|PELUQUERIA|PETSHOP|N° CODIGO)/i
const TALLA_LINE = /^Talla /i
const CONDITION_LINE = /^(Monorquido|Criptorquido)/i
const SEVERITY = /^(Leve|Moderado|Moderada|Grave)$/i
const PEL_LEAF = /^(Normal|Medicado|Normal Medicado|Nudoso|Rebajado)/i

function escapeSql(str) {
  return str.replace(/'/g, "''")
}

function categoriaFromPrefix(prefix) {
  switch (prefix) {
    case 'FAR': return 'farmacia'
    case 'PEL': return 'peluqueria'
    case 'PTS': return 'petshop'
    default: return 'consulta'
  }
}

function isPelSectionRoot(line) {
  const normalized = line.toLowerCase().replace(/\s+/g, ' ')
  return PEL_SECTION_ROOTS.some(root => normalized.startsWith(root.toLowerCase()))
}

function isConSectionRoot(line) {
  return CON_SECTION_ROOTS.some(root => line.trim().startsWith(root))
}

function isSpeciesLine(line) {
  return SPECIES.test(line.trim())
}

function isDosisLine(line) {
  return /^Dosis de /i.test(line.trim())
}

function isVacunaItemLine(line) {
  return /^Vacuna /i.test(line.trim())
}

function parseAplicacionVacunasLine(line) {
  const m = line.match(/^Aplicación de vacunas\s+(.+)$/i)
  if (!m) return null
  const nombre = m[1].trim()
  return {
    nombre,
    descripcion: `Aplicación de vacunas → ${nombre}`,
    context: ['Aplicación de vacunas'],
  }
}

const LAB_SUBGROUPS = ['Perfiles', 'Inmunocromatografia', 'Urologia']

function parseLabHeaderLine(line) {
  const m = line.match(/^Servicios de laboratorio\s+(.+)$/i)
  if (!m) return null
  return { nombre: m[1].trim(), group: 'Servicios de laboratorio' }
}

function parseRetiroPuntosLine(line) {
  const m = line.match(/^Retiro de puntos\s+(.+)$/i)
  if (!m) return null
  return { nombre: m[1].trim(), group: 'Retiro de puntos' }
}

function parseUrologiaLine(line) {
  const m = line.match(/^Urologia\s+(.+)$/i)
  if (!m) return null
  return { nombre: m[1].trim(), subgroup: 'Urologia' }
}

function catalogGroupPath(ctx) {
  if (!ctx) return []
  const parts = [ctx.group]
  if (ctx.subgroup) parts.push(ctx.subgroup)
  return parts
}

function isPelSizeLine(line) {
  return /^(Pequeño|Mediano|Grande)$/i.test(line.trim())
}

function isPelLeafLine(line) {
  const t = line.trim()
  if (isPelSizeLine(t)) return false
  return PEL_LEAF.test(t) || /^Nudoso /i.test(t) || /^Rebajado /i.test(t)
}

function isConChildLine(line) {
  const t = line.trim()
  if (SEVERITY.test(t)) return true
  if (TALLA_LINE.test(t)) return true
  if (CONDITION_LINE.test(t)) return true
  if (/^OVH por Piometra/i.test(t)) return true
  return false
}

function isConSubProcedure(line, sectionContext) {
  if (!sectionContext.length) return false
  const section = sectionContext[0]
  if (section.includes('emergencia') && /^(Eviseracion|Amputacion de cola)$/i.test(line.trim())) return true
  if (section.includes('electivas') && /^(Castracion|Criptorquidectomia)$/i.test(line.trim())) return true
  return false
}

function isNewServiceHeader(line, sectionContext = []) {
  const t = line.trim()
  if (isDosisLine(t)) return false
  if (isVacunaItemLine(t)) return false
  if (isConChildLine(t)) return false
  if (isSpeciesLine(t)) return false
  if (/^Aplicación de vacunas/i.test(t)) return false
  if (isConSubProcedure(t, sectionContext)) return false
  if (isConSectionRoot(t)) return true
  return /^(Administración|Aplicación|Consulta|Cirugias|Amputacion|Cateterización|OVH|Reseccion|Cistotomia|Enucleacion|Curaciones|Desparasitaciones|Dreno|Enemas|Eutanasia|Hospitalizaciones|Profilaxis|Quimioterapia|Retiro|Sedaciones|Servicios|Sutura|Transfuciones|Vendaje|Criptorquidectomia|Castracion)/i.test(t)
}

function stripPriceFromLine(text) {
  return text
    .replace(/--\s*\d+\s+of\s+\d+\s*--/g, '')
    .replace(/\s*\$(\d+(?:\.\d{2})?)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripPriceFromText(text) {
  return text
    .split('\n')
    .map(stripPriceFromLine)
    .filter(Boolean)
    .join('\n')
    .trim()
}

function extractPrice(text) {
  const matches = [...text.matchAll(/\$(\d+(?:\.\d{2})?)/g)]
  const price = matches.length ? parseFloat(matches[matches.length - 1][1]) : null
  return { price, textWithoutPrice: stripPriceFromText(text) }
}

function splitDescriptionLines(raw) {
  return raw
    .split('\n')
    .map(l => stripPriceFromLine(l))
    .filter(l => l && !PAGE_MARKER.test(l) && !SECTION_HEADER.test(l))
}

function splitCollapsedConLine(line) {
  const ct = line.match(/^(Canino|Felino)\s+(Talla .+)$/i)
  if (ct) return [ct[1], ct[2]]

  for (const section of CON_SECTION_ROOTS) {
    if (!line.startsWith(section + ' ')) continue
    const rest = line.slice(section.length).trim()
    const subSp = rest.match(/^(.+?)\s+(Felino|Canino)$/i)
    if (subSp) return [section, subSp[1].trim(), subSp[2]]
    const subCond = rest.match(/^(.+?)\s+(Monorquido|Criptorquido .+)$/i)
    if (subCond) return [section, subCond[1].trim(), subCond[2]]
    return [section, rest]
  }

  const cfm = line.match(/^(Criptorquidectomia)\s+(Felino|Canino)\s+((?:Monorquido|Criptorquido) .+)$/i)
  if (cfm) return [cfm[1], cfm[2], cfm[3]]

  const cmit = line.match(/^(Canino)\s+((?:Monorquido|Criptorquido) \w+(?: \w+)?)\s+(Talla .+)$/i)
  if (cmit) return [cmit[1], cmit[2], cmit[3]]

  const clt = line.match(/^(Canino)\s+(.+?)\s+(Talla .+)$/i)
  if (clt && !TALLA_LINE.test(clt[2])) return [clt[1], clt[2], clt[3]]

  const sf = line.match(/^(.+?)\s+(Felino|Canino)$/i)
  if (sf && !CONDITION_LINE.test(sf[1]) && !TALLA_LINE.test(sf[1])) {
    return [sf[1].trim(), sf[2]]
  }

  return [line]
}

function splitCollapsedPelLine(line) {
  const coatTallaLeaf = line.match(/^(Normal)\s+(Talla .+?)\s+(.+)$/i)
  if (coatTallaLeaf) return [coatTallaLeaf[1], coatTallaLeaf[2], coatTallaLeaf[3]]
  return [line]
}

function mergeBrokenLines(lines) {
  const merged = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1]
    if (line === 'Nudoso' && next && /^(leve|moderado|grave)/i.test(next)) {
      const parts = next.split(/\s+/)
      merged.push(`Nudoso ${parts[0]}`)
      const rest = parts.slice(1).join(' ')
      if (rest) merged.push(rest)
      i++
    } else if (line === 'Corte especial +' && next === 'baño') {
      merged.push('Corte especial + baño')
      i++
    } else {
      merged.push(line)
    }
  }
  return merged
}

function expandStructuredLines(lines, prefix) {
  const out = []
  for (const line of lines) {
    const parts = prefix === 'CON'
      ? splitCollapsedConLine(line)
      : prefix === 'PEL'
        ? splitCollapsedPelLine(line)
        : [line]

    for (const part of parts) {
      const tallaTreatment = part.match(/^(Talla .+?) (Normal|Medicado)$/i)
      if (tallaTreatment) {
        out.push(tallaTreatment[1], tallaTreatment[2])
        continue
      }

      const conditionTalla = part.match(/^((?:Monorquido|Criptorquido) \w+(?: \w+)?)\s+(Talla .+)$/i)
      if (conditionTalla) {
        out.push(conditionTalla[1], conditionTalla[2])
        continue
      }

      const speciesOvh = part.match(/^(Felino|Canino)\s+(OVH .+)$/i)
      if (speciesOvh) {
        out.push(speciesOvh[1], speciesOvh[2])
        continue
      }

      const serviceSeverity = part.match(/^(.+?)\s+(Leve|Moderado|Moderada|Grave)$/i)
      if (serviceSeverity && prefix === 'CON' && !isConSectionRoot(part) && !TALLA_LINE.test(part)) {
        out.push(serviceSeverity[1].trim(), serviceSeverity[2])
        continue
      }

      if (prefix === 'PEL') {
        let matched = false
        for (const root of PEL_SECTION_ROOTS) {
          if (part.toLowerCase().startsWith(root.toLowerCase() + ' ')) {
            out.push(root, part.slice(root.length).trim())
            matched = true
            break
          }
        }
        if (matched) continue
      }

      out.push(part)
    }
  }
  return out
}

function joinPath(parts) {
  return parts.filter(Boolean).join(' → ')
}

function stripSpeciesFromPath(parts) {
  if (parts.length && isSpeciesLine(parts[parts.length - 1])) return parts.slice(0, -1)
  return parts
}

function findSpeciesInPath(parts) {
  return parts.find(p => isSpeciesLine(p)) ?? null
}

function stripAllSpeciesFromPath(parts) {
  return parts.filter(p => !isSpeciesLine(p))
}

function shouldPrependSection(lines, sectionContext) {
  if (!sectionContext.length) return false
  if (isConSectionRoot(lines[0])) return false
  if (CONDITION_LINE.test(lines[0])) return false
  if (isNewServiceHeader(lines[0], sectionContext) && !isConSubProcedure(lines[0], sectionContext)) return false
  return true
}

function buildConMultilinePath(lines, sectionContext, serviceContext, activeContext) {
  if (isSpeciesLine(lines[0]) && serviceContext.length > 0) {
    const base = stripAllSpeciesFromPath(serviceContext)
    return [...base, ...lines]
  }

  if (shouldPrependSection(lines, sectionContext)) {
    return [...sectionContext, ...lines]
  }

  if (CONDITION_LINE.test(lines[0]) && !isSpeciesLine(lines[0])) {
    const species = findSpeciesInPath(activeContext) ?? findSpeciesInPath(serviceContext)
    const base = stripConditionFromPath(stripAllSpeciesFromPath(activeContext.length ? activeContext : serviceContext))
    if (sectionContext.length && !base.some(p => sectionContext.includes(p))) {
      const withSection = [...sectionContext, ...base]
      return species ? [...withSection, species, ...lines] : [...withSection, ...lines]
    }
    return species ? [...base, species, ...lines] : [...base, ...lines]
  }

  return [...lines]
}

function stripConditionFromPath(parts) {
  return parts.filter(p => !CONDITION_LINE.test(p) && !TALLA_LINE.test(p))
}

function updateConSection(lines, sectionContext) {
  if (isConSectionRoot(lines[0])) return [lines[0]]
  if (isNewServiceHeader(lines[0], sectionContext) && !isConSubProcedure(lines[0], sectionContext)) return []
  return sectionContext
}

function updateConServiceContext(path, lines) {
  if (isSpeciesLine(lines[0]) && path.length >= 2) {
    return stripAllSpeciesFromPath(path.slice(0, -1))
  }
  if (CONDITION_LINE.test(lines[0])) {
    const species = findSpeciesInPath(path)
    const base = stripConditionFromPath(stripAllSpeciesFromPath(path))
    return species ? [...base, species] : base
  }
  return path.slice(0, -1)
}

function buildPelMultilinePath(lines, pelContext) {
  if (isPelSectionRoot(lines[0])) {
    return lines
  }
  if (lines[0] === 'Normal' && lines.length >= 3 && TALLA_LINE.test(lines[1])) {
    return [pelContext.service, lines[0], lines[1], lines[2]].filter(Boolean)
  }
  if (TALLA_LINE.test(lines[0])) {
    const base = pelContext.service ? [pelContext.service] : []
    if (pelContext.coat) base.push(pelContext.coat)
    return [...base, ...lines]
  }
  if (lines[0] === 'Normal' && pelContext.service?.includes('Corte') && lines.length >= 2) {
    return [pelContext.service, ...lines]
  }
  return [...pelContext.fullPath(), ...lines]
}

class PelContext {
  constructor() {
    this.service = null
    this.coat = null
    this.talla = null
  }

  serviceParts() {
    const parts = []
    if (this.service) parts.push(this.service)
    if (this.coat) parts.push(this.coat)
    if (this.talla) parts.push(this.talla)
    return parts
  }

  fullPath() {
    return this.serviceParts()
  }

  absorbPath(path) {
    if (!path.length) return
    if (isPelSectionRoot(path[0])) {
      this.service = path[0]
      this.coat = null
      this.talla = null
    }
    const start = isPelSectionRoot(path[0]) ? 1 : 0
    for (const part of path.slice(start)) {
      if (TALLA_LINE.test(part)) {
        this.talla = part
      } else if (part === 'Normal' && this.service?.includes('Corte') && !this.coat) {
        this.coat = part
      } else if (isPelSectionRoot(part)) {
        this.service = part
        this.coat = null
        this.talla = null
      }
    }
  }

  resetIfRoot(line) {
    if (isPelSectionRoot(line)) {
      this.service = line
      this.coat = null
      this.talla = null
      return true
    }
    return false
  }
}

function parsePdfText(text) {
  const cleaned = text.replace(/\r/g, '')
  const entryRegex = /(\d+)\s+(CON|FAR|PEL|PTS)-(\d{4})\s*/g
  const matches = [...cleaned.matchAll(entryRegex)]

  const items = []
  let sectionContext = []
  let serviceContext = []
  let activeContext = []
  let pelContext = new PelContext()
  let vacunaContext = false
  let catalogGroupContext = null

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const prefix = m[2]
    const codigo = `${prefix}-${m[3]}`
    const start = m.index + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index : cleaned.length
    let block = cleaned.slice(start, end).trim()
    block = block.replace(/\n(FARMACIA|PELUQUERIA|PETSHOP)[\s\S]*$/i, '').trim()

    const { price, textWithoutPrice } = extractPrice(block)
    let lines = expandStructuredLines(mergeBrokenLines(splitDescriptionLines(textWithoutPrice)), prefix)

    let nombre
    let descripcion

    if (prefix === 'FAR' || prefix === 'PTS') {
      const line = lines[0] ?? codigo
      nombre = line
      descripcion = line
      sectionContext = []
      serviceContext = []
      activeContext = []
      vacunaContext = false
      catalogGroupContext = null
    } else if (prefix === 'PEL') {
      if (lines.length === 0) {
        nombre = codigo
        descripcion = codigo
      } else if (lines.length >= 2) {
        if (pelContext.resetIfRoot(lines[0])) {
          // root already set
        }
        const path = buildPelMultilinePath(lines, pelContext)
        nombre = path[path.length - 1]
        descripcion = joinPath(path)
        pelContext.absorbPath(path.slice(0, -1))
        sectionContext = []
        serviceContext = []
        activeContext = []
      } else {
        const line = lines[0]
        if (pelContext.resetIfRoot(line)) {
          nombre = line
          descripcion = line
        } else if (TALLA_LINE.test(line)) {
          const tt = line.match(/^(Talla .+?) (Normal|Medicado)$/i)
          if (tt) {
            pelContext.talla = tt[1]
            nombre = tt[2]
            descripcion = joinPath([...pelContext.serviceParts(), tt[2]])
          } else {
            pelContext.talla = line
            nombre = line
            descripcion = joinPath([...pelContext.serviceParts()])
          }
        } else if (isPelSizeLine(line)) {
          pelContext.talla = null
          pelContext.coat = null
          if (isPelSectionRoot(pelContext.service ?? '')) {
            // sizes under Baño + Limpieza etc.
          }
          nombre = line
          descripcion = joinPath([...(pelContext.service ? [pelContext.service] : []), line])
          if (pelContext.service) pelContext.talla = line
        } else if (isPelLeafLine(line)) {
          nombre = line
          descripcion = joinPath([...pelContext.serviceParts(), line])
        } else {
          nombre = line
          descripcion = line
          pelContext.resetIfRoot(line)
        }
      }
      vacunaContext = false
      catalogGroupContext = null
    } else {
      // CON
      if (lines.length === 0) {
        nombre = codigo
        descripcion = codigo
      } else if (lines.length >= 2) {
        if (LAB_SUBGROUPS.includes(lines[0]) && catalogGroupContext?.group === 'Servicios de laboratorio') {
          const path = ['Servicios de laboratorio', ...lines]
          nombre = path[path.length - 1]
          descripcion = joinPath(path)
          catalogGroupContext = { group: 'Servicios de laboratorio', subgroup: lines[0] }
          sectionContext = []
          serviceContext = []
          activeContext = path.slice(0, -1)
          vacunaContext = false
        } else {
          const path = buildConMultilinePath(lines, sectionContext, serviceContext, activeContext)
          nombre = path[path.length - 1]
          descripcion = joinPath(path)
          sectionContext = updateConSection(lines, sectionContext)
          serviceContext = updateConServiceContext(path, lines)
          activeContext = path.slice(0, -1)
          vacunaContext = false
          catalogGroupContext = null
        }
      } else {
        const line = lines[0]
        const vac = parseAplicacionVacunasLine(line)
        const lab = parseLabHeaderLine(line)
        const retiro = parseRetiroPuntosLine(line)
        const urologia = parseUrologiaLine(line)
        if (vac) {
          nombre = vac.nombre
          descripcion = vac.descripcion
          serviceContext = vac.context
          activeContext = vac.context
          vacunaContext = true
          catalogGroupContext = null
        } else if (lab) {
          nombre = lab.nombre
          descripcion = joinPath(['Servicios de laboratorio', lab.nombre])
          catalogGroupContext = { group: 'Servicios de laboratorio', subgroup: null }
          serviceContext = ['Servicios de laboratorio']
          activeContext = ['Servicios de laboratorio']
          vacunaContext = false
        } else if (retiro) {
          nombre = retiro.nombre
          descripcion = joinPath(['Retiro de puntos', retiro.nombre])
          catalogGroupContext = { group: 'Retiro de puntos', subgroup: null }
          serviceContext = ['Retiro de puntos']
          activeContext = ['Retiro de puntos']
          vacunaContext = false
        } else if (urologia && catalogGroupContext?.group === 'Servicios de laboratorio') {
          nombre = urologia.nombre
          descripcion = joinPath(['Servicios de laboratorio', 'Urologia', urologia.nombre])
          catalogGroupContext = { group: 'Servicios de laboratorio', subgroup: 'Urologia' }
          vacunaContext = false
        } else if (isVacunaItemLine(line) && vacunaContext) {
          nombre = line
          descripcion = joinPath(['Aplicación de vacunas', line])
        } else if (catalogGroupContext) {
          nombre = line
          descripcion = joinPath([...catalogGroupPath(catalogGroupContext), line])
        } else if (isDosisLine(line) && activeContext.length > 0) {
          nombre = line
          descripcion = joinPath([...activeContext, line])
        } else if (isConChildLine(line) && activeContext.length > 0) {
          nombre = line
          descripcion = joinPath([...activeContext, line])
          if (CONDITION_LINE.test(line)) {
            serviceContext = activeContext
          }
        } else if (isNewServiceHeader(line, sectionContext)) {
          nombre = line
          descripcion = line
          sectionContext = isConSectionRoot(line) ? [line] : []
          serviceContext = [line]
          activeContext = [line]
          vacunaContext = false
          catalogGroupContext = null
        } else {
          nombre = line
          descripcion = line
        }
      }
    }

    items.push({
      codigo,
      nombre,
      descripcion,
      categoria: categoriaFromPrefix(prefix),
      precio: price,
    })
  }

  return items
}

function auditItems(items) {
  const bad = []
  const flatOk = /^(Administración de sueros|Aplicación de medicamentos parenterales \(Externos\)|Consulta|Hospitalizaciones)$/i
  for (const item of items) {
    if (item.categoria !== 'consulta' && item.categoria !== 'peluqueria') continue
    if (flatOk.test(item.nombre)) continue
    const d = item.descripcion
    if (d === item.nombre && !/^(Normal|Medicado|Leve|Moderado|Grave|Felino|Canino|Pequeño|Mediano|Grande)$/i.test(item.nombre)) {
      bad.push(item)
      continue
    }
    if (/^Talla (pequeña|mediana|grande)/i.test(d) && !d.includes('→')) bad.push(item)
    if (/^(Canino|Felino) → Talla/i.test(d) && !d.includes('Cirugias') && !d.includes('Cateterización') && !d.includes('Reseccion')) bad.push(item)
    if (/^Nudoso moderado →/i.test(d) && !d.includes('Corte')) bad.push(item)
    if (/^Normal → Talla/i.test(d) && !d.includes('Baño') && !d.includes('Corte')) bad.push(item)
  }
  return bad
}

function generateUpdateSql(items) {
  const lines = [
    '-- Fix catalogo nombre/descripcion from codigo-vete.pdf',
    '-- Generated by scripts/parse-codigo-vete.mjs',
    '',
    'BEGIN;',
    '',
  ]
  for (const item of items) {
    lines.push(
      `UPDATE catalogo SET nombre = '${escapeSql(item.nombre)}', descripcion = '${escapeSql(item.descripcion)}', categoria = '${item.categoria}' WHERE codigo = '${item.codigo}';`
    )
  }
  lines.push('', 'COMMIT;', '')
  return lines.join('\n')
}

function generateSeedSql(items) {
  const values = items.map(item => {
    const precio = item.precio != null ? item.precio.toFixed(2) : 'NULL'
    return `('${item.codigo}', '${escapeSql(item.nombre)}', '${escapeSql(item.descripcion)}', '${item.categoria}', ${precio})`
  })
  return [
    '-- Catalog seed from codigo-vete.pdf (generated)',
    'INSERT INTO catalogo (codigo, nombre, descripcion, categoria, precio) VALUES',
    values.join(',\n'),
    'ON CONFLICT (veterinaria_id, codigo) DO NOTHING;',
    '',
  ].join('\n')
}

async function main() {
  if (!fs.existsSync(PDF_PATH)) {
    console.error(`PDF not found: ${PDF_PATH}`)
    process.exit(1)
  }

  const buffer = fs.readFileSync(PDF_PATH)
  const parser = new PDFParse({ data: buffer })
  const pdfData = await parser.getText()
  await parser.destroy()
  const items = parsePdfText(pdfData.text)

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
  fs.mkdirSync(path.dirname(OUT_SQL), { recursive: true })

  fs.writeFileSync(OUT_JSON, JSON.stringify(items, null, 2), 'utf8')
  fs.writeFileSync(OUT_SQL, generateUpdateSql(items), 'utf8')
  fs.writeFileSync(OUT_SEED, generateSeedSql(items), 'utf8')

  console.log(`Parsed ${items.length} items`)

  const checks = [
    'CON-0031', 'CON-0032', 'CON-0040', 'CON-0041', 'CON-0048', 'CON-0056', 'CON-0060', 'CON-0063',
    'CON-0081', 'CON-0083', 'PEL-0001', 'PEL-0002', 'PEL-0003', 'PEL-0012', 'PEL-0013', 'PEL-0022', 'PEL-0048',
  ]
  for (const code of checks) {
    const item = items.find(i => i.codigo === code)
    if (item) console.log(`${code}: ${item.descripcion}`)
  }

  const bad = auditItems(items)
  if (bad.length) {
    console.log(`\nAudit: ${bad.length} items with weak hierarchy`)
    for (const item of bad.slice(0, 20)) {
      console.log(`  ${item.codigo}: ${item.descripcion}`)
    }
  } else {
    console.log('\nAudit: OK')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
