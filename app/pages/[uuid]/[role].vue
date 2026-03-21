<script setup lang="ts">
definePageMeta({
  middleware: 'game-auth',
  layout: 'game',
  validate(route) {
    return ['mommy', 'daddy'].includes(route.params.role as string)
  }
})

const route = useRoute()
const uuid = route.params.uuid as string
const role = computed(() => route.params.role as 'mommy' | 'daddy')
</script>

<template>
  <div class="space-y-6">
    <SwipeCard
      :game-id="uuid"
      :parent="role"
    />
    <GameBackButton :game-id="uuid" />
  </div>
</template>
