<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-2">Tirages</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Tous les tirages disponibles — Du poulet quotidien à la parcelle annuelle
    </p>

    <!-- Filters -->
    <v-chip-group v-model="filter" class="mb-4" mandatory>
      <v-chip value="all" variant="outlined">Tous</v-chip>
      <v-chip value="open" variant="outlined" color="success">Ouverts</v-chip>
      <v-chip value="locked" variant="outlined" color="warning">Complets</v-chip>
      <v-chip value="drawn" variant="outlined" color="grey">Terminés</v-chip>
    </v-chip-group>

    <!-- Draws Grid -->
    <v-row>
      <v-col v-for="draw in filteredDraws" :key="draw.id" cols="12" md="6" lg="4">
        <DrawCard :draw="draw" @buy="handleBuy" />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-alert v-if="filteredDraws.length === 0" type="info" variant="tonal" class="mt-4">
      Aucun trouvé pour ce filtre.
    </v-alert>

    <!-- Buy Dialog -->
    <v-dialog v-model="showBuyDialog" max-width="450">
      <v-card>
        <v-card-title class="bg-primary text-white">
          Acheter des tickets
        </v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-2"><strong>{{ selectedDraw?.title }}</strong></p>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Ticket : {{ selectedDraw?.Ct_XAF }} XAF ({{ selectedDraw?.Ct_Oziki?.toLocaleString() }} Oz)
          </p>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Quota anti-baleine : max {{ selectedDraw?.Tmax_joueur }} tickets par joueur
          </p>

          <div class="d-flex align-center justify-center mb-4">
            <v-btn icon="mdi-minus" variant="outlined" @click="ticketCount = Math.max(1, ticketCount - 1)" />
            <span class="text-h4 font-weight-bold mx-6">{{ ticketCount }}</span>
            <v-btn icon="mdi-plus" variant="outlined" @click="ticketCount = Math.min(selectedDraw?.Tmax_joueur || 10, ticketCount + 1)" />
          </div>

          <v-divider class="mb-4" />

          <div class="d-flex justify-space-between">
            <span>Total :</span>
            <span class="text-h6 font-weight-bold text-primary">
              {{ ((selectedDraw?.Ct_XAF || 0) * ticketCount).toLocaleString() }} XAF
            </span>
          </div>
          <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
            <span>En Oziki :</span>
            <span>{{ ((selectedDraw?.Ct_Oziki || 0) * ticketCount).toLocaleString() }} Oz</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 text-medium-emphasis">
            <span>Votre solde :</span>
            <span :class="userStore.currentUser.oziki_balance >= (selectedDraw?.Ct_Oziki || 0) * ticketCount ? 'text-success' : 'text-error'">
              {{ userStore.currentUser.oziki_balance.toLocaleString() }} Oz
            </span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showBuyDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="confirmBuy" :disabled="!canBuy">
            Confirmer l'achat
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/services/api'
import { useUserStore } from '@/stores/user'
import DrawCard from '@/components/DrawCard.vue'

const userStore = useUserStore()
const draws = ref([])
const filter = ref('all')
const showBuyDialog = ref(false)
const selectedDraw = ref(null)
const ticketCount = ref(1)

const filteredDraws = computed(() => {
  if (filter.value === 'all') return draws.value
  return draws.value.filter(d => d.status === filter.value)
})

const canBuy = computed(() => {
  if (!selectedDraw.value) return false
  const total = selectedDraw.value.Ct_Oziki * ticketCount.value
  return userStore.currentUser.oziki_balance >= total
})

async function loadDraws() {
  try {
    draws.value = await api.get('/draws')
  } catch (e) {
    console.error('Erreur chargement tirages:', e)
  }
}

function handleBuy(drawId) {
  selectedDraw.value = draws.value.find(d => d.id === drawId)
  ticketCount.value = 1
  showBuyDialog.value = true
}

async function confirmBuy() {
  try {
    await userStore.buyTicket(selectedDraw.value.id, ticketCount.value)
    showBuyDialog.value = false
    await loadDraws()
  } catch (e) {
    alert(e.message)
  }
}

onMounted(loadDraws)
</script>
