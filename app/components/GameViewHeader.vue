<script setup lang="ts">
const props = defineProps<{
  gameId: string
  title?: string
  subtitle?: string
}>()

const toast = useToast()
const { t } = useI18n()

async function copyId() {
  try {
    await navigator.clipboard.writeText(props.gameId)
    toast.add({
      title: t('header.copySuccessTitle'),
      description: t('header.copySuccessDescription'),
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch {
    toast.add({
      title: t('header.copyFailTitle'),
      description: t('header.copyFailDescription'),
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="text-center space-y-2">
    <div
      class="inline-flex items-center justify-center gap-2 rounded-lg border border-default/40 bg-muted/50 px-3 py-2 mx-auto"
    >
      <UIcon
        name="i-lucide-hash"
        class="w-4 h-4 text-muted shrink-0"
      />
      <span
        class="text-base font-mono font-bold tracking-widest tabular-nums sm:text-lg"
      >{{ gameId }}</span>
      <UButton
        icon="i-lucide-copy"
        variant="ghost"
        color="neutral"
        size="xs"
        square
        :aria-label="$t('header.copyGameIdAria')"
        class="shrink-0"
        @click="copyId"
      />
    </div>
    <h1
      v-if="title"
      class="text-xl font-bold leading-tight sm:text-2xl md:text-3xl"
    >
      {{ title }}
    </h1>
    <p
      v-if="subtitle"
      class="text-xs text-muted sm:text-sm"
    >
      {{ subtitle }}
    </p>
  </div>
</template>
