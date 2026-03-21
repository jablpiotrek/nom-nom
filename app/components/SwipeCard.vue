<script setup lang="ts">
type CardItem = { nameId: number, name: string }

/** Prefetch queue size: next card is often instant; rest load in background */
const BUFFER_TARGET = 8

const props = defineProps<{
  gameId: string
  parent: 'mommy' | 'daddy'
}>()

const toast = useToast()
const { t } = useI18n()

const items = ref<CardItem[]>([])
const buffer = ref<CardItem[]>([])
const loading = ref(true)
const done = ref(false)
const busy = ref(false)
let bufferTopUpInFlight: Promise<void> | null = null

/** FlashCards exposed API (vue3-flashcards) */
const deck = ref<{
  swipeLeft: () => void
  swipeRight: () => void
  skip: () => void
  restore: () => void
  reset: (options?: { animate?: boolean }) => Promise<void>
} | null>(null)

/** Stronger, consistent visibility while dragging (delta from vue3-flashcards). */
function swipeBadgeOpacity(delta: number) {
  const d = Math.abs(Number(delta) || 0)
  return Math.min(1, 0.2 + d * 4)
}

async function fetchNameBatch(
  count: number,
  excludeNameId?: number
): Promise<CardItem[]> {
  const params: Record<string, string | number> = {
    parent: props.parent,
    batch: count
  }
  if (excludeNameId != null) {
    params.exclude = excludeNameId
  }
  const data = await $fetch<{
    items?: CardItem[]
    done?: boolean
  }>(`/api/games/${props.gameId}/next-name`, {
    params
  })
  if (data.done && (!data.items || data.items.length === 0)) {
    return []
  }
  return data.items ?? []
}

function scheduleBufferTopUp() {
  if (done.value) {
    return
  }
  const need = BUFFER_TARGET - buffer.value.length
  if (need <= 0 || bufferTopUpInFlight) {
    return
  }
  bufferTopUpInFlight = (async () => {
    try {
      const fresh = await fetchNameBatch(need, items.value[0]?.nameId)
      buffer.value.push(...fresh)
    } catch {
      /* prefetch is best-effort */
    } finally {
      bufferTopUpInFlight = null
    }
  })()
}

async function resetDeck() {
  try {
    await deck.value?.reset?.({ animate: false })
  } catch {
    /* ignore if deck not ready */
  }
}

/**
 * Show next card: pop from prefetch buffer (instant) or fetch a new batch.
 */
async function advanceToNextCard() {
  if (buffer.value.length > 0) {
    const next = buffer.value.shift()!
    items.value = [next]
    loading.value = false
    scheduleBufferTopUp()
    await nextTick()
    await resetDeck()
    return
  }

  const excludeWhileFetching = items.value[0]?.nameId

  loading.value = true
  items.value = []
  try {
    const batch = await fetchNameBatch(BUFFER_TARGET, excludeWhileFetching)
    if (!batch.length) {
      done.value = true
      return
    }
    done.value = false
    items.value = [batch[0]!]
    buffer.value.push(...batch.slice(1))
    scheduleBufferTopUp()
    await nextTick()
    await resetDeck()
  } catch {
    done.value = true
  } finally {
    loading.value = false
  }
}

async function postSwipe(action: 'like' | 'dislike', item: CardItem) {
  const { matched, matchedName } = await $fetch(
    `/api/games/${props.gameId}/swipe`,
    {
      method: 'POST',
      body: {
        nameId: item.nameId,
        parent: props.parent,
        action
      }
    }
  )
  if (matched) {
    toast.add({
      title: t('swipe.matchTitle'),
      description: t('swipe.matchDescription', { name: matchedName }),
      icon: 'i-lucide-heart',
      color: 'success'
    })
  }
}

async function onSwipeRight(item: CardItem) {
  if (busy.value) {
    return
  }
  busy.value = true
  try {
    await postSwipe('like', item)
    await advanceToNextCard()
  } catch {
    loading.value = false
    toast.add({
      title: t('swipe.errorTitle'),
      description: t('swipe.errorDescription'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    deck.value?.restore()
  } finally {
    busy.value = false
  }
}

async function onSwipeLeft(item: CardItem) {
  if (busy.value) {
    return
  }
  busy.value = true
  try {
    await postSwipe('dislike', item)
    await advanceToNextCard()
  } catch {
    loading.value = false
    toast.add({
      title: t('swipe.errorTitle'),
      description: t('swipe.errorDescription'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    deck.value?.restore()
  } finally {
    busy.value = false
  }
}

async function onSkip(_item: CardItem) {
  if (busy.value) {
    return
  }
  busy.value = true
  try {
    await advanceToNextCard()
  } finally {
    busy.value = false
  }
}

function btnDislike() {
  deck.value?.swipeLeft()
}
function btnLike() {
  deck.value?.swipeRight()
}
function btnSkip() {
  deck.value?.skip()
}

onMounted(() => {
  loading.value = true
  void advanceToNextCard()
})
</script>

<template>
  <div class="flex flex-col items-center gap-4">
    <div
      v-if="done"
      class="text-center space-y-4"
    >
      <UIcon
        name="i-lucide-check-circle"
        class="w-16 h-16 text-primary mx-auto"
      />
      <h2 class="text-xl font-bold sm:text-2xl">
        {{ $t("swipe.doneTitle") }}
      </h2>
      <p class="max-w-xs text-sm text-muted sm:max-w-none sm:text-base">
        {{ $t("swipe.doneSubtitle") }}
      </p>
      <UButton
        :to="`/${gameId}/match`"
        :label="$t('swipe.viewMatches')"
        icon="i-lucide-heart"
        size="xl"
        class="!cursor-pointer"
      />
    </div>

    <template v-else>
      <FlashCards
        ref="deck"
        :items="items"
        item-key="nameId"
        :swipe-direction="['left', 'right', 'top']"
        :stack="0"
        :swipe-threshold="100"
        :wait-animation-end="true"
        :disable-drag="busy"
        class="w-full max-w-sm min-h-0"
        @swipe-left="onSwipeLeft"
        @swipe-right="onSwipeRight"
        @swipe-top="onSkip"
        @skip="onSkip"
      >
        <template #default="{ item }">
          <UCard class="text-center select-none relative overflow-visible">
            <div class="py-8">
              <p class="text-5xl font-bold">
                {{ item.name }}
              </p>
            </div>
          </UCard>
        </template>

        <template #left="{ delta }">
          <div
            class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg px-4"
            :style="{ opacity: swipeBadgeOpacity(delta) }"
          >
            <span
              class="rounded-lg border-4 border-error bg-default/90 px-4 py-2 font-bold text-error text-xl uppercase tracking-widest shadow-lg rotate-[-10deg] backdrop-blur-sm"
            >
              {{ $t("swipe.badgeNope") }}
            </span>
          </div>
        </template>
        <template #right="{ delta }">
          <div
            class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg px-4"
            :style="{ opacity: swipeBadgeOpacity(delta) }"
          >
            <span
              class="rounded-lg border-4 border-success bg-default/90 px-4 py-2 font-bold text-success text-xl uppercase tracking-widest shadow-lg rotate-10 backdrop-blur-sm"
            >
              {{ $t("swipe.badgeLike") }}
            </span>
          </div>
        </template>
        <template #top="{ delta }">
          <div
            class="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg px-4"
            :style="{ opacity: swipeBadgeOpacity(delta) }"
          >
            <span
              class="rounded-lg border-4 border-neutral-400 bg-default/90 px-4 py-2 font-bold text-muted text-xl uppercase tracking-widest shadow-lg backdrop-blur-sm dark:border-neutral-600"
            >
              {{ $t("swipe.badgeLater") }}
            </span>
          </div>
        </template>

        <!--
          Library shows this slot whenever there's a single card (index >= length-1).
          Must always render a root node or Vue falls back to default "No more cards!".
        -->
        <template #empty>
          <div
            class="flex min-h-[100px] flex-col items-center justify-center gap-1.5 py-4 text-muted"
          >
            <UIcon
              v-if="loading"
              name="i-lucide-loader-2"
              class="h-8 w-8 animate-spin shrink-0"
            />
            <span
              v-if="loading"
              class="text-sm"
            >
              {{ $t("swipe.loadingNext") }}
            </span>
          </div>
        </template>
      </FlashCards>

      <div class="flex items-center gap-6">
        <UTooltip :text="$t('swipe.tooltipDislike')">
          <UButton
            icon="i-lucide-x"
            :aria-label="$t('swipe.ariaDislike')"
            size="xl"
            color="error"
            variant="soft"
            class="rounded-full !p-4 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="busy || !items.length"
            @click="btnDislike"
          />
        </UTooltip>
        <UTooltip :text="$t('swipe.tooltipSkip')">
          <UButton
            icon="i-lucide-clock"
            :aria-label="$t('swipe.ariaSkip')"
            size="lg"
            color="neutral"
            variant="ghost"
            class="rounded-full !p-3 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="busy || !items.length"
            @click="btnSkip"
          />
        </UTooltip>
        <UTooltip :text="$t('swipe.tooltipLike')">
          <UButton
            icon="i-lucide-heart"
            :aria-label="$t('swipe.ariaLike')"
            size="xl"
            color="success"
            variant="soft"
            class="rounded-full !p-4 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="busy || !items.length"
            @click="btnLike"
          />
        </UTooltip>
      </div>

      <p class="text-sm text-muted text-center max-w-xs">
        {{ $t("swipe.hint") }}
      </p>
    </template>
  </div>
</template>
