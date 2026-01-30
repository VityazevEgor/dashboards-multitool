<template>
  <v-row class="mb-6" justify="center">
    <v-col cols="12" md="10" lg="8">
      <v-card class="pa-6" color="surface" elevation="6">
        <div class="text-overline text-primary mb-2">Выбор утилиты</div>
        <div class="text-h4 font-weight-bold mb-4">
          Что вы хотите сделать?
        </div>
        <div class="text-body-1 text-medium-emphasis mb-8">
          Выберите инструмент для работы с дашбордами.
        </div>

        <v-row>
          <v-col cols="12" md="6">
            <v-card class="pa-4" variant="tonal" color="primary">
              <div class="text-h6 font-weight-bold mb-2">
                Генерация статуса дашборда
              </div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Загрузите Excel, опишите статусы и получите готовый DOCX отчёт.
              </div>
              <v-btn color="primary" variant="flat" @click="select('status')">
                Перейти
              </v-btn>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card class="pa-4" variant="tonal" color="secondary">
              <div class="text-h6 font-weight-bold mb-2">
                Парсинг значений дашборда
              </div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Вставьте HTML код и получите Excel таблицу с метриками.
              </div>
              <v-btn color="secondary" variant="flat" @click="select('parser')">
                Перейти
              </v-btn>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
const emit = defineEmits(['select'])

const select = (utility) => {
  emit('select', utility)
}
</script>
