// Carga inicial de la Escuela Patín Artístico F.A. a partir de la lista de
// patinadoras 2026 (datos/patinadoras.json, generado desde el Excel).
//
// Crea: las 5 sedes, a Florencia como profesora, un grupo por sede y nivel, las
// alumnas con su grupo, y el usuario administrador de Florencia.
//
// Se puede correr más de una vez: si la base ya tiene alumnas, no carga nada.
//
// Uso:  node importarPatinadoras.js
import { readFileSync } from 'fs'
import { randomBytes } from 'crypto'
import { sequelize } from './database.js'
import Usuario from './models/Usuario.js'
import Sede from './models/Sede.js'
import Profesora from './models/Profesora.js'
import Actividad from './models/Actividad.js'
import Alumna from './models/Alumna.js'
import AlumnaActividad from './models/AlumnaActividad.js'
import './models/Cuota.js'
import './models/Egreso.js'

const EMAIL_ADMIN = 'florencia@patinfa.com'

async function run() {
  await sequelize.authenticate()
  await sequelize.sync()

  if (await Alumna.count() > 0) {
    console.log('La base ya tiene alumnas cargadas: no se importa nada.')
    return
  }

  const datos = JSON.parse(readFileSync(new URL('./datos/patinadoras.json', import.meta.url), 'utf8'))

  const t = await sequelize.transaction()
  try {
    const florencia = await Profesora.create(
      { nombre: 'Florencia', apellido: 'Armentano', abreviatura: 'FA' }, { transaction: t })

    // Un grupo por sede y nivel. La clave es "hoja|nivel".
    const grupos = {}
    for (const s of datos.sedes) {
      const sede = await Sede.create({ nombre: s.nombre, direccion: s.direccion }, { transaction: t })
      for (const nivel of s.niveles) {
        const grupo = await Actividad.create({
          nombre: `${nivel} · ${s.corto}`,
          sede_id: sede.id,
          profesora_id: florencia.id,
          capacidad: 60,
          horarios: [],
          mensualidad: 0,
        }, { transaction: t })
        grupos[`${s.hoja}|${nivel}`] = grupo
      }
    }

    // Una alumna puede figurar en más de un nivel (le pasa a Aitana Bonafina):
    // se carga una sola vez y se la anota en cada grupo.
    const porNombre = {}
    let anotaciones = 0
    for (const a of datos.alumnas) {
      const clave = `${a.nombre} ${a.apellido}`.toLowerCase()
      let alumna = porNombre[clave]
      if (!alumna) {
        alumna = await Alumna.create({
          nombre: a.nombre,
          apellido: a.apellido,
          estado: 'activa',
          observacion: `Importada de la lista 2026 como "${a.original}" (${a.sede} · ${a.nivel})`,
        }, { transaction: t })
        porNombre[clave] = alumna
      }
      const grupo = grupos[`${a.sede}|${a.nivel}`]
      await AlumnaActividad.create({ alumna_id: alumna.id, actividad_id: grupo.id }, { transaction: t })
      anotaciones++
    }

    // Usuario administrador de Florencia, con una contraseña al azar.
    let password = null
    if (!await Usuario.findOne({ where: { email: EMAIL_ADMIN }, transaction: t })) {
      password = 'PatinFA-' + randomBytes(3).toString('hex')
      await Usuario.create({
        nombre: 'Florencia Armentano',
        email: EMAIL_ADMIN,
        password: await Usuario.hashPassword(password),
        rol: 'admin',
      }, { transaction: t })
    }

    await t.commit()

    console.log(`✓ Sedes: ${datos.sedes.length}`)
    console.log(`✓ Grupos: ${Object.keys(grupos).length}`)
    console.log(`✓ Alumnas: ${Object.keys(porNombre).length} (${anotaciones} anotaciones a grupos)`)
    if (password) console.log(`✓ Usuario: ${EMAIL_ADMIN}  ·  contraseña: ${password}`)
  } catch (err) {
    await t.rollback()
    throw err
  }
}

run()
  .catch(err => { console.error('✗ Error:', err.message); process.exitCode = 1 })
  .finally(() => sequelize.close())
