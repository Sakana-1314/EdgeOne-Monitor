<template>
  <div class="page">
    <!-- 概览指标 -->
    <div class="grid-4 region-kpis">
      <KpiCard
        label="覆盖国家 / 地区"
        :value-text="String(covered || '—')"
        unit-text="个"
        :loading="loading"
        icon=""
        color="#3b82f6"
        sub="Top 结果中出现的地区数"
      />
      <KpiCard
        label="请求 Top 来源"
        :value-text="topReqName"
        :unit-text="topReqPct"
        :loading="loading"
        :icon="GlobeOutline"
        color="#22c55e"
        sub="按请求数统计"
      />
      <KpiCard
        label="流量 Top 来源"
        :value-text="topFluxName"
        :unit-text="topFluxPct"
        :loading="loading"
        :icon="GlobeOutline"
        color="#f59e0b"
        sub="按响应流量统计"
      />
      <KpiCard
        label="请求 Top 省份"
        :value-text="topProvName"
        :unit-text="topProvPct"
        :loading="loading"
        :icon="LocationOutline"
        color="#8b5cf6"
        sub="国内省份请求占比"
      />
    </div>

    <!-- 地图 -->
    <PanelCard
      :title="mapTitle"
      badge="拖动 / 滚轮缩放"
      :color="'#2f6bff'"
    >
      <template #extra>
        <div class="map-controls">
          <Segmented v-model="mapKey" :options="mapOptions" />
        </div>
      </template>
      <GeoMap
        :map-name="mapGeo"
        :rows="mapRows"
        :unit="mapUnit"
        :dark="app.isDark"
        :loading="loading"
        :height="440"
      />
    </PanelCard>

    <div class="grid-2">
      <PanelCard title="国家 / 地区流量排行" color="#f59e0b">
        <TopRankList
          :rows="rankOutCountry"
          :unit="'bytes'"
          :loading="loading"
          :top-n="8"
          color="#f59e0b"
        />
      </PanelCard>
      <PanelCard title="国家 / 地区请求数排行" color="#3b82f6">
        <TopRankList
          :rows="rankReqCountry"
          :unit="'count'"
          :loading="loading"
          :top-n="8"
          color="#3b82f6"
        />
      </PanelCard>
      <PanelCard title="国内省份流量排行" color="#ec4899">
        <TopRankList
          :rows="rankOutProvince"
          :unit="'bytes'"
          :loading="loading"
          :top-n="8"
          color="#ec4899"
        />
      </PanelCard>
      <PanelCard title="国内省份请求数排行" color="#06b6d4">
        <TopRankList
          :rows="rankReqProvince"
          :unit="'count'"
          :loading="loading"
          :top-n="8"
          color="#06b6d4"
        />
      </PanelCard>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { GlobeOutline, LocationOutline } from '@vicons/ionicons5';
import Segmented from '../components/Segmented.vue';
import KpiCard from '../components/KpiCard.vue';
import PanelCard from '../components/PanelCard.vue';
import TopRankList from '../components/TopRankList.vue';
import GeoMap from '../components/GeoMap.vue';
import { useMetrics } from '../composables/useMetrics.js';
import { useAppStore } from '../store/app.js';
import { resolveCountry, resolveProvince, toCountryMapName } from '../config/geo.js';

const app = useAppStore();
const IDS = [
  'l7Flow_request_country',
  'l7Flow_outFlux_country',
  'l7Flow_request_province',
  'l7Flow_outFlux_province'
];
const { data, loading } = useMetrics(IDS, { compare: false });

/* 地图切换：world-request / world-flux / china-province */
const mapOptions = [
  { label: '全球 · 请求', value: 'world-req' },
  { label: '全球 · 流量', value: 'world-flux' },
  { label: '中国 · 省份', value: 'china-req' }
];
const mapKey = ref('world-req');
const mapGeo = computed(() => (mapKey.value.startsWith('china') ? 'china' : 'world'));
const mapUnit = computed(() => (mapKey.value.endsWith('flux') ? 'bytes' : 'count'));

const countryData = (flux) => data[flux ? 'l7Flow_outFlux_country' : 'l7Flow_request_country'] || { data: [] };
const mapRows = computed(() => {
  const arr = countryData(mapKey.value.endsWith('flux')).data || [];
  if (mapKey.value.startsWith('china')) {
    return arr
      .map((r) => ({ name: resolveProvince(r.key), value: r.value }))
      .filter((r) => r.value > 0);
  }
  return arr
    .filter((r) => r.value > 0)
    .map((r) => ({ name: toCountryMapName(r.key), value: r.value }));
});

const mapTitle = computed(() => {
  const m = mapOptions.find((o) => o.value === mapKey.value);
  const sub = mapKey.value.startsWith('china') ? '省份请求数地理分布' : mapKey.value.endsWith('flux') ? '响应流量地理分布' : '请求数地理分布';
  return `${m?.label || ''}分布`;
});

/* 排行列表 */
function rowsOf(id, nameFn) {
  const m = data[id];
  if (!m || m.kind !== 'top') return [];
  return (m.data || []).map((r) => ({ name: nameFn ? nameFn(r.key) : r.key, value: r.value }));
}
const rankOutCountry = computed(() => rowsOf('l7Flow_outFlux_country', resolveCountry));
const rankReqCountry = computed(() => rowsOf('l7Flow_request_country', resolveCountry));
const rankOutProvince = computed(() => rowsOf('l7Flow_outFlux_province', resolveProvince));
const rankReqProvince = computed(() => rowsOf('l7Flow_request_province', resolveProvince));

/* KPI */
const covered = computed(() => rankReqCountry.value.length || '—');
function topOf(rows) {
  return rows.length ? rows[0] : null;
}
function pctOf(rows, item) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!item || !total) return '';
  return ((item.value / total) * 100).toFixed(1) + '%';
}
const topReqName = computed(() => {
  const t = topOf(rankReqCountry.value);
  return t ? t.name : '—';
});
const topReqPct = computed(() => pctOf(rankReqCountry.value, topOf(rankReqCountry.value)));
const topFluxName = computed(() => {
  const t = topOf(rankOutCountry.value);
  return t ? t.name : '—';
});
const topFluxPct = computed(() => pctOf(rankOutCountry.value, topOf(rankOutCountry.value)));
const topProvName = computed(() => {
  const t = topOf(rankReqProvince.value);
  return t ? t.name : '—';
});
const topProvPct = computed(() => pctOf(rankReqProvince.value, topOf(rankReqProvince.value)));
</script>

<style scoped>
.map-controls {
  display: flex;
  align-items: center;
}
</style>
