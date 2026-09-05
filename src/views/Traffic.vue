<template>
  <div class="page">
    <!-- 流量 KPI -->
    <div class="section-title">流量</div>
    <div class="kpi-grid">
      <KpiCard
        v-for="id in fluxIds"
        :key="id"
        :label="meta(id).label"
        :value-text="text(id)"
        :loading="loading"
        :icon="null"
        :color="meta(id).color"
        :growth="grow(id)"
        tip="该时间范围内的累计流量"
      />
    </div>

    <PanelCard title="流量趋势" :color="'#2f6bff'">
      <template #extra>
        <span class="chart-note">单位按量级自适应</span>
      </template>
      <EChart :option="fluxOption" :loading="loading" :height="300" />
    </PanelCard>

    <!-- 带宽 KPI -->
    <div class="section-title">带宽（峰值）</div>
    <div class="kpi-grid">
      <KpiCard
        v-for="id in bwIds"
        :key="id"
        :label="meta(id).label"
        :value-text="text(id)"
        :loading="loading"
        :icon="null"
        :color="meta(id).color"
        :growth="grow(id)"
        tip="时间范围内的带宽峰值"
      />
    </div>

    <PanelCard title="带宽趋势" :color="'#f59e0b'">
      <EChart :option="bwOption" :loading="loading" :height="300" />
    </PanelCard>
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
const fluxIds = ['l7Flow_flux', 'l7Flow_inFlux', 'l7Flow_outFlux'];
const bwIds = ['l7Flow_bandwidth', 'l7Flow_inBandwidth', 'l7Flow_outBandwidth'];
const ALL = [...fluxIds, ...bwIds];
const { data, loading } = useMetrics(ALL, { compare: true });

function text(id) {
  const { cur, unit } = kpiOf(data[id], id);
  return formatKpi(cur, unit);
}
function grow(id) {
  const { cur, prev } = kpiOf(data[id], id);
  if (cur == null || prev == null) return null;
  return growthPct(cur, prev);
}

const fluxOption = computed(() => {
  const s = seriesFrom(data, fluxIds);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
const bwOption = computed(() => {
  const s = seriesFrom(data, bwIds);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
</script>

<style scoped>
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--eo-text-3);
  letter-spacing: 1px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.chart-note {
  font-size: 12px;
  color: var(--eo-text-3);
}
@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 520px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
