import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:net'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_TEST_URL
const anonKey = process.env.SUPABASE_TEST_ANON_KEY
const serviceKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY

if (!url || !/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url) || !anonKey || !serviceKey) {
  throw new Error('This smoke test runs only against local Supabase on port 54321')
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })
const suffix = randomUUID().slice(0, 8)
const password = `Test-${randomUUID()}!`
const createdUsers = []
const createdClinics = []
const capturedEmails = []

const smtp = createServer(socket => {
  socket.write('220 localhost ESMTP test\r\n')
  let buffer = ''
  let dataMode = false
  let login = 0
  let message = ''
  socket.on('data', chunk => {
    buffer += chunk.toString('utf8')
    let end = buffer.indexOf('\r\n')
    while (end !== -1) {
      const line = buffer.slice(0, end)
      buffer = buffer.slice(end + 2)
      if (dataMode) {
        if (line === '.') {
          capturedEmails.push(message)
          message = ''
          dataMode = false
          socket.write('250 queued\r\n')
        } else message += `${line}\r\n`
      } else if (login) {
        login -= 1
        socket.write(login ? '334 UGFzc3dvcmQ6\r\n' : '235 authenticated\r\n')
      } else if (/^EHLO/i.test(line)) socket.write('250-localhost\r\n250 AUTH PLAIN LOGIN\r\n')
      else if (/^AUTH PLAIN/i.test(line)) socket.write('235 authenticated\r\n')
      else if (/^AUTH LOGIN/i.test(line)) { login = 2; socket.write('334 VXNlcm5hbWU6\r\n') }
      else if (/^DATA/i.test(line)) { dataMode = true; socket.write('354 continue\r\n') }
      else if (/^QUIT/i.test(line)) { socket.write('221 bye\r\n'); socket.end() }
      else socket.write('250 ok\r\n')
      end = buffer.indexOf('\r\n')
    }
  })
})

await new Promise((resolve, reject) => {
  smtp.once('error', reject)
  smtp.listen(0, '0.0.0.0', resolve)
})

async function value(promise) {
  const { data, error } = await promise
  if (error) throw error
  return data
}

async function clinic(name) {
  const data = await value(admin.from('veterinarias').insert({ nombre: name }).select('id').single())
  createdClinics.push(data.id)
  return data.id
}

async function account(veterinariaId, rol) {
  const email = `export-${rol}-${randomUUID().slice(0, 8)}@example.test`
  const data = await value(admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { nombre: 'Smoke Test', veterinaria_id: veterinariaId, rol },
  }))
  createdUsers.push(data.user.id)
  await value(admin.from('perfiles').update({ veterinaria_id: veterinariaId, rol })
    .eq('id', data.user.id))
  const client = createClient(url, anonKey, { auth: { persistSession: false } })
  const signed = await value(client.auth.signInWithPassword({ email, password }))
  return { client, token: signed.session.access_token }
}

async function request(token, exportacionId, recipient, adjuntos) {
  const response = await fetch(`${url}/functions/v1/send-export-documents`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ exportacionId, destinatarioEmail: recipient, adjuntos }),
  })
  const body = await response.json()
  return { status: response.status, body }
}

try {
  const clinicA = await clinic(`DV37 A ${suffix}`)
  const clinicB = await clinic(`DV37 B ${suffix}`)
  const doctor = await account(clinicA, 'doctora')
  const otherDoctor = await account(clinicB, 'doctora')
  const reception = await account(clinicA, 'recepcion')
  const email = `owner-${suffix}@example.test`
  const owner = await value(admin.from('propietarios').insert({
    veterinaria_id: clinicA, nombre: 'Owner Test', telefono: '77770000', email,
  }).select('id').single())
  const pet = await value(admin.from('mascotas').insert({
    veterinaria_id: clinicA, propietario_id: owner.id, nombre: 'Test Pet',
    especie: 'perro', raza: 'Mixta', fecha_nacimiento: '2020-01-01', sexo: 'macho',
  }).select('id').single())
  const exportacion = await value(admin.from('exportaciones_mascota').insert({
    veterinaria_id: clinicA, mascota_id: pet.id, pais_destino: 'Estados Unidos',
    fecha_tramite_programada: '2026-10-14', veterinario_responsable: 'Smoke Test',
    estado: 'borrador', requisitos: [{ id: randomUUID(), nombre: 'Revisión', estado: 'pendiente', obligatorio: true }],
  }).select('id').single())
  const list = await value(doctor.client.from('exportaciones_mascota')
    .select('*,mascotas(nombre,propietarios(nombre))').eq('veterinaria_id', clinicA))
  assert.equal(list.length, 1)
  assert.equal(list[0].mascotas.nombre, 'Test Pet')
  assert.equal(list[0].mascotas.propietarios.nombre, 'Owner Test')
  const otherList = await value(otherDoctor.client.from('exportaciones_mascota').select('id'))
  assert.equal(otherList.length, 0)
  const adjuntos = [{ tipo: 'certificado', content: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF').toString('base64') }]

  assert.equal((await request('invalid', exportacion.id, email, adjuntos)).status, 401)
  assert.equal((await request(reception.token, exportacion.id, email, adjuntos)).status, 403)
  const otherClinic = await request(otherDoctor.token, exportacion.id, email, adjuntos)
  assert.equal(otherClinic.status, 404, JSON.stringify(otherClinic.body))
  assert.equal((await request(doctor.token, exportacion.id, email, adjuntos)).status, 409)

  await value(admin.from('exportaciones_mascota').update({
    estado: 'completado', requisitos: [{ id: randomUUID(), nombre: 'Revisión', estado: 'completado', obligatorio: true }],
  }).eq('id', exportacion.id))
  assert.equal((await request(doctor.token, exportacion.id, 'wrong@example.test', adjuntos)).status, 409)
  assert.equal((await request(doctor.token, exportacion.id, email, [{ tipo: 'certificado', content: 'YmFk' }])).status, 400)
  assert.equal((await request(doctor.token, exportacion.id, email, [adjuntos[0], adjuntos[0]])).status, 400)

  await value(admin.from('config_email').insert({
    veterinaria_id: clinicA, smtp_host: 'host.docker.internal', smtp_port: smtp.address().port,
    smtp_user: 'test@example.test', smtp_pass: 'local-test', from_email: 'test@example.test', activo: true,
  }))
  const result = await request(doctor.token, exportacion.id, email, adjuntos)
  assert.equal(result.status, 200, JSON.stringify(result.body))
  const history = await value(doctor.client.from('envios_exportacion')
    .select('destinatario_email,documentos,estado,fecha_envio').eq('exportacion_id', exportacion.id))
  assert.equal(history.length, 1)
  assert.equal(history[0].destinatario_email, email)
  assert.deepEqual(history[0].documentos, ['certificado'])
  assert.equal(history[0].estado, 'enviado')
  assert.ok(history[0].fecha_envio)
  assert.equal(capturedEmails.length, 1)
  assert.match(capturedEmails[0], /certificado-salud\.pdf/)
  const foreignHistory = await value(otherDoctor.client.from('envios_exportacion')
    .select('id').eq('exportacion_id', exportacion.id))
  assert.equal(foreignHistory.length, 0)
  assert.equal((await request(doctor.token, exportacion.id, email,
    [{ tipo: 'cartilla', content: adjuntos[0].content }])).status, 400)

  await value(admin.from('vacunas').insert({
    veterinaria_id: clinicA, mascota_id: pet.id, nombre: 'Rabia', fecha_aplicacion: '2026-01-01',
  }))
  const allDocuments = await request(doctor.token, exportacion.id, email, [
    ...adjuntos,
    { tipo: 'cartilla', content: adjuntos[0].content },
    { tipo: 'laboratorio', content: adjuntos[0].content },
  ])
  assert.equal(allDocuments.status, 200, JSON.stringify(allDocuments.body))
  assert.equal(capturedEmails.length, 2)
  assert.match(capturedEmails[1], /resultados-laboratorio\.pdf/)
  assert.match(capturedEmails[1], /cartilla-vacunacion\.pdf/)

  await value(admin.from('config_email').update({ smtp_port: 1 }).eq('veterinaria_id', clinicA))
  const failed = await request(doctor.token, exportacion.id, email, adjuntos)
  assert.equal(failed.status, 502, JSON.stringify(failed.body))
  const historyAfterFailure = await value(doctor.client.from('envios_exportacion')
    .select('estado,fecha_envio').eq('exportacion_id', exportacion.id).order('created_at', { ascending: false }))
  assert.equal(historyAfterFailure[0].estado, 'fallido')
  assert.equal(historyAfterFailure[0].fecha_envio, null)
  console.info('Export document smoke test passed: auth, tenant, state, validation, SMTP and history')
} finally {
  for (const id of createdUsers) await admin.auth.admin.deleteUser(id)
  for (const id of createdClinics) await admin.from('veterinarias').delete().eq('id', id)
  await new Promise(resolve => smtp.close(resolve))
}
