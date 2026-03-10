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
        <div class="d-flex align-start ga-3 status-row">
          <v-text-field
            class="flex-grow-1"
            :label="status"
            variant="outlined"
            color="primary"
            :model-value="descriptions[status]"
            @update:model-value="(value) => updateDescription(status, value)"
          />
          <v-menu location="bottom end" :close-on-content-click="false">
            <template #activator="{ props: menuProps }">
              <v-btn
                v-bind="menuProps"
                class="color-trigger"
                icon
                variant="tonal"
                :style="{ color: colors[status] || '#10b981' }"
              >
                <v-icon icon="mdi-palette" />
              </v-btn>
            </template>

            <v-card class="pa-2" width="320">
              <div class="text-caption text-medium-emphasis mb-2">
                Цвет для статуса: {{ status }}
              </div>
              <v-color-picker
                :model-value="colors[status] || '#10b981'"
                mode="hex"
                :modes="['hex']"
                hide-inputs
                show-swatches
                @update:model-value="(value) => updateColor(status, value)"
              />
            </v-card>
          </v-menu>
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
.status-row {
  min-height: 56px;
}

.color-trigger {
  margin-top: 6px;
}
</style>
