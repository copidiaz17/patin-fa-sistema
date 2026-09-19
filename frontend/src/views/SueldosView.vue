<template>
  <div class="p-6 lg:p-8">
    <div class="mb-6">
      <h1 class="font-display text-3xl font-bold text-ritmica-dark">Sueldos</h1>
      <p class="font-body text-gray-500 mt-1">Liquidación mensual por profesora (40% de cuotas cobradas del período)</p>
    </div>

    <!-- Filtro mes/año -->
    <div class="flex flex-wrap gap-3 mb-6 items-end">
      <div>
        <label class="block font-body text-xs text-gray-500 mb-1">Mes</label>
        <select v-model.number="filtroMes" class="input w-40">
          <option v-for="m in 12" :key="m" :value="m">{{ nombreMes(m) }}</option>
        </select>
      </div>
      <div>
        <label class="block font-body text-xs text-gray-500 mb-1">Año</label>
        <select v-model.number="filtroAnio" class="input w-28">
          <option v-for="a in anios" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
      <button @click="cargar" class="btn-primary">Ver sueldos</button>
    </div>

    <div v-if="cargando" class="text-center py-16 text-gray-400 font-body">Calculando...</div>
    <div v-if="errorMsg" class="card p-4 text-red-500 font-body text-sm mb-4">{{ errorMsg }}</div>

    <template v-else-if="datos">
      <!-- Resumen total -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-4 text-center">
          <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Período</p>
          <p class="font-display text-lg font-bold text-ritmica-dark">{{ nombreMes(datos.mes) }} {{ datos.anio }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Profesoras activas</p>
          <p class="font-display text-lg font-bold text-ritmica-dark">{{ datos.profesoras.length }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Total cuotas cobradas</p>
          <p class="font-display text-lg font-bold text-ritmica-pink">${{ fmt(totalCuotas) }}</p>
        </div>
        <div class="card p-4 text-center">
          <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Total a liquidar (40%)</p>
          <p class="font-display text-lg font-bold text-emerald-600">${{ fmt(totalSueldos) }}</p>
        </div>
      </div>

      <!-- Tabla de profesoras -->
      <div class="space-y-3">
        <div
          v-for="p in datos.profesoras"
          :key="p.profesora.id"
          class="card overflow-hidden"
        >
          <!-- Cabecera de la profesora -->
          <button
            class="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            @click="toggle(p.profesora.id)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-ritmica-rose flex items-center justify-center text-ritmica-pink font-bold text-sm flex-shrink-0">
                {{ p.profesora.apellido[0] }}{{ p.profesora.nombre[0] }}
              </div>
              <div class="text-left">
                <p class="font-body font-semibold text-gray-900">{{ p.profesora.apellido }}, {{ p.profesora.nombre }}</p>
                <p class="font-body text-xs text-gray-400">{{ p.alumnas_count }} alumnas · {{ p.detalle.length }} cuotas cobradas en el período</p>
              </div>
            </div>
            <div class="flex items-center gap-6">
              <div class="text-right hidden sm:block">
                <p class="font-body text-xs text-gray-400">Total cuotas</p>
                <p class="font-body font-semibold text-gray-700 font-mono">${{ fmt(p.total_cuotas) }}</p>
              </div>
              <div class="text-right">
                <p class="font-body text-xs text-gray-400">Sueldo (40%)</p>
                <p class="font-display text-lg font-bold text-emerald-600 font-mono">${{ fmt(p.sueldo) }}</p>
              </div>
              <span class="text-gray-400 text-sm">{{ expandido === p.profesora.id ? '▲' : '▼' }}</span>
            </div>
          </button>

          <!-- Detalle expandible -->
          <div v-if="expandido === p.profesora.id" class="border-t border-gray-100">
            <div v-if="!p.detalle.length" class="px-6 py-4 text-gray-400 font-body text-sm text-center">
              Sin cuotas cobradas en este período para sus alumnas.
            </div>
            <table v-else class="w-full">
              <thead>
                <tr class="bg-gray-50">
                  <th class="text-left px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider">Alumna</th>
                  <th class="text-left px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider hidden lg:table-cell">Grupo</th>
                  <th class="text-center px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider">%</th>
                  <th class="text-center px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider hidden md:table-cell">Fecha pago</th>
                  <th class="text-right px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider">Monto</th>
                  <th class="text-right px-6 py-2 font-body text-xs text-gray-400 uppercase tracking-wider">Le corresponde</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in p.detalle" :key="c.id" class="border-t border-gray-50 hover:bg-gray-50">
                  <td class="px-6 py-2.5 font-body text-sm text-gray-800">{{ c.alumna.apellido }}, {{ c.alumna.nombre }}</td>
                  <td class="px-6 py-2.5 font-body text-xs text-gray-500 hidden lg:table-cell">{{ c.grupo }}</td>
                  <td class="px-6 py-2.5 text-center">
                    <span
                      class="text-xs font-semibold px-2 py-0.5 rounded-full"
                      :class="c.porcentaje === 0.20 ? 'bg-amber-100 text-amber-700' : 'bg-ritmica-pink/10 text-ritmica-pink'"
                    >{{ c.porcentaje === 0.20 ? '20%' : '40%' }}</span>
                  </td>
                  <td class="px-6 py-2.5 font-body text-xs text-gray-500 text-center hidden md:table-cell">{{ c.fecha_pago }}</td>
                  <td class="px-6 py-2.5 font-body text-sm text-gray-600 text-right font-mono">${{ fmt(c.monto) }}</td>
                  <td class="px-6 py-2.5 font-body text-sm font-semibold text-emerald-700 text-right font-mono">${{ fmt(Math.round(c.monto * c.porcentaje)) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="bg-emerald-50">
                  <td colspan="5" class="px-6 py-2.5 font-body text-sm font-semibold text-gray-700">Sueldo a liquidar</td>
                  <td class="px-6 py-2.5 font-body text-sm font-bold text-emerald-700 text-right font-mono">${{ fmt(p.sueldo) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const hoy       = new Date()
const filtroMes  = ref(hoy.getMonth() + 1)
const filtroAnio = ref(hoy.getFullYear())
const anios      = Array.from({ length: 4 }, (_, i) => hoy.getFullYear() - i)
const cargando   = ref(false)
const datos      = ref(null)
const expandido  = ref(null)
const errorMsg   = ref('')

const MESES_N = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
function nombreMes(m) { return MESES_N[m - 1] }
function fmt(n) { return Number(n || 0).toLocaleString('es-AR') }
function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

const totalCuotas  = computed(() => datos.value?.profesoras.reduce((s, p) => s + p.total_cuotas, 0) ?? 0)
const totalSueldos = computed(() => datos.value?.profesoras.reduce((s, p) => s + p.sueldo, 0) ?? 0)

function toggle(id) {
  expandido.value = expandido.value === id ? null : id
}

async function cargar() {
  cargando.value = true
  errorMsg.value = ''
  expandido.value = null
  try {
    const { data } = await axios.get('/api/sueldos', {
      params: { mes: filtroMes.value, anio: filtroAnio.value },
      headers: headers(),
    })
    datos.value = data
  } catch (err) {
    errorMsg.value = err.response?.data?.error || 'Error al cargar los sueldos'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>
