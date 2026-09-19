<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Sedes</h1>
        <p class="font-body text-gray-500 mt-1">Ubicaciones del gimnasio</p>
      </div>
      <button @click="abrirModal()" class="btn-primary">+ Nueva sede</button>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="s in sedes" :key="s.id"
        class="card p-5"
        :class="!s.activo ? 'opacity-50' : ''"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📍</span>
            <div>
              <p class="font-body text-sm font-bold text-gray-900">{{ s.nombre }}</p>
              <p v-if="s.direccion" class="font-body text-xs text-gray-400 mt-0.5">{{ s.direccion }}</p>
            </div>
          </div>
        </div>
        <div class="flex justify-between items-center pt-3 border-t border-gray-100">
          <span :class="s.activo ? 'badge-activa' : 'badge-baja'">{{ s.activo ? 'Activa' : 'Inactiva' }}</span>
          <div class="flex gap-1">
            <button @click="abrirModal(s)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm">✏️</button>
            <button @click="toggleActivo(s)" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm">{{ s.activo ? '🔒' : '🔓' }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">{{ editando ? 'Editar sede' : 'Nueva sede' }}</h2>
          <button @click="modal = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Dirección</label>
            <input v-model="form.direccion" type="text" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Teléfono</label>
            <input v-model="form.telefono" type="tel" class="input" />
          </div>
        </div>
        <p v-if="error" class="text-red-500 text-sm font-body mt-3">{{ error }}</p>
        <div class="flex gap-3 mt-6">
          <button @click="modal = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="guardar" :disabled="guardando" class="btn-primary flex-1">{{ guardando ? 'Guardando...' : (editando ? 'Actualizar' : 'Crear') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const sedes    = ref([])
const modal    = ref(false)
const editando = ref(null)
const guardando= ref(false)
const error    = ref('')
const form = ref({ nombre:'', direccion:'', telefono:'' })

function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

async function cargar() {
  const { data } = await axios.get('/api/sedes', { headers: headers() })
  sedes.value = data
}

function abrirModal(s = null) {
  editando.value = s; error.value = ''
  form.value = s ? { nombre: s.nombre, direccion: s.direccion||'', telefono: s.telefono||'' }
                 : { nombre:'', direccion:'', telefono:'' }
  modal.value = true
}

async function guardar() {
  error.value = ''
  if (!form.value.nombre) { error.value = 'El nombre es obligatorio'; return }
  guardando.value = true
  try {
    if (editando.value) await axios.put(`/api/sedes/${editando.value.id}`, form.value, { headers: headers() })
    else await axios.post('/api/sedes', form.value, { headers: headers() })
    modal.value = false; await cargar()
  } catch (err) { error.value = err.response?.data?.error || 'Error' }
  finally { guardando.value = false }
}

async function toggleActivo(s) {
  await axios.put(`/api/sedes/${s.id}`, { activo: !s.activo }, { headers: headers() })
  await cargar()
}

onMounted(cargar)
</script>
