<template>
  <div class="page">
    <div class="kpi-grid">
      <KpiCard
        v-for="id in ids"
        :key="id"
        :label="meta(id).label"
        :value-text="text(id)"
        :loading="loading"
        :color="meta(id).color"
        :growth="grow(id)"
        :tip="tipOf(id)"
      />
    </div>

    <div class="grid-2">
      <PanelCard title="请求数趋势" color="#3b82f6">
        <EChart :option="reqOption" :loading="loading" :height="300" />
      </PanelCard>
      <PanelCard title="响应耗时趋势" color="#8b5cf6">
        <EChart :option="perfOption" :loading="loading" :height="300" />
      </PanelCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import KpiCard from '../components/KpiCard.vue';
import PanelCard from '../components/PanelCard.vue';
import EChart from '../components/EChart.vue';
import { useMetrics } from '../composables/useMetrics.js';
import { useAppStore } from '../store/app.js';
import { meta, kpiOf } from '../config/metrics.js';
import { formatKpi, growthPct } from '../utils/format.js';
import { seriesFrom } from '../utils/series.js';
import { buildTrendOption } from '../utils/chart.js';

const app = useAppStore();
const ids = ['l7Flow_request', 'l7Flow_avgResponseTime', 'l7Flow_avgFirstByteResponseTime'];
const { data, loading } = useMetrics(ids, { compare: true });

function tipOf(id) {
  if (id === 'l7Flow_request') return '该时间范围内的总请求数';
  if (id === 'l7Flow_avgResponseTime') return '从发起请求到收到完整响应的时间';
  return '从发起请求到收到响应首字节的时间';
}

function text(id) {
  const { cur, unit } = kpiOf(data[id], id);
  return formatKpi(cur, unit);
}
function grow(id) {
  const { cur, prev } = kpiOf(data[id], id);
  if (cur == null || prev == null) return null;
  return growthPct(cur, prev);
}

const reqOption = computed(() => {
  const s = seriesFrom(data, ['l7Flow_request']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
const perfOption = computed(() => {
  const s = seriesFrom(data, ['l7Flow_avgResponseTime', 'l7Flow_avgFirstByteResponseTime']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 760px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
