<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Profesoras</h1>
        <p class="font-body text-gray-500 mt-1">Equipo docente</p>
      </div>
      <button @click="abrirModal()" class="btn-primary">+ Nueva profesora</button>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="p in profesoras" :key="p.id"
        class="card p-5 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow"
        :class="!p.activo ? 'opacity-50' : ''"
        @click="$router.push(`/profesoras/${p.id}`)"
      >
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-ritmica-pink/10 flex items-center justify-center flex-shrink-0">
            <span class="text-ritmica-pink font-bold font-body text-lg">{{ p.abreviatura || p.nombre[0] }}</span>
          </div>
          <div class="min-w-0">
            <p class="font-body text-sm font-bold text-gray-900 truncate">{{ p.apellido }}, {{ p.nombre }}</p>
            <p v-if="p.telefono" class="font-body text-xs text-gray-400 truncate">{{ p.telefono }}</p>
          </div>
        </div>
        <div class="flex justify-between items-center pt-2 border-t border-gray-100">
          <span :class="p.activo ? 'badge-activa' : 'badge-baja'">{{ p.activo ? 'Activa' : 'Inactiva' }}</span>
          <div class="flex gap-1" @click.stop>
            <button @click="abrirModal(p)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm transition-colors">✏️</button>
            <button @click="toggleActivo(p)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm transition-colors">{{ p.activo ? '🔒' : '🔓' }}</button>
          </div>
        </div>
      </div>
      <div v-if="!profesoras.length && !cargando" class="text-gray-400 font-body text-sm col-span-full text-center py-12">
        No hay profesoras cargadas.
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">{{ editando ? 'Editar profesora' : 'Nueva profesora' }}</h2>
          <button @click="cerrarModal" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Nombre *</label>
              <input v-model="form.nombre" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Apellido *</label>
              <input v-model="form.apellido" type="text" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Abreviatura</label>
              <input v-model="form.abreviatura" type="text" maxlength="10" class="input" />
            </div>
            <div>
              <label class="block font-body text-xs text-gray-500 mb-1">Teléfono</label>
              <input v-model="form.telefono" type="tel" class="input" />
            </div>
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>
        </div>
        <p v-if="error" class="text-red-500 text-sm font-body mt-3">{{ error }}</p>
        <div class="flex gap-3 mt-6">
          <button @click="cerrarModal" class="btn-secondary flex-1">Cancelar</button>
          <button @click="guardar" :disabled="guardando" class="btn-primary flex-1">{{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const profesoras = ref([])
const cargando   = ref(true)
const modal      = ref(false)
const editando   = ref(null)
const guardando  = ref(false)
const error      = ref('')
const form = ref({ nombre:'', apellido:'', abreviatura:'', telefono:'', email:'' })

function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

async function cargar() {
  cargando.value = true
  const { data } = await axios.get('/api/profesoras', { headers: headers() })
  profesoras.value = data
  cargando.value = false
}

function abrirModal(p = null) {
  editando.value = p; error.value = ''
  form.value = p ? { nombre: p.nombre, apellido: p.apellido, abreviatura: p.abreviatura||'', telefono: p.telefono||'', email: p.email||'' }
                 : { nombre:'', apellido:'', abreviatura:'', telefono:'', email:'' }
  modal.value = true
}
function cerrarModal() { modal.value = false; editando.value = null }

async function guardar() {
  error.value = ''
  if (!form.value.nombre || !form.value.apellido) { error.value = 'Nombre y apellido son obligatorios'; return }
  guardando.value = true
  try {
    if (editando.value) await axios.put(`/api/profesoras/${editando.value.id}`, form.value, { headers: headers() })
    else await axios.post('/api/profesoras', form.value, { headers: headers() })
    cerrarModal(); await cargar()
  } catch (err) { error.value = err.response?.data?.error || 'Error' }
  finally { guardando.value = false }
}

async function toggleActivo(p) {
  await axios.put(`/api/profesoras/${p.id}`, { activo: !p.activo }, { headers: headers() })
  await cargar()
}

onMounted(cargar)
</script>
