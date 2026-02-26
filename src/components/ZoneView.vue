<template>
  <v-card class="pa-4" color="surface-variant" elevation="0">
    <div class="text-h6 font-weight-bold mb-4">{{ title }}</div>

    <template v-for="(section, sectionIndex) in zoneData.sections" :key="`${title}-${sectionIndex}`">
      <div v-if="section.name" class="text-subtitle-1 font-weight-bold mb-2 mt-2 section-title">
        {{ section.name }}
      </div>

      <v-row>
        <v-col
          v-for="(card, cardIndex) in section.cards"
          :key="`${title}-${sectionIndex}-${cardIndex}`"
          class="d-flex"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card :class="['pa-3 metric-card w-100', card.problem ? 'problem-card' : 'ok-card']" elevation="0">
            <div class="text-subtitle-2 font-weight-bold mb-2">{{ card.name }}</div>
            <div class="text-h5 font-weight-black mb-2">{{ card.mainValue || '-' }}</div>
            <v-chip
              size="small"
              :color="card.problem ? 'error' : 'success'"
              variant="tonal"
              class="mb-2"
            >
              {{ card.status || 'Без статуса' }}
            </v-chip>

            <div v-if="card.values.length" class="d-flex flex-column ga-1">
              <div
                v-for="(valueItem, valueIndex) in card.values"
                :key="`${title}-${sectionIndex}-${cardIndex}-${valueIndex}`"
                class="value-line"
              >
                <span class="value-name">{{ valueItem.name }}</span>
                <span class="value-number">{{ valueItem.value || '-' }}</span>
                <v-icon
                  size="14"
                  :color="valueItem.problem ? 'error' : 'success'"
                  icon="mdi-circle"
                />
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  zoneData: {
    type: Object,
    default: () => ({ sections: [] }),
  },
})
</script>

<style scoped>
.section-title {
  color: rgba(226, 232, 240, 0.95);
}

.metric-card {
  height: 100%;
  border: 1px solid transparent;
  background: rgba(15, 23, 42, 0.5);
}

.ok-card {
  border-color: rgba(16, 185, 129, 0.35);
}

.problem-card {
  border-color: rgba(248, 113, 113, 0.45);
}

.value-line {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 6px;
  align-items: center;
  font-size: 12px;
}

.value-name {
  color: rgba(226, 232, 240, 0.8);
}

.value-number {
  font-weight: 700;
}
</style>
