<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 1</div>
    <div class="text-h5 font-weight-bold mb-2">Загрузите Excel</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Поддерживаются файлы .xlsx и .xls.
    </div>
    <v-file-input
      v-model="localFile"
      label="Выберите Excel файл"
      accept=".xlsx,.xls"
      prepend-icon="mdi-file-excel"
      variant="outlined"
      color="primary"
      @update:model-value="emitFile"
    />
  </v-card>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-selected'])
const localFile = ref(null)

const emitFile = (file) => {
  emit('file-selected', file)
}
</script>
