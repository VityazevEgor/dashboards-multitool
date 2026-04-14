import * as XLSX from 'xlsx-js-style'

const border = {
  top: { style: 'thin', color: { rgb: '334155' } },
  bottom: { style: 'thin', color: { rgb: '334155' } },
  left: { style: 'thin', color: { rgb: '334155' } },
  right: { style: 'thin', color: { rgb: '334155' } },
}

const baseCellStyle = {
  font: {
    name: 'Cascadia Mono',
    sz: 11,
    color: { rgb: 'E2E8F0' },
  },
  fill: {
    fgColor: { rgb: '0F172A' },
  },
  alignment: {
    vertical: 'center',
    horizontal: 'left',
    wrapText: true,
  },
  border,
}

const headerCellStyle = {
  ...baseCellStyle,
  font: {
    ...baseCellStyle.font,
    bold: true,
    color: { rgb: 'F8FAFC' },
  },
  alignment: {
    ...baseCellStyle.alignment,
    horizontal: 'center',
  },
}

const applyStyles = (worksheet) => {
  if (!worksheet['!ref']) {
    return
  }

  const range = XLSX.utils.decode_range(worksheet['!ref'])

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex += 1) {
    for (let colIndex = range.s.c; colIndex <= range.e.c; colIndex += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      const cell = worksheet[cellRef]
      if (!cell) continue

      cell.s = rowIndex === 0 ? headerCellStyle : baseCellStyle
    }
  }
}

export const exportTableDiffToExcel = (
  changes,
  fileName = 'table-diff.xlsx'
) => {
  const workbook = XLSX.utils.book_new()

  const sheetData = [
    ['Номер строки', 'Старое значение', 'Новое значение'],
    ...changes.map((item) => [item.rowNumber, item.oldValue, item.newValue]),
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  worksheet['!cols'] = [{ wch: 16 }, { wch: 60 }, { wch: 60 }]
  worksheet['!rows'] = [{ hpt: 24 }]
  worksheet['!autofilter'] = {
    ref: 'A1:C1',
  }

  applyStyles(worksheet)

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Table Diff')
  XLSX.writeFile(workbook, fileName)
}
