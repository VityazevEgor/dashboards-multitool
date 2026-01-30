import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import { saveAs } from 'file-saver'

const createHeading = (text) =>
  new Paragraph({
    children: [new TextRun({ text, bold: true, size: 28 })],
    spacing: { after: 200 },
  })

const createParagraph = (text) =>
  new Paragraph({
    children: [new TextRun({ text, size: 24 })],
    spacing: { after: 120 },
  })

const createTable = (title, counts, descriptions) => {
  const rows = [
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph('Статус')],
        }),
        new TableCell({
          children: [new Paragraph('Количество')],
        }),
        new TableCell({
          children: [new Paragraph('Комментарий')],
        }),
      ],
    }),
  ]

  Object.entries(counts).forEach(([status, count]) => {
    rows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph(status)],
          }),
          new TableCell({
            children: [new Paragraph(String(count))],
          }),
          new TableCell({
            children: [new Paragraph(descriptions?.[status] || '-')],
          }),
        ],
      })
    )
  })

  return [
    createHeading(title),
    new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    }),
  ]
}

export const generateStatusReport = async ({
  readinessPercent,
  readyCount,
  totalCount,
  greenZone,
  blueZone,
  statusDescriptions,
  comment,
}) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createHeading('Отчет по статусу дашборда'),
          createParagraph(
            `Общая готовность дашборда: ${readinessPercent}% (${readyCount} из ${totalCount})`
          ),
          ...createTable(
            'Синяя зона: распределение статусов',
            blueZone,
            statusDescriptions
          ),
          ...createTable(
            'Зеленая зона: распределение статусов',
            greenZone,
            statusDescriptions
          ),
          createHeading('Общий комментарий'),
          createParagraph(comment || 'Комментарий не указан.'),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, 'dashboard-status-report.docx')
}
