<script setup lang="ts">
definePageMeta({ layout: 'game' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const uuid = route.params.uuid as string
const { setResumeGameId, setResumeGameAndRole } = useGameResume()

const pin = ref('')
const error = ref('')
const loading = ref(false)

async function verify() {
  error.value = ''
  if (!pin.value) {
    error.value = t('auth.errors.enterPin')
    return
  }

  loading.value = true
  try {
    await $fetch(`/api/games/${uuid}/verify-pin`, {
      method: 'POST',
      body: { pin: pin.value }
    })
    const redirect = (route.query.redirect as string) || `/${uuid}`
    const path = redirect.split('?')[0] ?? redirect
    const roleMatch = path.match(/^\/[^/]+\/(mommy|daddy)$/)
    if (roleMatch?.[1] === 'mommy' || roleMatch?.[1] === 'daddy') {
      setResumeGameAndRole(uuid, roleMatch[1])
    } else {
      setResumeGameId(uuid)
    }
    await router.push(redirect)
  } catch (e: unknown) {
    error.value = getFetchErrorMessage(e) || t('auth.errors.invalidPin')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-sm mx-auto space-y-8">
    <UCard>
      <form
        class="space-y-4"
        @submit.prevent="verify"
      >
        <UFormField :label="$t('auth.pinLabel')">
          <UInput
            v-model="pin"
            type="password"
            :placeholder="$t('auth.pinPlaceholder')"
            icon="i-lucide-lock"
            size="lg"
            autofocus
          />
        </UFormField>

        <p
          v-if="error"
          class="text-sm text-error"
        >
          {{ error }}
        </p>

        <UButton
          type="submit"
          :label="$t('auth.submit')"
          icon="i-lucide-log-in"
          size="lg"
          block
          :loading="loading"
        />
      </form>
    </UCard>
  </div>
</template>
