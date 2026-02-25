<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <UButton
    icon="i-lucide-sparkles"
    color="neutral"
    variant="ghost"
    block
    :square="collapsed"
    :label="collapsed ? undefined : 'Aura Monitor'"
    class="justify-start"
  />
</template>
