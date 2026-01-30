<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 4</div>
    <div class="text-h5 font-weight-bold mb-2">Выберите готовые статусы</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Отметьте статусы, которые означают, что метрика считается готовой.
    </div>

    <v-select
      :items="statuses"
      label="Готовые статусы"
      variant="outlined"
      color="primary"
      multiple
      chips
      :model-value="readyStatuses"
      @update:model-value="updateReady"
    />
  </v-card>
</template>

<script setup>
const props = defineProps({
  statuses: {
    type: Array,
    default: () => [],
  },
  readyStatuses: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:readyStatuses'])

const updateReady = (value) => emit('update:readyStatuses', value)
</script>
