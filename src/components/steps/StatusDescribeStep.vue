<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 3</div>
    <div class="text-h5 font-weight-bold mb-2">Описание статусов</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Для каждого найденного статуса можно указать комментарий. Это опционально.
    </div>

    <v-row>
      <v-col
        v-for="status in statuses"
        :key="status"
        cols="12"
        md="6"
      >
        <v-text-field
          :label="status"
          variant="outlined"
          color="primary"
          :model-value="descriptions[status]"
          @update:model-value="(value) => updateDescription(status, value)"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
const props = defineProps({
  statuses: {
    type: Array,
    default: () => [],
  },
  descriptions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:description'])

const updateDescription = (status, value) => {
  emit('update:description', { status, value })
}
</script>
