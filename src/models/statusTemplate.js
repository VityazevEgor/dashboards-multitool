export class StatusTemplate {
  constructor(payload = {}) {
    this.name = payload.name || ''
    this.updatedAt = payload.updatedAt || new Date().toISOString()
    this.sheets = payload.sheets || { green: '', blue: '' }
    this.statusColumns = payload.statusColumns || { green: '', blue: '' }
    this.valueColumns = payload.valueColumns || { green: '', blue: '' }
    this.statusDescriptions = payload.statusDescriptions || {}
    this.statusColorOverrides = payload.statusColorOverrides || {}
    this.readyStatuses = payload.readyStatuses || []
    this.generalComment = payload.generalComment || ''
    this.metricComments = payload.metricComments || {}
    this.preparedCommentsText = payload.preparedCommentsText || ''
    this.dimUncommented = Boolean(payload.dimUncommented)
    this.visualTheme = payload.visualTheme || 'dark'
  }

  toJSON() {
    return {
      name: this.name,
      updatedAt: new Date().toISOString(),
      sheets: this.sheets,
      statusColumns: this.statusColumns,
      valueColumns: this.valueColumns,
      statusDescriptions: this.statusDescriptions,
      statusColorOverrides: this.statusColorOverrides,
      readyStatuses: this.readyStatuses,
      generalComment: this.generalComment,
      metricComments: this.metricComments,
      preparedCommentsText: this.preparedCommentsText,
      dimUncommented: this.dimUncommented,
      visualTheme: this.visualTheme,
    }
  }

  static fromState(name, state) {
    return new StatusTemplate({
      name,
      sheets: { ...state.sheets },
      statusColumns: { ...state.statusColumns },
      valueColumns: { ...state.valueColumns },
      statusDescriptions: { ...state.statusDescriptions },
      statusColorOverrides: { ...state.statusColorOverrides },
      readyStatuses: [...state.readyStatuses],
      generalComment: state.generalComment,
      metricComments: { ...state.metricComments },
      preparedCommentsText: state.preparedCommentsText,
      dimUncommented: state.dimUncommented,
      visualTheme: state.visualTheme,
    })
  }
}

export class StatusTemplateStore {
  constructor(storageKey = 'dashboard_status_templates_v1') {
    this.storageKey = storageKey
  }

  loadAll() {
    try {
      const raw = localStorage.getItem(this.storageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed.map((item) => new StatusTemplate(item))
    } catch (error) {
      console.warn('[TemplateStore] Failed to load templates:', error)
      return []
    }
  }

  saveAll(templates) {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(templates.map((template) => template.toJSON()))
      )
    } catch (error) {
      console.warn('[TemplateStore] Failed to save templates:', error)
    }
  }

  upsert(template) {
    const templates = this.loadAll()
    const index = templates.findIndex((item) => item.name === template.name)
    if (index >= 0) {
      templates[index] = template
    } else {
      templates.push(template)
    }
    this.saveAll(templates)
    return templates
  }
}
