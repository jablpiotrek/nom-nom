<script setup lang="ts">
defineProps<{
  gameId: string
}>()
</script>

<template>
  <div class="w-full flex justify-center pt-6">
    <UButton
      :to="`/${gameId}`"
      :label="$t('game.backToGame')"
      icon="i-lucide-arrow-left"
      variant="outline"
      color="neutral"
    />
  </div>
</template>
