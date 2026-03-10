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

  <v-row v-if="fileRef" class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="9">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-primary mb-2">Шаблоны</div>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Выберите готовый шаблон, создайте новый или перезапишите текущий.
        </div>
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-start ga-2">
            <v-select
              class="flex-grow-1"
              v-model="selectedTemplateName"
              :items="templateNames"
              label="Шаблон"
              variant="outlined"
              clearable
            />
              <v-btn
                class="template-btn"
                color="secondary"
                variant="text"
                prepend-icon="mdi-plus-box-outline"
                @click="openCreateTemplateDialog"
              >
                Новый
              </v-btn>
            </div>
            <div class="d-flex ga-2 mt-2">
              <v-btn
                class="template-btn"
                color="primary"
                variant="flat"
                prepend-icon="mdi-check-circle-outline"
                :disabled="!selectedTemplateName"
                @click="applyTemplate"
              >
                Применить
              </v-btn>
              <v-btn
                class="template-btn"
                color="secondary"
                variant="outlined"
                prepend-icon="mdi-content-save-outline"
                @click="saveTemplate"
              >
                Сохранить
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card>
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
        :colors="statusColors"
        @update:description="updateDescription"
        @update:color="updateColor"
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
        :status-colors="statusColors"
        :theme-mode="visualSettings.themeMode"
        :dim-uncommented="visualSettings.dimUncommented"
        :prepared-comments-text="visualSettings.preparedCommentsText"
        :card-comments="metricComments"
        @update:theme-mode="(value) => (visualSettings.themeMode = value)"
        @update:dim-uncommented="(value) => (visualSettings.dimUncommented = value)"
        @update:prepared-comments-text="(value) => (visualSettings.preparedCommentsText = value)"
        @set-card-comment="setCardComment"
        @remove-card-comment="removeCardComment"
      />
    </v-col>
  </v-row>

  <v-dialog v-model="createTemplateDialog" max-width="460">
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">Новый шаблон</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="newTemplateName"
          label="Название шаблона"
          variant="outlined"
          autofocus
          @keyup.enter="confirmCreateTemplate"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="createTemplateDialog = false">Отмена</v-btn>
        <v-btn color="primary" variant="flat" @click="confirmCreateTemplate">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
import { StatusTemplate, StatusTemplateStore } from '../models/statusTemplate.js'

const emit = defineEmits(['back'])

const templateStore = new StatusTemplateStore()

const fileRef = ref(null)
const workbookRef = ref(null)
const sheetNames = ref([])

const templates = ref([])
const selectedTemplateName = ref('')
const createTemplateDialog = ref(false)
const newTemplateName = ref('')

const statusColumnOptions = reactive({ green: [], blue: [] })
const valueColumnOptions = reactive({ green: [], blue: [] })
const selectedStatusColumn = reactive({ green: '', blue: '' })
const selectedValueColumn = reactive({ green: '', blue: '' })
const sheetSelection = reactive({ green: '', blue: '' })

const validationError = ref('')
const statuses = ref([])
const statusDescriptions = reactive({})
const statusDescriptionsStore = reactive({})
const statusColors = reactive({})
const statusColorOverrides = reactive({})
const readyStatuses = ref([])
const comment = ref('')
const generating = ref(false)

const metricComments = reactive({})
const visualSettings = reactive({
  themeMode: 'dark',
  dimUncommented: false,
  preparedCommentsText: '',
})

const zoneData = reactive({
  green: { rows: [], metrics: [], items: [], columnMap: {} },
  blue: { rows: [], metrics: [], items: [], columnMap: {} },
})

const requiredColumns = ['Тип', 'Наименование']

const templateNames = computed(() => templates.value.map((template) => template.name))

const getDefaultStatusColor = (status) =>
  readyStatuses.value.includes(status) ? '#10b981' : '#ef4444'

const refreshTemplateList = () => {
  templates.value = templateStore.loadAll()
}

const clearObject = (target) => {
  Object.keys(target).forEach((key) => delete target[key])
}

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

const resolveActualHeader = (headerRow, selectedHeader) => {
  const normalizedSelected = selectedHeader?.toString().trim().toLowerCase()
  if (!normalizedSelected) return selectedHeader
  const actual = headerRow.find(
    (header) => header?.toString().trim().toLowerCase() === normalizedSelected
  )
  return actual || selectedHeader
}

const syncCurrentStatusFields = () => {
  statuses.value.forEach((status) => {
    statusDescriptions[status] = statusDescriptionsStore[status] || ''
    statusColors[status] = statusColorOverrides[status] || getDefaultStatusColor(status)
  })

  Object.keys(statusDescriptions).forEach((status) => {
    if (!statuses.value.includes(status)) {
      delete statusDescriptions[status]
    }
  })
  Object.keys(statusColors).forEach((status) => {
    if (!statuses.value.includes(status)) {
      delete statusColors[status]
    }
  })
}

const applyTemplatePayload = (template) => {
  sheetSelection.green = template.sheets?.green || ''
  sheetSelection.blue = template.sheets?.blue || ''
  selectedStatusColumn.green = template.statusColumns?.green || ''
  selectedStatusColumn.blue = template.statusColumns?.blue || ''
  selectedValueColumn.green = template.valueColumns?.green || ''
  selectedValueColumn.blue = template.valueColumns?.blue || ''

  clearObject(statusDescriptionsStore)
  Object.assign(statusDescriptionsStore, template.statusDescriptions || {})

  clearObject(statusColorOverrides)
  Object.assign(statusColorOverrides, template.statusColorOverrides || {})

  readyStatuses.value = [...(template.readyStatuses || [])]
  comment.value = template.generalComment || ''

  clearObject(metricComments)
  Object.assign(metricComments, template.metricComments || {})

  visualSettings.themeMode = template.visualTheme || 'dark'
  visualSettings.dimUncommented = Boolean(template.dimUncommented)
  visualSettings.preparedCommentsText = template.preparedCommentsText || ''

  refreshStatusColumnOptions()
  processSheets()
}

const buildTemplateFromCurrentState = (name) =>
  StatusTemplate.fromState(name, {
    sheets: { ...sheetSelection },
    statusColumns: { ...selectedStatusColumn },
    valueColumns: { ...selectedValueColumn },
    statusDescriptions: { ...statusDescriptionsStore },
    statusColorOverrides: { ...statusColorOverrides },
    readyStatuses: [...readyStatuses.value],
    generalComment: comment.value,
    metricComments: { ...metricComments },
    preparedCommentsText: visualSettings.preparedCommentsText,
    dimUncommented: visualSettings.dimUncommented,
    visualTheme: visualSettings.themeMode,
  })

const handleFile = async (file) => {
  fileRef.value = file
  workbookRef.value = null
  sheetNames.value = []
  validationError.value = ''

  sheetSelection.green = ''
  sheetSelection.blue = ''
  selectedStatusColumn.green = ''
  selectedStatusColumn.blue = ''
  selectedValueColumn.green = ''
  selectedValueColumn.blue = ''

  statusColumnOptions.green = []
  statusColumnOptions.blue = []
  valueColumnOptions.green = []
  valueColumnOptions.blue = []

  statuses.value = []
  readyStatuses.value = []
  comment.value = ''

  clearObject(statusDescriptions)
  clearObject(statusDescriptionsStore)
  clearObject(statusColors)
  clearObject(statusColorOverrides)
  clearObject(metricComments)

  visualSettings.themeMode = 'dark'
  visualSettings.dimUncommented = false
  visualSettings.preparedCommentsText = ''

  selectedTemplateName.value = ''

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
    refreshTemplateList()
  } catch (error) {
    console.error('[Excel] Failed to read workbook:', error)
    validationError.value = 'Не удалось прочитать Excel файл. Проверьте формат.'
  }
}

const openCreateTemplateDialog = () => {
  newTemplateName.value = ''
  createTemplateDialog.value = true
}

const confirmCreateTemplate = () => {
  const name = newTemplateName.value.trim()
  if (!name) return
  const template = buildTemplateFromCurrentState(name)
  templates.value = templateStore.upsert(template)
  selectedTemplateName.value = name
  createTemplateDialog.value = false
  console.log('[Template] Created:', name)
}

const saveTemplate = () => {
  if (selectedTemplateName.value) {
    const template = buildTemplateFromCurrentState(selectedTemplateName.value)
    templates.value = templateStore.upsert(template)
    console.log('[Template] Saved:', selectedTemplateName.value)
    return
  }
  openCreateTemplateDialog()
}

const applyTemplate = () => {
  const template = templates.value.find((item) => item.name === selectedTemplateName.value)
  if (!template) return
  console.log('[Template] Applying:', template.name)
  applyTemplatePayload(template)
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
  processSheets()
}

const updateBlueStatusColumn = (value) => {
  selectedStatusColumn.blue = value || ''
  processSheets()
}

const updateGreenValueColumn = (value) => {
  selectedValueColumn.green = value || ''
  processSheets()
}

const updateBlueValueColumn = (value) => {
  selectedValueColumn.blue = value || ''
  processSheets()
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

  statusColumnOptions.green = normalizeHeaders(greenData.headerRow)
  statusColumnOptions.blue = normalizeHeaders(blueData.headerRow)
  valueColumnOptions.green = normalizeHeaders(greenData.headerRow)
  valueColumnOptions.blue = normalizeHeaders(blueData.headerRow)

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
    if (defaultColumn) selectedStatusColumn.green = defaultColumn
  }
  if (!selectedStatusColumn.blue) {
    const defaultColumn = statusColumnOptions.blue.find(
      (column) => column.toLowerCase() === 'статус'
    )
    if (defaultColumn) selectedStatusColumn.blue = defaultColumn
  }
  if (!selectedValueColumn.green) {
    const defaultColumn = valueColumnOptions.green.find((column) =>
      column.toLowerCase().includes('значение')
    )
    if (defaultColumn) selectedValueColumn.green = defaultColumn
  }
  if (!selectedValueColumn.blue) {
    const defaultColumn = valueColumnOptions.blue.find((column) =>
      column.toLowerCase().includes('значение')
    )
    if (defaultColumn) selectedValueColumn.blue = defaultColumn
  }
}

const processSheets = () => {
  validationError.value = ''

  if (!sheetSelection.green || !sheetSelection.blue) return

  if (!selectedStatusColumn.green || !selectedStatusColumn.blue) {
    validationError.value = 'Выберите столбец со статусами для каждого листа.'
    return
  }

  if (!selectedValueColumn.green || !selectedValueColumn.blue) {
    validationError.value = 'Выберите столбец со значениями для каждого листа.'
    return
  }

  const greenData = getSheetData(workbookRef.value, sheetSelection.green)
  const blueData = getSheetData(workbookRef.value, sheetSelection.blue)

  const greenColumns = buildColumnMap(greenData.headerRow, requiredColumns)
  const blueColumns = buildColumnMap(blueData.headerRow, requiredColumns)

  if (greenColumns.missing.length || blueColumns.missing.length) {
    const messages = []
    if (greenColumns.missing.length) {
      messages.push(`Зеленая зона: отсутствуют столбцы ${greenColumns.missing.join(', ')}`)
    }
    if (blueColumns.missing.length) {
      messages.push(`Синяя зона: отсутствуют столбцы ${blueColumns.missing.join(', ')}`)
    }
    validationError.value = messages.join('. ')
    zoneData.green.rows = []
    zoneData.blue.rows = []
    zoneData.green.metrics = []
    zoneData.blue.metrics = []
    zoneData.green.items = []
    zoneData.blue.items = []
    statuses.value = []
    return
  }

  zoneData.green.rows = greenData.rows
  zoneData.blue.rows = blueData.rows

  greenColumns.map[selectedStatusColumn.green] = resolveActualHeader(
    greenData.headerRow,
    selectedStatusColumn.green
  )
  blueColumns.map[selectedStatusColumn.blue] = resolveActualHeader(
    blueData.headerRow,
    selectedStatusColumn.blue
  )
  greenColumns.map[selectedValueColumn.green] = resolveActualHeader(
    greenData.headerRow,
    selectedValueColumn.green
  )
  blueColumns.map[selectedValueColumn.blue] = resolveActualHeader(
    blueData.headerRow,
    selectedValueColumn.blue
  )

  zoneData.green.columnMap = greenColumns.map
  zoneData.blue.columnMap = blueColumns.map

  zoneData.green.metrics = extractMetrics(greenData.rows, greenColumns.map, selectedStatusColumn.green)
  zoneData.blue.metrics = extractMetrics(blueData.rows, blueColumns.map, selectedStatusColumn.blue)
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

  const combinedStatuses = new Map()
  ;[...zoneData.green.metrics, ...zoneData.blue.metrics].forEach((item) => {
    if (item.status) {
      combinedStatuses.set(item.statusKey, item.statusDisplay)
    }
  })

  statuses.value = Array.from(combinedStatuses.values())
  syncCurrentStatusFields()
}

const updateDescription = ({ status, value }) => {
  statusDescriptions[status] = value
  statusDescriptionsStore[status] = value
}

const updateColor = ({ status, value }) => {
  statusColorOverrides[status] = value
  statusColors[status] = value
}

const updateReadyStatuses = (value) => {
  readyStatuses.value = value
  syncCurrentStatusFields()
}

const updateComment = (value) => {
  comment.value = value
}

const setCardComment = ({ cardId, comment: text }) => {
  metricComments[cardId] = text
}

const removeCardComment = (cardId) => {
  delete metricComments[cardId]
}

const normalizeStatus = (status) => normalizeStatusKey(status) || ''

const allMetrics = computed(() => [...zoneData.green.metrics, ...zoneData.blue.metrics])
const totalCount = computed(() => allMetrics.value.length)

const readyCount = computed(() => {
  const readySet = new Set(readyStatuses.value.map(normalizeStatus))
  return allMetrics.value.filter((item) => readySet.has(normalizeStatus(item.status))).length
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

const buildZoneView = (items, readySet, zoneKey, useSections) => {
  const sections = []
  let currentSection = null
  let currentCard = null
  const keyCounter = new Map()

  const ensureSection = (name = '') => {
    const section = { name, cards: [] }
    sections.push(section)
    return section
  }

  const makeCardId = (sectionName, cardName) => {
    const base = `${zoneKey}|${sectionName || ''}|${cardName || ''}`
    const count = keyCounter.get(base) || 0
    keyCounter.set(base, count + 1)
    return `${base}|${count}`
  }

  items.forEach((item) => {
    const typeNormalized = normalizeValue(item.type)

    if (isSectionType(item.type)) {
      if (!useSections) return
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
        id: makeCardId(currentSection.name, item.name),
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
    }
  })

  return { sections: sections.filter((section) => section.cards.length) }
}

const dashboardView = computed(() => {
  const readySet = new Set(readyStatuses.value.map(normalizeStatus))
  return {
    green: buildZoneView(zoneData.green.items, readySet, 'green', false),
    blue: buildZoneView(zoneData.blue.items, readySet, 'blue', true),
  }
})

const generateReport = async () => {
  generating.value = true
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

refreshTemplateList()
</script>

<style scoped>
.template-btn {
  min-height: 56px;
}
</style>
