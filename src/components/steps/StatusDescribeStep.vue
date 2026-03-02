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
        <div class="d-flex align-start ga-3">
          <v-text-field
            class="flex-grow-1"
            :label="status"
            variant="outlined"
            color="primary"
            :model-value="descriptions[status]"
            @update:model-value="(value) => updateDescription(status, value)"
          />
          <div class="color-field">
            <label class="color-label">Цвет</label>
            <input
              class="color-input"
              type="color"
              :value="colors[status] || '#10b981'"
              @input="(event) => updateColor(status, event.target.value)"
            />
          </div>
        </div>
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
  colors: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['update:description', 'update:color'])

const updateDescription = (status, value) => {
  emit('update:description', { status, value })
}

const updateColor = (status, value) => {
  emit('update:color', { status, value })
}
</script>

<style scoped>
.color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 64px;
}

.color-label {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}

.color-input {
  width: 48px;
  height: 48px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}
</style>
