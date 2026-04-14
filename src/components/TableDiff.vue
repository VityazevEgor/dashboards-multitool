<template>
  <div class="d-flex align-center mb-6">
    <v-btn variant="text" color="primary" prepend-icon="mdi-arrow-left" @click="goBack">
      Назад к выбору
    </v-btn>
  </div>

  <v-row class="mb-6" justify="center">
    <v-col cols="12" lg="10">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-info mb-2">Table Diff</div>
        <div class="text-h5 font-weight-bold mb-2">Сравнение столбцов в Excel</div>
        <div class="text-body-2 text-medium-emphasis mb-6">
          Выберите по одному XLSX файлу, листу и столбцу с каждой стороны. После сравнения можно скачать оформленный XLSX с изменениями.
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4 h-100" variant="tonal" color="primary">
              <div class="text-subtitle-1 font-weight-bold mb-3">Старый файл</div>
              <v-file-input
                v-model="oldFile"
                label="XLSX файл"
                accept=".xlsx"
                prepend-icon="mdi-file-excel"
                variant="outlined"
                density="comfortable"
                @update:model-value="handleOldFile"
              />

              <v-select
                v-model="oldSheet"
                :items="oldSheetNames"
                label="Лист"
                variant="outlined"
                density="comfortable"
                :disabled="!oldWorkbook"
                class="mt-2"
              />

              <v-select
                v-model="oldColumn"
                :items="oldColumns"
                item-title="label"
                item-value="value"
                label="Столбец"
                variant="outlined"
                density="comfortable"
                :disabled="!oldColumns.length"
                class="mt-2"
              />
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="pa-4 h-100" variant="tonal" color="secondary">
              <div class="text-subtitle-1 font-weight-bold mb-3">Новый файл</div>
              <v-file-input
                v-model="newFile"
                label="XLSX файл"
                accept=".xlsx"
                prepend-icon="mdi-file-excel"
                variant="outlined"
                density="comfortable"
                @update:model-value="handleNewFile"
              />

              <v-select
                v-model="newSheet"
                :items="newSheetNames"
                label="Лист"
                variant="outlined"
                density="comfortable"
                :disabled="!newWorkbook"
                class="mt-2"
              />

              <v-select
                v-model="newColumn"
                :items="newColumns"
                item-title="label"
                item-value="value"
                label="Столбец"
                variant="outlined"
                density="comfortable"
                :disabled="!newColumns.length"
                class="mt-2"
              />
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          v-if="errorText"
          class="mt-4"
          type="error"
          variant="tonal"
        >
          {{ errorText }}
        </v-alert>

        <div class="d-flex flex-wrap gap-4 mt-6">
          <v-btn
            color="info"
            variant="flat"
            :loading="comparing"
            :disabled="!canCompare"
            @click="runCompare"
          >
            Сравнить
          </v-btn>
          <v-btn
            color="success"
            variant="outlined"
            :disabled="!hasCompared"
            @click="downloadResult"
          >
            Скачать XLSX
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>

  <v-row v-if="hasCompared" justify="center">
    <v-col cols="12" lg="10">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-info mb-2">Результат</div>
        <div class="text-h5 font-weight-bold mb-4">Найдено изменений: {{ changes.length }}</div>

        <v-alert v-if="!changes.length" type="success" variant="tonal" class="mb-4">
          Изменений не найдено.
        </v-alert>

        <v-table v-else density="comfortable">
          <thead>
            <tr>
              <th>Номер строки</th>
              <th>Изменение</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in previewChanges" :key="`${item.rowNumber}-${index}`">
              <td>{{ item.rowNumber }}</td>
              <td>
                <div class="diff-cell mono">
                  <template v-for="(line, lineIndex) in item.diffLines" :key="`${item.rowNumber}-${lineIndex}`">
                    <div :class="['diff-line', line.type]">
                      <span class="diff-prefix">{{ line.prefix }}</span>{{ line.text }}
                    </div>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-if="changes.length > previewChanges.length" class="text-caption text-medium-emphasis mt-2">
          Показаны первые {{ previewChanges.length }} строк из {{ changes.length }}.
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import * as XLSX from 'xlsx'
import { diffLines } from 'diff'
import { getSheetNames, readWorkbook } from '../utils/excel.js'
import { exportTableDiffToExcel } from '../utils/tableDiffExcel.js'

const emit = defineEmits(['back'])

const oldFile = ref(null)
const newFile = ref(null)

const oldWorkbook = ref(null)
const newWorkbook = ref(null)

const oldSheetNames = ref([])
const newSheetNames = ref([])

const oldSheet = ref('')
const newSheet = ref('')

const oldColumn = ref(null)
const newColumn = ref(null)

const oldColumns = ref([])
const newColumns = ref([])

const comparing = ref(false)
const hasCompared = ref(false)
const changes = ref([])
const errorText = ref('')

const previewChanges = computed(() => changes.value.slice(0, 30))

const canCompare = computed(() =>
  Boolean(
    oldWorkbook.value &&
      newWorkbook.value &&
      oldSheet.value &&
      newSheet.value &&
      oldColumn.value !== null &&
      newColumn.value !== null
  )
)

const unwrapFile = (value) => {
  if (Array.isArray(value)) {
    return value[0] || null
  }
  return value || null
}

const getColumnOptions = (workbook, sheetName) => {
  if (!workbook || !sheetName) {
    return []
  }

  const sheet = workbook.Sheets?.[sheetName]
  if (!sheet) {
    return []
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const headers = matrix[0] || []
  const range = sheet['!ref'] ? XLSX.utils.decode_range(sheet['!ref']) : { e: { c: headers.length - 1 } }
  const columnCount = Math.max(range.e.c + 1, headers.length, 0)

  return Array.from({ length: columnCount }, (_, index) => {
    const letter = XLSX.utils.encode_col(index)
    const headerName = (headers[index] ?? '').toString().trim()
    const label = headerName ? `${letter} - ${headerName}` : letter
    return { label, value: index }
  })
}

const normalizeCellValue = (value) => {
  if (value === null || value === undefined) {
    return ''
  }
  return value.toString().trim()
}

const splitToLines = (value) => {
  const normalized = value.replaceAll('\r', '')
  const lines = normalized.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines.length ? lines : ['']
}

const buildDiffLines = (oldValue, newValue) => {
  const parts = diffLines(oldValue || '', newValue || '')
  const lines = []

  parts.forEach((part) => {
    const type = part.added ? 'added' : part.removed ? 'removed' : 'context'
    const prefix = part.added ? '+' : part.removed ? '-' : ' '
    splitToLines(part.value).forEach((line) => {
      lines.push({
        type,
        prefix,
        text: line,
      })
    })
  })

  return lines
}

const getColumnValues = (workbook, sheetName, columnIndex) => {
  const sheet = workbook?.Sheets?.[sheetName]
  if (!sheet) {
    return []
  }

  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (matrix.length <= 1) {
    return []
  }

  return matrix.slice(1).map((row) => normalizeCellValue(row[columnIndex]))
}

const setOldWorkbookData = (workbook) => {
  oldWorkbook.value = workbook
  oldSheetNames.value = getSheetNames(workbook)
  oldSheet.value = oldSheetNames.value[0] || ''
}

const setNewWorkbookData = (workbook) => {
  newWorkbook.value = workbook
  newSheetNames.value = getSheetNames(workbook)
  newSheet.value = newSheetNames.value[0] || ''
}

const resetResult = () => {
  hasCompared.value = false
  changes.value = []
  errorText.value = ''
}

const handleOldFile = async (input) => {
  resetResult()
  const file = unwrapFile(input)
  oldFile.value = file

  if (!file) {
    oldWorkbook.value = null
    oldSheetNames.value = []
    oldSheet.value = ''
    oldColumn.value = null
    oldColumns.value = []
    return
  }

  try {
    const workbook = await readWorkbook(file)
    setOldWorkbookData(workbook)
  } catch (error) {
    oldWorkbook.value = null
    oldSheetNames.value = []
    oldSheet.value = ''
    oldColumn.value = null
    oldColumns.value = []
    errorText.value = `Не удалось прочитать старый файл: ${error?.message || 'unknown error'}`
  }
}

const handleNewFile = async (input) => {
  resetResult()
  const file = unwrapFile(input)
  newFile.value = file

  if (!file) {
    newWorkbook.value = null
    newSheetNames.value = []
    newSheet.value = ''
    newColumn.value = null
    newColumns.value = []
    return
  }

  try {
    const workbook = await readWorkbook(file)
    setNewWorkbookData(workbook)
  } catch (error) {
    newWorkbook.value = null
    newSheetNames.value = []
    newSheet.value = ''
    newColumn.value = null
    newColumns.value = []
    errorText.value = `Не удалось прочитать новый файл: ${error?.message || 'unknown error'}`
  }
}

watch(oldSheet, (value) => {
  oldColumns.value = getColumnOptions(oldWorkbook.value, value)
  oldColumn.value = oldColumns.value[0]?.value ?? null
  resetResult()
})

watch(newSheet, (value) => {
  newColumns.value = getColumnOptions(newWorkbook.value, value)
  newColumn.value = newColumns.value[0]?.value ?? null
  resetResult()
})

watch([oldColumn, newColumn], () => {
  resetResult()
})

const runCompare = () => {
  if (!canCompare.value) {
    return
  }

  comparing.value = true
  errorText.value = ''

  try {
    const oldValues = getColumnValues(oldWorkbook.value, oldSheet.value, oldColumn.value)
    const newValues = getColumnValues(newWorkbook.value, newSheet.value, newColumn.value)

    const maxLength = Math.max(oldValues.length, newValues.length)
    const diffRows = []

    for (let rowIndex = 0; rowIndex < maxLength; rowIndex += 1) {
      const oldValue = oldValues[rowIndex] ?? ''
      const newValue = newValues[rowIndex] ?? ''

      if (oldValue !== newValue) {
        diffRows.push({
          rowNumber: rowIndex + 2,
          oldValue,
          newValue,
          diffLines: buildDiffLines(oldValue, newValue),
        })
      }
    }

    changes.value = diffRows
    hasCompared.value = true
  } catch (error) {
    errorText.value = `Ошибка сравнения: ${error?.message || 'unknown error'}`
  } finally {
    comparing.value = false
  }
}

const downloadResult = () => {
  if (!hasCompared.value) {
    return
  }

  exportTableDiffToExcel(changes.value)
}

const goBack = () => emit('back')
</script>

<style scoped>
.gap-4 {
  gap: 16px;
}

.diff-cell {
  white-space: pre;
  line-height: 1.5;
}

.diff-line {
  display: block;
  padding: 1px 6px;
  border-radius: 4px;
}

.diff-prefix {
  display: inline-block;
  width: 14px;
  font-weight: 700;
}

.diff-line.context {
  color: #cbd5e1;
}

.diff-line.added {
  color: #a7f3d0;
  background: rgba(16, 185, 129, 0.18);
}

.diff-line.removed {
  color: #fecaca;
  background: rgba(248, 113, 113, 0.18);
}
</style>
