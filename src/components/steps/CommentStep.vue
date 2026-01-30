<template>
  <v-card class="pa-6" color="surface" elevation="6">
    <div class="text-overline text-primary mb-2">Шаг 5</div>
    <div class="text-h5 font-weight-bold mb-2">Общий комментарий</div>
    <div class="text-body-2 text-medium-emphasis mb-4">
      Этот текст будет добавлен в финальный документ.
    </div>

    <v-textarea
      label="Комментарий"
      variant="outlined"
      color="primary"
      rows="4"
      :model-value="comment"
      @update:model-value="updateComment"
    />
  </v-card>
</template>

<script setup>
const props = defineProps({
  comment: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:comment'])

const updateComment = (value) => emit('update:comment', value)
</script>
