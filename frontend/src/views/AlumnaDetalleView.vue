<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center gap-3 mb-6">
      <RouterLink to="/alumnas" class="text-gray-400 hover:text-ritmica-pink transition-colors">← Volver</RouterLink>
    </div>

    <div v-if="cargando" class="text-center py-16 text-gray-400 font-body">Cargando...</div>
    <template v-else-if="alumna">
      <!-- Header -->
      <div class="card p-6 mb-6 flex flex-col sm:flex-row gap-6 items-start">
        <!-- Foto -->
        <div class="relative flex-shrink-0">
          <div class="w-24 h-24 rounded-2xl overflow-hidden bg-ritmica-rose flex items-center justify-center">
            <img v-if="alumna.foto" :src="alumna.foto" class="w-full h-full object-cover" />
            <span v-else class="text-ritmica-pink text-3xl font-bold font-body">{{ iniciales }}</span>
          </div>
          <label class="absolute -bottom-2 -right-2 bg-ritmica-pink text-white text-xs rounded-full w-7 h-7 flex items-center justify-center cursor-pointer hover:bg-ritmica-pink-dark transition-colors">
            📷
            <input type="file" accept="image/*" class="hidden" @change="subirFoto" />
          </label>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between flex-wrap gap-2">
            <div>
              <h1 class="font-display text-2xl font-bold text-ritmica-dark">{{ alumna.apellido }}, {{ alumna.nombre }}</h1>
              <p v-if="alumna.apodo" class="font-body text-sm text-gray-400">"{{ alumna.apodo }}"</p>
            </div>
            <span :class="badgeEstado(alumna.estado)">{{ alumna.estado }}</span>
          </div>
          <div class="flex flex-wrap gap-4 mt-3 text-sm font-body text-gray-500">
            <span v-if="alumna.fecha_nacimiento">🎂 {{ edad }} años ({{ alumna.fecha_nacimiento }})</span>
            <span v-if="alumna.telefono">📱 {{ alumna.telefono }}</span>
            <span v-if="alumna.correo">✉️ {{ alumna.correo }}</span>
          </div>
          <div class="flex flex-wrap gap-1 mt-3">
            <span v-for="act in alumna.actividades" :key="act.id" class="text-xs bg-ritmica-pink/10 text-ritmica-pink px-2.5 py-1 rounded-full font-body">
              {{ act.nombre }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 mb-6 border-b border-gray-200">
        <button
          v-for="tab in tabs" :key="tab.id"
          @click="tabActivo = tab.id"
          class="px-4 py-2 font-body text-sm transition-colors border-b-2 -mb-px"
          :class="tabActivo === tab.id ? 'border-ritmica-pink text-ritmica-pink font-semibold' : 'border-transparent text-gray-500'"
        >{{ tab.label }}</button>
      </div>

      <!-- Tab: Datos personales -->
      <template v-if="tabActivo === 'datos'">
        <div class="card p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="campo in camposPersonales" :key="campo.key">
            <p class="font-body text-xs text-gray-400 mb-0.5">{{ campo.label }}</p>
            <p class="font-body text-sm text-gray-800">{{ campo.format ? campo.format(alumna[campo.key]) : (alumna[campo.key] || '—') }}</p>
          </div>
          <div v-if="alumna.observacion" class="sm:col-span-2 lg:col-span-3">
            <p class="font-body text-xs text-gray-400 mb-0.5">Observaciones</p>
            <p class="font-body text-sm text-gray-800">{{ alumna.observacion }}</p>
          </div>
          <div v-if="alumna.comentarios" class="sm:col-span-2 lg:col-span-3">
            <p class="font-body text-xs text-gray-400 mb-0.5">Comentarios</p>
            <p class="font-body text-sm text-gray-800">{{ alumna.comentarios }}</p>
          </div>
        </div>
      </template>

      <!-- Tab: Pagos -->
      <template v-if="tabActivo === 'pagos'">
        <div class="flex justify-between items-center mb-4">
          <p class="font-body text-sm text-gray-500">Historial de cuotas</p>
          <button @click="abrirModalPago" class="btn-primary text-xs py-1.5 px-4">+ Registrar cuota</button>
        </div>
        <div class="card overflow-hidden">
          <div v-if="!cuotas.length" class="text-center py-8 text-gray-400 font-body text-sm">Sin pagos registrados.</div>
          <table v-else class="w-full">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left px-6 py-3 font-body text-xs text-gray-400 uppercase tracking-wider">Período</th>
                <th class="text-right px-6 py-3 font-body text-xs text-gray-400 uppercase tracking-wider">Monto</th>
                <th class="text-center px-6 py-3 font-body text-xs text-gray-400 uppercase tracking-wider">Medio</th>
                <th class="text-center px-6 py-3 font-body text-xs text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="text-center px-6 py-3 font-body text-xs text-gray-400 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cuotas" :key="c.id" class="border-b border-gray-50 hover:bg-gray-50">
                <td class="px-6 py-3 font-body text-sm font-semibold">{{ nombreMes(c.mes) }} {{ c.anio }}</td>
                <td class="px-6 py-3 font-body text-sm text-right font-mono">${{ fmt(c.monto) }}</td>
                <td class="px-6 py-3 font-body text-xs text-center capitalize text-gray-500">{{ c.medio_pago }}</td>
                <td class="px-6 py-3 font-body text-xs text-center text-gray-500">{{ c.fecha_pago }}</td>
                <td class="px-6 py-3 text-center">
                  <button @click="eliminarCuota(c)" class="text-red-400 hover:text-red-600 text-sm">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- Modal pago -->
    <div v-if="modalPago" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Registrar cuota</h2>
          <button @click="modalPago = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="space-y-4">
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
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Monto $</label>
            <input v-model.number="formPago.monto" type="number" min="0" step="100" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Medio de pago</label>
            <select v-model="formPago.medio_pago" class="input">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="mercadopago">MercadoPago</option>
            </select>
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Fecha de pago</label>
            <input v-model="formPago.fecha_pago" type="date" class="input" />
          </div>
        </div>
        <p v-if="errorPago" class="text-red-500 text-sm mt-3 font-body">{{ errorPago }}</p>
        <div class="flex gap-3 mt-6">
          <button @click="modalPago = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="confirmarPago" :disabled="guardandoPago" class="btn-primary flex-1">
            {{ guardandoPago ? 'Guardando...' : 'Confirmar' }}
          </button>
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
const alumna   = ref(null)
const cuotas   = ref([])
const cargando = ref(true)
const tabActivo= ref('datos')
const modalPago    = ref(false)
const guardandoPago= ref(false)
const errorPago    = ref('')

const hoy = new Date()
const formPago = ref({ mes: hoy.getMonth()+1, anio: hoy.getFullYear(), monto:0, medio_pago:'efectivo', fecha_pago: hoy.toISOString().slice(0,10) })

const tabs = [
  { id:'datos', label:'Datos personales' },
  { id:'pagos', label:'Pagos' },
]

const CANAL_LABEL = { redes_sociales:'Redes sociales', presencial:'Presencial', flyers:'Flyers / Afiches', recomendacion:'Recomendación', otros:'Otros' }

const camposPersonales = [
  { key:'documento',               label:'Documento' },
  { key:'fecha_nacimiento',        label:'Fecha de nacimiento' },
  { key:'fecha_ingreso',           label:'Fecha de ingreso' },
  { key:'telefono',                label:'Celular' },
  { key:'telefono_fijo',           label:'Teléfono fijo' },
  { key:'correo',                  label:'Correo' },
  { key:'contacto_emergencia',     label:'Contacto emergencia' },
  { key:'telefono_emergencia',     label:'Tel. emergencia' },
  { key:'obra_social',             label:'Obra social' },
  { key:'vencimiento_certificado', label:'Vto. certificado médico' },
  { key:'canal_captacion',         label:'Canal de captación', format: v => CANAL_LABEL[v] || v },
]

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function nombreMes(m) { return MESES[m-1] }
function fmt(n) { return Number(n||0).toLocaleString('es-AR') }
function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

const iniciales = computed(() => alumna.value ? `${alumna.value.nombre[0]}${alumna.value.apellido[0]}`.toUpperCase() : '' )
const edad = computed(() => alumna.value?.fecha_nacimiento ? hoy.getFullYear() - new Date(alumna.value.fecha_nacimiento).getFullYear() : '')

function badgeEstado(e) {
  const m = { activa:'badge-activa', visita:'badge-visita', baja:'badge-baja', suspendida:'badge-suspendida' }
  return m[e] || 'badge-activa'
}

async function cargar() {
  const [al, cu] = await Promise.all([
    axios.get(`/api/alumnas/${route.params.id}`,              { headers: headers() }),
    axios.get('/api/cuotas', { params: { alumna_id: route.params.id }, headers: headers() }),
  ])
  alumna.value = al.data
  cuotas.value = cu.data
  cargando.value = false
}

async function subirFoto(e) {
  const file = e.target.files[0]
  if (!file) return
  const fd = new FormData()
  fd.append('foto', file)
  const { data } = await axios.post(`/api/alumnas/${route.params.id}/foto`, fd, { headers: { ...headers(), 'Content-Type': 'multipart/form-data' } })
  alumna.value.foto = data.url
}

function abrirModalPago() {
  errorPago.value = ''
  formPago.value = { mes: hoy.getMonth()+1, anio: hoy.getFullYear(), monto:0, medio_pago:'efectivo', fecha_pago: hoy.toISOString().slice(0,10) }
  modalPago.value = true
}

async function confirmarPago() {
  errorPago.value = ''
  if (!formPago.value.monto) { errorPago.value = 'El monto es obligatorio'; return }
  guardandoPago.value = true
  try {
    await axios.post('/api/cuotas', { ...formPago.value, alumna_id: route.params.id }, { headers: headers() })
    modalPago.value = false
    const { data } = await axios.get('/api/cuotas', { params: { alumna_id: route.params.id }, headers: headers() })
    cuotas.value = data
  } catch (err) { errorPago.value = err.response?.data?.error || 'Error' }
  finally { guardandoPago.value = false }
}

async function eliminarCuota(c) {
  if (!confirm('¿Eliminar este pago?')) return
  await axios.delete(`/api/cuotas/${c.id}`, { headers: headers() })
  cuotas.value = cuotas.value.filter(x => x.id !== c.id)
}

onMounted(cargar)
</script>
