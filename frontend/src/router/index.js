import { createRouter, createWebHistory } from 'vue-router'

const PROFESORA_ALLOWED = ['/alumnas', '/pagos']

function requireAuth(to, from, next) {
  const token = localStorage.getItem('ritmica_token')
  if (!token) return next('/login')
  const rol = localStorage.getItem('ritmica_rol')
  if (rol === 'profesora') {
    const allowed = PROFESORA_ALLOWED.some(p => to.path.startsWith(p))
    if (!allowed) return next('/alumnas')
  }
  if (rol === 'recepcion' && to.path.startsWith('/dashboard')) {
    return next('/alumnas')
  }
  next()
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    {
      path: '/',
      component: () => import('../views/AppLayout.vue'),
      beforeEnter: requireAuth,
      children: [
        { path: '', redirect: () => localStorage.getItem('ritmica_rol') === 'recepcion' ? '/alumnas' : '/dashboard' },
        { path: 'dashboard',   name: 'dashboard',   component: () => import('../views/DashboardView.vue') },
        { path: 'alumnas',     name: 'alumnas',     component: () => import('../views/AlumnasView.vue') },
        { path: 'alumnas/:id', name: 'alumna',      component: () => import('../views/AlumnaDetalleView.vue') },
        { path: 'pagos',       name: 'pagos',       component: () => import('../views/PagosView.vue') },
        { path: 'caja',        name: 'caja',        component: () => import('../views/CajaView.vue') },
        { path: 'profesoras',     name: 'profesoras',       component: () => import('../views/ProfesorasView.vue') },
        { path: 'profesoras/:id', name: 'profesora-detalle', component: () => import('../views/ProfesoraDetalleView.vue') },
        { path: 'sedes',       name: 'sedes',       component: () => import('../views/SedesView.vue') },
        { path: 'actividades', name: 'actividades', component: () => import('../views/ActividadesView.vue') },
        { path: 'grupos',     name: 'grupos',      component: () => import('../views/ActividadesView.vue') },
        { path: 'usuarios',    name: 'usuarios',    component: () => import('../views/UsuariosView.vue') },
        { path: 'sueldos',     name: 'sueldos',     component: () => import('../views/SueldosView.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
  scrollBehavior() { return { top: 0 } },
})

export default router
