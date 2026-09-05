<template>
  <div class="page">
    <div class="kpi-grid">
      <KpiCard label="当日构建次数" :value-text="v('dailyBuilds')" :loading="buildLoading" :icon="BuildOutline" color="#3b82f6" sub="今日 UTC" />
      <KpiCard label="当月构建次数" :value-text="v('monthlyBuilds')" :loading="buildLoading" :icon="AlbumsOutline" color="#f59e0b" sub="本月累计" />
      <KpiCard label="Cloud Functions 24h 请求数" :value-text="v('cf24hRequests', true)" :loading="monthLoading" :icon="CloudOutline" color="#06b6d4" sub="近 24 小时" />
      <KpiCard label="当月 CF 请求数" :value-text="v('monthlyRequests', true)" :loading="monthLoading" :icon="LayersOutline" color="#22c55e" sub="Cloud Functions" />
      <KpiCard label="当月 CF GBs" :value-text="gbsText" :loading="monthLoading" :icon="ServerOutline" color="#8b5cf6" sub="Cloud Functions 资源量" />
    </div>

    <div class="grid-2">
      <PanelCard title="近 14 天构建次数" color="#f59e0b">
        <EChart :option="buildOpt" :loading="buildLoading" :height="300" />
      </PanelCard>
      <PanelCard title="Cloud Functions 请求趋势（近 24 小时）" color="#06b6d4">
        <EChart :option="cfOpt" :loading="cfLoading" :height="300" />
      </PanelCard>
    </div>

    <PanelCard title="当月构建进度" color="#3b82f6">
      <div class="progress-wrap">
        <n-progress
          type="line"
          :percentage="monthProgress"
          :height="14"
          :border-radius="8"
          color="#2f6bff"
          rail-color="var(--eo-fill-1)"
          indicator-placement="inside"
        />
        <div class="progress-desc">
          距本月结束还可用构建次数约
          <b>{{ buildData ? Math.max(0, buildData.monthlyBuilds) : 0 }}</b>
          次（实际配额以平台为准）
        </div>
      </div>
    </PanelCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { BuildOutline, AlbumsOutline, CloudOutline, LayersOutline, ServerOutline } from '@vicons/ionicons5';
import KpiCard from '../components/KpiCard.vue';
import PanelCard from '../components/PanelCard.vue';
import EChart from '../components/EChart.vue';
import { useLoader } from '../composables/useMetrics.js';
import { useAppStore } from '../store/app.js';
import { api } from '../api/index.js';
import { formatCount, formatInt } from '../utils/format.js';
import { buildBarOption, buildTrendOption } from '../utils/chart.js';

const app = useAppStore();

const { value: buildData, loading: buildLoading, reload: buildReload } = useLoader((dash) => api.pagesBuild(dash.zoneId));
const { value: cfData, loading: cfLoading, reload: cfReload } = useLoader((dash) => {
  const win = dash.getWindow({ capDays: 2 });
  return api.pagesCfRequests(dash.zoneId, win);
});
const { value: monthData, loading: monthLoading, reload: monthReload } = useLoader((dash) => api.pagesCfMonthly(dash.zoneId));

function v(key, countFmt = false) {
  const d = buildData.value || {};
  const m = monthData.value || {};
  const val = key in m ? m[key] : d[key];
  if (val == null) return '—';
  return countFmt ? formatCount(val) : String(formatInt(val));
}
const gbsText = computed(() => {
  const m = monthData.value;
  if (!m || m.monthlyGbs == null) return '—';
  return String(formatInt(m.monthlyGbs)) + ' GB';
});

const monthProgress = computed(() => {
  const b = buildData.value;
  if (b && b.monthProgress != null) return b.monthProgress;
  return 0;
});

const buildOpt = computed(() => {
  const b = buildData.value;
  if (!b || !Array.isArray(b.trend)) return null;
  return buildBarOption(
    b.trend.map((t) => t.date),
    b.trend.map((t) => t.v),
    { dark: app.isDark, color: '#f59e0b', name: '构建次数' }
  );
});

const cfOpt = computed(() => {
  const pts = cfData.value?.points;
  if (!pts || !pts.length) return null;
  const step = pts.length > 1 ? pts[1].t - pts[0].t : 3600000;
  const cats = pts.map((p) => {
    const d = new Date(p.t);
    return `${String(d.getHours()).padStart(2, '0')}:00`;
  });
  return buildBarOption(
    cats,
    pts.map((p) => p.v),
    { dark: app.isDark, color: '#06b6d4', name: '请求数' }
  );
});
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
}
.progress-wrap { padding: 6px 2px; }
.progress-desc {
  margin-top: 12px;
  font-size: 12px;
  color: var(--eo-text-3);
}
@media (max-width: 1300px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 760px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 520px) {
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
