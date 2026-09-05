<template>
  <n-config-provider
    :theme="app.isDark ? darkTheme : null"
    :theme-overrides="overrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    style="height: 100%"
  >
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { darkTheme, zhCN, dateZhCN } from 'naive-ui';
import type { GlobalThemeOverrides } from 'naive-ui';
import { useAppStore } from './store/app';
import { naiveOverrides, applyCssTokens } from './config/theme';
import { useRoute } from 'vue-router';

const app = useAppStore();
const route = useRoute();

const overrides = computed<GlobalThemeOverrides>(() => naiveOverrides(app.isDark));

watch(
  () => app.effectiveTheme,
  (dark) => applyCssTokens(dark === 'dark'),
  { immediate: true }
);

watch(
  () => app.siteName,
  () => {
    const title = route.meta.title ? `${route.meta.title} · ${app.siteName}` : app.siteName;
    document.title = title;
  }
);

let mql: MediaQueryList | null = null;
function onSystemThemeChange(): void {
  if (app.themeMode === 'auto') app.notifyTheme();
}

onMounted(() => {
  app.applyThemeClass();
  void app.boot();
  if (window.matchMedia) {
    mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', onSystemThemeChange);
  }
});

onBeforeUnmount(() => {
  if (mql) mql.removeEventListener('change', onSystemThemeChange);
});
</script>
