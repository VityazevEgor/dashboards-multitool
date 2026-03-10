<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="d-flex flex-wrap align-center justify-space-between mb-4">
      <div>
        <div class="text-overline text-primary">Визуализация</div>
        <div class="text-h5 font-weight-bold">Состояние дашборда</div>
      </div>
      <div class="d-flex flex-wrap align-center ga-3">
        <v-btn-toggle
          v-model="themeModeProxy"
          color="primary"
          density="comfortable"
          mandatory
          variant="outlined"
        >
          <v-btn value="dark">Темная тема</v-btn>
          <v-btn value="light">Светлая тема</v-btn>
        </v-btn-toggle>
        <v-btn
          color="secondary"
          variant="outlined"
          :loading="exporting"
          @click="exportImage"
        >
          Экспорт в PNG
        </v-btn>
      </div>
    </div>

    <v-card class="pa-4 mb-4" variant="outlined" color="warning">
      <div class="text-subtitle-2 font-weight-bold mb-2">Заготовленные комментарии</div>
      <v-textarea
        v-model="preparedCommentsTextProxy"
        rows="3"
        variant="outlined"
        color="warning"
        hide-details
        placeholder="Один комментарий на строку"
      />
    </v-card>

    <v-checkbox
      v-model="dimUncommentedProxy"
      color="warning"
      hide-details
      label="Затемнять карточки без комментариев"
      class="mb-3"
    />

    <div ref="dashboardRef" :class="['dashboard-export-block pa-4', `theme-${themeMode}`]">
      <zone-view
        title="Зеленая зона"
        :zone-data="greenZone"
        :theme-mode="themeMode"
        :status-colors="statusColors"
        :dim-uncommented="dimUncommented"
        :card-comments="cardComments"
        class="mb-6"
        @card-click="openCommentEditor"
      />
      <zone-view
        title="Синяя зона"
        :zone-data="blueZone"
        :theme-mode="themeMode"
        :status-colors="statusColors"
        :dim-uncommented="dimUncommented"
        :card-comments="cardComments"
        @card-click="openCommentEditor"
      />
    </div>

    <v-dialog v-model="commentDialog" max-width="560">
      <v-card>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Комментарий для карточки
        </v-card-title>
        <v-card-text>
          <div class="text-body-2 mb-3">{{ selectedCardTitle }}</div>
          <v-select
            v-model="selectedPreset"
            :items="preparedCommentsList"
            label="Выберите из заготовок"
            variant="outlined"
            clearable
            class="mb-3"
          />
          <v-textarea
            v-model="commentDraft"
            label="Или введите свой комментарий"
            variant="outlined"
            rows="3"
            hide-details
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="removeComment">Удалить</v-btn>
          <v-btn variant="text" @click="commentDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" @click="applyComment">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import html2canvas from 'html2canvas'
import ZoneView from './ZoneView.vue'

const props = defineProps({
  greenZone: {
    type: Object,
    default: () => ({ sections: [] }),
  },
  blueZone: {
    type: Object,
    default: () => ({ sections: [] }),
  },
  statusColors: {
    type: Object,
    default: () => ({}),
  },
  themeMode: {
    type: String,
    default: 'dark',
  },
  dimUncommented: {
    type: Boolean,
    default: false,
  },
  preparedCommentsText: {
    type: String,
    default: '',
  },
  cardComments: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits([
  'update:themeMode',
  'update:dimUncommented',
  'update:preparedCommentsText',
  'set-card-comment',
  'remove-card-comment',
])

const dashboardRef = ref(null)
const exporting = ref(false)
const commentDialog = ref(false)
const selectedCardId = ref('')
const selectedCardTitle = ref('')
const selectedPreset = ref('')
const commentDraft = ref('')

const themeModeProxy = computed({
  get: () => props.themeMode,
  set: (value) => emit('update:themeMode', value),
})

const dimUncommentedProxy = computed({
  get: () => props.dimUncommented,
  set: (value) => emit('update:dimUncommented', value),
})

const preparedCommentsTextProxy = computed({
  get: () => props.preparedCommentsText,
  set: (value) => emit('update:preparedCommentsText', value),
})

const preparedCommentsList = computed(() =>
  props.preparedCommentsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
)

watch(selectedPreset, (value) => {
  if (value) {
    commentDraft.value = value
  }
})

const openCommentEditor = (card) => {
  selectedCardId.value = card.id
  selectedCardTitle.value = card.name || 'Без названия'
  commentDraft.value = props.cardComments?.[card.id] || ''
  selectedPreset.value = preparedCommentsList.value.includes(commentDraft.value)
    ? commentDraft.value
    : ''
  commentDialog.value = true
}

const applyComment = () => {
  if (!selectedCardId.value) return
  const value = commentDraft.value.trim()
  if (value) {
    emit('set-card-comment', { cardId: selectedCardId.value, comment: value })
  } else {
    emit('remove-card-comment', selectedCardId.value)
  }
  commentDialog.value = false
}

const removeComment = () => {
  if (selectedCardId.value) {
    emit('remove-card-comment', selectedCardId.value)
  }
  commentDialog.value = false
}

const exportImage = async () => {
  if (!dashboardRef.value) return

  exporting.value = true
  console.log('[Dashboard] PNG export started')
  try {
    const canvas = await html2canvas(dashboardRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: props.themeMode === 'light' ? '#f8fafc' : '#0e0f14',
    })
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = 'dashboard-visualization.png'
    link.click()
    console.log('[Dashboard] PNG export finished')
  } catch (error) {
    console.error('[Dashboard] PNG export failed:', error)
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.dashboard-export-block {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.theme-dark {
  background: linear-gradient(135deg, rgba(94, 234, 212, 0.06), rgba(56, 189, 248, 0.06));
}

.theme-light {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(226, 232, 240, 0.96));
  border-color: rgba(148, 163, 184, 0.35);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
</style>
