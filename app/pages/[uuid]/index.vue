<script setup lang="ts">
definePageMeta({
  middleware: 'game-auth',
  layout: 'game'
})

const route = useRoute()
const uuid = route.params.uuid as string
</script>

<template>
  <div class="grid gap-4">
    <UButton
      :to="`/${uuid}/mommy`"
      :label="$t('hub.imMommy')"
      icon="i-lucide-heart"
      size="xl"
      block
      variant="soft"
    />

    <UButton
      :to="`/${uuid}/daddy`"
      :label="$t('hub.imDaddy')"
      icon="i-lucide-star"
      size="xl"
      block
      variant="soft"
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
  </div>
</template>
