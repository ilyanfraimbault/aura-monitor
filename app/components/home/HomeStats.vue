<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AuraMember, CreateAuraEventPayload } from '~/types'

const props = defineProps<{
  members: AuraMember[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'adjust-aura', payload: CreateAuraEventPayload): void
}>()

const isModalOpen = ref(false)
const reason = ref('')
const delta = ref(10)
const selectedMemberId = ref('')

const presetActions = [{
  label: 'Action ridicule',
  reason: 'Action ridicule en public',
  delta: -300
}, {
  label: 'Malaise social',
  reason: 'Malaise social devant temoins',
  delta: -120
}, {
  label: 'Geste heroique',
  reason: 'Action heroique remarquee',
  delta: 180
}, {
  label: 'Aide majeure',
  reason: 'Aide majeure apportee a un membre',
  delta: 90
}]

const selectedMember = computed(() => {
  return props.members.find(member => member.id === selectedMemberId.value)
})

const maxAuraValue = computed(() => {
  const maxCurrentAura = Math.max(...props.members.map(member => member.currentAura), 100)
  return Math.max(200, maxCurrentAura + 50)
})

function auraGaugeValue(aura: number): number {
  return Math.max(0, Math.min(100, Math.round((aura / maxAuraValue.value) * 100)))
}

function formatDailyDelta(value: number): string {
  if (value > 0) {
    return `+${value}`
  }

  if (value < 0) {
    return `${value}`
  }

  return '0'
}

function dailyDeltaColor(value: number): 'success' | 'error' | 'neutral' {
  if (value > 0) {
    return 'success'
  }

  if (value < 0) {
    return 'error'
  }

  return 'neutral'
}

function openModal(memberId: string, defaultDelta: number) {
  selectedMemberId.value = memberId
  delta.value = defaultDelta
  reason.value = ''
  isModalOpen.value = true
}

function applyPresetAction(memberId: string, action: { delta: number, reason: string }) {
  emit('adjust-aura', {
    memberId,
    delta: action.delta,
    reason: action.reason
  })
}

function getPresetItems(memberId: string): DropdownMenuItem[][] {
  return [presetActions.map(action => ({
    label: `${action.label} (${action.delta > 0 ? '+' : ''}${action.delta})`,
    color: action.delta > 0 ? 'success' : 'error',
    icon: action.delta > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down',
    onSelect: () => applyPresetAction(memberId, action)
  }))]
}

function submitAdjustment() {
  if (!selectedMemberId.value || !reason.value.trim() || delta.value === 0) {
    return
  }

  emit('adjust-aura', {
    memberId: selectedMemberId.value,
    delta: delta.value,
    reason: reason.value.trim()
  })

  isModalOpen.value = false
}
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6">
    <UPageCard
      v-for="member in members"
      :key="member.id"
      icon="i-lucide-flame"
      :title="member.name"
      variant="subtle"
      :ui="{
        container: 'gap-y-3',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
        title: 'font-normal text-muted text-xs uppercase'
      }"
    >
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm text-muted">
            Score du jour
          </span>
          <UBadge :color="dailyDeltaColor(member.deltaToday)" variant="subtle" class="text-xs">
            {{ formatDailyDelta(member.deltaToday) }} aujourd hui
          </UBadge>
        </div>

        <span class="text-sm text-muted">
          Aura actuelle
        </span>

        <span class="text-2xl font-semibold text-highlighted">
          {{ member.currentAura }}
        </span>

        <UProgress :model-value="auraGaugeValue(member.currentAura)" />

        <div class="flex items-center gap-2">
          <UButton
            color="error"
            variant="soft"
            size="xs"
            icon="i-lucide-minus"
            label="-10"
            :disabled="isLoading"
            @click="openModal(member.id, -10)"
          />
          <UButton
            color="success"
            variant="soft"
            size="xs"
            icon="i-lucide-plus"
            label="+10"
            :disabled="isLoading"
            @click="openModal(member.id, 10)"
          />
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            label="Ajuster"
            :disabled="isLoading"
            @click="openModal(member.id, member.deltaToday >= 0 ? -5 : 5)"
          />
          <UDropdownMenu :items="getPresetItems(member.id)" :content="{ align: 'end' }">
            <UButton
              color="neutral"
              variant="soft"
              size="xs"
              icon="i-lucide-zap"
              label="Actions"
              :disabled="isLoading"
            />
          </UDropdownMenu>
        </div>
      </div>
    </UPageCard>

    <UPageCard
      v-if="!members.length"
      title="Aucun membre"
      description="Ajoutez un membre depuis Settings > Members."
    >
      <p class="text-sm text-muted">
        Les jauges apparaitront ici une fois la liste des membres creee.
      </p>
    </UPageCard>
  </UPageGrid>

  <UModal v-model:open="isModalOpen" title="Ajuster l'aura">
    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Membre: <span class="text-highlighted font-medium">{{ selectedMember?.name ?? '-' }}</span>
        </p>

        <UFormField label="Variation d aura">
          <UInput
            v-model.number="delta"
            type="number"
            placeholder="Ex: -10 ou +20"
          />
        </UFormField>

        <UFormField label="Raison">
          <UTextarea
            v-model="reason"
            :rows="3"
            placeholder="Ex: Moment heroique pendant la reunion"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          label="Annuler"
          @click="isModalOpen = false"
        />
        <UButton
          color="primary"
          label="Appliquer"
          :disabled="!reason.trim() || !selectedMemberId || delta === 0"
          @click="submitAdjustment"
        />
      </div>
    </template>
  </UModal>
</template>
