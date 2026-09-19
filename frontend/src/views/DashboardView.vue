<template>
  <div class="p-6 lg:p-8">
    <div class="mb-8">
      <h1 class="font-display text-3xl font-bold text-ritmica-dark">Dashboard</h1>
      <p class="font-body text-gray-500 mt-1">Resumen general · {{ fechaHoy }}</p>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Alumnas activas</p>
        <p class="font-display text-3xl font-bold text-ritmica-dark">{{ stats.totalActivas }}</p>
        <p class="font-body text-xs text-gray-400 mt-1">{{ stats.totalVisitas }} visitas</p>
      </div>
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Cobrado este mes</p>
        <p class="font-display text-2xl font-bold text-emerald-600">${{ fmt(stats.cuotasMes) }}</p>
        <p class="font-body text-xs text-gray-400 mt-1">{{ stats.pagadasMes }} pagos</p>
      </div>
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Egresos este mes</p>
        <p class="font-display text-2xl font-bold text-red-500">${{ fmt(stats.egresosMes) }}</p>
        <p class="font-body text-xs text-gray-400 mt-1">resultado neto</p>
      </div>
      <div class="card p-5">
        <p class="font-body text-xs text-gray-400 uppercase tracking-wider mb-1">Resultado neto</p>
        <p class="font-display text-2xl font-bold" :class="neto >= 0 ? 'text-ritmica-pink' : 'text-red-600'">
          ${{ fmt(neto) }}
        </p>
        <p class="font-body text-xs text-gray-400 mt-1">ingresos - egresos</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Cumpleaños -->
      <div class="card p-6">
        <h2 class="font-display text-lg font-bold text-ritmica-dark mb-4">🎂 Cumpleaños hoy</h2>
        <div v-if="!stats.cumpleaniosHoy?.length" class="text-gray-400 font-body text-sm">
          Nadie cumple años hoy.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="a in stats.cumpleaniosHoy"
            :key="a.id"
            class="flex items-center gap-3 p-3 bg-ritmica-rose rounded-xl"
          >
            <span class="text-2xl">🛼</span>
            <div>
              <p class="font-body text-sm font-semibold text-ritmica-dark">{{ a.nombre }} {{ a.apellido }}</p>
              <p class="font-body text-xs text-gray-400">{{ edad(a.fecha_nacimiento) }} años</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Accesos rápidos -->
      <div class="card p-6 lg:col-span-2">
        <h2 class="font-display text-lg font-bold text-ritmica-dark mb-4">Accesos rápidos</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <RouterLink
            v-for="acc in accesos"
            :key="acc.to"
            :to="acc.to"
            class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-ritmica-rose hover:bg-ritmica-pink/10 transition-colors group"
          >
            <span class="text-3xl">{{ acc.icon }}</span>
            <span class="font-body text-xs text-gray-600 group-hover:text-ritmica-pink text-center">{{ acc.label }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Evolución cobros -->
    <div class="card p-6 mt-6">
      <h2 class="font-display text-lg font-bold text-ritmica-dark mb-4">Cobros últimos 6 meses</h2>
      <div class="h-48 flex items-end gap-2">
        <div
          v-for="m in ingresosMensuales"
          :key="`${m.mes}-${m.anio}`"
          class="flex-1 flex flex-col items-center gap-1"
        >
          <span class="font-body text-xs text-gray-400">${{ fmt(m.total) }}</span>
          <div
            class="w-full rounded-t-lg bg-gradient-to-t from-ritmica-pink to-ritmica-pink-light transition-all duration-500"
            :style="{ height: barHeight(m.total) + 'px' }"
          ></div>
          <span class="font-body text-xs text-gray-500">{{ nombreMes(m.mes) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const stats = ref({ totalActivas: 0, totalVisitas: 0, cuotasMes: 0, egresosMes: 0, pagadasMes: 0, cumpleaniosHoy: [] })
const ingresosMensuales = ref([])

const neto = computed(() => stats.value.cuotasMes - stats.value.egresosMes)

const fechaHoy = new Date().toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })

function fmt(n) { return Number(n||0).toLocaleString('es-AR', { minimumFractionDigits: 0 }) }
function fmtK(n) { return n >= 1000 ? (n/1000).toFixed(1)+'k' : String(Math.round(n)) }

function edad(fn) {
  const hoy = new Date()
  const nac = new Date(fn)
  return hoy.getFullYear() - nac.getFullYear()
}

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
function nombreMes(m) { return MESES[m-1] }

function barHeight(total) {
  const max = Math.max(...ingresosMensuales.value.map(m => m.total), 1)
  return Math.max(4, (total / max) * 140)
}

const accesos = [
  { to: '/alumnas',     icon: '🛼', label: 'Nueva alumna' },
  { to: '/pagos',       icon: '💳', label: 'Registrar pago' },
  { to: '/caja',        icon: '🏧', label: 'Caja del día' },
  { to: '/grupos',      icon: '🗂️', label: 'Grupos' },
  { to: '/sedes',       icon: '📍', label: 'Sedes' },
]

function headers() { return { Authorization: `Bearer ${localStorage.getItem('ritmica_token')}` } }

onMounted(async () => {
  const [s, i] = await Promise.all([
    axios.get('/api/dashboard',                    { headers: headers() }),
    axios.get('/api/dashboard/ingresos-mensuales', { headers: headers() }),
  ])
  stats.value = s.data
  ingresosMensuales.value = i.data
})
</script>
