<script setup lang="ts">
import type { AuraMember } from '~/types'

defineProps<{
  members: AuraMember[]
  isLoading?: boolean
}>()

defineEmits<{
  (e: 'edit' | 'delete', member: AuraMember): void
}>()

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
</script>

<template>
  <ul role="list" class="divide-y divide-default">
    <li v-for="member in members" :key="member.id" class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6">
      <div class="flex items-center gap-3 min-w-0">
        <UAvatar :alt="member.name" size="md" />

        <div class="text-sm min-w-0">
          <p class="text-highlighted font-medium truncate">
            {{ member.name }}
          </p>
          <p class="text-muted truncate">
            Aura: {{ member.currentAura }} | Base: {{ member.startingAura }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <UBadge :color="dailyDeltaColor(member.deltaToday)" variant="subtle">
          {{ formatDailyDelta(member.deltaToday) }} aujourd hui
        </UBadge>

        <UButton
          icon="i-lucide-pencil"
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="$emit('edit', member)"
        />

        <UButton
          icon="i-lucide-trash"
          color="error"
          variant="ghost"
          :disabled="isLoading"
          @click="$emit('delete', member)"
        />
      </div>
    </li>
  </ul>
</template>
