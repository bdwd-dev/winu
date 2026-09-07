<template>
  <v-container class="py-6">
    <!-- Hero Section -->
    <v-row justify="center" class="mb-8">
      <v-col cols="12" md="8" class="text-center">
        <h1 class="text-h3 font-weight-bold mb-3">
          <span class="text-primary">Winu</span> — Tente ta chance
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Loterie solidaire congolaise — Micro-tickets dès 50 XAF, tirage Nzadi 100% vérifiable
        </p>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card color="primary" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ stats.users?.total || 0 }}</div>
          <div class="text-caption">Joueurs inscrits</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="accent" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ stats.draws?.open || 0 }}</div>
          <div class="text-caption">Tirages ouverts</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="secondary" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ stats.tickets?.total || 0 }}</div>
          <div class="text-caption">Tickets vendus</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card color="success" variant="tonal" class="text-center pa-4">
          <div class="text-h4 font-weight-bold">{{ formatXAF(stats.tickets?.revenue_XAF || 0) }}</div>
          <div class="text-caption">CA Total (XAF)</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card hover to="/draws" color="surface" class="pa-4">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="56" class="mr-4">
              <v-icon icon="mdi-gift" size="28" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Voir les tirages</div>
              <div class="text-caption">Poulet, Data, TV, Moto, Parcelle...</div>
            </div>
            <v-icon icon="mdi-chevron-right" class="ml-auto" />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card hover color="surface" class="pa-4" @click="showOzikiDialog = true">
          <div class="d-flex align-center">
            <v-avatar color="accent" size="56" class="mr-4">
              <v-icon icon="mdi-diamond" size="28" />
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Acheter Oziki</div>
              <div class="text-caption">1 XAF = 10 Oziki — Paiement MoMo</div>
            </div>
            <v-icon icon="mdi-chevron-right" class="ml-auto" />
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Draws -->
    <h2 class="text-h5 font-weight-bold mb-4">Tirages en cours</h2>
    <v-row>
      <v-col v-for="draw in openDraws" :key="draw.id" cols="12" md="6" lg="4">
        <DrawCard :draw="draw" @buy="handleBuy" />
      </v-col>
    </v-row>

    <!-- Oziki Dialog -->
    <v-dialog v-model="showOzikiDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-primary text-white">Acheter Oziki</v-card-title>
        <v-card-text class="pt-4">
          <p class="mb-4">Solde actuel : <strong>{{ userStore.currentUser.oziki_balance.toLocaleString() }} Oz</strong></p>
          <v-btn-toggle v-model="ozikiAmount" mandatory class="mb-4" divided>
            <v-btn :value="1000">1 000 XAF</v-btn>
            <v-btn :value="2000">2 000 XAF</v-btn>
            <v-btn :value="5000">5 000 XAF</v-btn>
          </v-btn-toggle>
          <p class="text-center text-h6">
            = {{ (ozikiAmount * 10).toLocaleString() }} Oziki
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showOzikiDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="confirmBuyOziki">Acheter</v-btn>
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
const stats = ref({})
const draws = ref([])
const showOzikiDialog = ref(false)
const ozikiAmount = ref(1000)

const openDraws = computed(() => draws.value.filter(d => d.status === 'open').slice(0, 3))

async function loadData() {
  try {
    stats.value = await api.get('/api/stats')
    draws.value = await api.get('/draws')
  } catch (e) {
    console.error('Erreur chargement:', e)
  }
}

async function handleBuy(drawId) {
  try {
    await userStore.buyTicket(drawId, 1)
    await loadData()
  } catch (e) {
    alert(e.message)
  }
}

async function confirmBuyOziki() {
  try {
    await userStore.buyOziki(ozikiAmount.value)
    showOzikiDialog.value = false
  } catch (e) {
    alert(e.message)
  }
}

function formatXAF(val) {
  return val >= 1000000
    ? (val / 1000000).toFixed(1) + 'M'
    : val >= 1000
      ? (val / 1000).toFixed(0) + 'k'
      : val.toString()
}

onMounted(loadData)
</script>
