<template>
  <v-card :class="['pa-4 zone-card', `theme-${themeMode}`]" elevation="0">
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
          <v-card
            :class="['pa-3 metric-card w-100', `theme-${themeMode}`, card.problem ? 'problem-card' : 'ok-card']"
            :style="cardStyle(card.status)"
            elevation="0"
          >
            <div class="text-subtitle-2 font-weight-bold mb-2">{{ card.name }}</div>
            <template v-if="card.values.length">
              <div class="metric-main-line mb-2">
                <div class="text-h5 font-weight-black">{{ card.mainValue || '-' }}</div>
                <div class="status-text" :style="statusStyle(card.status)">
                  {{ card.status || 'Без статуса' }}
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-h5 font-weight-black mb-1">{{ card.mainValue || '-' }}</div>
              <div class="status-text status-under-number mb-2" :style="statusStyle(card.status)">
                {{ card.status || 'Без статуса' }}
              </div>
            </template>

            <div v-if="card.values.length" class="d-flex flex-column ga-1">
              <div
                v-for="(valueItem, valueIndex) in card.values"
                :key="`${title}-${sectionIndex}-${cardIndex}-${valueIndex}`"
                class="value-line"
              >
                <span class="value-name">{{ valueItem.name }}</span>
                <span class="value-number">{{ valueItem.value || '-' }}</span>
                <span class="status-text" :style="statusStyle(valueItem.status)">
                  {{ valueItem.status || 'Без статуса' }}
                </span>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-card>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  zoneData: {
    type: Object,
    default: () => ({ sections: [] }),
  },
  themeMode: {
    type: String,
    default: 'dark',
  },
  statusColors: {
    type: Object,
    default: () => ({}),
  },
})

const statusStyle = (status) => {
  const color = props.statusColors?.[status]
  return color ? { color } : null
}

const cardStyle = (status) => {
  const color = props.statusColors?.[status]
  return color ? { borderColor: color } : null
}
</script>

<style scoped>
.zone-card.theme-dark {
  background: rgba(30, 34, 48, 0.7);
  color: rgba(226, 232, 240, 0.96);
}

.zone-card.theme-light {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98));
  color: #0f172a;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.section-title {
  color: rgba(226, 232, 240, 0.95);
}

.theme-light .section-title {
  color: #0f172a;
}

.metric-card {
  height: 100%;
  border: 1px solid transparent;
}

.metric-card.theme-dark {
  background: rgba(15, 23, 42, 0.5);
}

.metric-card.theme-light {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.ok-card {
  border-color: rgba(16, 185, 129, 0.35);
}

.problem-card {
  border-color: rgba(248, 113, 113, 0.45);
}

.value-line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 72px);
  gap: 2px;
  align-items: center;
  font-size: 12px;
}

.value-name {
  color: rgba(226, 232, 240, 0.8);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-card.theme-light .text-subtitle-2,
.metric-card.theme-light .text-h5,
.metric-card.theme-light .value-number {
  color: #0f172a;
}

.theme-light .value-name {
  color: #334155;
}

.value-number {
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
  min-width: 64px;
}

.metric-main-line {
  display: grid;
  grid-template-columns: auto minmax(0, 140px);
  gap: 10px;
  align-items: baseline;
}

.status-text {
  font-size: 12px;
  font-weight: 700;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 72px;
}

.status-text.status-under-number {
  display: block;
  text-align: left;
  max-width: none;
  white-space: normal;
  min-width: auto;
  overflow: visible;
  text-overflow: unset;
}

.status-ok {
  color: #10b981;
}

.status-problem {
  color: #ef4444;
}

.metric-card.theme-light.ok-card {
  border-color: rgba(16, 185, 129, 0.45);
}

.metric-card.theme-light.problem-card {
  border-color: rgba(239, 68, 68, 0.5);
}
</style>
