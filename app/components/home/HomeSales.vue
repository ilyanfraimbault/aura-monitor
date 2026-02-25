<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { AuraEvent } from '~/types'

defineProps<{
  events: AuraEvent[]
  isLoading?: boolean
}>()

const UBadge = resolveComponent('UBadge')
const columns: TableColumn<AuraEvent>[] = [
  {
    accessorKey: 'occurredAt',
    header: 'Date',
    cell: ({ row }) => {
      return new Date(row.getValue('occurredAt')).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  },
  {
    accessorKey: 'memberName',
    header: 'Membre'
  },
  {
    accessorKey: 'reason',
    header: 'Interaction'
  },
  {
    accessorKey: 'delta',
    header: 'Variation',
    cell: ({ row }) => {
      const value = Number(row.getValue('delta'))

      return h(UBadge, { variant: 'subtle', color: value >= 0 ? 'success' : 'error' }, () =>
        `${value >= 0 ? '+' : ''}${value}`
      )
    }
  }
]
</script>

<template>
  <UPageCard
    title="Historique recent"
    description="Dernieres actions qui ont modifie l'aura des membres."
    variant="naked"
  />

  <UTable
    :data="events"
    :columns="columns"
    class="shrink-0"
    :ui="{
      base: 'table-fixed border-separate border-spacing-0',
      thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      th: 'first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
      td: 'border-b border-default'
    }"
  />
</template>
