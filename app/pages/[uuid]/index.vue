<script setup lang="ts">
import type { GameRole } from '~/utils/gameResume'

definePageMeta({
  middleware: 'game-auth',
  layout: 'game'
})

const route = useRoute()
const router = useRouter()
const uuid = route.params.uuid as string

const {
  setResumeRole,
  clearResume,
  clearAuthCookie,
  syncResumeGameIdIfChanged
} = useGameResume()

const quitModalOpen = ref(false)

onMounted(() => {
  syncResumeGameIdIfChanged(uuid)
})

async function goToRole(role: GameRole) {
  setResumeRole(role)
  await router.push(`/${uuid}/${role}`)
}

async function confirmQuitGame() {
  clearResume()
  clearAuthCookie(uuid)
  quitModalOpen.value = false
  await router.push('/')
}
</script>

<template>
  <div class="grid gap-4">
    <UButton
      :label="$t('hub.imMommy')"
      icon="i-lucide-heart"
      size="xl"
      block
      variant="soft"
      @click="goToRole('mommy')"
    />

    <UButton
      :label="$t('hub.imDaddy')"
      icon="i-lucide-star"
      size="xl"
      block
      variant="soft"
      @click="goToRole('daddy')"
    />

    <USeparator :label="$t('hub.or')" />

    <UButton
      :to="`/${uuid}/match`"
      :label="$t('hub.viewMatches')"
      icon="i-lucide-sparkles"
      size="xl"
      block
      color="neutral"
      variant="outline"
    />

    <UButton
      :label="$t('hub.quitGame')"
      icon="i-lucide-log-out"
      size="lg"
      block
      color="neutral"
      variant="ghost"
      @click="quitModalOpen = true"
    />

    <UModal
      v-model:open="quitModalOpen"
      :title="$t('hub.quitModalTitle')"
      :description="$t('hub.quitModalDescription')"
    >
      <template #footer>
        <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <UButton
            :label="$t('hub.quitModalCancel')"
            color="neutral"
            variant="outline"
            class="w-full justify-center sm:w-auto sm:min-w-24"
            @click="quitModalOpen = false"
          />
          <UButton
            :label="$t('hub.quitModalConfirm')"
            color="error"
            class="w-full justify-center sm:w-auto sm:min-w-24"
            @click="confirmQuitGame"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
