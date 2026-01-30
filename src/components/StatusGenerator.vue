<template>
  <div class="d-flex align-center mb-6">
    <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" @click="goBack">
      Назад к выбору
    </v-btn>
  </div>

  <v-row class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <upload-step @file-selected="handleFile" />
    </v-col>
  </v-row>

  <v-row v-if="sheetNames.length" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <sheet-select-step
        :sheet-names="sheetNames"
        :green-sheet="sheetSelection.green"
        :blue-sheet="sheetSelection.blue"
        :error="validationError"
        @update:green-sheet="updateGreenSheet"
        @update:blue-sheet="updateBlueSheet"
      />
    </v-col>
  </v-row>

  <v-row v-if="statuses.length" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <status-describe-step
        :statuses="statuses"
        :descriptions="statusDescriptions"
        @update:description="updateDescription"
      />
    </v-col>
  </v-row>

  <v-row v-if="statuses.length" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <ready-status-step
        :statuses="statuses"
        :ready-statuses="readyStatuses"
        @update:ready-statuses="updateReadyStatuses"
      />
    </v-col>
  </v-row>

  <v-row v-if="statuses.length" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <comment-step :comment="comment" @update:comment="updateComment" />
    </v-col>
  </v-row>

  <v-row v-if="totalCount" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <generate-step
        :readiness-percent="readinessPercent"
        :ready-count="readyCount"
        :total-count="totalCount"
        :green-statuses="greenStatusSummary"
        :blue-statuses="blueStatusSummary"
        :loading="generating"
        @generate="generateReport"
      />
    </v-col>
  </v-row>

  <v-row v-if="totalCount" class="mb-10" justify="center">
    <v-col cols="12" md="10" lg="9">
      <report-preview
        :readiness-percent="readinessPercent"
        :ready-count="readyCount"
        :total-count="totalCount"
        :green-counts="greenStatusCounts"
        :blue-counts="blueStatusCounts"
        :status-descriptions="statusDescriptions"
        :comment="comment"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import UploadStep from './steps/UploadStep.vue'
import SheetSelectStep from './steps/SheetSelectStep.vue'
import StatusDescribeStep from './steps/StatusDescribeStep.vue'
import ReadyStatusStep from './steps/ReadyStatusStep.vue'
import CommentStep from './steps/CommentStep.vue'
import GenerateStep from './steps/GenerateStep.vue'
import ReportPreview from './ReportPreview.vue'
import {
  readWorkbook,
  getSheetNames,
  getSheetData,
  buildColumnMap,
  extractMetrics,
  summarizeStatuses,
  normalizeStatusKey,
} from '../utils/excel.js'
import { generateStatusReport } from '../utils/docx.js'

const emit = defineEmits(['back'])

const fileRef = ref(null)
const workbookRef = ref(null)
const sheetNames = ref([])

const sheetSelection = reactive({
  green: '',
  blue: '',
})

const validationError = ref('')
const statuses = ref([])
const statusDescriptions = reactive({})
const readyStatuses = ref([])
const comment = ref('')
const generating = ref(false)

const zoneData = reactive({
  green: { rows: [], metrics: [], columnMap: {} },
  blue: { rows: [], metrics: [], columnMap: {} },
})

const requiredColumns = ['Тип', 'Наименование', 'Статус']

const handleFile = async (file) => {
  fileRef.value = file
  workbookRef.value = null
  sheetNames.value = []
  sheetSelection.green = ''
  sheetSelection.blue = ''
  validationError.value = ''
  statuses.value = []
  readyStatuses.value = []
  comment.value = ''
  Object.keys(statusDescriptions).forEach((key) => delete statusDescriptions[key])

  if (!file) {
    console.log('[Excel] File cleared')
    return
  }

  console.log('[Excel] File selected:', file.name, file.size)

  try {
    const workbook = await readWorkbook(file)
    workbookRef.value = workbook
    sheetNames.value = getSheetNames(workbook)
    console.log('[Excel] Workbook loaded. Sheets:', sheetNames.value)
  } catch (error) {
    console.error('[Excel] Failed to read workbook:', error)
    validationError.value = 'Не удалось прочитать Excel файл. Проверьте формат.'
  }
}

const updateGreenSheet = (value) => {
  sheetSelection.green = value
  processSheets()
}

const updateBlueSheet = (value) => {
  sheetSelection.blue = value
  processSheets()
}

const processSheets = () => {
  validationError.value = ''

  if (!sheetSelection.green || !sheetSelection.blue) {
    return
  }

  console.log('[Excel] Selected sheets:', {
    green: sheetSelection.green,
    blue: sheetSelection.blue,
  })

  const greenData = getSheetData(workbookRef.value, sheetSelection.green)
  const blueData = getSheetData(workbookRef.value, sheetSelection.blue)

  const greenColumns = buildColumnMap(greenData.headerRow, requiredColumns)
  const blueColumns = buildColumnMap(blueData.headerRow, requiredColumns)

  console.log('[Excel] Green columns map:', greenColumns.map)
  console.log('[Excel] Blue columns map:', blueColumns.map)

  if (greenColumns.missing.length || blueColumns.missing.length) {
    const messages = []
    if (greenColumns.missing.length) {
      messages.push(
        `Зеленая зона: отсутствуют столбцы ${greenColumns.missing.join(', ')}`
      )
    }
    if (blueColumns.missing.length) {
      messages.push(
        `Синяя зона: отсутствуют столбцы ${blueColumns.missing.join(', ')}`
      )
    }
    validationError.value = messages.join('. ')
    console.warn('[Excel] Missing columns:', validationError.value)
    zoneData.green.rows = []
    zoneData.blue.rows = []
    zoneData.green.metrics = []
    zoneData.blue.metrics = []
    statuses.value = []
    return
  }

  zoneData.green.rows = greenData.rows
  zoneData.blue.rows = blueData.rows
  zoneData.green.columnMap = greenColumns.map
  zoneData.blue.columnMap = blueColumns.map

  zoneData.green.metrics = extractMetrics(
    greenData.rows,
    greenColumns.map
  )
  zoneData.blue.metrics = extractMetrics(blueData.rows, blueColumns.map)

  console.log('[Excel] Green metrics:', zoneData.green.metrics)
  console.log('[Excel] Blue metrics:', zoneData.blue.metrics)

  const combinedStatuses = new Map()
  zoneData.green.metrics.forEach((item) => {
    if (!item.status) return
    combinedStatuses.set(item.statusKey, item.statusDisplay)
  })
  zoneData.blue.metrics.forEach((item) => {
    if (!item.status) return
    combinedStatuses.set(item.statusKey, item.statusDisplay)
  })

  statuses.value = Array.from(combinedStatuses.values())
  console.log('[Excel] Unique statuses:', statuses.value)

  if (!statuses.value.length) {
    Object.keys(statusDescriptions).forEach((key) => delete statusDescriptions[key])
  }

  readyStatuses.value = readyStatuses.value.filter((status) =>
    statuses.value.includes(status)
  )

  statuses.value.forEach((status) => {
    if (!(status in statusDescriptions)) {
      statusDescriptions[status] = ''
    }
  })

  Object.keys(statusDescriptions).forEach((status) => {
    if (!statuses.value.includes(status)) {
      delete statusDescriptions[status]
    }
  })
}

const updateDescription = ({ status, value }) => {
  statusDescriptions[status] = value
}

const updateReadyStatuses = (value) => {
  readyStatuses.value = value
  console.log('[Status] Ready statuses updated:', readyStatuses.value)
}

const updateComment = (value) => {
  comment.value = value
}

const normalizeStatus = (status) => normalizeStatusKey(status) || ''

const allMetrics = computed(() => [
  ...zoneData.green.metrics,
  ...zoneData.blue.metrics,
])

const totalCount = computed(() => allMetrics.value.length)

const readyCount = computed(() => {
  const readySet = new Set(readyStatuses.value.map(normalizeStatus))
  return allMetrics.value.filter((item) =>
    readySet.has(normalizeStatus(item.status))
  ).length
})

const readinessPercent = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((readyCount.value / totalCount.value) * 100)
})

const greenStatusCounts = computed(() => summarizeStatuses(zoneData.green.metrics))
const blueStatusCounts = computed(() => summarizeStatuses(zoneData.blue.metrics))

const greenStatusSummary = computed(() =>
  Object.entries(greenStatusCounts.value)
    .map(([status, count]) => `${status} (${count})`)
    .join(', ')
)

const blueStatusSummary = computed(() =>
  Object.entries(blueStatusCounts.value)
    .map(([status, count]) => `${status} (${count})`)
    .join(', ')
)

const generateReport = async () => {
  generating.value = true
  console.log('[Docx] Generating report...')
  console.log('[Docx] Summary:', {
    readinessPercent: readinessPercent.value,
    readyCount: readyCount.value,
    totalCount: totalCount.value,
    greenStatusCounts: greenStatusCounts.value,
    blueStatusCounts: blueStatusCounts.value,
    statusDescriptions: { ...statusDescriptions },
    comment: comment.value,
  })

  try {
    await generateStatusReport({
      readinessPercent: readinessPercent.value,
      readyCount: readyCount.value,
      totalCount: totalCount.value,
      greenZone: greenStatusCounts.value,
      blueZone: blueStatusCounts.value,
      statusDescriptions: { ...statusDescriptions },
      comment: comment.value,
    })
    console.log('[Docx] Report saved successfully.')
  } catch (error) {
    console.error('[Docx] Failed to generate report:', error)
  } finally {
    generating.value = false
  }
}

const goBack = () => emit('back')

watch(sheetNames, (value) => {
  if (!value.length) {
    statuses.value = []
  }
})
</script>
