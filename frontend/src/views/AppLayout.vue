<template>
  <div class="min-h-screen bg-ritmica-rose flex">

    <!-- Overlay mobile -->
    <div v-if="sidebarOpen" class="fixed inset-0 z-30 bg-black/50 lg:hidden" @click="sidebarOpen = false" />

    <!-- Sidebar -->
    <aside
      class="fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col
             bg-gradient-to-b from-ritmica-pink to-ritmica-pink-dark
             transform transition-transform duration-300 ease-in-out
             lg:relative lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    >
      <!-- Logo -->
      <div class="p-5 border-b border-white/20 flex items-center justify-center">
        <img src="/logo.webp" alt="Escuela Patín Artístico F.A." class="w-32 h-32 object-contain drop-shadow-lg" />
      </div>

      <!-- User pill -->
      <div class="mx-4 mt-4 px-3 py-2 rounded-xl bg-white/10 flex items-center gap-2">
        <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
          {{ iniciales }}
        </div>
        <div class="min-w-0">
          <p class="text-white text-xs font-semibold truncate">{{ nombre }}</p>
          <p class="text-white/60 text-xs capitalize">{{ rol }}</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-4 space-y-0.5 overflow-y-auto mt-2">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm transition-all duration-200"
          :class="isActive(link.to)
            ? 'bg-white text-ritmica-pink font-semibold shadow-sm'
            : 'text-white/80 hover:bg-white/15 hover:text-white'"
          @click="sidebarOpen = false"
        >
          <span class="text-base w-5 text-center flex-shrink-0">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
        </RouterLink>
      </nav>

      <!-- Footer -->
      <div class="p-4 border-t border-white/20">
        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-white/70 hover:text-white hover:bg-white/15 transition-all"
        >
          <span class="text-base w-5 text-center">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="flex-1 overflow-y-auto min-w-0">
      <!-- Topbar mobile -->
      <div class="lg:hidden flex items-center gap-3 px-4 py-3 bg-ritmica-pink border-b border-white/20 sticky top-0 z-20">
        <button @click="sidebarOpen = true" class="text-white p-1">
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <img src="/logo.webp" alt="Escuela Patín Artístico F.A." class="h-8 object-contain" />
      </div>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route  = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)

const nombre = localStorage.getItem('ritmica_nombre') || 'Usuario'
const rol    = localStorage.getItem('ritmica_rol')    || 'recepcion'

const iniciales = computed(() =>
  nombre.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
)

const ALL_LINKS = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard',    roles: ['admin','lectura'] },
  { to: '/alumnas',     icon: '🛼', label: 'Alumnas',      roles: ['admin','recepcion','lectura','profesora'] },
  { to: '/pagos',       icon: '💳', label: 'Pagos',        roles: ['admin','recepcion','profesora'] },
  { to: '/caja',        icon: '🏧', label: 'Caja diaria',  roles: ['admin','recepcion'] },
  { to: '/grupos',      icon: '🗂️', label: 'Grupos',       roles: ['admin','recepcion','lectura'] },
  // Profesoras y Sueldos no van: en Patín F.A. Florencia es la única profesora.
  { to: '/sedes',       icon: '📍', label: 'Sedes',        roles: ['admin','recepcion'] },
  { to: '/usuarios',    icon: '👤', label: 'Usuarios',     roles: ['admin','recepcion'] },
]

const navLinks = computed(() => ALL_LINKS.filter(l => l.roles.includes(rol)))

function isActive(path) { return route.path.startsWith(path) }

function logout() {
  localStorage.removeItem('ritmica_token')
  localStorage.removeItem('ritmica_nombre')
  localStorage.removeItem('ritmica_rol')
  router.push('/login')
}
</script>
