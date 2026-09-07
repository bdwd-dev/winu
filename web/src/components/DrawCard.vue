<template>
  <v-card :color="cardColor" variant="elevated" class="draw-card h-100">
    <v-card-item>
      <div class="d-flex justify-space-between align-start mb-2">
        <v-chip :color="statusColor" size="small" variant="flat">
          {{ statusLabel }}
        </v-chip>
        <v-chip variant="outlined" size="small">
          {{ frequencyLabel }}
        </v-chip>
      </div>
      <v-card-title class="text-h6 font-weight-bold">{{ draw.title }}</v-card-title>
      <v-card-subtitle>{{ draw.description }}</v-card-subtitle>
    </v-card-item>

    <v-card-text>
      <!-- Progress -->
      <div class="mb-3">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span>{{ draw.Tvendus }} / {{ draw.Tmax }} tickets</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <v-progress-linear
          :model-value="progressPercent"
          :color="progressColor"
          height="8"
          rounded
        />
      </div>

      <!-- Info Grid -->
      <v-row dense>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Lot</div>
          <div class="font-weight-bold">{{ formatXAF(draw.P) }} XAF</div>
        </v-col>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Ticket</div>
          <div class="font-weight-bold text-primary">{{ draw.Ct_XAF }} XAF</div>
        </v-col>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">En Oziki</div>
          <div class="font-weight-bold text-accent">{{ draw.Ct_Oziki?.toLocaleString() }} Oz</div>
        </v-col>
        <v-col cols="6">
          <div class="text-caption text-medium-emphasis">Gagnants max</div>
          <div class="font-weight-bold">{{ draw.Wmax }}</div>
        </v-col>
      </v-row>
    </v-card-text>

    <v-card-actions v-if="draw.status === 'open'">
      <v-btn
        color="primary"
        variant="flat"
        block
        prepend-icon="mdi-ticket"
        @click="$emit('buy', draw.id)"
      >
        Acheter ticket
      </v-btn>
    </v-card-actions>
    <v-card-actions v-else-if="draw.status === 'locked'">
      <v-btn color="warning" variant="outlined" block disabled>
        <v-icon icon="mdi-lock" class="mr-1" /> Complet — Tirage imminent
      </v-btn>
    </v-card-actions>
    <v-card-actions v-else>
      <v-btn color="success" variant="outlined" block disabled>
        <v-icon icon="mdi-check-circle" class="mr-1" /> Tirage effectué
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  draw: { type: Object, required: true }
})
defineEmits(['buy'])

const progressPercent = computed(() =>
  Math.min(100, Math.round((props.draw.Tvendus / props.draw.Tmax) * 100))
)

const progressColor = computed(() => {
  if (progressPercent.value >= 90) return 'error'
  if (progressPercent.value >= 60) return 'warning'
  return 'success'
})

const statusColor = computed(() => {
  switch (props.draw.status) {
    case 'open': return 'success'
    case 'locked': return 'warning'
    case 'drawn': return 'grey'
    default: return 'grey'
  }
})

const statusLabel = computed(() => {
  switch (props.draw.status) {
    case 'open': return 'Ouvert'
    case 'locked': return 'Complet'
    case 'drawn': return 'Terminé'
    default: return props.draw.status
  }
})

const frequencyLabel = computed(() => {
  const labels = { 1: 'Journalier', 2: 'Weekend', 3: 'Mensuel', 4: 'Annuel' }
  return labels[props.draw.I] || 'Spécial'
})

const cardColor = computed(() => {
  if (props.draw.status === 'drawn') return 'surface'
  return 'surface'
})

function formatXAF(val) {
  return val?.toLocaleString()
}
</script>

<style scoped>
.draw-card {
  transition: transform 0.2s;
}
.draw-card:hover {
  transform: translateY(-2px);
}
</style>
