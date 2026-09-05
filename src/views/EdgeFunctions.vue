<template>
  <div class="page">
    <div class="kpi-grid">
      <KpiCard
        label="边缘函数请求数"
        :value-text="reqText"
        :loading="loading"
        :icon="ConstructOutline"
        color="#3b82f6"
        :growth="grow('function_requestCount')"
        tip="所选时间范围内边缘函数总调用次数"
      />
      <KpiCard
        label="CPU 总耗时"
        :value-text="cpuText"
        :loading="loading"
        :icon="TimeOutline"
        color="#f59e0b"
        :growth="grow('function_cpuCostTime')"
        tip="所选时间范围内边缘函数消耗的 CPU 总时间"
      />
    </div>

    <div class="grid-2">
      <PanelCard title="边缘函数请求数趋势" color="#3b82f6">
        <EChart :option="reqOpt" :loading="loading" :height="300" />
      </PanelCard>
      <PanelCard title="CPU 耗时趋势" color="#f59e0b">
        <EChart :option="cpuOpt" :loading="loading" :height="300" />
      </PanelCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ConstructOutline, TimeOutline } from '@vicons/ionicons5';
import KpiCard from '../components/KpiCard.vue';
import PanelCard from '../components/PanelCard.vue';
import EChart from '../components/EChart.vue';
import { useMetrics } from '../composables/useMetrics.js';
import { useAppStore } from '../store/app.js';
import { kpiOf } from '../config/metrics.js';
import { formatKpi, growthPct } from '../utils/format.js';
import { seriesFrom } from '../utils/series.js';
import { buildTrendOption } from '../utils/chart.js';

const app = useAppStore();
const ids = ['function_requestCount', 'function_cpuCostTime'];
const { data, loading } = useMetrics(ids, { compare: true });

const reqText = computed(() => {
  const { cur, unit } = kpiOf(data['function_requestCount'], 'function_requestCount');
  return cur == null ? '—' : formatKpi(cur, unit);
});
const cpuText = computed(() => {
  const { cur, unit } = kpiOf(data['function_cpuCostTime'], 'function_cpuCostTime');
  return cur == null ? '—' : formatKpi(cur, unit);
});
function grow(id) {
  const { cur, prev } = kpiOf(data[id], id);
  if (cur == null || prev == null) return null;
  return growthPct(cur, prev);
}

const reqOpt = computed(() => {
  const s = seriesFrom(data, ['function_requestCount']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
const cpuOpt = computed(() => {
  const s = seriesFrom(data, ['function_cpuCostTime']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (max-width: 620px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
