<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <div>
        <div class="text-overline text-primary">Визуализация</div>
        <div class="text-h5 font-weight-bold">Состояние дашборда</div>
      </div>
      <v-btn
        color="secondary"
        variant="outlined"
        :loading="exporting"
        @click="exportImage"
      >
        Экспорт в PNG
      </v-btn>
    </div>

    <div ref="dashboardRef" class="dashboard-export-block pa-4">
      <zone-view title="Зеленая зона" :zone-data="greenZone" class="mb-6" />
      <zone-view title="Синяя зона" :zone-data="blueZone" />
    </div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import html2canvas from 'html2canvas'
import ZoneView from './ZoneView.vue'

const props = defineProps({
  greenZone: {
    type: Object,
    default: () => ({ sections: [] }),
  },
  blueZone: {
    type: Object,
    default: () => ({ sections: [] }),
  },
})

const dashboardRef = ref(null)
const exporting = ref(false)

const exportImage = async () => {
  if (!dashboardRef.value) return

  exporting.value = true
  console.log('[Dashboard] PNG export started')
  try {
    const canvas = await html2canvas(dashboardRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0e0f14',
    })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'dashboard-visualization.png'
    link.click()
    console.log('[Dashboard] PNG export finished')
  } catch (error) {
    console.error('[Dashboard] PNG export failed:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.dashboard-export-block {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: linear-gradient(135deg, rgba(94, 234, 212, 0.06), rgba(56, 189, 248, 0.06));
}
</style>
