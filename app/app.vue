<script setup>
const { locale, t } = useI18n()

useHead(() => ({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: locale.value
  }
}))

useSeoMeta({
  title: () => t('meta.title'),
  description: () => t('meta.description')
})
</script>

<template>
  <UApp>
    <UHeader :toggle="false">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2"
        >
          <UIcon
            name="i-lucide-cookie"
            class="w-6 h-6 text-primary"
          />
          <span class="text-base font-bold sm:text-lg">nom-nom</span>
        </NuxtLink>
      </template>

      <template #right>
        <div class="flex items-center gap-2">
          <LanguageSwitch />
          <UColorModeButton />
        </div>
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <NuxtLayout>
          <NuxtPage />
        </NuxtLayout>
      </UContainer>
    </UMain>

    <UNotifications />
  </UApp>
</template>
