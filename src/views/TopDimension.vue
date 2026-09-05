<template>
  <div>
    <div v-if="loading" class="top-loading">
      <n-skeleton text :repeat="4" />
    </div>
    <n-alert v-else-if="error" type="warning" style="margin-bottom: 12px">{{ error }}</n-alert>

    <div v-else class="grid-2">
      <PanelCard v-for="c in cards" :key="c.id" :title="c.label" :color="c.color">
        <TopRankList
          :rows="rowsOf(c.id)"
          :unit="unit"
          :loading="false"
          :top-n="8"
          :color="c.color"
          :fmt="fmtOf(c.id)"
        />
      </PanelCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import PanelCard from '../components/PanelCard.vue';
import TopRankList from '../components/TopRankList.vue';
import { useMetrics } from '../composables/useMetrics';
import { meta } from '../config/metrics';
import { formatByUnit } from '../utils/format';
import type { MetricUnit } from '../types/model';

type TopDim = 'flux' | 'req';

/** 排行面板元数据 */
interface CardDef {
  id: string;
  label: string;
  color: string;
}

const props = withDefaults(
  defineProps<{
    /** flux | req */
    dim?: TopDim;
  }>(),
  { dim: 'flux' }
);

const DIMS = [
  'statusCode', 'domain', 'url', 'resourceType', 'sip', 'referers',
  'ua_device', 'ua_browser', 'ua_os', 'ua'
];

const ids = computed<string[]>(() => {
  const prefix = props.dim === 'flux' ? 'l7Flow_outFlux_' : 'l7Flow_request_';
  return DIMS.map((s) => prefix + s);
});
const unit = computed<MetricUnit>(() => (props.dim === 'flux' ? 'bytes' : 'count'));

const { data, loading, error } = useMetrics(ids.value, { compare: false });

const cards = computed<CardDef[]>(() =>
  DIMS.map((s) => {
    const id = ids.value[DIMS.indexOf(s)];
    const m = meta(id);
    return { id, label: m.label, color: m.color };
  })
);

function displayKey(id: string, key: string): string {
  if (id.endsWith('_referers') && key === '-') return '（直接访问 / 无 Referer）';
  return String(key);
}

function rowsOf(id: string): Array<{ name: string; value: number }> {
  const m = data[id];
  if (!m || m.kind !== 'top' || !Array.isArray(m.data)) return [];
  return m.data.map((r) => ({ name: displayKey(id, r.key), value: r.value }));
}

function fmtOf(id: string): (value: number) => string {
  return (v) => formatByUnit(v, unit.value);
}
</script>

<style scoped>
.top-loading { padding: 8px 2px; }
</style>
