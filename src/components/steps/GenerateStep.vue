<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 6</div>
    <div class="text-h5 font-weight-bold mb-2">Создание отчета</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Проверьте расчет готовности и создайте DOCX документ.
    </div>

    <v-alert type="info" variant="tonal" class="mb-4">
      Готовность: <strong>{{ readinessPercent }}%</strong>
      (готово {{ readyCount }} из {{ totalCount }})
    </v-alert>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4" color="surface-variant">
          <div class="text-subtitle-1 font-weight-bold mb-2">Синяя зона</div>
          <div class="text-body-2 text-medium-emphasis">Статусы: {{ blueStatuses }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-4" color="surface-variant">
          <div class="text-subtitle-1 font-weight-bold mb-2">Зеленая зона</div>
          <div class="text-body-2 text-medium-emphasis">Статусы: {{ greenStatuses }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-btn
      color="primary"
      size="large"
      class="mt-6"
      :loading="loading"
      @click="generate"
    >
      Создать отчет по статусу
    </v-btn>
  </v-card>
</template>

<script setup>
const props = defineProps({
  readinessPercent: {
    type: Number,
    default: 0,
  },
  readyCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  greenStatuses: {
    type: String,
    default: '',
  },
  blueStatuses: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['generate'])

const generate = () => emit('generate')
</script>
