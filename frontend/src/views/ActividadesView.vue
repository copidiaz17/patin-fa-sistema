<template>
  <div class="p-6 lg:p-8">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Grupos</h1>
        <p class="font-body text-gray-500 mt-1">{{ actividadesFiltradas.length }} grupos activos</p>
      </div>
      <button @click="abrirModal()" class="btn-primary">+ Nuevo grupo</button>
    </div>

    <!-- Filtro por sede -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="s in [{ id:'', nombre:'Todos' }, ...sedes]" :key="s.id"
        @click="filtroSede = s.id"
        class="px-4 py-2 rounded-xl font-body text-sm transition-colors"
        :class="filtroSede === s.id
          ? 'bg-ritmica-pink text-white'
          : 'bg-white border border-gray-200 text-gray-600 hover:border-ritmica-pink'"
      >{{ s.nombre }}</button>
    </div>

    <!-- Cards -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="a in actividadesFiltradas" :key="a.id"
        class="card p-5 flex flex-col gap-3"
        :class="!a.activo ? 'opacity-50' : ''"
      >
        <!-- Nombre + monto -->
        <div class="flex items-start justify-between">
          <div>
            <p class="font-body font-bold text-gray-900">{{ a.nombre }}</p>
            <p class="font-body text-xs text-ritmica-pink mt-0.5">{{ a.sede?.nombre }}</p>
          </div>
          <span class="font-mono text-sm font-bold text-gray-900 whitespace-nowrap ml-2">${{ fmt(a.mensualidad) }}</span>
        </div>

        <!-- Horarios -->
        <div v-if="a.horarios?.length" class="flex flex-wrap gap-1">
          <span
            v-for="h in a.horarios" :key="h.dia"
            class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-body"
          >{{ h.dia }} {{ h.hora_inicio }}–{{ h.hora_fin }}</span>
        </div>

        <!-- Footer -->
        <div class="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
          <span class="font-body text-xs text-gray-400">Cap. {{ a.capacidad }}</span>
          <div class="flex gap-1">
            <button @click="abrirModal(a)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm" title="Editar">✏️</button>
            <button @click="toggleActivo(a)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm" :title="a.activo ? 'Desactivar' : 'Activar'">{{ a.activo ? '🔒' : '🔓' }}</button>
          </div>
        </div>
      </div>

      <div v-if="!actividadesFiltradas.length" class="col-span-full text-center py-16 text-gray-400 font-body">
        No hay grupos para mostrar.
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="modal" class="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-2xl w-full max-w-lg my-4">
        <div class="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 class="font-display text-xl font-bold text-ritmica-dark">{{ editando ? 'Editar grupo' : 'Nuevo grupo' }}</h2>
          <button @click="modal = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div class="p-6 space-y-4">

          <!-- Nombre -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" placeholder="Ej: Avanzadas · San Jorge" class="input" />
          </div>

          <!-- Sede + Mensualidad -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Sede *</label>
              <select v-model.number="form.sede_id" class="input">
                <option value="">Seleccionar...</option>
                <option v-for="s in sedes" :key="s.id" :value="s.id">{{ s.nombre }}</option>
              </select>
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Mensualidad $</label>
              <input v-model.number="form.mensualidad" type="number" min="0" step="100" class="input" />
            </div>
          </div>

          <!-- Capacidad -->
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Capacidad</label>
            <input v-model.number="form.capacidad" type="number" min="1" class="input" />
          </div>

          <!-- Horarios -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="font-body text-xs text-gray-500">Horarios</label>
              <button @click="agregarHorario" class="text-ritmica-pink text-xs font-body hover:underline">+ Agregar horario</button>
            </div>
            <div v-for="(h, i) in form.horarios" :key="i" class="flex gap-2 mb-2 items-center">
              <select v-model="h.dia" class="input flex-1">
                <option v-for="d in dias" :key="d" :value="d">{{ d }}</option>
              </select>
              <input v-model="h.hora_inicio" type="time" class="input w-28" />
              <input v-model="h.hora_fin"    type="time" class="input w-28" />
              <button @click="form.horarios.splice(i, 1)" class="text-red-400 hover:text-red-600 text-sm flex-shrink-0">✕</button>
            </div>
            <p v-if="!form.horarios.length" class="font-body text-xs text-gray-300 italic">Sin horarios cargados</p>
          </div>
        </div>

        <p v-if="error" class="text-red-500 text-sm font-body px-6 pb-2">{{ error }}</p>

        <div class="flex gap-3 p-6 pt-0">
          <button @click="modal = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="guardar" :disabled="guardando" class="btn-primary flex-1">
            {{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const actividades = ref([])
const sedes       = ref([])
const profesoras  = ref([])
const modal       = ref(false)
const editando    = ref(null)
const guardando   = ref(false)
const error       = ref('')
const filtroSede  = ref('')

const dias = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

const formVacio = () => ({ nombre:'', sede_id:'', profesora_id: null, profesora_id_2: null, mensualidad: 0, capacidad: 20, horarios: [] })
const form = ref(formVacio())

function fmt(n) { return Number(n || 0).toLocaleString('es-AR') }
function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

const actividadesFiltradas = computed(() =>
  actividades.value.filter(a => !filtroSede.value || a.sede_id == filtroSede.value)
)

async function cargar() {
  const [ac, se, pr] = await Promise.all([
    axios.get('/api/actividades', { headers: headers() }),
    axios.get('/api/sedes',       { headers: headers() }),
    axios.get('/api/profesoras',  { headers: headers() }),
  ])
  actividades.value = ac.data
  sedes.value       = se.data.filter(s => s.activo)
  profesoras.value  = pr.data.filter(p => p.activo)
}

function agregarHorario() {
  form.value.horarios.push({ dia: 'Lunes', hora_inicio: '09:00', hora_fin: '10:00' })
}

function abrirModal(a = null) {
  editando.value = a
  error.value    = ''
  form.value = a
    ? {
        nombre:        a.nombre,
        sede_id:       a.sede_id,
        profesora_id:  a.profesora_id   || null,
        profesora_id_2:a.profesora_id_2 || null,
        mensualidad:   Number(a.mensualidad || 0),
        capacidad:     a.capacidad,
        horarios:      JSON.parse(JSON.stringify(a.horarios || [])),
      }
    : formVacio()
  modal.value = true
}

async function guardar() {
  error.value = ''
  if (!form.value.nombre.trim() || !form.value.sede_id) {
    error.value = 'Nombre y sede son obligatorios'
    return
  }
  guardando.value = true
  try {
    // Florencia es la única profesora: el formulario no pregunta y el grupo
    // queda a su nombre.
    const datos = { ...form.value }
    if (!datos.profesora_id && profesoras.value.length === 1) datos.profesora_id = profesoras.value[0].id
    if (editando.value) {
      await axios.put(`/api/actividades/${editando.value.id}`, datos, { headers: headers() })
    } else {
      await axios.post('/api/actividades', datos, { headers: headers() })
    }
    modal.value = false
    await cargar()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(a) {
  await axios.put(`/api/actividades/${a.id}`, { activo: !a.activo }, { headers: headers() })
  await cargar()
}

onMounted(cargar)
</script>
