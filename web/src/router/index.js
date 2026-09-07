import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import DrawsView from '@/views/DrawsView.vue'
import AdminView from '@/views/AdminView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/draws', name: 'draws', component: DrawsView },
  { path: '/admin', name: 'admin', component: AdminView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
