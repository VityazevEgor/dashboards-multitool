const normalizeText = (value) =>
  value ? value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : ''

const readValue = (root, selector) =>
  normalizeText(root?.querySelector(selector)?.textContent || '')

const readTextList = (root, selector) =>
  Array.from(root?.querySelectorAll(selector) || []).map((node) =>
    normalizeText(node.textContent || '')
  )

export const parseDashboardHtml = (htmlText) => {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlText, 'text/html')

  const filteredBlocks = Array.from(doc.querySelectorAll('.dashboard-tree-filter'))
  filteredBlocks.forEach((node) => node.remove())
  if (filteredBlocks.length) {
    console.log('[Parser] Removed dashboard-tree-filter blocks:', filteredBlocks.length)
  }

  const iconBlocks = Array.from(doc.querySelectorAll('.q-icon'))
  iconBlocks.forEach((node) => node.remove())
  if (iconBlocks.length) {
    console.log('[Parser] Removed q-icon elements:', iconBlocks.length)
  }

  const sectionNodes = Array.from(doc.querySelectorAll('[id^="dashboard-block-"]'))
    .filter((node) => /dashboard-block-\d+/.test(node.id))

  console.log('[Parser] Sections found:', sectionNodes.length)

  const rows = []
  const sections = []
  const tables = []

  sectionNodes.forEach((sectionNode) => {
    const sectionTitle = readValue(sectionNode, '.dashboard__title')
    const cards = Array.from(sectionNode.querySelectorAll('.dashboard-block'))

    if (!cards.length) {
      console.log('[Parser] Section skipped (no cards):', sectionTitle || sectionNode.id)
      return
    }

    sections.push({ title: sectionTitle, cards: cards.length })

    rows.push({
      name: sectionTitle || 'Без названия раздела',
      type: 'Раздел',
      value: '',
    })

    cards.forEach((card) => {
      const cardTitle = readValue(card, '.dashboard-block__title')
      const mainValue = readValue(card, '.dashboard-block__value span')

      if (!cardTitle || cardTitle === 'Без названия метрики') {
        console.log('[Parser] Metric skipped (no title):', cardTitle || sectionTitle)
        return
      }

      rows.push({
        name: cardTitle,
        type: 'Метрика',
        value: mainValue,
      })

      const extraItems = Array.from(card.querySelectorAll('.dashboard-block__extra .extra-item'))
      extraItems.forEach((item) => {
        const extraTitle = readValue(item, '.extra-item__title')
        const extraValue = readValue(item, '.extra-item__value span') || readValue(item, '.extra-item__value')
        if (!extraTitle && !cardTitle) {
          return
        }

        const fullName = extraTitle ? `${cardTitle} — ${extraTitle}` : cardTitle

        rows.push({
          name: fullName,
          type: 'Значение',
          value: extraValue,
        })
      })
    })
  })

  const metricsCount = rows.filter((row) => row.type === 'Метрика' || row.type === 'Значение').length

  const tableNodes = Array.from(doc.querySelectorAll('[id^="dashboard-table-"]'))
    .filter((node) => /dashboard-table-\d+/.test(node.id))

  console.log('[Parser] Tables found:', tableNodes.length)

  tableNodes.forEach((tableNode, index) => {
    const title = readValue(tableNode, '.text-h5.text-bold')
    const table = tableNode.querySelector('table.q-table')
    if (!table) {
      console.log('[Parser] Table skipped (no q-table):', title || tableNode.id)
      return
    }

    const headers = readTextList(table, 'thead tr th')
    const bodyRows = Array.from(table.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) =>
        normalizeText(cell.textContent || '')
      )
    )

    tables.push({
      id: tableNode.id,
      title: title || `Таблица ${index + 1}`,
      headers,
      rows: bodyRows,
    })
  })

  return {
    rows,
    sections,
    metricsCount,
    tables,
  }
}
