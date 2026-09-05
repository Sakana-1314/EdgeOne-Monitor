<template>
  <n-card class="panel-card" :bordered="false" size="small" content-style="padding: 12px 14px 14px;">
    <template #header>
      <div class="panel-head">
        <span v-if="icon" class="panel-icon" :style="{ color }"><n-icon :component="icon" /></span>
        <span class="panel-title">{{ title }}</span>
        <n-tag v-if="badge" size="tiny" :bordered="false" type="info" class="panel-badge">{{ badge }}</n-tag>
      </div>
    </template>
    <template v-if="$slots.extra" #header-extra>
      <div class="panel-extra"><slot name="extra" /></div>
    </template>
    <div class="panel-body"><slot /></div>
  </n-card>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  icon: { type: Object, default: null },
  color: { type: String, default: '' },
  badge: { type: String, default: '' }
});
</script>

<style scoped>
.panel-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.panel-card :deep(.n-card__content) {
  flex: 1;
  min-height: 0;
}
.panel-head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}
.panel-icon { display: inline-flex; }
.panel-title { line-height: 1.3; }
.panel-body {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
