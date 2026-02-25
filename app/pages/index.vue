<script setup lang="ts">
import { sub } from 'date-fns'
import type { AuraOverview, AuraTimeline, CreateAuraEventPayload, Range } from '~/types'

const toast = useToast()

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const rangeQuery = computed(() => ({
  start: range.value.start.toISOString(),
  end: range.value.end.toISOString()
}))

const { data: overview, status: overviewStatus, refresh: refreshOverview } = await useFetch<AuraOverview>('/api/aura/overview', {
  query: rangeQuery,
  default: () => ({
    members: [],
    recentEvents: [],
    teamAura: 0,
    teamDeltaToday: 0,
    rangeDelta: 0
  })
})

const { data: timeline, status: timelineStatus, refresh: refreshTimeline } = await useFetch<AuraTimeline>('/api/aura/timeline', {
  query: rangeQuery,
  default: () => ({
    members: [],
    points: []
  })
})

const emptyOverview: AuraOverview = {
  members: [],
  recentEvents: [],
  teamAura: 0,
  teamDeltaToday: 0,
  rangeDelta: 0
}

const emptyTimeline: AuraTimeline = {
  members: [],
  points: []
}

const safeOverview = computed(() => overview.value ?? emptyOverview)
const safeTimeline = computed(() => timeline.value ?? emptyTimeline)

const isLoading = computed(() => overviewStatus.value === 'pending' || timelineStatus.value === 'pending')

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybeError = error as { data?: { statusMessage?: string }, message?: string }
    return maybeError.data?.statusMessage ?? maybeError.message ?? fallback
  }

  return fallback
}

async function onAdjustAura(payload: CreateAuraEventPayload) {
  try {
    await $fetch('/api/aura/events', {
      method: 'POST',
      body: payload
    })

    await Promise.all([
      refreshOverview(),
      refreshTimeline()
    ])

    toast.add({
      title: 'Aura mise a jour',
      description: `${payload.delta > 0 ? '+' : ''}${payload.delta} aura applique a ${safeOverview.value.members.find(member => member.id === payload.memberId)?.name ?? 'ce membre'}.`,
      color: payload.delta > 0 ? 'success' : 'error'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Erreur',
      description: getApiErrorMessage(error, 'Impossible d enregistrer cet evenement.'),
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Aura Monitor" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <HomeDateRangePicker v-model="range" class="-ms-1" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <HomeStats
        :members="safeOverview.members"
        :is-loading="isLoading"
        @adjust-aura="onAdjustAura"
      />

      <HomeChart
        :timeline="safeTimeline"
        :is-loading="isLoading"
      />

      <HomeSales
        :events="safeOverview.recentEvents"
        :is-loading="isLoading"
      />
    </template>
  </UDashboardPanel>
</template>
