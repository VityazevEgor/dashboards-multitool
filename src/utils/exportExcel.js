import * as XLSX from 'xlsx-js-style'

const headerStyle = {
  font: { bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '1F2937' } },
  alignment: { vertical: 'center', wrapText: true },
}

const sectionStyle = {
  font: { bold: true, color: { rgb: '0F172A' } },
  fill: { fgColor: { rgb: '93C5FD' } },
  alignment: { vertical: 'center', wrapText: true },
}

const titleStyle = {
  font: { bold: true, color: { rgb: '0F172A' }, sz: 14 },
  fill: { fgColor: { rgb: 'A7F3D0' } },
  alignment: { vertical: 'center', wrapText: true },
}

const baseStyle = {
  alignment: { vertical: 'top', wrapText: true },
}

const borderStyle = {
  top: { style: 'thin', color: { rgb: '94A3B8' } },
  bottom: { style: 'thin', color: { rgb: '94A3B8' } },
  left: { style: 'thin', color: { rgb: '94A3B8' } },
  right: { style: 'thin', color: { rgb: '94A3B8' } },
}

const applyColumnWidths = (worksheet, data) => {
  const colWidths = []
  data.forEach((row) => {
    row.forEach((value, index) => {
      const length = value ? value.toString().length : 0
      if (!colWidths[index] || length > colWidths[index]) {
        colWidths[index] = length
      }
    })
  })

  worksheet['!cols'] = colWidths.map((length) => ({
    wch: Math.min(Math.max((length || 0) + 4, 12), 70),
  }))
}

const applyBorders = (worksheet) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'])

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      const cell = worksheet[cellRef]
      if (!cell) continue
      cell.s = { ...(cell.s || {}), border: borderStyle }
    }
  }
}

const styleSheet = (
  worksheet,
  data,
  { sectionRowIndex = null, headerRowIndex = 0, titleRowIndex = null } = {}
) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'])

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const isHeader = headerRowIndex !== null && rowIndex === headerRowIndex
    const isTitle = titleRowIndex !== null && rowIndex === titleRowIndex
    const isSection = sectionRowIndex !== null && rowIndex === sectionRowIndex

    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      const cell = worksheet[cellRef]
      if (!cell) continue

      if (isTitle) {
        cell.s = titleStyle
      } else if (isHeader) {
        cell.s = headerStyle
      } else if (isSection) {
        cell.s = sectionStyle
      } else {
        cell.s = baseStyle
      }
    }
  }
}

const toNumberMaybe = (value) => {
  if (typeof value !== 'string') return value
  const normalized = value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
  if (!normalized) return value

  const candidate = normalized.replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(candidate)) {
    return value
  }

  const parsed = Number(candidate)
  return Number.isFinite(parsed) ? parsed : value
}

const sanitizeSheetName = (name, existingNames) => {
  const baseName = (name || 'Таблица')
    .replace(/[\\/?*\\[\\]:]/g, ' ')
    .trim()
    .slice(0, 31) || 'Таблица'

  let finalName = baseName
  let counter = 1
  while (existingNames.has(finalName)) {
    const suffix = ` ${counter}`
    finalName = `${baseName.slice(0, 31 - suffix.length)}${suffix}`
    counter += 1
  }
  existingNames.add(finalName)
  return finalName
}

const applyMetricsStyles = (worksheet, data) => {
  const range = XLSX.utils.decode_range(worksheet['!ref'])

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    const isHeader = rowIndex === 0
    const rowType = data[rowIndex]?.[1]
    const isSection = rowType === 'Раздел'

    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      const cell = worksheet[cellRef]
      if (!cell) continue

      if (isHeader) {
        cell.s = headerStyle
      } else if (isSection) {
        cell.s = sectionStyle
      } else {
        cell.s = baseStyle
      }
    }
  }
}

export const exportRowsToExcel = (rows, fileName = 'dashboard-metrics.xlsx', tables = []) => {
  const workbook = XLSX.utils.book_new()

  const metricsData = [
    ['Название', 'Тип', 'Значение карточки'],
    ...rows.map((row) => [row.name, row.type, toNumberMaybe(row.value)]),
  ]

  const metricsSheet = XLSX.utils.aoa_to_sheet(metricsData)

  applyMetricsStyles(metricsSheet, metricsData)
  applyBorders(metricsSheet)
  applyColumnWidths(metricsSheet, metricsData)
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Метрики')

  const existingNames = new Set(['Метрики'])

  tables.forEach((table) => {
    const headers = table.headers?.length ? table.headers : []
    const bodyRows = table.rows || []
    const maxColumns = Math.max(headers.length, ...bodyRows.map((row) => row.length), 1)

    const titleRow = Array.from({ length: maxColumns }, (_, index) =>
      index === 0 ? table.title : ''
    )

    const data = [titleRow]
    if (headers.length) {
      data.push([...headers])
    }
    bodyRows.forEach((row) => {
      const filledRow = Array.from({ length: maxColumns }, (_, index) =>
        toNumberMaybe(row[index] || '')
      )
      data.push(filledRow)
    })

    const sheet = XLSX.utils.aoa_to_sheet(data)
    sheet['!merges'] = sheet['!merges'] || []
    sheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: maxColumns - 1 },
    })

    styleSheet(sheet, data, {
      titleRowIndex: 0,
      headerRowIndex: headers.length ? 1 : null,
    })

    applyBorders(sheet)
    applyColumnWidths(sheet, data)
    const sheetName = sanitizeSheetName(table.title, existingNames)
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  })

  XLSX.writeFile(workbook, fileName)
}
