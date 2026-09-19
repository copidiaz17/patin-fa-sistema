<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="font-display text-3xl font-bold text-ritmica-dark">Caja diaria</h1>
        <p class="font-body text-gray-500 mt-1">Movimientos del día</p>
      </div>
      <div class="flex items-center gap-3">
        <input v-model="fecha" type="date" class="input" @change="cargar" />
      </div>
    </div>

    <!-- KPIs del día -->
    <div class="grid grid-cols-3 gap-4 mb-8">
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Ingresos</p>
        <p class="font-display text-2xl font-bold text-emerald-600">${{ fmt(resumen.totalCuotas) }}</p>
      </div>
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Egresos</p>
        <p class="font-display text-2xl font-bold text-red-500">${{ fmt(resumen.totalEgresos) }}</p>
      </div>
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Saldo</p>
        <p class="font-display text-2xl font-bold" :class="resumen.saldo >= 0 ? 'text-ritmica-pink' : 'text-red-600'">${{ fmt(resumen.saldo) }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Cuotas del día -->
      <div class="card">
        <div class="p-5 border-b border-gray-100">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Cuotas cobradas</h2>
        </div>
        <div v-if="!resumen.cuotas?.length" class="p-6 text-center text-gray-400 font-body text-sm">Sin cobros hoy.</div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="c in resumen.cuotas" :key="c.id" class="px-5 py-3 flex justify-between items-center">
            <div>
              <p class="font-body text-sm font-semibold text-gray-900">{{ c.alumna?.apellido }}, {{ c.alumna?.nombre }}</p>
              <p class="font-body text-xs text-gray-400 capitalize">{{ c.medio_pago }}</p>
            </div>
            <p class="font-body text-sm font-bold text-emerald-600 font-mono">${{ fmt(c.monto) }}</p>
          </div>
        </div>
      </div>

      <!-- Egresos del día -->
      <div class="card">
        <div class="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Egresos</h2>
          <button @click="abrirModalEgreso" class="btn-primary text-xs py-1.5 px-3">+ Egreso</button>
        </div>
        <div v-if="!resumen.egresos?.length" class="p-6 text-center text-gray-400 font-body text-sm">Sin egresos hoy.</div>
        <div v-else class="divide-y divide-gray-50">
          <div v-for="e in resumen.egresos" :key="e.id" class="px-5 py-3 flex justify-between items-center">
            <div>
              <p class="font-body text-sm font-semibold text-gray-900">{{ e.categoria }}</p>
              <p class="font-body text-xs text-gray-400">{{ e.descripcion }}</p>
            </div>
            <div class="flex items-center gap-2">
              <p class="font-body text-sm font-bold text-red-500 font-mono">-${{ fmt(e.monto) }}</p>
              <button @click="eliminarEgreso(e)" class="text-red-300 hover:text-red-500 text-xs">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal egreso -->
    <div v-if="modalEgreso" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl w-full max-w-sm p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="font-display text-lg font-bold text-ritmica-dark">Nuevo egreso</h2>
          <button @click="modalEgreso = false" class="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Categoría *</label>
            <input v-model="formEgreso.categoria" type="text" placeholder="Alquiler, limpieza, etc." class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Descripción</label>
            <input v-model="formEgreso.descripcion" type="text" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Monto $</label>
            <input v-model.number="formEgreso.monto" type="number" min="0" step="100" class="input" />
          </div>
          <div>
            <label class="block font-body text-xs text-gray-500 mb-1">Medio de pago</label>
            <select v-model="formEgreso.medio_pago" class="input">
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>
        </div>
        <p v-if="errorEgreso" class="text-red-500 text-sm mt-3 font-body">{{ errorEgreso }}</p>
        <div class="flex gap-3 mt-6">
          <button @click="modalEgreso = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="guardarEgreso" :disabled="guardandoEgreso" class="btn-primary flex-1">
            {{ guardandoEgreso ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const hoy   = new Date().toISOString().slice(0,10)
const fecha = ref(hoy)
const resumen = ref({ cuotas:[], egresos:[], totalCuotas:0, totalEgresos:0, saldo:0 })
const modalEgreso   = ref(false)
const guardandoEgreso = ref(false)
const errorEgreso   = ref('')
const formEgreso = ref({ categoria:'', descripcion:'', monto:0, medio_pago:'efectivo' })

function fmt(n) { return Number(n||0).toLocaleString('es-AR') }
function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

async function cargar() {
  const { data } = await axios.get('/api/caja/resumen', { params: { fecha: fecha.value }, headers: headers() })
  resumen.value = data
}

function abrirModalEgreso() {
  formEgreso.value = { categoria:'', descripcion:'', monto:0, medio_pago:'efectivo' }
  errorEgreso.value = ''
  modalEgreso.value = true
}

async function guardarEgreso() {
  errorEgreso.value = ''
  if (!formEgreso.value.categoria || !formEgreso.value.monto) { errorEgreso.value = 'Categoría y monto son obligatorios'; return }
  guardandoEgreso.value = true
  try {
    await axios.post('/api/caja/egresos', { ...formEgreso.value, fecha: fecha.value }, { headers: headers() })
    modalEgreso.value = false
    await cargar()
  } catch (err) {
    errorEgreso.value = err.response?.data?.error || 'Error'
  } finally {
    guardandoEgreso.value = false
  }
}

async function eliminarEgreso(e) {
  if (!confirm('¿Eliminar este egreso?')) return
  await axios.delete(`/api/caja/egresos/${e.id}`, { headers: headers() })
  await cargar()
}

onMounted(cargar)
</script>
