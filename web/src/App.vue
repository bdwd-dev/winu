<template>
  <v-app>
    <!-- Navigation -->
    <v-app-bar color="primary" density="compact" elevation="2">
      <v-app-bar-title class="font-weight-bold">
        <v-icon icon="mdi-clover" class="mr-2" />
        WINU
      </v-app-bar-title>
      <v-tabs v-model="activeTab" align-tabs="end" color="white">
        <v-tab to="/" value="home">
          <v-icon icon="mdi-home" class="mr-1" /> Accueil
        </v-tab>
        <v-tab to="/draws" value="draws">
          <v-icon icon="mdi-gift" class="mr-1" /> Tirages
        </v-tab>
        <v-tab to="/admin" value="admin">
          <v-icon icon="mdi-shield-crown" class="mr-1" /> Admin
        </v-tab>
      </v-tabs>
      <v-chip class="ml-4" variant="elevated" color="accent">
        <v-icon icon="mdi-diamond" size="small" class="mr-1" />
        {{ userStore.currentUser?.oziki_balance?.toLocaleString() }} Oz
      </v-chip>
    </v-app-bar>

    <v-main class="bg-background">
      <router-view />
    </v-main>

    <!-- Bottom Navigation Mobile -->
    <v-bottom-navigation v-if="isMobile" grow color="primary" elevation="8">
      <v-btn to="/" value="home">
        <v-icon icon="mdi-home" />
        <span>Accueil</span>
      </v-btn>
      <v-btn to="/draws" value="draws">
        <v-icon icon="mdi-gift" />
        <span>Tirages</span>
      </v-btn>
      <v-btn to="/admin" value="admin">
        <v-icon icon="mdi-shield-crown" />
        <span>Admin</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activeTab = ref('home')
const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)
</script>
