<script setup lang="ts">
import { format } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { AuraTimeline } from '~/types'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  timeline: AuraTimeline
  isLoading?: boolean
}>()

type DataRecord = {
  date: Date
  values: Record<string, number>
}

const { width } = useElementSize(cardRef)

const memberPalette = ['#2563eb', '#dc2626', '#16a34a', '#ea580c', '#9333ea', '#0891b2', '#db2777', '#0d9488']

const membersWithColors = computed(() => {
  return props.timeline.members.map((member, index) => ({
    ...member,
    color: memberPalette[index % memberPalette.length]!
  }))
})

const data = computed<DataRecord[]>(() => {
  return props.timeline.points.map((point) => {
    return {
      date: new Date(point.date),
      values: point.values
    }
  })
})

const x = (_: DataRecord, i: number) => i
const memberY = (memberId: string) => (d: DataRecord) => d.values[memberId] ?? 0

const formatNumber = new Intl.NumberFormat('fr-FR').format
const yTicks = (value: number) => formatNumber(Math.round(value))

const currentValues = computed<Record<string, number>>(() => {
  if (!props.timeline.points.length) {
    return {}
  }

  return props.timeline.points[props.timeline.points.length - 1]!.values
})

const formatDate = (date: Date): string => format(date, 'd MMM')

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i] || i % 2 !== 0) {
    return ''
  }

  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => {
  const memberValues = membersWithColors.value
    .map(member => `${member.name}: ${formatNumber(d.values[member.id] ?? 0)}`)
    .join(' | ')

  return `${formatDate(d.date)} - ${memberValues}`
}
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <p class="text-xs text-muted uppercase mb-2">
        Evolution journaliere de tous les membres
      </p>

      <div class="flex flex-wrap gap-2">
        <div
          v-for="member in membersWithColors"
          :key="member.id"
          class="inline-flex items-center gap-2 rounded-md border border-default px-2 py-1 text-xs"
        >
          <span class="size-2 rounded-full" :style="{ backgroundColor: member.color }" />
          <span class="text-highlighted">{{ member.name }}</span>
          <span class="text-muted">{{ formatNumber(currentValues[member.id] ?? 0) }}</span>
        </div>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        v-for="member in membersWithColors"
        :key="member.id"
        :x="x"
        :y="memberY(member.id)"
        :color="member.color"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisAxis
        type="y"
        :tick-format="yTicks"
      />

      <VisCrosshair
        color="var(--ui-text-muted)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>

    <div v-if="!timeline.points.length && !isLoading" class="px-6 pb-3 text-sm text-muted">
      Aucun evenement dans cette periode.
    </div>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
