<template>
  <div class="p-6 lg:p-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Alumnas</h1>
        <p class="font-body text-gray-500 mt-1">{{ alumnas.length }} {{ esProfe ? 'en tus grupos' : 'registradas' }}</p>
      </div>
      <div class="flex gap-2 flex-wrap">
        <button @click="exportarPDF" :disabled="exportando" class="btn-secondary flex items-center gap-2 text-sm">
          <span>📄</span> {{ exportando ? 'Generando...' : 'Exportar PDF' }}
        </button>
        <button @click="abrirModalPagoGeneral" class="btn-secondary flex items-center gap-2 text-sm">
          <span>💳</span> Registrar pago
        </button>
        <button @click="abrirModal()" class="btn-primary flex items-center gap-2">
          <span>+</span> Nueva alumna
        </button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap gap-3 mb-6">
      <input v-model="busqueda" type="text" placeholder="Buscar por nombre o documento..." class="input max-w-xs" />
      <select v-model="filtroEstado" class="input w-40">
        <option value="">Todos los estados</option>
        <option value="activa">Activa</option>
        <option value="visita">Visita</option>
        <option value="baja">Baja</option>
        <option value="suspendida">Suspendida</option>
      </select>
      <select v-if="!esProfe || catalogo.length > 1" v-model="filtroActividad" class="input w-52">
        <option value="">Todos los grupos</option>
        <option v-for="act in catalogo" :key="act.id" :value="act.id">{{ act.nombre }}</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="card overflow-hidden">
      <div v-if="cargando" class="text-center py-16 text-gray-400 font-body">Cargando...</div>
      <div v-else-if="!alumnasFiltradas.length" class="text-center py-16 text-gray-400 font-body">
        No se encontraron alumnas.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Alumna</th>
              <th class="text-left px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                {{ esProfe ? 'Grupo' : 'Actividades' }}
              </th>
              <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Estado</th>
              <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Cuota</th>
              <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="a in alumnasFiltradas"
              :key="a.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 bg-ritmica-rose flex items-center justify-center">
                    <img v-if="a.foto" :src="a.foto" class="w-full h-full object-cover" />
                    <span v-else class="text-ritmica-pink text-sm font-bold">{{ iniciales(a) }}</span>
                  </div>
                  <div>
                    <p class="font-body text-sm font-semibold text-gray-900">{{ a.apellido }}, {{ a.nombre }}</p>
                    <p v-if="a.fecha_nacimiento" class="font-body text-xs text-gray-400">{{ edad(a.fecha_nacimiento) }} años</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 hidden sm:table-cell">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="act in a.actividades"
                    :key="act.id"
                    class="text-xs bg-ritmica-pink/10 text-ritmica-pink px-2 py-0.5 rounded-full font-body"
                  >{{ act.nombre }}</span>
                  <span v-if="!a.actividades?.length" class="text-xs text-gray-300 font-body">—</span>
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <span :class="badgeEstado(a.estado)">{{ a.estado }}</span>
              </td>
              <td class="px-6 py-4 text-center hidden md:table-cell">
                <span
                  class="text-xs font-body font-semibold px-2 py-1 rounded-full"
                  :class="cuotaPagada(a.id) ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'"
                >
                  {{ cuotaPagada(a.id) ? '✓ Al día' : '✗ Debe' }}
                </span>
              </td>
              <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <RouterLink :to="`/alumnas/${a.id}`" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-sm">👁️</RouterLink>
                  <button @click="abrirModal(a)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors text-sm">✏️</button>
                  <button @click="registrarPago(a)" class="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors text-sm">💳</button>
                  <button @click="abrirCambioGrupo(a)" class="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors text-sm" title="Cambiar grupo">🔀</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Modal crear/editar alumna ─────────────────────────────────────── -->
    <div v-if="modal" class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl w-full max-w-2xl my-4">
        <div class="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 class="font-display text-xl font-bold text-ritmica-dark">
            {{ editando ? 'Editar alumna' : 'Nueva alumna' }}
          </h2>
          <button @click="cerrarModal" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div class="p-6 space-y-5">

          <!-- Info grupo (solo profesora, solo al crear) -->
          <div v-if="esProfe && !editando" class="flex items-center gap-3 bg-ritmica-rose border border-ritmica-pink/20 rounded-xl px-4 py-3">
            <span class="text-xl">🗓️</span>
            <div>
              <p class="font-body text-sm font-semibold text-ritmica-dark">La alumna será asignada a tu(s) grupo(s)</p>
              <p class="font-body text-xs text-gray-500">{{ catalogo.map(a => a.nombre).join(' · ') }}</p>
            </div>
          </div>

          <!-- Datos personales -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Nombre *</label>
              <input v-model="form.nombre" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Apellido *</label>
              <input v-model="form.apellido" type="text" class="input" />
            </div>
            <div class="col-span-2">
              <label class="block font-body text-xs text-gray-500 mb-1">Dirección</label>
              <input v-model="form.direccion" type="text" class="input" placeholder="Calle, número, barrio..." />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Apodo</label>
              <input v-model="form.apodo" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Estado</label>
              <select v-model="form.estado" class="input">
                <option value="activa">Activa</option>
                <option value="visita">Visita</option>
                <option value="baja">Baja</option>
                <option value="suspendida">Suspendida</option>
              </select>
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Fecha de nacimiento</label>
              <input v-model="form.fecha_nacimiento" type="date" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Documento</label>
              <input v-model="form.documento" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Celular</label>
              <input v-model="form.telefono" type="tel" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Teléfono fijo</label>
              <input v-model="form.telefono_fijo" type="tel" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Correo</label>
              <input v-model="form.correo" type="email" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Fecha de ingreso</label>
              <input v-model="form.fecha_ingreso" type="date" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Contacto emergencia</label>
              <input v-model="form.contacto_emergencia" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Tel. emergencia</label>
              <input v-model="form.telefono_emergencia" type="tel" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Obra social</label>
              <input v-model="form.obra_social" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Vto. certificado médico</label>
              <input v-model="form.vencimiento_certificado" type="date" class="input" />
            </div>
            <div v-if="!esProfe" class="col-span-2">
              <label class="block font-body text-xs text-gray-500 mb-1">Canal de captación</label>
              <select v-model="form.canal_captacion" class="input">
                <option value="redes_sociales">Redes sociales</option>
                <option value="presencial">Presencial</option>
                <option value="flyers">Flyers / Afiches</option>
                <option value="recomendacion">Recomendación</option>
                <option value="otros">Otros</option>
              </select>
            </div>
          </div>

          <!-- Actividades (solo admin/recepcion) -->
          <div v-if="!esProfe">
            <label class="block font-body text-xs text-gray-500 mb-2">Actividades asignadas</label>
            <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-100 rounded-xl p-3">
              <label
                v-for="act in catalogo"
                :key="act.id"
                class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-ritmica-rose"
              >
                <input type="checkbox" :value="act.id" v-model="form.actividades" class="accent-ritmica-pink" />
                <span class="font-body text-sm text-gray-700">{{ act.nombre }}</span>
                <span class="font-body text-xs text-gray-400">· {{ act.sede?.nombre }}</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Observaciones</label>
              <textarea v-model="form.observacion" rows="2" class="input resize-none" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Comentarios</label>
              <textarea v-model="form.comentarios" rows="2" class="input resize-none" />
            </div>
          </div>
        </div>

        <p v-if="errorModal" class="text-red-500 text-sm font-body px-6 pb-2">{{ errorModal }}</p>

        <div class="flex gap-3 p-6 pt-0">
          <button @click="cerrarModal" class="btn-secondary flex-1">Cancelar</button>
          <button @click="guardar" :disabled="guardando" class="btn-primary flex-1">
            {{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal pago ────────────────────────────────────────────────────── -->
    <div v-if="modalPago" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Registrar pago</h2>
          <button @click="modalPago = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <!-- Mensaje éxito -->
        <div v-if="pagoExito" class="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 flex-shrink-0">
          <span class="text-green-600 text-lg">✓</span>
          <span class="font-body text-sm text-green-700 font-semibold">Pago registrado correctamente</span>
        </div>

        <!-- Cuerpo scrolleable -->
        <div class="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          <!-- Búsqueda o alumna fija -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Alumna *</label>
            <div v-if="alumnaSeleccionada && !busquedaLibre" class="flex items-center justify-between px-3 py-2 bg-ritmica-pink/5 rounded-lg">
              <div>
                <span class="font-body text-sm font-semibold text-ritmica-pink">{{ alumnaSeleccionada.apellido }}, {{ alumnaSeleccionada.nombre }}</span>
                <div class="flex flex-wrap gap-1 mt-0.5">
                  <span v-for="act in alumnaSeleccionada.actividades" :key="act.id" class="text-xs bg-ritmica-pink/10 text-ritmica-pink px-2 py-0.5 rounded-full font-body">{{ act.nombre }}</span>
                </div>
              </div>
            </div>
            <div v-else>
              <input
                v-model="busquedaPago"
                type="text"
                class="input"
                placeholder="Buscar por nombre o apellido..."
                @focus="mostrarSugPago = true"
                autocomplete="off"
              />
              <div v-if="mostrarSugPago && sugerenciasPago.length" class="relative">
                <ul class="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                  <li
                    v-for="a in sugerenciasPago" :key="a.id"
                    @mousedown.prevent="elegirAlumna(a)"
                    class="px-4 py-2.5 hover:bg-ritmica-pink/5 cursor-pointer flex items-center gap-3"
                  >
                    <div class="w-7 h-7 rounded-full bg-ritmica-rose flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <img v-if="a.foto" :src="a.foto" class="w-full h-full object-cover" />
                      <span v-else class="text-ritmica-pink text-xs font-bold">{{ a.nombre[0] }}{{ a.apellido[0] }}</span>
                    </div>
                    <div>
                      <p class="font-body text-sm text-gray-800">{{ a.apellido }}, {{ a.nombre }}</p>
                      <p class="font-body text-xs text-gray-400">{{ a.actividades?.map(x=>x.nombre).join(', ') }}</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div v-if="alumnaSeleccionada" class="mt-2 flex items-center justify-between px-3 py-2 bg-ritmica-pink/5 rounded-lg">
                <span class="font-body text-sm font-semibold text-ritmica-pink">{{ alumnaSeleccionada.apellido }}, {{ alumnaSeleccionada.nombre }}</span>
                <button @click="alumnaSeleccionada = null; busquedaPago = ''" class="text-gray-400 hover:text-gray-600 text-xs">✕</button>
              </div>
            </div>
          </div>

          <!-- Fecha de pago -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Fecha de pago</label>
            <input v-model="formPago.fecha_pago" type="date" class="input" />
          </div>

          <!-- Cuota correspondiente a -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Cuota correspondiente a</label>
            <select v-model="formPago.actividad_id" class="input">
              <option :value="null">— Sin especificar —</option>
              <option v-for="op in opcionesActividad" :key="op.id" :value="op.id">{{ op.nombre }}</option>
            </select>
          </div>

          <!-- Tipo -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Tipo de pago</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 font-body text-sm cursor-pointer">
                <input type="radio" v-model="formPago.tipo" value="cuota" class="accent-ritmica-pink" /> Cuota mensual
              </label>
              <label class="flex items-center gap-2 font-body text-sm cursor-pointer">
                <input type="radio" v-model="formPago.tipo" value="inscripcion" class="accent-ritmica-pink" /> Inscripción
              </label>
            </div>
          </div>

          <!-- Mes y Año -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Mes</label>
              <select v-model.number="formPago.mes" class="input">
                <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
              </select>
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Año</label>
              <input v-model.number="formPago.anio" type="number" class="input" />
            </div>
          </div>

          <!-- Monto -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Monto $</label>
            <input v-model.number="formPago.monto" type="number" min="0" step="100" class="input" />
          </div>

          <!-- Medio de pago -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Medio de pago</label>
            <select v-model="formPago.medio_pago" class="input">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="mercadopago">MercadoPago</option>
            </select>
          </div>

          <!-- Observación -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Observación</label>
            <input v-model="formPago.observacion" type="text" class="input" placeholder="Opcional..." />
          </div>

          <!-- Comprobante -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Comprobante (imagen)</label>
            <div
              class="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-ritmica-pink/40 transition-colors"
              @click="$refs.inputComp.click()"
            >
              <input ref="inputComp" type="file" accept="image/*" class="hidden" @change="onComprobante" />
              <div v-if="comprobantePreview">
                <img :src="comprobantePreview" class="max-h-28 mx-auto rounded-lg object-contain" />
                <p class="font-body text-xs text-gray-400 mt-2">Toca para cambiar</p>
              </div>
              <div v-else class="py-1">
                <p class="font-body text-sm text-gray-400">📎 Adjuntar comprobante</p>
                <p class="font-body text-xs text-gray-300 mt-0.5">JPG, PNG hasta 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <p v-if="errorPago" class="text-red-500 text-sm font-body mb-3">{{ errorPago }}</p>
          <div class="flex gap-3">
            <button @click="modalPago = false" class="btn-secondary flex-1">Cerrar</button>
            <button @click="confirmarPago" :disabled="guardandoPago" class="btn-primary flex-1">
              {{ guardandoPago ? 'Guardando...' : 'Registrar pago' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Modal cambiar grupo (solo profesoras) ────────────────────────────── -->
    <div v-if="modalCambioGrupo" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Cambiar grupo</h2>
          <button @click="modalCambioGrupo = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <p class="font-body text-sm text-gray-600 mb-4">
          <span class="font-semibold">{{ alumnaParaCambio?.apellido }}, {{ alumnaParaCambio?.nombre }}</span><br/>
          <span class="text-xs text-gray-400">Grupo actual: {{ alumnaParaCambio?.actividades?.map(a => a.nombre).join(', ') || '—' }}</span>
        </p>
        <div>
          <label class="block font-body text-xs text-gray-500 mb-1">Nuevo grupo</label>
          <select v-model="grupoDestino" class="input">
            <option value="">Seleccioná un grupo...</option>
            <option v-for="act in catalogo" :key="act.id" :value="act.id">{{ act.nombre }}</option>
          </select>
        </div>
        <p v-if="errorCambio" class="text-red-500 text-sm font-body mt-3">{{ errorCambio }}</p>
        <div class="flex gap-3 mt-5">
          <button @click="modalCambioGrupo = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarCambioGrupo" :disabled="!grupoDestino || guardandoCambio" class="btn-primary flex-1">
            {{ guardandoCambio ? 'Guardando...' : 'Confirmar' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { exportarAlumnasPDF } from '../utils/pdf.js'

const rol    = localStorage.getItem('ritmica_rol') || ''
const esProfe = rol === 'profesora'

const alumnas        = ref([])
const catalogo       = ref([])   // actividades (filtradas por backend si es profe)
const cuotasPagadas  = ref([])
const cargando        = ref(true)
const busqueda        = ref('')
const filtroEstado    = ref('')
const filtroActividad = ref('')
const modal          = ref(false)
const modalPago      = ref(false)
const editando       = ref(null)
const guardando      = ref(false)
const guardandoPago  = ref(false)
const errorModal     = ref('')
const errorPago      = ref('')
const pagoExito      = ref(false)
const alumnaSeleccionada = ref(null)
const busquedaLibre  = ref(false)   // true = modal abierto sin alumna fija (búsqueda libre)
const busquedaPago   = ref('')
const mostrarSugPago = ref(false)
const comprobanteFile    = ref(null)
const comprobantePreview = ref('')
const exportando       = ref(false)
const modalCambioGrupo = ref(false)
const alumnaParaCambio = ref(null)
const grupoDestino     = ref('')
const errorCambio      = ref('')
const guardandoCambio  = ref(false)

async function exportarPDF() {
  exportando.value = true
  try {
    await exportarAlumnasPDF({
      alumnas: alumnasFiltradas.value,
      cuotasPagadas: cuotasPagadas.value,
      filtroEstado: filtroEstado.value,
    })
  } finally {
    exportando.value = false
  }
}

const MESES_N = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function nombreMes(m) { return MESES_N[m - 1] }

const hoy = new Date()

const formBase = () => ({
  nombre: '', apellido: '', apodo: '', estado: 'activa', direccion: '',
  fecha_nacimiento: '', documento: '', telefono: '', telefono_fijo: '',
  correo: '', fecha_ingreso: '', contacto_emergencia: '', telefono_emergencia: '',
  obra_social: '', vencimiento_certificado: '', canal_captacion: 'otros',
  observacion: '', comentarios: '', actividades: [],
})

const form     = ref(formBase())
const formPago = ref({ tipo: 'cuota', mes: hoy.getMonth() + 1, anio: hoy.getFullYear(), monto: 0, medio_pago: 'efectivo', fecha_pago: hoy.toISOString().slice(0, 10), observacion: '', actividad_id: null })

function headers()    { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }
function iniciales(a) { return `${a.nombre[0]}${a.apellido[0]}`.toUpperCase() }
function edad(fn)     { return hoy.getFullYear() - new Date(fn).getFullYear() }

function badgeEstado(e) {
  return { activa: 'badge-activa', visita: 'badge-visita', baja: 'badge-baja', suspendida: 'badge-suspendida' }[e] || 'badge-activa'
}

function cuotaPagada(id) { return cuotasPagadas.value.includes(id) }

const alumnasFiltradas = computed(() => {
  let list = alumnas.value
  if (filtroEstado.value) list = list.filter(a => a.estado === filtroEstado.value)
  if (busqueda.value) {
    const q = busqueda.value.toLowerCase()
    list = list.filter(a =>
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      (a.documento || '').includes(q)
    )
  }
  return list
})

async function cargar() {
  cargando.value = true
  try {
    const params = {}
    if (filtroActividad.value) params.actividad_id = filtroActividad.value
    const [al, act, venc] = await Promise.all([
      axios.get('/api/alumnas',         { headers: headers(), params }),
      axios.get('/api/actividades',     { headers: headers() }),
      axios.get('/api/cuotas/vencidas', { headers: headers() }),
    ])
    alumnas.value       = al.data
    catalogo.value      = act.data
    const idsBaja = venc.data.alumnas.map(a => a.id)
    cuotasPagadas.value = alumnas.value.filter(a => !idsBaja.includes(a.id)).map(a => a.id)
  } finally {
    cargando.value = false
  }
  // Garantiza que Danza Fusión exista en la DB; si no estaba en el catálogo, la agrega
  try {
    const { data } = await axios.get('/api/actividades/danza-fusion', { headers: headers() })
    if (data && !catalogo.value.find(a => a.id === data.id)) {
      catalogo.value = [...catalogo.value, data]
    }
  } catch (e) {
    console.error('Danza Fusión no disponible:', e?.response?.data?.error || e.message)
  }
}

function abrirModal(a = null) {
  editando.value   = a
  errorModal.value = ''
  form.value = a ? {
    nombre: a.nombre, apellido: a.apellido, apodo: a.apodo || '',
    estado: a.estado, direccion: a.direccion || '',
    fecha_nacimiento: a.fecha_nacimiento || '',
    documento: a.documento || '', telefono: a.telefono || '',
    telefono_fijo: a.telefono_fijo || '', correo: a.correo || '',
    fecha_ingreso: a.fecha_ingreso || '',
    contacto_emergencia: a.contacto_emergencia || '',
    telefono_emergencia: a.telefono_emergencia || '',
    obra_social: a.obra_social || '',
    vencimiento_certificado: a.vencimiento_certificado || '',
    canal_captacion: a.canal_captacion || 'otros',
    observacion: a.observacion || '', comentarios: a.comentarios || '',
    actividades: a.actividades?.map(x => x.id) || [],
  } : formBase()
  modal.value = true
}

function cerrarModal() { modal.value = false; editando.value = null }

async function guardar() {
  errorModal.value = ''
  if (!form.value.nombre.trim() || !form.value.apellido.trim()) {
    errorModal.value = 'Nombre y apellido son obligatorios'
    return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await axios.put(`/api/alumnas/${editando.value.id}`, form.value, { headers: headers() })
    } else {
      await axios.post('/api/alumnas', form.value, { headers: headers() })
    }
    cerrarModal()
    await cargar()
  } catch (err) {
    errorModal.value = err.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

const sugerenciasPago = computed(() => {
  const q = busquedaPago.value.toLowerCase().trim()
  if (!q) return []
  return alumnas.value.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.apellido.toLowerCase().includes(q)
  ).slice(0, 8)
})

// Busca Danza Fusión en el catálogo ya cargado (reactivo)
const danzaFusion = computed(() => catalogo.value.find(a => /danza fusi/i.test(a.nombre)) || null)

const opcionesActividad = computed(() => {
  const opciones = []
  const acts = alumnaSeleccionada.value?.actividades || []
  for (const act of acts) opciones.push({ id: act.id, nombre: act.nombre })
  const df = danzaFusion.value
  if (df && !opciones.find(o => o.id === df.id)) {
    opciones.push({ id: df.id, nombre: 'Danza Fusión' })
  }
  return opciones
})

function onComprobante(e) {
  const file = e.target.files[0]
  if (!file) return
  comprobanteFile.value = file
  comprobantePreview.value = URL.createObjectURL(file)
}

function elegirAlumna(a) {
  alumnaSeleccionada.value = a
  busquedaPago.value = `${a.apellido}, ${a.nombre}`
  mostrarSugPago.value = false
  formPago.value.actividad_id = a.actividades?.[0]?.id || null
}

function registrarPago(a) {
  alumnaSeleccionada.value = a
  busquedaLibre.value = false
  errorPago.value = ''
  pagoExito.value = false
  busquedaPago.value = ''
  comprobanteFile.value = null
  comprobantePreview.value = ''
  const actividadDefault = a.actividades?.[0]?.id || null
  formPago.value = { tipo: 'cuota', mes: hoy.getMonth() + 1, anio: hoy.getFullYear(), monto: 0, medio_pago: 'efectivo', fecha_pago: hoy.toISOString().slice(0, 10), observacion: '', actividad_id: actividadDefault }
  modalPago.value = true
}

function abrirModalPagoGeneral() {
  alumnaSeleccionada.value = null
  busquedaLibre.value = true
  errorPago.value = ''
  pagoExito.value = false
  busquedaPago.value = ''
  comprobanteFile.value = null
  comprobantePreview.value = ''
  formPago.value = { tipo: 'cuota', mes: hoy.getMonth() + 1, anio: hoy.getFullYear(), monto: 0, medio_pago: 'efectivo', fecha_pago: hoy.toISOString().slice(0, 10), observacion: '', actividad_id: null }
  modalPago.value = true
}

async function confirmarPago() {
  errorPago.value = ''
  pagoExito.value = false
  if (!alumnaSeleccionada.value) { errorPago.value = 'Seleccioná una alumna'; return }
  if (!formPago.value.monto)     { errorPago.value = 'El monto es obligatorio'; return }
  guardandoPago.value = true
  try {
    const { data: cuota } = await axios.post('/api/cuotas', {
      ...formPago.value,
      alumna_id: alumnaSeleccionada.value.id,
    }, { headers: headers() })

    if (comprobanteFile.value) {
      const fd = new FormData()
      fd.append('comprobante', comprobanteFile.value)
      await axios.post(`/api/cuotas/${cuota.id}/comprobante`, fd, {
        headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
      })
    }

    pagoExito.value = true
    // Limpiar alumna y comprobante, mantener mes/año/monto
    alumnaSeleccionada.value = null
    busquedaPago.value = ''
    comprobanteFile.value = null
    comprobantePreview.value = ''
    formPago.value.observacion = ''
    formPago.value.actividad_id = null
    setTimeout(() => { pagoExito.value = false }, 4000)
    await cargar()
  } catch (err) {
    errorPago.value = err.response?.data?.error || 'Error al guardar'
  } finally {
    guardandoPago.value = false
  }
}

function abrirCambioGrupo(a) {
  alumnaParaCambio.value = a
  grupoDestino.value = ''
  errorCambio.value = ''
  modalCambioGrupo.value = true
}

async function confirmarCambioGrupo() {
  errorCambio.value = ''
  guardandoCambio.value = true
  try {
    await axios.put(
      `/api/alumnas/${alumnaParaCambio.value.id}/cambiar-grupo`,
      { actividad_id_nueva: grupoDestino.value },
      { headers: headers() }
    )
    modalCambioGrupo.value = false
    await cargar()
  } catch (err) {
    errorCambio.value = err.response?.data?.error || 'Error al cambiar grupo'
  } finally {
    guardandoCambio.value = false
  }
}

watch(filtroActividad, cargar)

onMounted(cargar)
</script>
