<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const deckLoading = useSwipeDeckLoading()

watch(
  () => route.params.role,
  (role) => {
    if (role === 'mommy' || role === 'daddy') {
      deckLoading.value = true
    } else {
      deckLoading.value = false
    }
  },
  { immediate: true }
)

const gameId = computed(() => String(route.params.uuid ?? ''))

const sub = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts[1] ?? ''
})

const header = computed(() => {
  const s = sub.value

  if (s === 'match') {
    return {
      title: t('layout.game.matchesTitle'),
      subtitle: t('layout.game.matchesSubtitle')
    }
  }
  if (s === 'auth') {
    return {
      title: t('layout.game.authTitle'),
      subtitle: t('layout.game.authSubtitle')
    }
  }
  if (s === 'mommy') {
    return {
      title: t('layout.game.mommyTitle'),
      subtitle: deckLoading.value ? undefined : t('layout.game.swipeSubtitle')
    }
  }
  if (s === 'daddy') {
    return {
      title: t('layout.game.daddyTitle'),
      subtitle: deckLoading.value ? undefined : t('layout.game.swipeSubtitle')
    }
  }

  return {
    title: t('layout.game.hubTitle'),
    subtitle: t('layout.game.hubSubtitle')
  }
})
</script>

<template>
  <div class="max-w-md mx-auto space-y-8">
    <GameViewHeader
      v-if="gameId"
      :game-id="gameId"
      :title="header.title"
      :subtitle="header.subtitle"
    />
    <slot />
  </div>
</template>
