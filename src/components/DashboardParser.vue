<template>
  <div class="d-flex align-center mb-6">
    <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" @click="goBack">
      Назад к выбору
    </v-btn>
  </div>

  <v-row class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-primary mb-2">Шаг 1</div>
        <div class="text-h5 font-weight-bold mb-2">HTML код дашборда</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Вставьте HTML код в поле или загрузите файл. Все данные обрабатываются локально.
        </div>

        <v-textarea
          v-model="htmlInput"
          label="HTML код"
          variant="outlined"
          color="primary"
          rows="8"
          class="mb-4"
          @update:model-value="handleTextarea"
        />

        <v-file-input
          v-model="htmlFile"
          label="Загрузить HTML файл"
          accept=".html,.htm,.txt"
          prepend-icon="mdi-file-code"
          variant="outlined"
          color="primary"
          @update:model-value="handleFile"
        />

        <div class="d-flex flex-wrap gap-4 mt-4">
          <v-btn color="primary" variant="flat" :loading="parsing" @click="runParse">
            Запустить парсинг
          </v-btn>
          <v-btn
            color="secondary"
            variant="outlined"
            :disabled="!rows.length && !tables.length"
            @click="exportExcel"
          >
            Сохранить Excel
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>

  <v-row v-if="rows.length" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-primary mb-2">Результат</div>
        <div class="text-h5 font-weight-bold mb-4">Сводка парсинга</div>

        <v-row class="mb-4">
          <v-col cols="12" md="3">
            <v-card class="pa-4" color="surface-variant" elevation="0">
              <div class="text-subtitle-1 font-weight-bold">Разделы</div>
              <div class="text-h6">{{ sections.length }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4" color="surface-variant" elevation="0">
              <div class="text-subtitle-1 font-weight-bold">Метрики/значения</div>
              <div class="text-h6">{{ metricsCount }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4" color="surface-variant" elevation="0">
              <div class="text-subtitle-1 font-weight-bold">Всего строк</div>
              <div class="text-h6">{{ rows.length }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="pa-4" color="surface-variant" elevation="0">
              <div class="text-subtitle-1 font-weight-bold">Таблицы</div>
              <div class="text-h6">{{ tables.length }}</div>
            </v-card>
          </v-col>
        </v-row>

        <v-alert v-if="tables.length" type="info" variant="tonal" class="mb-4">
          Найденные таблицы: {{ tableTitles }}
        </v-alert>

        <v-table density="comfortable">
          <thead>
            <tr>
              <th>Название</th>
              <th>Тип</th>
              <th>Значение карточки</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in previewRows" :key="index">
              <td>{{ row.name }}</td>
              <td>{{ row.type }}</td>
              <td>{{ row.value }}</td>
            </tr>
          </tbody>
        </v-table>

        <div class="text-caption text-medium-emphasis mt-2">
          Показаны первые {{ previewRows.length }} строк из {{ rows.length }}.
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref } from 'vue'
import { parseDashboardHtml } from '../utils/dashboardParser.js'
import { exportRowsToExcel } from '../utils/exportExcel.js'

const emit = defineEmits(['back'])

const htmlInput = ref('')
const htmlFile = ref(null)
const parsing = ref(false)

const rows = ref([])
const sections = ref([])
const metricsCount = ref(0)
const tables = ref([])

const previewRows = computed(() => rows.value.slice(0, 20))
const tableTitles = computed(() =>
  tables.value.map((table) => table.title).join(', ')
)

const handleTextarea = () => {
  if (htmlInput.value) {
    console.log('[Parser] HTML text updated. Length:', htmlInput.value.length)
  }
}

const handleFile = async (file) => {
  htmlFile.value = file
  if (!file) {
    return
  }

  console.log('[Parser] HTML file selected:', file.name, file.size)

  try {
    const text = await file.text()
    htmlInput.value = text
    console.log('[Parser] HTML file loaded into textarea. Length:', text.length)
  } catch (error) {
    console.error('[Parser] Failed to read file:', error)
  }
}

const runParse = async () => {
  if (!htmlInput.value) {
    console.warn('[Parser] No HTML provided')
    return
  }

  parsing.value = true
  console.log('[Parser] Parsing started')

  try {
    const result = parseDashboardHtml(htmlInput.value)
    rows.value = result.rows
    sections.value = result.sections
    metricsCount.value = result.metricsCount
    tables.value = result.tables || []

    console.log('[Parser] Parsing completed:', {
      sections: sections.value.length,
      rows: rows.value.length,
      metricsCount: metricsCount.value,
      tables: tables.value.length,
    })
  } catch (error) {
    console.error('[Parser] Parsing failed:', error)
  } finally {
    parsing.value = false
  }
}

const exportExcel = () => {
  if (!rows.value.length && !tables.value.length) {
    return
  }

  console.log('[Excel] Export started. Rows:', rows.value.length)
  exportRowsToExcel(rows.value, 'dashboard-metrics.xlsx', tables.value)
  console.log('[Excel] Export finished')
}

const goBack = () => emit('back')
</script>

<style scoped>
.gap-4 {
  gap: 16px;
}
</style>
