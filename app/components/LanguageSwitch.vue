<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n()

type LocaleObj = { code: string, name?: string }

const options = computed(() => {
  const list = locales.value as LocaleObj[]
  return list.map(l => ({
    code: l.code,
    short: String(l.code).toUpperCase(),
    ariaName:
      l.code === 'en'
        ? t('header.localeEn')
        : l.code === 'pl'
          ? t('header.localePl')
          : l.name ?? l.code
  }))
})

async function pick(code: string) {
  if (code === locale.value) {
    return
  }
  await setLocale(code)
}
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-lg border border-default p-0.5"
    role="group"
    :aria-label="t('footer.languageSwitch')"
  >
    <UButton
      v-for="opt in options"
      :key="opt.code"
      size="xs"
      :variant="locale === opt.code ? 'solid' : 'ghost'"
      :color="locale === opt.code ? 'primary' : 'neutral'"
      class="min-w-9 justify-center font-semibold uppercase"
      :aria-label="opt.ariaName"
      :aria-pressed="locale === opt.code"
      @click="pick(opt.code)"
    >
      {{ opt.short }}
    </UButton>
  </div>
</template>
