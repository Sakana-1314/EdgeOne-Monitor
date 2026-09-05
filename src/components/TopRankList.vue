<template>
  <div class="rank-list">
    <n-skeleton v-if="loading" text :repeat="6" class="rank-skeleton" />
    <n-empty v-else-if="!rows.length" size="small" description="暂无数据" style="padding: 16px 0" />
    <template v-else>
      <div v-for="(row, i) in visible" :key="row.name + i" class="rank-row">
        <span class="rank-idx" :class="{ top: i < 3 }" :style="i < 3 ? { background: TOP_COLORS[i] } : undefined">{{ i + 1 }}</span>
        <div class="rank-main">
          <div class="rank-line1">
            <span class="rank-name" :title="row.name">{{ row.name }}</span>
            <span class="rank-val">{{ row.display }}</span>
          </div>
          <div class="rank-track">
            <div class="rank-bar" :style="{ width: row.pct + '%', background: row.color }"></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatByUnit } from '../utils/format.js';

const TOP_COLORS = ['linear-gradient(135deg, #fbbf24, #f59e0b)', 'linear-gradient(135deg, #94a3b8, #64748b)', 'linear-gradient(135deg, #fdba74, #b45309)'];

const props = defineProps({
  rows: { type: Array, default: () => [] }, // [{ name, value, color?, display? }]
  topN: { type: Number, default: 10 },
  unit: { type: String, default: 'count' },
  fmt: { type: Function, default: null },
  color: { type: String, default: '#3b82f6' },
  loading: { type: Boolean, default: false }
});

function resolveColor(i, row) {
  return row.color || props.color;
}

const visible = computed(() => {
  const list = props.rows.slice(0, props.topN);
  const max = Math.max(1, ...list.map((r) => r.value || 0));
  return list.map((r, i) => ({
    ...r,
    display:
      r.display != null
        ? r.display
        : props.fmt
          ? props.fmt(r.value, r)
          : formatByUnit(r.value, props.unit),
    pct: ((r.value || 0) / max) * 100,
    color: resolveColor(i, r)
  }));
});
</script>

<style scoped>
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  width: 100%;
}
.rank-skeleton { margin-top: 4px; }
.rank-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.rank-idx {
  flex: 0 0 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--eo-text-2);
  background: var(--eo-fill-1);
}
.rank-idx.top { color: #fff; }
.rank-main { flex: 1; min-width: 0; }
.rank-line1 { display: flex; align-items: baseline; gap: 8px; }
.rank-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--eo-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rank-val {
  font-size: 13px;
  font-weight: 700;
  color: var(--eo-text-1);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.rank-track {
  margin-top: 3px;
  height: 6px;
  border-radius: 999px;
  background: var(--eo-fill-1);
  overflow: hidden;
}
.rank-bar { height: 100%; border-radius: 999px; transition: width 0.5s ease; }
</style>
