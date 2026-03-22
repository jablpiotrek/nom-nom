<script setup>
const { locale, t } = useI18n();
const year = new Date().getFullYear();

useHead(() => ({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: {
    lang: locale.value,
  },
}));

useSeoMeta({
  title: () => t("meta.title"),
  description: () => t("meta.description"),
});
</script>

<template>
  <UApp>
    <!-- UApp is a provider only (no layout root); flex wrapper pins footer to viewport bottom -->
    <div class="flex min-h-dvh w-full flex-col">
      <UHeader :toggle="false">
        <template #left>
          <NuxtLink to="/" class="flex items-center gap-2">
            <UIcon name="i-lucide-cookie" class="w-6 h-6 text-primary" />
            <span class="text-base font-bold sm:text-lg">nom-nom</span>
          </NuxtLink>
        </template>

        <template #right>
          <UColorModeButton />
        </template>
      </UHeader>

      <!-- flex-1 fills space below header; flex-col + flex-1 container pushes footer down -->
      <UMain class="flex min-h-0 flex-1 flex-col">
        <UContainer class="min-h-0 flex-1 py-8">
          <NuxtLayout>
            <NuxtPage />
          </NuxtLayout>
        </UContainer>

        <footer
          class="flex h-[var(--ui-header-height)] shrink-0 items-center justify-between gap-3 border-t border-default/40 px-4 text-xs text-muted sm:px-6"
          role="contentinfo"
        >
          <p class="m-0 min-w-0">
            {{ t("footer.copyright", { year }) }}
          </p>
          <LanguageSwitch class="shrink-0" />
        </footer>
      </UMain>
    </div>
  </UApp>
</template>
