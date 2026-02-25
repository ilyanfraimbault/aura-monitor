<script setup lang="ts">
import type { AuraMember } from '~/types'

const toast = useToast()
const { data: members, status, refresh } = await useFetch<AuraMember[]>('/api/members', { default: () => [] })

const q = ref('')
const isSubmitting = ref(false)
const isEditModalOpen = ref(false)

const createForm = reactive({
  name: '',
  startingAura: 100
})

const editForm = reactive({
  id: '',
  name: '',
  startingAura: 100
})

const isLoading = computed(() => status.value === 'pending' || isSubmitting.value)

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const maybeError = error as { data?: { statusMessage?: string }, message?: string }
    return maybeError.data?.statusMessage ?? maybeError.message ?? fallback
  }

  return fallback
}

const filteredMembers = computed(() => {
  const list = members.value ?? []

  if (!q.value.trim()) {
    return list
  }

  return list.filter(member => member.name.toLowerCase().includes(q.value.toLowerCase()))
})

async function createNewMember() {
  if (!createForm.name.trim()) {
    return
  }

  const parsedStartingAura = Number(createForm.startingAura)

  isSubmitting.value = true
  try {
    await $fetch('/api/members', {
      method: 'POST',
      body: {
        name: createForm.name.trim(),
        startingAura: Number.isNaN(parsedStartingAura) ? 100 : parsedStartingAura
      }
    })

    createForm.name = ''
    createForm.startingAura = 100
    await refresh()

    toast.add({
      title: 'Membre ajoute',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Erreur',
      description: getApiErrorMessage(error, 'Impossible d ajouter ce membre.'),
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

function openEditModal(member: AuraMember) {
  editForm.id = member.id
  editForm.name = member.name
  editForm.startingAura = member.startingAura
  isEditModalOpen.value = true
}

async function saveMemberEdition() {
  if (!editForm.id || !editForm.name.trim()) {
    return
  }

  const parsedStartingAura = Number(editForm.startingAura)

  isSubmitting.value = true
  try {
    await $fetch(`/api/members/${editForm.id}`, {
      method: 'PATCH',
      body: {
        name: editForm.name.trim(),
        startingAura: Number.isNaN(parsedStartingAura) ? 100 : parsedStartingAura
      }
    })

    isEditModalOpen.value = false
    await refresh()

    toast.add({
      title: 'Membre modifie',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Erreur',
      description: getApiErrorMessage(error, 'Impossible de modifier ce membre.'),
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function deleteExistingMember(member: AuraMember) {
  if (!confirm(`Supprimer ${member.name} ? Cette action supprimera aussi son historique d aura.`)) {
    return
  }

  isSubmitting.value = true
  try {
    await $fetch(`/api/members/${member.id}`, {
      method: 'DELETE'
    })

    await refresh()

    toast.add({
      title: 'Membre supprime',
      color: 'success'
    })
  } catch (error: unknown) {
    toast.add({
      title: 'Erreur',
      description: getApiErrorMessage(error, 'Impossible de supprimer ce membre.'),
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <UPageCard
      title="Members"
      description="Gerer les membres suivis dans Aura Monitor."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="w-full lg:ms-auto lg:max-w-xl grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2">
        <UInput
          v-model="createForm.name"
          placeholder="Nom du membre"
          :disabled="isLoading"
          @keydown.enter="createNewMember"
        />
        <UInput
          v-model.number="createForm.startingAura"
          type="number"
          placeholder="Aura de depart"
          :disabled="isLoading"
          @keydown.enter="createNewMember"
        />
        <UButton
          label="Ajouter"
          icon="i-lucide-user-plus"
          color="neutral"
          :loading="isSubmitting"
          :disabled="!createForm.name.trim()"
          @click="createNewMember"
        />
      </div>
    </UPageCard>

    <UPageCard variant="subtle" :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }">
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Search members"
          autofocus
          class="w-full"
        />
      </template>

      <SettingsMembersList
        :members="filteredMembers"
        :is-loading="isLoading"
        @edit="openEditModal"
        @delete="deleteExistingMember"
      />
    </UPageCard>

    <UModal v-model:open="isEditModalOpen" title="Modifier un membre">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nom">
            <UInput v-model="editForm.name" />
          </UFormField>

          <UFormField label="Aura de depart">
            <UInput v-model.number="editForm.startingAura" type="number" />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-end gap-2">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="isEditModalOpen = false"
          />
          <UButton
            label="Enregistrer"
            color="primary"
            :loading="isSubmitting"
            :disabled="!editForm.name.trim()"
            @click="saveMemberEdition"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
