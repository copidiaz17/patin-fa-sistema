<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/profesoras" class="text-gray-400 hover:text-ritmica-pink transition-colors">← Volver</RouterLink>
    </div>

    <div v-if="cargando" class="text-center py-16 text-gray-400 font-body">Cargando...</div>

    <template v-else-if="profe">
      <!-- Header -->
      <div class="card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div class="w-16 h-16 rounded-2xl bg-ritmica-pink/10 flex items-center justify-center flex-shrink-0">
          <span class="text-ritmica-pink font-bold font-body text-2xl">{{ profe.abreviatura || profe.nombre[0] }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="font-display text-2xl font-bold text-ritmica-dark">{{ profe.apellido }}, {{ profe.nombre }}</h1>
          <div class="flex flex-wrap gap-4 mt-1 text-sm font-body text-gray-500">
            <span v-if="profe.telefono">📱 {{ profe.telefono }}</span>
            <span v-if="profe.email">✉️ {{ profe.email }}</span>
          </div>
        </div>
        <div class="flex flex-col sm:items-end gap-2">
          <span :class="profe.activo ? 'badge-activa' : 'badge-baja'">{{ profe.activo ? 'Activa' : 'Inactiva' }}</span>
          <span class="font-body text-xs text-gray-400">{{ totalAlumnas }} alumnas · {{ profe.grupos.length }} grupos</span>
          <button @click="abrirModalPago" class="btn-primary text-sm py-1.5 px-4 mt-1">+ Registrar pago</button>
        </div>
      </div>

      <!-- Filtro de grupo (solo si tiene más de uno) -->
      <div v-if="profe.grupos.length > 1" class="mb-5 flex items-center gap-3">
        <label class="font-body text-sm text-gray-500 flex-shrink-0">Filtrar grupo:</label>
        <select v-model="grupoFiltro" class="input max-w-xs">
          <option value="">Todos los grupos</option>
          <option v-for="g in profe.grupos" :key="g.id" :value="g.id">
            {{ g.nombre }} {{ g.compartido ? '(compartido)' : '(exclusivo)' }}
          </option>
        </select>
      </div>

      <!-- Grupos -->
      <div v-if="!profe.grupos.length" class="text-center py-12 text-gray-400 font-body text-sm">
        No tiene grupos asignados.
      </div>

      <div v-for="grupo in gruposFiltrados" :key="grupo.id" class="card mb-4 overflow-hidden">
        <!-- Cabecera del grupo -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/60">
          <div>
            <div class="flex items-center gap-2">
              <h2 class="font-body font-semibold text-gray-800">{{ grupo.nombre }}</h2>
              <span
                class="text-xs px-2 py-0.5 rounded-full font-body font-medium"
                :class="grupo.compartido ? 'bg-amber-100 text-amber-700' : 'bg-ritmica-pink/10 text-ritmica-pink'"
              >
                {{ grupo.compartido ? 'Compartido' : 'Exclusivo' }}
              </span>
            </div>
            <div class="flex flex-wrap gap-3 mt-0.5 text-xs font-body text-gray-400">
              <span v-if="grupo.sede">📍 {{ grupo.sede }}</span>
              <span v-if="grupo.compartido && grupo.profe2">con {{ grupo.profe2.nombre }} {{ grupo.profe2.apellido }}</span>
              <span v-if="grupo.mensualidad">💰 ${{ fmt(grupo.mensualidad) }}</span>
            </div>
            <div v-if="grupo.horarios?.length" class="flex flex-wrap gap-2 mt-1">
              <span
                v-for="(h, i) in grupo.horarios" :key="i"
                class="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-body"
              >
                {{ h.dia }} {{ h.hora_inicio }}–{{ h.hora_fin }}
              </span>
            </div>
          </div>
          <span class="font-body text-sm text-gray-400 flex-shrink-0 ml-4">{{ grupo.alumnas.length }} alumnas</span>
        </div>

        <!-- Lista de alumnas -->
        <div v-if="!grupo.alumnas.length" class="px-5 py-4 text-sm text-gray-400 font-body">Sin alumnas en este grupo.</div>
        <ul v-else class="divide-y divide-gray-50">
          <li
            v-for="a in grupo.alumnas" :key="a.id"
            class="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-ritmica-rose flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img v-if="a.foto" :src="a.foto" class="w-full h-full object-cover" />
              <span v-else class="text-ritmica-pink text-xs font-bold font-body">{{ a.nombre[0] }}{{ a.apellido[0] }}</span>
            </div>
            <RouterLink :to="`/alumnas/${a.id}`" class="flex-1 min-w-0 hover:text-ritmica-pink transition-colors">
              <span class="font-body text-sm text-gray-800">{{ a.apellido }}, {{ a.nombre }}</span>
            </RouterLink>
            <!-- Badge del grupo (visible cuando se muestran todos los grupos) -->
            <span v-if="!grupoFiltro" class="text-xs px-2 py-0.5 rounded-full font-body hidden sm:inline-block"
              :class="grupo.compartido ? 'bg-amber-100 text-amber-700' : 'bg-ritmica-pink/10 text-ritmica-pink'">
              {{ grupo.nombre }}
            </span>
            <span :class="badgeEstado(a.estado)" class="text-xs">{{ a.estado }}</span>
          </li>
        </ul>
      </div>
    </template>

    <div v-else class="text-center py-16 text-gray-400 font-body">Profesora no encontrada.</div>

    <!-- ── Modal Registrar Pago ──────────────────────────────────────────── -->
    <div v-if="modalPago" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <!-- Header del modal -->
        <div class="flex justify-between items-center px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Registrar pago</h2>
          <button @click="cerrarModalPago" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <!-- Mensaje de éxito -->
        <div v-if="pagoExito" class="mx-6 mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 flex-shrink-0">
          <span class="text-green-600 text-lg">✓</span>
          <span class="font-body text-sm text-green-700 font-semibold">Pago registrado correctamente</span>
        </div>

        <!-- Contenido scrolleable -->
        <div class="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          <!-- Buscar alumna -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Alumna *</label>
            <input
              v-model="busquedaAlumna"
              type="text"
              class="input"
              placeholder="Buscar por nombre o apellido..."
              @focus="mostrarSugerencias = true"
              autocomplete="off"
            />
            <div v-if="mostrarSugerencias && sugerencias.length" class="relative">
              <ul class="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto">
                <li
                  v-for="a in sugerencias" :key="a.id"
                  @mousedown.prevent="seleccionarAlumna(a)"
                  class="px-4 py-2.5 hover:bg-ritmica-pink/5 cursor-pointer flex items-center gap-3"
                >
                  <div class="w-7 h-7 rounded-full bg-ritmica-rose flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img v-if="a.foto" :src="a.foto" class="w-full h-full object-cover" />
                    <span v-else class="text-ritmica-pink text-xs font-bold">{{ a.nombre[0] }}{{ a.apellido[0] }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-body text-sm text-gray-800">{{ a.apellido }}, {{ a.nombre }}</p>
                    <p class="font-body text-xs text-gray-400">{{ nombreGrupo(a.id) }}</p>
                  </div>
                </li>
              </ul>
            </div>
            <!-- Alumna seleccionada -->
            <div v-if="alumnaSeleccionada && !mostrarSugerencias" class="mt-2 px-3 py-2 bg-ritmica-pink/5 rounded-lg flex items-center justify-between">
              <span class="font-body text-sm font-semibold text-ritmica-pink">{{ alumnaSeleccionada.apellido }}, {{ alumnaSeleccionada.nombre }}</span>
              <button @click="limpiarAlumna" class="text-gray-400 hover:text-gray-600 text-xs">✕ cambiar</button>
            </div>
          </div>

          <!-- Mes y Año -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Mes *</label>
              <select v-model.number="formPago.mes" class="input">
                <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
              </select>
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Año *</label>
              <input v-model.number="formPago.anio" type="number" min="2020" max="2099" class="input" />
            </div>
          </div>

          <!-- Monto -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Monto $ *</label>
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
              @click="$refs.inputComprobante.click()"
            >
              <input ref="inputComprobante" type="file" accept="image/*" class="hidden" @change="onComprobante" />
              <div v-if="comprobantePreview">
                <img :src="comprobantePreview" class="max-h-32 mx-auto rounded-lg object-contain" />
                <p class="font-body text-xs text-gray-400 mt-2">Toca para cambiar</p>
              </div>
              <div v-else class="py-2">
                <p class="font-body text-sm text-gray-400">📎 Adjuntar comprobante</p>
                <p class="font-body text-xs text-gray-300 mt-1">JPG, PNG hasta 10MB</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del modal -->
        <div class="px-6 pb-6 pt-4 border-t border-gray-100 flex-shrink-0">
          <p v-if="errorPago" class="text-red-500 text-sm font-body mb-3">{{ errorPago }}</p>
          <div class="flex gap-3">
            <button @click="cerrarModalPago" class="btn-secondary flex-1">Cerrar</button>
            <button @click="registrarPago" :disabled="guardandoPago" class="btn-primary flex-1">
              {{ guardandoPago ? 'Guardando...' : 'Registrar pago' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route    = useRoute()
const profe    = ref(null)
const cargando = ref(true)
const grupoFiltro = ref('')

// Modal pago
const modalPago         = ref(false)
const guardandoPago     = ref(false)
const errorPago         = ref('')
const pagoExito         = ref(false)
const busquedaAlumna    = ref('')
const alumnaSeleccionada= ref(null)
const mostrarSugerencias= ref(false)
const comprobanteFile   = ref(null)
const comprobantePreview= ref('')
const inputComprobante  = ref(null)

const hoy = new Date()
const formPago = ref({
  mes: hoy.getMonth() + 1,
  anio: hoy.getFullYear(),
  monto: 0,
  medio_pago: 'efectivo',
  observacion: '',
})

function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }
function fmt(n) { return Number(n || 0).toLocaleString('es-AR') }
function badgeEstado(e) {
  const m = { activa: 'badge-activa', visita: 'badge-visita', baja: 'badge-baja', suspendida: 'badge-suspendida' }
  return m[e] || 'badge-activa'
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function nombreMes(m) { return MESES[m - 1] }

const totalAlumnas = computed(() => {
  if (!profe.value) return 0
  const ids = new Set()
  profe.value.grupos.forEach(g => g.alumnas.forEach(a => ids.add(a.id)))
  return ids.size
})

const gruposFiltrados = computed(() => {
  if (!profe.value) return []
  if (!grupoFiltro.value) return profe.value.grupos
  return profe.value.grupos.filter(g => g.id === grupoFiltro.value)
})

// Todas las alumnas de todos los grupos (sin duplicados)
const todasLasAlumnas = computed(() => {
  if (!profe.value) return []
  const map = new Map()
  profe.value.grupos.forEach(g => g.alumnas.forEach(a => { if (!map.has(a.id)) map.set(a.id, a) }))
  return [...map.values()]
})

// Sugerencias de búsqueda
const sugerencias = computed(() => {
  const q = busquedaAlumna.value.toLowerCase().trim()
  if (!q || alumnaSeleccionada.value) return []
  return todasLasAlumnas.value.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.apellido.toLowerCase().includes(q)
  ).slice(0, 8)
})

// Nombre del grupo de una alumna (para mostrar en sugerencias)
function nombreGrupo(alumnaId) {
  if (!profe.value) return ''
  const gs = profe.value.grupos.filter(g => g.alumnas.some(a => a.id === alumnaId))
  return gs.map(g => g.nombre).join(', ')
}

function seleccionarAlumna(a) {
  alumnaSeleccionada.value = a
  busquedaAlumna.value = `${a.apellido}, ${a.nombre}`
  mostrarSugerencias.value = false
}

function limpiarAlumna() {
  alumnaSeleccionada.value = null
  busquedaAlumna.value = ''
  mostrarSugerencias.value = false
}

function onComprobante(e) {
  const file = e.target.files[0]
  if (!file) return
  comprobanteFile.value = file
  comprobantePreview.value = URL.createObjectURL(file)
}

function abrirModalPago() {
  errorPago.value = ''
  pagoExito.value = false
  limpiarAlumna()
  comprobanteFile.value = null
  comprobantePreview.value = ''
  formPago.value = {
    mes: hoy.getMonth() + 1,
    anio: hoy.getFullYear(),
    monto: 0,
    medio_pago: 'efectivo',
    observacion: '',
  }
  modalPago.value = true
}

function cerrarModalPago() {
  modalPago.value = false
}

async function registrarPago() {
  errorPago.value = ''
  pagoExito.value = false

  if (!alumnaSeleccionada.value) { errorPago.value = 'Seleccioná una alumna'; return }
  if (!formPago.value.monto)     { errorPago.value = 'El monto es obligatorio'; return }

  guardandoPago.value = true
  try {
    const fechaHoy = new Date().toISOString().slice(0, 10)
    const { data: cuota } = await axios.post('/api/cuotas', {
      alumna_id:  alumnaSeleccionada.value.id,
      mes:        formPago.value.mes,
      anio:       formPago.value.anio,
      monto:      formPago.value.monto,
      medio_pago: formPago.value.medio_pago,
      observacion:formPago.value.observacion || null,
      fecha_pago: fechaHoy,
    }, { headers: headers() })

    // Subir comprobante si hay imagen
    if (comprobanteFile.value) {
      const fd = new FormData()
      fd.append('comprobante', comprobanteFile.value)
      await axios.post(`/api/cuotas/${cuota.id}/comprobante`, fd, {
        headers: { ...headers(), 'Content-Type': 'multipart/form-data' },
      })
    }

    pagoExito.value = true

    // Limpiar para el siguiente pago (pero mantener mes/año/monto)
    limpiarAlumna()
    comprobanteFile.value = null
    comprobantePreview.value = ''
    formPago.value.observacion = ''

    // Ocultar el tick verde después de 4 segundos
    setTimeout(() => { pagoExito.value = false }, 4000)
  } catch (err) {
    errorPago.value = err.response?.data?.error || 'Error al registrar el pago'
  } finally {
    guardandoPago.value = false
  }
}

async function cargar() {
  try {
    const { data } = await axios.get(`/api/profesoras/${route.params.id}`, { headers: headers() })
    profe.value = data
  } catch {
    profe.value = null
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>
