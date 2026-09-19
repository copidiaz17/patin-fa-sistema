<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Usuarios</h1>
        <p class="font-body text-gray-500 mt-1">Accesos al sistema</p>
      </div>
      <button @click="abrirModal()" class="btn-primary">+ Nuevo usuario</button>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-left px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Nombre</th>
            <th class="text-left px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
            <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Rol</th>
            <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Estado</th>
            <th class="text-center px-6 py-4 font-body text-xs text-gray-400 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id" class="border-b border-gray-50 hover:bg-gray-50">
            <td class="px-6 py-4 font-body text-sm font-semibold text-gray-900">{{ u.nombre }}</td>
            <td class="px-6 py-4 font-body text-sm text-gray-500 hidden sm:table-cell">{{ u.email }}</td>
            <td class="px-6 py-4 text-center">
              <span class="text-xs font-semibold px-2.5 py-1 rounded-full capitalize" :class="badgeRol(u.rol)">
                {{ u.rol }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <span :class="u.activo ? 'badge-activa' : 'badge-baja'">{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <div class="flex gap-1 justify-center">
                <button @click="abrirModal(u)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm">✏️</button>
                <button @click="toggleActivo(u)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 text-sm" :title="u.activo ? 'Desactivar' : 'Activar'">
                  {{ u.activo ? '🔒' : '🔓' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="modal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-md p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">
            {{ editando ? 'Editar usuario' : 'Nuevo usuario' }}
          </h2>
          <button @click="modal = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Nombre *</label>
            <input v-model="form.nombre" type="text" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Email *</label>
            <input v-model="form.email" type="email" class="input" :disabled="!!editando" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">
              Contraseña {{ editando ? '(dejar vacío para no cambiar)' : '*' }}
            </label>
            <input v-model="form.password" type="password" class="input" autocomplete="new-password" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Rol</label>
            <select v-model="form.rol" class="input">
              <option value="admin">Admin — acceso total</option>
              <option value="recepcion">Recepción — alumnas, pagos, caja</option>
              <option value="lectura">Solo lectura</option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-red-500 text-sm font-body mt-3">{{ error }}</p>

        <div class="flex gap-3 mt-6">
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
import { ref, onMounted } from 'vue'
import axios from 'axios'

const usuarios  = ref([])
const profesoras = ref([])
const modal     = ref(false)
const editando  = ref(null)
const guardando = ref(false)
const error     = ref('')
const form = ref({ nombre: '', email: '', password: '', rol: 'recepcion', profesora_id: null })

function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

function badgeRol(rol) {
  return {
    admin:     'bg-ritmica-pink/10 text-ritmica-pink',
    recepcion: 'bg-blue-50 text-blue-600',
    lectura:   'bg-gray-100 text-gray-500',
    profesora: 'bg-purple-50 text-purple-600',
  }[rol] || 'bg-gray-100 text-gray-500'
}

async function cargar() {
  const [u, p] = await Promise.all([
    axios.get('/api/usuarios',   { headers: headers() }),
    axios.get('/api/profesoras', { headers: headers() }),
  ])
  usuarios.value  = u.data
  profesoras.value = p.data
}

function abrirModal(u = null) {
  editando.value = u
  error.value    = ''
  form.value = u
    ? { nombre: u.nombre, email: u.email, password: '', rol: u.rol, profesora_id: u.profesora_id || null }
    : { nombre: '', email: '', password: '', rol: 'recepcion', profesora_id: null }
  modal.value = true
}

async function guardar() {
  error.value = ''
  if (!form.value.nombre || !form.value.email) { error.value = 'Nombre y email son obligatorios'; return }
  if (!editando.value && !form.value.password)  { error.value = 'La contraseña es obligatoria'; return }
  if (form.value.rol === 'profesora' && !form.value.profesora_id) {
    error.value = 'Seleccioná la profesora vinculada'; return
  }
  guardando.value = true
  try {
    if (editando.value) {
      await axios.put(`/api/usuarios/${editando.value.id}`, form.value, { headers: headers() })
    } else {
      await axios.post('/api/usuarios', form.value, { headers: headers() })
    }
    modal.value = false
    await cargar()
  } catch (err) {
    error.value = err.response?.data?.error || 'Error al guardar'
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(u) {
  await axios.put(`/api/usuarios/${u.id}`, { activo: !u.activo }, { headers: headers() })
  await cargar()
}

onMounted(cargar)
</script>
