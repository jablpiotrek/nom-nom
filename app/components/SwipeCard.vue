<script setup lang="ts">
import { useScrollLock } from '@vueuse/core'

type CardItem = { nameId: number, name: string }

/** Page scroll while dragging cards — VueUse (already in Nuxt UI’s stack). @see https://vueuse.org/useScrollLock */
const isScrollLocked = useScrollLock(
  () => (import.meta.client ? document.documentElement : null),
  false
)

const props = defineProps<{
  gameId: string
  parent: 'mommy' | 'daddy'
}>()

const toast = useToast()
const { t } = useI18n()
const loading = useSwipeDeckLoading()

type UndoState
  = | { kind: 'none' }
    | { kind: 'pending', item: CardItem }
    | { kind: 'available', item: CardItem }
    | { kind: 'blockedMatch' }

/** Shuffled queue: head is current card; tail is upcoming */
const remaining = ref<CardItem[]>([])
const skipBusy = ref(false)
const undoBusy = ref(false)
const undoState = ref<UndoState>({ kind: 'none' })

/** Monotonic: only the latest swipe’s POST may update `undoState`. */
const swipeEpoch = ref(0)

/** Resolves when the latest swipe’s POST settles (success or fail). */
const pendingSwipeSettled = shallowRef<Promise<void> | null>(null)

const interactionLocked = computed(() => undoBusy.value || skipBusy.value)

const undoTooltipText = computed(() => {
  switch (undoState.value.kind) {
    case 'pending':
      return t('swipe.undoPendingTooltip')
    case 'blockedMatch':
      return t('swipe.undoBlockedMatchTooltip')
    case 'available':
      return t('swipe.undoTooltip')
    default:
      return t('swipe.undoNoneTooltip')
  }
})

/** Undo control always visible; only `available` (and not busy) is clickable. */
const undoControlDisabled = computed(() => {
  if (undoState.value.kind === 'available') {
    return undoBusy.value || skipBusy.value
  }
  return true
})

const undoControlLoading = computed(
  () =>
    undoState.value.kind === 'pending'
    || (undoState.value.kind === 'available' && undoBusy.value)
)

const items = computed(() => {
  const head = remaining.value[0]
  return head ? [head] : []
})

const done = computed(() => !loading.value && remaining.value.length === 0)

/** FlashCards exposed API (vue3-flashcards) */
const deck = ref<{
  swipeLeft: () => void
  swipeRight: () => void
  skip: () => void
  restore: () => void
  reset: (options?: { animate?: boolean }) => Promise<void>
} | null>(null)

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  return arr
}

/** Stronger, consistent visibility while dragging (delta from vue3-flashcards). */
function swipeBadgeOpacity(delta: number) {
  const d = Math.abs(Number(delta) || 0)
  return Math.min(1, 0.2 + d * 4)
}

async function resetDeck() {
  try {
    await deck.value?.reset?.({ animate: false })
  } catch {
    /* ignore if deck not ready */
  }
}

async function loadDeck() {
  loading.value = true
  try {
    const data = await $fetch<{
      items?: CardItem[]
      done?: boolean
    }>(`/api/games/${props.gameId}/deck`, {
      params: { parent: props.parent }
    })
    const raw = data.items ?? []
    shuffleInPlace(raw)
    remaining.value = raw
  } catch {
    remaining.value = []
  } finally {
    loading.value = false
  }
  await nextTick()
  await resetDeck()
}

async function goToNextCard() {
  remaining.value = remaining.value.slice(1)
  await nextTick()
  await resetDeck()
}

/** Skip is not persisted — move current to the back so it can show again later */
async function skipToBack() {
  const q = remaining.value
  if (q.length > 1) {
    const [head, ...rest] = q
    remaining.value = [...rest, head!]
  }
  await nextTick()
  await resetDeck()
}

function postSwipe(
  action: 'like' | 'dislike',
  item: CardItem
): Promise<{ matched: boolean, matchedName: string | null }> {
  return $fetch(`/api/games/${props.gameId}/swipe`, {
    method: 'POST',
    body: {
      nameId: item.nameId,
      parent: props.parent,
      action
    }
  })
}

/**
 * Fire-and-forget POST for this card; advance immediately. Older POSTs keep running.
 * Only the latest swipe drives undo UI (epoch).
 */
function queueSwipe(action: 'like' | 'dislike', item: CardItem) {
  if (undoBusy.value || skipBusy.value) {
    return
  }
  swipeEpoch.value += 1
  const epoch = swipeEpoch.value
  const snapshot: CardItem = { nameId: item.nameId, name: item.name }

  let resolvePending: (() => void) | undefined
  pendingSwipeSettled.value = new Promise<void>((resolve) => {
    resolvePending = resolve
  })

  undoState.value = { kind: 'pending', item: snapshot }

  void postSwipe(action, snapshot)
    .then((res) => {
      if (epoch !== swipeEpoch.value) {
        return
      }
      if (action === 'like' && res.matched) {
        toast.add({
          title: t('swipe.matchTitle'),
          description: t('swipe.matchDescription', {
            name: res.matchedName ?? ''
          }),
          icon: 'i-lucide-heart',
          color: 'success'
        })
        undoState.value = { kind: 'blockedMatch' }
      } else {
        undoState.value = { kind: 'available', item: snapshot }
      }
    })
    .catch(() => {
      if (epoch !== swipeEpoch.value) {
        return
      }
      undoState.value = { kind: 'none' }
      remaining.value = [snapshot, ...remaining.value]
      toast.add({
        title: t('swipe.errorTitle'),
        description: t('swipe.errorDescription'),
        icon: 'i-lucide-alert-circle',
        color: 'error'
      })
      void nextTick().then(() => {
        void resetDeck()
        deck.value?.restore()
      })
    })
    .finally(() => {
      resolvePending?.()
    })

  void goToNextCard()
}

function onSwipeRight(item: CardItem) {
  queueSwipe('like', item)
}

function onSwipeLeft(item: CardItem) {
  queueSwipe('dislike', item)
}

async function undoLastSwipe() {
  if (undoBusy.value || skipBusy.value) {
    return
  }
  if (undoState.value.kind === 'pending' && pendingSwipeSettled.value) {
    await pendingSwipeSettled.value
  }
  if (undoState.value.kind !== 'available') {
    return
  }
  const { item } = undoState.value
  undoBusy.value = true
  try {
    await $fetch(`/api/games/${props.gameId}/swipe`, {
      method: 'DELETE',
      query: {
        nameId: item.nameId,
        parent: props.parent
      }
    })
    remaining.value = [item, ...remaining.value]
    undoState.value = { kind: 'none' }
    await nextTick()
    await resetDeck()
  } catch {
    toast.add({
      title: t('swipe.undoFailedTitle'),
      description: t('swipe.undoFailedDescription'),
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    undoBusy.value = false
  }
}

async function onSkip(_item: CardItem) {
  if (interactionLocked.value) {
    return
  }
  undoState.value = { kind: 'none' }
  swipeEpoch.value += 1
  pendingSwipeSettled.value = null
  skipBusy.value = true
  try {
    await skipToBack()
  } finally {
    skipBusy.value = false
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

function onSwipeDragStart() {
  isScrollLocked.value = true
}

function onSwipeDragEnd() {
  isScrollLocked.value = false
}

onMounted(() => {
  void loadDeck()
})

onUnmounted(() => {
  loading.value = false
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
      <div class="flex justify-center">
        <UTooltip :text="undoTooltipText">
          <UButton
            icon="i-lucide-undo-2"
            color="neutral"
            variant="ghost"
            size="lg"
            class="shrink-0"
            :class="{
              '!cursor-pointer': !undoControlDisabled,
              '!cursor-not-allowed opacity-60':
                undoControlDisabled && !undoControlLoading
            }"
            :aria-label="$t('swipe.undoAria')"
            :loading="undoControlLoading"
            :disabled="undoControlDisabled"
            @click="undoLastSwipe"
          />
        </UTooltip>
      </div>
      <UButton
        :to="`/${gameId}/match`"
        :label="$t('swipe.viewMatches')"
        icon="i-lucide-heart"
        size="xl"
        class="!cursor-pointer"
      />
    </div>

    <template v-else>
      <!-- Stacking wrapper: controls sit below in DOM; keep deck above while dragging -->
      <div class="relative z-50 isolate w-full max-w-sm min-h-0">
        <FlashCards
          ref="deck"
          :items="items"
          item-key="nameId"
          :swipe-direction="['left', 'right', 'top']"
          :stack="0"
          :swipe-threshold="100"
          :wait-animation-end="true"
          :disable-drag="interactionLocked"
          class="w-full min-h-0"
          @swipe-left="onSwipeLeft"
          @swipe-right="onSwipeRight"
          @swipe-top="onSkip"
          @skip="onSkip"
          @dragstart="onSwipeDragStart"
          @dragend="onSwipeDragEnd"
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
      </div>

      <div
        v-if="!loading"
        class="relative z-0 flex flex-nowrap items-center justify-center gap-4 sm:gap-6"
      >
        <UTooltip :text="$t('swipe.tooltipDislike')">
          <UButton
            icon="i-lucide-x"
            :aria-label="$t('swipe.ariaDislike')"
            size="xl"
            color="error"
            variant="soft"
            class="shrink-0 rounded-full !p-4 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="interactionLocked || !items.length"
            @click="btnDislike"
          />
        </UTooltip>

        <UTooltip :text="undoTooltipText">
          <UButton
            icon="i-lucide-undo-2"
            color="neutral"
            variant="ghost"
            size="lg"
            class="shrink-0 rounded-full !p-3"
            :class="{
              '!cursor-pointer': !undoControlDisabled,
              '!cursor-not-allowed opacity-60':
                undoControlDisabled && !undoControlLoading
            }"
            :aria-label="$t('swipe.undoAria')"
            :loading="undoControlLoading"
            :disabled="undoControlDisabled"
            @click="undoLastSwipe"
          />
        </UTooltip>

        <UTooltip :text="$t('swipe.tooltipSkip')">
          <UButton
            icon="i-lucide-clock"
            :aria-label="$t('swipe.ariaSkip')"
            size="lg"
            color="neutral"
            variant="ghost"
            class="shrink-0 rounded-full !p-3 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="interactionLocked || !items.length"
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
            class="shrink-0 rounded-full !p-4 !cursor-pointer disabled:!cursor-not-allowed"
            :disabled="interactionLocked || !items.length"
            @click="btnLike"
          />
        </UTooltip>
      </div>

      <p
        v-if="!loading"
        class="relative z-0 text-sm text-muted text-center max-w-xs"
      >
        {{ $t("swipe.hint") }}
      </p>
    </template>
  </div>
</template>
