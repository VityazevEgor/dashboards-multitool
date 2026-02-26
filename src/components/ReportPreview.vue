<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="d-flex flex-wrap justify-space-between align-center mb-4">
      <div>
        <div class="text-overline text-primary">Предпросмотр отчета</div>
        <div class="text-h5 font-weight-bold">Статус дашборда</div>
      </div>
      <v-btn
        color="secondary"
        variant="outlined"
        :loading="exporting"
        @click="exportImage"
      >
        Сохранить PNG
      </v-btn>
    </div>

    <div ref="reportRef" class="report-block pa-6">
      <div class="text-h6 font-weight-bold mb-2">
        Общая готовность: {{ readinessPercent }}%
      </div>
      <div class="text-body-2 text-medium-emphasis mb-6">
        Готово {{ readyCount }} из {{ totalCount }} метрик/значений
      </div>

      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card class="pa-4" color="surface-variant" elevation="0">
            <div class="text-subtitle-1 font-weight-bold mb-3">
              Синяя зона
            </div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th class="text-right">Количество</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in blueRows" :key="item.status">
                  <td>{{ item.status }}</td>
                  <td class="text-right">{{ item.count }}</td>
                  <td>{{ item.description || '-' }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-4" color="surface-variant" elevation="0">
            <div class="text-subtitle-1 font-weight-bold mb-3">
              Зеленая зона
            </div>
            <v-table density="comfortable">
              <thead>
                <tr>
                  <th>Статус</th>
                  <th class="text-right">Количество</th>
                  <th>Комментарий</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in greenRows" :key="item.status">
                  <td>{{ item.status }}</td>
                  <td class="text-right">{{ item.count }}</td>
                  <td>{{ item.description || '-' }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="pa-4" color="surface-variant" elevation="0">
        <div class="text-subtitle-1 font-weight-bold mb-2">
          Общий комментарий
        </div>
        <div class="text-body-2 text-medium-emphasis report-comment">
          {{ comment || 'Комментарий не указан.' }}
        </div>
      </v-card>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import html2canvas from 'html2canvas'

const props = defineProps({
  readinessPercent: {
    type: Number,
    default: 0,
  },
  readyCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  greenCounts: {
    type: Object,
    default: () => ({}),
  },
  blueCounts: {
    type: Object,
    default: () => ({}),
  },
  statusDescriptions: {
    type: Object,
    default: () => ({}),
  },
  comment: {
    type: String,
    default: '',
  },
})

const reportRef = ref(null)
const exporting = ref(false)

const buildRows = (counts) =>
  Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    description: props.statusDescriptions?.[status] || '',
  }))

const greenRows = computed(() => buildRows(props.greenCounts))
const blueRows = computed(() => buildRows(props.blueCounts))

const exportImage = async () => {
  if (!reportRef.value) return

  exporting.value = true
  console.log('[PNG] Export started')

  try {
    const canvas = await html2canvas(reportRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#0e0f14',
    })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'dashboard-status-report.png'
    link.click()
    console.log('[PNG] Export finished successfully')
  } catch (error) {
    console.error('[PNG] Export failed:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.report-block {
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(94, 234, 212, 0.08), rgba(167, 139, 250, 0.08));
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.report-block .v-table {
  background: transparent;
}

.report-block th {
  font-weight: 600;
  color: rgba(226, 232, 240, 0.9);
}

.report-block td {
  color: rgba(226, 232, 240, 0.8);
}

.report-comment {
  white-space: pre-line;
}
</style>
