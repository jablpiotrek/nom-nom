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

const { setResumeGameAndRole } = useGameResume()

onMounted(() => {
  setResumeGameAndRole(uuid, role.value)
})
</script>

<template>
  <div>
    <SwipeCard
      :game-id="uuid"
      :parent="role"
    />
    <GameBackButton :game-id="uuid" />
  </div>
</template>
