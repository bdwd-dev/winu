<template>
  <v-container class="py-6">
    <h1 class="text-h4 font-weight-bold mb-2">Administration</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">
      Créer des tirages avec le moteur EBALE — Calcul organique des prix
    </p>

    <v-row>
      <!-- Create Draw Form -->
      <v-col cols="12" md="5">
        <v-card color="surface" class="mb-4">
          <v-card-title class="bg-primary text-white">
            <v-icon icon="mdi-plus-circle" class="mr-2" />
            Nouveau Tirage
          </v-card-title>
          <v-card-text class="pt-4">
            <v-text-field
              v-model="form.title"
              label="Titre du tirage"
              variant="outlined"
              density="compact"
              class="mb-3"
              placeholder="Ex: Poulet Mayo Quotidien"
            />
            <v-textarea
              v-model="form.description"
              label="Description"
              variant="outlined"
              density="compact"
              rows="2"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.P"
              label="Prix du lot (XAF)"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3"
              placeholder="Ex: 100000"
            />
            <v-select
              v-model.number="form.I"
              :items="frequencyOptions"
              label="Fréquence (Indice)"
              variant="outlined"
              density="compact"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.Wmax"
              label="Gagnants max"
              variant="outlined"
              density="compact"
              type="number"
              class="mb-3"
            />
            <v-select
              v-model="form.lot_type"
              :items="lotTypeOptions"
              label="Type de lot"
              variant="outlined"
              density="compact"
              class="mb-3"
            />
            <v-text-field
              v-model="form.seed_client"
              label="Seed client (Nzadi)"
              variant="outlined"
              density="compact"
              placeholder="block_btc_850000"
            />
          </v-card-text>
          <v-card-actions class="d-flex flex-wrap">
            <v-btn
              color="secondary"
              variant="outlined"
              @click="calculateEngine"
              :disabled="!form.P || !form.I"
            >
              <v-icon icon="mdi-calculator" class="mr-1" /> Calculer
            </v-btn>
            <v-spacer />
            <v-btn
              color="primary"
              variant="flat"
              @click="createDraw"
              :disabled="!engineResult"
            >
              <v-icon icon="mdi-check" class="mr-1" /> Créer
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Engine Result -->
        <v-card v-if="engineResult" color="surface" variant="outlined" class="mb-4">
          <v-card-title class="text-h6">
            <v-icon icon="mdi-cog" class="mr-2" />
            Résultat Moteur EBALE
          </v-card-title>
          <v-card-text>
            <v-list density="compact" bg-color="transparent">
              <v-list-item>
                <template #prepend><v-icon icon="mdi-currency-usd" /></template>
                <v-list-item-title>CA minimum</v-list-item-title>
                <v-list-item-subtitle>{{ engineResult.CAmin?.toLocaleString() }} XAF</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon icon="mdi-ticket" /></template>
                <v-list-item-title>Prix ticket</v-list-item-title>
                <v-list-item-subtitle>{{ engineResult.Ct_XAF }} XAF ({{ engineResult.Ct_Oziki?.toLocaleString() }} Oz)</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon icon="mdi-target" /></template>
                <v-list-item-title>Tickets pour financer</v-list-item-title>
                <v-list-item-subtitle>Tpalier = {{ engineResult.Tpalier }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon icon="mdi-lock" /></template>
                <v-list-item-title>Tickets max (lock)</v-list-item-title>
                <v-list-item-subtitle>Tmax = {{ engineResult.Tmax }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon icon="mdi-shield-account" /></template>
                <v-list-item-title>Quota anti-baleine</v-list-item-title>
                <v-list-item-subtitle>{{ engineResult.Tmax_joueur }} tickets/joueur</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend><v-icon icon="mdi-percent" /></template>
                <v-list-item-title>Premium (γ)</v-list-item-title>
                <v-list-item-subtitle>{{ engineResult.gamma }}x</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Draws List + Actions -->
      <v-col cols="12" md="7">
        <v-card color="surface">
          <v-card-title>
            Tous les tirages ({{ draws.length }})
          </v-card-title>
          <v-card-text>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel v-for="draw in draws" :key="draw.id">
                <v-expansion-panel-title>
                  <div class="d-flex align-center" style="width: 100%">
                    <v-chip :color="statusColor(draw.status)" size="small" class="mr-3">
                      {{ draw.status }}
                    </v-chip>
                    <span class="font-weight-bold">{{ draw.title }}</span>
                    <v-spacer />
                    <span class="text-body-2 text-medium-emphasis mr-3">
                      {{ draw.Tvendus }}/{{ draw.Tmax }}
                    </span>
                  </div>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-row dense class="mb-3">
                    <v-col cols="6">
                      <span class="text-caption">Lot:</span>
                      <span class="font-weight-bold ml-2">{{ draw.P?.toLocaleString() }} XAF</span>
                    </v-col>
                    <v-col cols="6">
                      <span class="text-caption">Ticket:</span>
                      <span class="font-weight-bold ml-2">{{ draw.Ct_XAF }} XAF</span>
                    </v-col>
                    <v-col cols="6">
                      <span class="text-caption">Fréquence:</span>
                      <span class="font-weight-bold ml-2">{{ frequencyLabel(draw.I) }}</span>
                    </v-col>
                    <v-col cols="6">
                      <span class="text-caption">CA généré:</span>
                      <span class="font-weight-bold ml-2">{{ draw.CA?.toLocaleString() }} XAF</span>
                    </v-col>
                  </v-row>

                  <!-- Nzadi Hash -->
                  <div v-if="draw.hash_nzadi" class="mb-3">
                    <span class="text-caption">Hash Nzadi:</span>
                    <v-code class="text-break">{{ draw.hash_nzadi }}</v-code>
                  </div>

                  <!-- Winner -->
                  <div v-if="draw.status === 'drawn'" class="mb-3">
                    <v-alert type="success" variant="tonal" density="compact">
                      <v-icon icon="mdi-trophy" class="mr-2" />
                      Gagnant: User #{{ draw.winner_id }}
                    </v-alert>
                  </div>

                  <!-- Actions -->
                  <div class="d-flex gap-2">
                    <v-btn
                      v-if="draw.status === 'open' || draw.status === 'locked'"
                      color="accent"
                      size="small"
                      variant="flat"
                      @click="executeDraw(draw.id)"
                    >
                      <v-icon icon="mdi-dice-6" class="mr-1" /> Lancer tirage Nzadi
                    </v-btn>
                    <v-btn
                      color="error"
                      size="small"
                      variant="outlined"
                      @click="deleteDraw(draw.id)"
                    >
                      <v-icon icon="mdi-delete" size="small" />
                    </v-btn>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Draw Result Dialog -->
    <v-dialog v-model="showResultDialog" max-width="500">
      <v-card>
        <v-card-title class="bg-accent text-white">
          <v-icon icon="mdi-party-popper" class="mr-2" />
          Résultat Tirage Nzadi
        </v-card-title>
        <v-card-text class="pt-4 text-center">
          <div v-if="drawResult">
            <v-icon icon="mdi-trophy" size="64" color="warning" class="mb-4" />
            <h2 class="text-h5 font-weight-bold mb-2">{{ drawResult.winner?.name }}</h2>
            <p class="text-body-1 mb-4">Ticket gagnant : <v-code>{{ drawResult.winner?.hex_code }}</v-code></p>

            <v-divider class="mb-4" />

            <h3 class="text-h6 mb-2">Preuve Nzadi (Provably Fair)</h3>
            <v-list density="compact" bg-color="transparent">
              <v-list-item>
                <v-list-item-title>Seed serveur</v-list-item-title>
                <v-list-item-subtitle class="text-break">{{ drawResult.seed_serveur }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Hash SHA-256</v-list-item-title>
                <v-list-item-subtitle class="text-break">
                  <v-code>{{ drawResult.hash_nzadi }}</v-code>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Total tickets</v-list-item-title>
                <v-list-item-subtitle>{{ drawResult.total_tickets }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="showResultDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/services/api'

const draws = ref([])
const engineResult = ref(null)
const showResultDialog = ref(false)
const drawResult = ref(null)

const form = reactive({
  title: '',
  description: '',
  P: 10000,
  I: 1,
  Wmax: 1,
  lot_type: 'physical',
  seed_client: 'block_btc_850000'
})

const frequencyOptions = [
  { title: 'Journalier (I=1)', value: 1 },
  { title: 'Weekend (I=2)', value: 2 },
  { title: 'Mensuel (I=3)', value: 3 },
  { title: 'Annuel (I=4)', value: 4 }
]

const lotTypeOptions = [
  { title: 'Physique (TV, moto, poulet)', value: 'physical' },
  { title: 'Digital (data, crédit)', value: 'digital' },
  { title: 'Expérientiel (resto, billet)', value: 'experience' }
]

async function loadDraws() {
  try {
    draws.value = await api.get('/draws')
  } catch (e) {
    console.error('Erreur chargement:', e)
  }
}

async function calculateEngine() {
  try {
    const Utotal = 500
    engineResult.value = await api.post('/api/calculate', {
      P: form.P,
      I: form.I,
      Utotal,
      Wmax: form.Wmax
    })
  } catch (e) {
    alert(e.message)
  }
}

async function createDraw() {
  try {
    await api.post('/api/draws', form)
    Object.assign(form, {
      title: '', description: '', P: 10000, I: 1, Wmax: 1,
      lot_type: 'physical', seed_client: 'block_btc_850000'
    })
    engineResult.value = null
    await loadDraws()
  } catch (e) {
    alert(e.message)
  }
}

async function executeDraw(drawId) {
  try {
    drawResult.value = await api.post(`/api/draw/${drawId}`)
    showResultDialog.value = true
    await loadDraws()
  } catch (e) {
    alert(e.message)
  }
}

async function deleteDraw(drawId) {
  if (!confirm('Supprimer ce tirage ?')) return
  try {
    await api.delete(`/draws/${drawId}`)
    await loadDraws()
  } catch (e) {
    alert(e.message)
  }
}

function statusColor(status) {
  switch (status) {
    case 'open': return 'success'
    case 'locked': return 'warning'
    case 'drawn': return 'grey'
    default: return 'grey'
  }
}

function frequencyLabel(I) {
  const labels = { 1: 'Journalier', 2: 'Weekend', 3: 'Mensuel', 4: 'Annuel' }
  return labels[I] || 'Spécial'
}

onMounted(loadDraws)
</script>
