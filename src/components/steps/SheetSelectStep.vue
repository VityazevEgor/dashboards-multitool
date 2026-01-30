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
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:greenSheet', 'update:blueSheet'])

const updateGreen = (value) => emit('update:greenSheet', value)
const updateBlue = (value) => emit('update:blueSheet', value)
</script>
