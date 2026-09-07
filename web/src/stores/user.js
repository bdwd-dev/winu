import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref({
    id: 1,
    phone: '+242061234567',
    name: 'Jean M.',
    oziki_balance: 50000,
    verified: true
  })

  const isAuthenticated = computed(() => currentUser.value?.verified)

  async function buyOziki(amount) {
    try {
      const res = await api.post('/api/buy-oziki', {
        user_id: currentUser.value.id,
        amount
      })
      currentUser.value.oziki_balance = res.new_balance
      return res
    } catch (e) {
      console.error('Erreur achat Oziki:', e)
      throw e
    }
  }

  async function buyTicket(drawId, count) {
    try {
      const res = await api.post('/api/buy-ticket', {
        user_id: currentUser.value.id,
        draw_id: drawId,
        count
      })
      currentUser.value.oziki_balance -= res.total_Oziki
      return res
    } catch (e) {
      console.error('Erreur achat ticket:', e)
      throw e
    }
  }

  return { currentUser, isAuthenticated, buyOziki, buyTicket }
})
