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
        :green-status-column-options="statusColumnOptions.green"
        :blue-status-column-options="statusColumnOptions.blue"
        :green-status-column="selectedStatusColumn.green"
        :blue-status-column="selectedStatusColumn.blue"
        :green-value-column-options="valueColumnOptions.green"
        :blue-value-column-options="valueColumnOptions.blue"
        :green-value-column="selectedValueColumn.green"
        :blue-value-column="selectedValueColumn.blue"
        :error="validationError"
        @update:green-sheet="updateGreenSheet"
        @update:blue-sheet="updateBlueSheet"
        @update:green-status-column="updateGreenStatusColumn"
        @update:blue-status-column="updateBlueStatusColumn"
        @update:green-value-column="updateGreenValueColumn"
        @update:blue-value-column="updateBlueValueColumn"
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

  <v-row v-if="totalCount" class="mb-10" justify="center">
    <v-col cols="12" md="10" lg="9">
      <dashboard-visualization
        :green-zone="dashboardView.green"
        :blue-zone="dashboardView.blue"
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
import DashboardVisualization from './DashboardVisualization.vue'
import {
  readWorkbook,
  getSheetNames,
  getSheetData,
  buildColumnMap,
  extractMetrics,
  extractDashboardItems,
  summarizeStatuses,
  normalizeStatusKey,
  normalizeValue,
  isSectionType,
  isMetricType,
} from '../utils/excel.js'
import { generateStatusReport } from '../utils/docx.js'

const emit = defineEmits(['back'])

const fileRef = ref(null)
const workbookRef = ref(null)
const sheetNames = ref([])
const statusColumnOptions = reactive({
  green: [],
  blue: [],
})
const valueColumnOptions = reactive({
  green: [],
  blue: [],
})
const selectedStatusColumn = reactive({
  green: '',
  blue: '',
})
const selectedValueColumn = reactive({
  green: '',
  blue: '',
})

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
  green: { rows: [], metrics: [], items: [], columnMap: {} },
  blue: { rows: [], metrics: [], items: [], columnMap: {} },
})

const requiredColumns = ['Тип', 'Наименование']
const STORAGE_KEYS = {
  comment: 'dashboard_status_general_comment',
  descriptions: 'dashboard_status_descriptions',
}

const loadStoredComment = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.comment) || ''
  } catch (error) {
    console.warn('[Storage] Failed to load general comment:', error)
    return ''
  }
}

const loadStoredDescriptions = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.descriptions)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed ? parsed : {}
  } catch (error) {
    console.warn('[Storage] Failed to load status descriptions:', error)
    return {}
  }
}

const saveStoredComment = (value) => {
  try {
    localStorage.setItem(STORAGE_KEYS.comment, value || '')
  } catch (error) {
    console.warn('[Storage] Failed to save general comment:', error)
  }
}

const saveStoredDescriptions = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.descriptions, JSON.stringify(statusDescriptions))
  } catch (error) {
    console.warn('[Storage] Failed to save status descriptions:', error)
  }
}

const handleFile = async (file) => {
  fileRef.value = file
  workbookRef.value = null
  sheetNames.value = []
  sheetSelection.green = ''
  sheetSelection.blue = ''
  validationError.value = ''
  statuses.value = []
  readyStatuses.value = []
  comment.value = loadStoredComment()
  statusColumnOptions.green = []
  statusColumnOptions.blue = []
  valueColumnOptions.green = []
  valueColumnOptions.blue = []
  selectedStatusColumn.green = ''
  selectedStatusColumn.blue = ''
  selectedValueColumn.green = ''
  selectedValueColumn.blue = ''
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
  refreshStatusColumnOptions()
  processSheets()
}

const updateBlueSheet = (value) => {
  sheetSelection.blue = value
  refreshStatusColumnOptions()
  processSheets()
}

const updateGreenStatusColumn = (value) => {
  selectedStatusColumn.green = value || ''
  console.log('[Excel] Green status column selected:', selectedStatusColumn.green)
  processSheets()
}

const updateBlueStatusColumn = (value) => {
  selectedStatusColumn.blue = value || ''
  console.log('[Excel] Blue status column selected:', selectedStatusColumn.blue)
  processSheets()
}

const updateGreenValueColumn = (value) => {
  selectedValueColumn.green = value || ''
  console.log('[Excel] Green value column selected:', selectedValueColumn.green)
  processSheets()
}

const updateBlueValueColumn = (value) => {
  selectedValueColumn.blue = value || ''
  console.log('[Excel] Blue value column selected:', selectedValueColumn.blue)
  processSheets()
}

const resolveActualHeader = (headerRow, selectedHeader) => {
  const normalizedSelected = selectedHeader?.toString().trim().toLowerCase()
  if (!normalizedSelected) return selectedHeader
  const actual = headerRow.find(
    (header) => header?.toString().trim().toLowerCase() === normalizedSelected
  )
  return actual || selectedHeader
}

const refreshStatusColumnOptions = () => {
  validationError.value = ''
  statusColumnOptions.green = []
  statusColumnOptions.blue = []
  valueColumnOptions.green = []
  valueColumnOptions.blue = []

  if (!sheetSelection.green || !sheetSelection.blue || !workbookRef.value) {
    return
  }

  const greenData = getSheetData(workbookRef.value, sheetSelection.green)
  const blueData = getSheetData(workbookRef.value, sheetSelection.blue)

  const normalizeHeaders = (headers) => {
    const seen = new Set()
    return headers
      .map((header) => header?.toString().trim())
      .filter((header) => {
        const key = header?.toLowerCase()
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      })
  }

  statusColumnOptions.green = normalizeHeaders(greenData.headerRow)
  statusColumnOptions.blue = normalizeHeaders(blueData.headerRow)
  valueColumnOptions.green = normalizeHeaders(greenData.headerRow)
  valueColumnOptions.blue = normalizeHeaders(blueData.headerRow)
  console.log('[Excel] Green status column options:', statusColumnOptions.green)
  console.log('[Excel] Blue status column options:', statusColumnOptions.blue)
  console.log('[Excel] Green value column options:', valueColumnOptions.green)
  console.log('[Excel] Blue value column options:', valueColumnOptions.blue)

  if (
    selectedStatusColumn.green &&
    !statusColumnOptions.green.includes(selectedStatusColumn.green)
  ) {
    selectedStatusColumn.green = ''
  }
  if (
    selectedStatusColumn.blue &&
    !statusColumnOptions.blue.includes(selectedStatusColumn.blue)
  ) {
    selectedStatusColumn.blue = ''
  }

  if (
    selectedValueColumn.green &&
    !valueColumnOptions.green.includes(selectedValueColumn.green)
  ) {
    selectedValueColumn.green = ''
  }
  if (
    selectedValueColumn.blue &&
    !valueColumnOptions.blue.includes(selectedValueColumn.blue)
  ) {
    selectedValueColumn.blue = ''
  }

  if (!selectedStatusColumn.green) {
    const defaultColumn = statusColumnOptions.green.find(
      (column) => column.toLowerCase() === 'статус'
    )
    if (defaultColumn) {
      selectedStatusColumn.green = defaultColumn
      console.log('[Excel] Green status column auto-selected:', selectedStatusColumn.green)
    }
  }

  if (!selectedStatusColumn.blue) {
    const defaultColumn = statusColumnOptions.blue.find(
      (column) => column.toLowerCase() === 'статус'
    )
    if (defaultColumn) {
      selectedStatusColumn.blue = defaultColumn
      console.log('[Excel] Blue status column auto-selected:', selectedStatusColumn.blue)
    }
  }

  if (!selectedValueColumn.green) {
    const defaultValueColumn = valueColumnOptions.green.find((column) =>
      column.toLowerCase().includes('значение')
    )
    if (defaultValueColumn) {
      selectedValueColumn.green = defaultValueColumn
      console.log('[Excel] Green value column auto-selected:', selectedValueColumn.green)
    }
  }

  if (!selectedValueColumn.blue) {
    const defaultValueColumn = valueColumnOptions.blue.find((column) =>
      column.toLowerCase().includes('значение')
    )
    if (defaultValueColumn) {
      selectedValueColumn.blue = defaultValueColumn
      console.log('[Excel] Blue value column auto-selected:', selectedValueColumn.blue)
    }
  }
}

const processSheets = () => {
  validationError.value = ''

  if (!sheetSelection.green || !sheetSelection.blue) {
    return
  }

  if (!statusColumnOptions.green.length || !statusColumnOptions.blue.length) {
    validationError.value = 'На одном из листов не найдены доступные столбцы для статусов.'
    return
  }

  if (!selectedStatusColumn.green || !selectedStatusColumn.blue) {
    validationError.value = 'Выберите столбец со статусами для каждого листа.'
    return
  }

  if (!selectedValueColumn.green || !selectedValueColumn.blue) {
    validationError.value = 'Выберите столбец со значениями для каждого листа.'
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
  const greenStatusHeader = resolveActualHeader(
    greenData.headerRow,
    selectedStatusColumn.green
  )
  const blueStatusHeader = resolveActualHeader(
    blueData.headerRow,
    selectedStatusColumn.blue
  )
  const greenValueHeader = resolveActualHeader(
    greenData.headerRow,
    selectedValueColumn.green
  )
  const blueValueHeader = resolveActualHeader(
    blueData.headerRow,
    selectedValueColumn.blue
  )
  greenColumns.map[selectedStatusColumn.green] = greenStatusHeader
  blueColumns.map[selectedStatusColumn.blue] = blueStatusHeader
  greenColumns.map[selectedValueColumn.green] = greenValueHeader
  blueColumns.map[selectedValueColumn.blue] = blueValueHeader
  zoneData.green.columnMap = greenColumns.map
  zoneData.blue.columnMap = blueColumns.map

  zoneData.green.metrics = extractMetrics(
    greenData.rows,
    greenColumns.map,
    selectedStatusColumn.green
  )
  zoneData.blue.metrics = extractMetrics(
    blueData.rows,
    blueColumns.map,
    selectedStatusColumn.blue
  )
  zoneData.green.items = extractDashboardItems(
    greenData.rows,
    greenColumns.map,
    selectedStatusColumn.green,
    selectedValueColumn.green
  )
  zoneData.blue.items = extractDashboardItems(
    blueData.rows,
    blueColumns.map,
    selectedStatusColumn.blue,
    selectedValueColumn.blue
  )

  console.log('[Excel] Green metrics:', zoneData.green.metrics)
  console.log('[Excel] Blue metrics:', zoneData.blue.metrics)
  console.log('[Excel] Green dashboard items:', zoneData.green.items)
  console.log('[Excel] Blue dashboard items:', zoneData.blue.items)

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

  const storedDescriptions = loadStoredDescriptions()
  if (!statuses.value.length) {
    Object.keys(statusDescriptions).forEach((key) => delete statusDescriptions[key])
    saveStoredDescriptions()
  }

  readyStatuses.value = readyStatuses.value.filter((status) =>
    statuses.value.includes(status)
  )

  statuses.value.forEach((status) => {
    if (!(status in statusDescriptions)) {
      statusDescriptions[status] = storedDescriptions[status] || ''
    }
  })

  Object.keys(statusDescriptions).forEach((status) => {
    if (!statuses.value.includes(status)) {
      delete statusDescriptions[status]
    }
  })

  saveStoredDescriptions()
}

const updateDescription = ({ status, value }) => {
  statusDescriptions[status] = value
  saveStoredDescriptions()
}

const updateReadyStatuses = (value) => {
  readyStatuses.value = value
  console.log('[Status] Ready statuses updated:', readyStatuses.value)
}

const updateComment = (value) => {
  comment.value = value
  saveStoredComment(value)
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

const buildZoneView = (items, readySet, useSections) => {
  const sections = []
  let currentSection = null
  let currentCard = null

  const ensureSection = (name = '') => {
    const section = { name, cards: [] }
    sections.push(section)
    return section
  }

  items.forEach((item) => {
    const typeNormalized = normalizeValue(item.type)
    if (isSectionType(item.type)) {
      if (!useSections) {
        return
      }
      currentSection = ensureSection(item.name || 'Без названия раздела')
      currentCard = null
      return
    }

    if (!currentSection) {
      currentSection = ensureSection(useSections ? 'Прочее' : '')
    }

    const statusNormalized = normalizeStatus(item.status)
    const hasStatus = Boolean(statusNormalized)
    const problem = hasStatus && !readySet.has(statusNormalized)

    if (typeNormalized === 'метрика') {
      currentCard = {
        name: item.name || 'Без названия метрики',
        mainValue: item.value,
        status: item.statusDisplay || item.status || '',
        values: [],
        problem,
      }
      currentSection.cards.push(currentCard)
      return
    }

    if (isMetricType(item.type) && typeNormalized === 'значение' && currentCard) {
      currentCard.values.push({
        name: item.name || 'Значение',
        value: item.value,
        status: item.statusDisplay || item.status || '',
        problem,
      })
      if (problem) {
        currentCard.problem = true
      }
    }
  })

  return { sections: sections.filter((section) => section.cards.length) }
}

const dashboardView = computed(() => {
  const readySet = new Set(readyStatuses.value.map(normalizeStatus))
  return {
    green: buildZoneView(zoneData.green.items, readySet, false),
    blue: buildZoneView(zoneData.blue.items, readySet, true),
  }
})

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

comment.value = loadStoredComment()
</script>
