<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()

const activeTab = ref('join')
const error = ref('')
const loading = ref(false)

const joinId = ref('')
const joinPin = ref('')

const createSex = ref<'boy' | 'girl'>('girl')
const createPin = ref('')
const createPinConfirm = ref('')

const sexOptions = computed(() => [
  { label: t('home.sex.girl'), value: 'girl', icon: 'i-lucide-heart' },
  { label: t('home.sex.boy'), value: 'boy', icon: 'i-lucide-star' }
])

const tabs = computed(() => [
  {
    label: t('home.tabs.join'),
    value: 'join',
    icon: 'i-lucide-log-in',
    slot: 'join'
  },
  {
    label: t('home.tabs.create'),
    value: 'create',
    icon: 'i-lucide-plus',
    slot: 'create'
  }
])

async function joinGame() {
  error.value = ''
  const id = joinId.value.trim().toUpperCase()
  if (!id) {
    error.value = t('home.errors.enterGameId')
    return
  }
  if (!joinPin.value) {
    error.value = t('home.errors.enterPin')
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/games/${id}/verify-pin`, {
      method: 'POST',
      body: { pin: joinPin.value }
    })
    await router.push(`/${id}`)
  } catch (e: unknown) {
    error.value = getFetchErrorMessage(e) || t('home.errors.invalidJoin')
  } finally {
    loading.value = false
  }
}

async function createGame() {
  error.value = ''
  if (createPin.value.length < 4) {
    error.value = t('home.errors.pinMin')
    return
  }
  if (createPin.value !== createPinConfirm.value) {
    error.value = t('home.errors.pinMismatch')
    return
  }

  loading.value = true
  try {
    const { id } = await $fetch('/api/games', {
      method: 'POST',
      body: { sex: createSex.value, pin: createPin.value }
    })
    await router.push(`/${id}`)
  } catch (e: unknown) {
    error.value = getFetchErrorMessage(e) || t('home.errors.generic')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md mx-auto space-y-8">
    <div class="text-center space-y-2">
      <h1 class="text-2xl font-bold sm:text-3xl md:text-4xl">
        nom-nom
      </h1>
      <p class="text-sm text-muted sm:text-base md:text-lg">
        {{ $t("home.tagline") }}
      </p>
    </div>

    <UTabs
      v-model="activeTab"
      :items="tabs"
      class="w-full"
    >
      <template #join>
        <UCard class="mt-4">
          <form
            class="space-y-5"
            @submit.prevent="joinGame"
          >
            <UFormField
              :label="$t('home.join.gameIdLabel')"
              :description="$t('home.join.gameIdDescription')"
            >
              <UInput
                v-model="joinId"
                :placeholder="$t('home.join.gameIdPlaceholder')"
                icon="i-lucide-hash"
                size="lg"
                class="uppercase"
              />
            </UFormField>

            <UFormField :label="$t('home.join.pinLabel')">
              <UInput
                v-model="joinPin"
                type="password"
                :placeholder="$t('home.join.pinPlaceholder')"
                icon="i-lucide-lock"
                size="lg"
              />
            </UFormField>

            <p
              v-if="error && activeTab === 'join'"
              class="text-sm text-error"
            >
              {{ error }}
            </p>

            <UButton
              type="submit"
              :label="$t('home.join.submit')"
              icon="i-lucide-log-in"
              size="lg"
              block
              :loading="loading"
            />
          </form>
        </UCard>
      </template>

      <template #create>
        <UCard class="mt-4">
          <form
            class="space-y-5"
            @submit.prevent="createGame"
          >
            <UFormField :label="$t('home.create.expectingLabel')">
              <URadioGroup
                v-model="createSex"
                :items="sexOptions"
                value-key="value"
              />
            </UFormField>

            <UCollapsible
              :unmount-on-hide="false"
              class="w-full rounded-lg border border-default/60 bg-elevated/50 text-left"
            >
              <template #default="{ open }">
                <button
                  type="button"
                  class="flex w-full items-start gap-3 rounded-t-lg p-3 text-sm transition-colors hover:bg-elevated/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  :aria-expanded="open"
                  :aria-label="
                    open
                      ? $t('home.create.pinAlertCollapse')
                      : $t('home.create.pinAlertExpand')
                  "
                >
                  <UIcon
                    name="i-lucide-key-round"
                    class="mt-0.5 size-5 shrink-0 text-muted"
                  />
                  <span class="min-w-0 flex-1 font-medium text-highlighted">
                    {{ $t("home.create.pinAlertTitle") }}
                  </span>
                  <UIcon
                    :name="
                      open ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
                    "
                    class="mt-0.5 size-5 shrink-0 text-muted"
                  />
                </button>
              </template>
              <template #content>
                <div
                  class="rounded-b-lg border-t border-default/40 px-3 pb-3 pl-11 pt-2 text-sm text-muted"
                >
                  {{ $t("home.create.pinAlertDescription") }}
                </div>
              </template>
            </UCollapsible>

            <UFormField
              :label="$t('home.create.pinLabel')"
              :description="$t('home.create.pinDescription')"
            >
              <UInput
                v-model="createPin"
                type="password"
                :placeholder="$t('home.create.pinPlaceholder')"
                icon="i-lucide-lock"
                size="lg"
                autocomplete="new-password"
              />
            </UFormField>

            <UFormField :label="$t('home.create.confirmPinLabel')">
              <UInput
                v-model="createPinConfirm"
                type="password"
                :placeholder="$t('home.create.confirmPinPlaceholder')"
                icon="i-lucide-lock-keyhole"
                size="lg"
                autocomplete="new-password"
              />
            </UFormField>

            <p
              v-if="error && activeTab === 'create'"
              class="text-sm text-error"
            >
              {{ error }}
            </p>

            <UButton
              type="submit"
              :label="$t('home.create.submit')"
              icon="i-lucide-plus"
              size="lg"
              block
              :loading="loading"
            />
          </form>
        </UCard>
      </template>
    </UTabs>
  </div>
</template>
