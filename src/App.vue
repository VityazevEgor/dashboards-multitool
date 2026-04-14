<template>
  <v-app>
    <v-app-bar color="surface" elevation="0">
      <v-container class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 text-md-h5 font-weight-bold">Dashboards Multitool</div>
          <div class="text-caption text-medium-emphasis">
            Автоматизация отчётов и сверка метрик
          </div>
        </div>
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-10">
        <utility-selector
          v-if="!selectedUtility"
          @select="handleSelect"
        />

        <v-slide-y-transition>
          <div v-if="selectedUtility === 'status'">
            <status-generator @back="selectedUtility = ''" />
          </div>
        </v-slide-y-transition>

        <v-slide-y-transition>
          <div v-if="selectedUtility === 'parser'">
            <dashboard-parser @back="selectedUtility = ''" />
          </div>
        </v-slide-y-transition>

        <v-slide-y-transition>
          <div v-if="selectedUtility === 'table-diff'">
            <table-diff @back="selectedUtility = ''" />
          </div>
        </v-slide-y-transition>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import UtilitySelector from './components/UtilitySelector.vue'
import StatusGenerator from './components/StatusGenerator.vue'
import DashboardParser from './components/DashboardParser.vue'
import TableDiff from './components/TableDiff.vue'

const selectedUtility = ref('')

const handleSelect = (utility) => {
  console.log('[App] Utility selected:', utility)
  selectedUtility.value = utility
}
</script>
