<template>
  <div class="page">
    <n-alert v-if="capped" type="info" :show-icon="true" style="margin-bottom: 4px">
      该安全指标仅支持查询最近 14 天数据，当前选择时间范围较长，已自动截取为近 14 天展示。
    </n-alert>

    <div class="kpi-grid">
      <KpiCard
        label="总拦截次数"
        :value-text="totalText"
        :loading="loading"
        :icon="ShieldCheckmarkOutline"
        color="#dc2626"
        :growth="totalGrow"
        tip="DDoS/CC 防护：精确 + 托管 + 速率限制"
      />
      <KpiCard
        v-for="id in ids"
        :key="id"
        :label="meta(id).label"
        :value-text="text(id)"
        :loading="loading"
        :color="meta(id).color"
        :growth="grow(id)"
      />
    </div>

    <PanelCard title="安全防护拦截趋势" color="#dc2626" badge="堆叠面积">
      <EChart :option="chartOption" :loading="loading" :height="320" />
    </PanelCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ShieldCheckmarkOutline } from '@vicons/ionicons5';
import KpiCard from '../components/KpiCard.vue';
import PanelCard from '../components/PanelCard.vue';
import EChart from '../components/EChart.vue';
import { useMetrics } from '../composables/useMetrics.js';
import { useDashboardStore } from '../store/dashboard.js';
import { useAppStore } from '../store/app.js';
import { meta, kpiOf } from '../config/metrics.js';
import { formatKpi, growthPct } from '../utils/format.js';
import { seriesFrom } from '../utils/series.js';
import { buildTrendOption } from '../utils/chart.js';

const app = useAppStore();
const dash = useDashboardStore();
const ids = ['ccAcl_interceptNum', 'ccManage_interceptNum', 'ccRate_interceptNum'];
const { data, loading } = useMetrics(ids, { compare: true, capDays: 14 });

const capped = computed(() => dash.rangeDur() > 14 * 86400000 || dash.rangeKey === '31d' || dash.rangeKey === 'custom' && dash.customDurMs() > 14 * 86400000);

function text(id) {
  const { cur, unit } = kpiOf(data[id], id);
  return formatKpi(cur, unit);
}
function grow(id) {
  const { cur, prev } = kpiOf(data[id], id);
  if (cur == null || prev == null) return null;
  return growthPct(cur, prev);
}

function sumAll(prev = false) {
  let t = 0;
  ids.forEach((id) => {
    const m = data[id];
    if (!m) return;
    if (prev) t += m.prevSum || 0;
    else t += m.sum || 0;
  });
  return t;
}
const totalText = computed(() => {
  if (!ids.some((id) => data[id])) return '—';
  return formatKpi(sumAll(false), 'count');
});
const totalGrow = computed(() => {
  const cur = sumAll(false);
  const prev = sumAll(true);
  if (!cur && !prev) return null;
  return growthPct(cur, prev);
});

const chartOption = computed(() => {
  const s = seriesFrom(data, ids);
  return s.length ? buildTrendOption(s, { dark: app.isDark, stack: true }) : null;
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
