<template>
  <div class="page">
    <div class="kpi-grid">
      <KpiCard
        v-for="id in kpiIds"
        :key="id"
        :label="meta(id).label"
        :value-text="text(id)"
        :loading="loading"
        :color="meta(id).color"
        :growth="grow(id)"
      />
      <KpiCard
        label="缓存命中率"
        :value-text="hitText"
        :loading="loading"
        :icon="FlashOutline"
        color="#22c55e"
        :growth="hitGrow"
        sub="1 - 回源响应流量 / 边缘响应流量"
      />
    </div>

    <div class="grid-3">
      <PanelCard title="回源流量趋势" color="#3b82f6">
        <EChart :option="fluxOpt" :loading="loading" :height="270" />
      </PanelCard>
      <PanelCard title="回源带宽趋势" color="#f59e0b">
        <EChart :option="bwOpt" :loading="loading" :height="270" />
      </PanelCard>
      <PanelCard title="回源请求数趋势" color="#06b6d4">
        <EChart :option="reqOpt" :loading="loading" :height="270" />
      </PanelCard>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { FlashOutline } from '@vicons/ionicons5';
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
const kpiIds = [
  'l7Flow_outFlux_hy',
  'l7Flow_request_hy',
  'l7Flow_outBandwidth_hy',
  'l7Flow_inFlux_hy',
  'l7Flow_inBandwidth_hy'
];
const ids = [...kpiIds, 'l7Flow_outFlux'];
const { data, loading } = useMetrics(ids, { compare: true });

function text(id) {
  const { cur, unit } = kpiOf(data[id], id);
  return formatKpi(cur, unit);
}
function grow(id) {
  const { cur, prev } = kpiOf(data[id], id);
  if (cur == null || prev == null) return null;
  return growthPct(cur, prev);
}

/* 缓存命中率 */
function hitOf(m) {
  const origin = m && m.sum;
  const edge = data['l7Flow_outFlux'] && data['l7Flow_outFlux'].sum;
  if (origin == null || !edge) return null;
  return Math.max(0, Math.min(100, (1 - origin / edge) * 100));
}
const hitText = computed(() => {
  const h = hitOf(data['l7Flow_inFlux_hy']);
  return h == null ? '—' : h.toFixed(2) + '%';
});
const hitGrow = computed(() => {
  const m = data['l7Flow_inFlux_hy'];
  const e = data['l7Flow_outFlux'];
  if (!m || !e) return null;
  const curOrigin = m.sum;
  const curEdge = e.sum;
  if (!curEdge) return null;
  const prevOrigin = m.prevSum;
  const prevEdge = e.prevSum;
  if (prevOrigin == null || !prevEdge) return null;
  const cur = (1 - curOrigin / curEdge) * 100;
  const prev = (1 - prevOrigin / prevEdge) * 100;
  return +(cur - prev).toFixed(2); // 单位：百分点
});

const fluxOpt = computed(() => {
  const s = seriesFrom(data, ['l7Flow_outFlux_hy', 'l7Flow_inFlux_hy']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
const bwOpt = computed(() => {
  const s = seriesFrom(data, ['l7Flow_outBandwidth_hy', 'l7Flow_inBandwidth_hy']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
const reqOpt = computed(() => {
  const s = seriesFrom(data, ['l7Flow_request_hy']);
  return s.length ? buildTrendOption(s, { dark: app.isDark }) : null;
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 560px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
