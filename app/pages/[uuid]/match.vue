<script setup lang="ts">
definePageMeta({
  middleware: 'game-auth',
  layout: 'game'
})

const route = useRoute()
const uuid = route.params.uuid as string

const { data, status } = await useFetch(`/api/games/${uuid}/matches`)
</script>

<template>
  <div class="space-y-8">
    <div
      v-if="status === 'pending'"
      class="flex justify-center"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="data?.matches?.length"
      class="space-y-3"
    >
      <UCard
        v-for="m in data.matches"
        :key="m.nameId"
        class="text-center"
      >
        <div class="flex items-center justify-center gap-3">
          <UIcon
            name="i-lucide-heart"
            class="w-5 h-5 text-primary"
          />
          <span class="text-2xl font-semibold">{{ m.name }}</span>
          <UIcon
            name="i-lucide-heart"
            class="w-5 h-5 text-primary"
          />
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="text-center space-y-4"
    >
      <UIcon
        name="i-lucide-heart-off"
        class="w-12 h-12 text-muted mx-auto"
      />
      <p class="text-muted">
        {{ $t("match.empty") }}
      </p>
    </div>

    <GameBackButton :game-id="uuid" />
  </div>
</template>
