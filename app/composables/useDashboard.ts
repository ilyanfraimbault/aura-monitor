import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()
  const isNotificationsSlideoverOpen = ref(false)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-m': () => router.push('/settings/members'),
    'g-s': () => router.push('/settings')
  })

  return {
    isNotificationsSlideoverOpen
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
