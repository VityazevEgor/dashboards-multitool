<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 2</div>
    <div class="text-h5 font-weight-bold mb-2">Выберите листы</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Укажите, где находятся данные по зеленой и синей зоне.
    </div>

    <v-row>
      <v-col cols="12" md="6">
        <v-select
          :items="sheetNames"
          label="Лист с зеленой зоной"
          variant="outlined"
          color="primary"
          :model-value="greenSheet"
          @update:model-value="updateGreen"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-select
          :items="sheetNames"
          label="Лист с синей зоной"
          variant="outlined"
          color="primary"
          :model-value="blueSheet"
          @update:model-value="updateBlue"
        />
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="greenStatusColumnOptions"
          label="Столбец статуса (зеленая зона)"
          variant="outlined"
          color="primary"
          :model-value="greenStatusColumn"
          :disabled="!greenStatusColumnOptions.length"
          clearable
          hint="Можно искать по названию столбца"
          persistent-hint
          @update:model-value="updateGreenStatusColumn"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="blueStatusColumnOptions"
          label="Столбец статуса (синяя зона)"
          variant="outlined"
          color="primary"
          :model-value="blueStatusColumn"
          :disabled="!blueStatusColumnOptions.length"
          clearable
          hint="Можно искать по названию столбца"
          persistent-hint
          @update:model-value="updateBlueStatusColumn"
        />
      </v-col>
    </v-row>

    <v-row class="mt-1">
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="greenValueColumnOptions"
          label="Столбец значений (зеленая зона)"
          variant="outlined"
          color="primary"
          :model-value="greenValueColumn"
          :disabled="!greenValueColumnOptions.length"
          clearable
          hint="Выберите столбец с числами для визуализации"
          persistent-hint
          @update:model-value="updateGreenValueColumn"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="blueValueColumnOptions"
          label="Столбец значений (синяя зона)"
          variant="outlined"
          color="primary"
          :model-value="blueValueColumn"
          :disabled="!blueValueColumnOptions.length"
          clearable
          hint="Выберите столбец с числами для визуализации"
          persistent-hint
          @update:model-value="updateBlueValueColumn"
        />
      </v-col>
    </v-row>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </v-alert>
  </v-card>
</template>

<script setup>
const props = defineProps({
  sheetNames: {
    type: Array,
    default: () => [],
  },
  greenSheet: {
    type: String,
    default: '',
  },
  blueSheet: {
    type: String,
    default: '',
  },
  greenStatusColumnOptions: {
    type: Array,
    default: () => [],
  },
  blueStatusColumnOptions: {
    type: Array,
    default: () => [],
  },
  greenStatusColumn: {
    type: String,
    default: '',
  },
  blueStatusColumn: {
    type: String,
    default: '',
  },
  greenValueColumnOptions: {
    type: Array,
    default: () => [],
  },
  blueValueColumnOptions: {
    type: Array,
    default: () => [],
  },
  greenValueColumn: {
    type: String,
    default: '',
  },
  blueValueColumn: {
    type: String,
    default: '',
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:greenSheet',
  'update:blueSheet',
  'update:greenStatusColumn',
  'update:blueStatusColumn',
  'update:greenValueColumn',
  'update:blueValueColumn',
])

const updateGreen = (value) => emit('update:greenSheet', value)
const updateBlue = (value) => emit('update:blueSheet', value)
const updateGreenStatusColumn = (value) => emit('update:greenStatusColumn', value)
const updateBlueStatusColumn = (value) => emit('update:blueStatusColumn', value)
const updateGreenValueColumn = (value) => emit('update:greenValueColumn', value)
const updateBlueValueColumn = (value) => emit('update:blueValueColumn', value)
</script>
