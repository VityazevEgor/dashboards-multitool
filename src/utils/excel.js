import * as XLSX from 'xlsx'

export const readWorkbook = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        resolve(workbook)
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })

export const getSheetNames = (workbook) => workbook?.SheetNames ?? []

export const getSheetData = (workbook, sheetName) => {
  const sheet = workbook?.Sheets?.[sheetName]
  if (!sheet) {
    return { headerRow: [], rows: [] }
  }

  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  const headerRow = rawRows[0] || []
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false })

  return { headerRow, rows }
}

export const normalizeValue = (value) =>
  value?.toString().trim().toLowerCase()

export const splitStatusTokens = (value) => {
  if (!value) return []
  return value
    .toString()
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean)
}

export const normalizeStatusKey = (value) => {
  const tokens = splitStatusTokens(value)
    .map((token) => token.toLowerCase())
    .sort((a, b) => a.localeCompare(b))
  return tokens.join(', ')
}

export const formatStatusDisplay = (value) => {
  const tokens = splitStatusTokens(value).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )
  return tokens.join(', ')
}

export const buildColumnMap = (headerRow, requiredColumns) => {
  const normalizedHeaders = new Map()
  headerRow.forEach((header) => {
    const normalized = normalizeValue(header)
    if (normalized) {
      normalizedHeaders.set(normalized, header)
    }
  })

  const map = {}
  const missing = []
  requiredColumns.forEach((required) => {
    const normalized = normalizeValue(required)
    const actual = normalizedHeaders.get(normalized)
    if (!actual) {
      missing.push(required)
    } else {
      map[required] = actual
    }
  })

  return { map, missing }
}

export const isMetricType = (value) => {
  const normalized = normalizeValue(value)
  if (!normalized) return false
  return normalized === 'значение' || normalized === 'метрика'
}

export const extractMetrics = (rows, columnMap, statusColumnName = 'Статус') => {
  const typeKey = columnMap['Тип']
  const nameKey = columnMap['Наименование']
  const statusKey = columnMap[statusColumnName]

  return rows
    .filter((row) => isMetricType(row[typeKey]))
    .map((row) => ({
      type: row[typeKey],
      name: row[nameKey],
      status: row[statusKey],
      statusKey: normalizeStatusKey(row[statusKey]),
      statusDisplay: formatStatusDisplay(row[statusKey]),
    }))
}

export const summarizeStatuses = (metrics) => {
  const counts = new Map()

  metrics.forEach((item) => {
    const key = item.statusKey || ''
    const display = item.statusDisplay || 'Без статуса'
    const current = counts.get(key)
    counts.set(key, {
      display,
      count: (current?.count || 0) + 1,
    })
  })

  const result = {}
  counts.forEach((value) => {
    result[value.display] = value.count
  })

  return result
}
