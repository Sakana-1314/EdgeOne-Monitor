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

<script setup>
import { computed } from 'vue';
import PanelCard from '../components/PanelCard.vue';
import TopRankList from '../components/TopRankList.vue';
import { useMetrics } from '../composables/useMetrics.js';
import { meta } from '../config/metrics.js';
import { formatByUnit } from '../utils/format.js';

const props = defineProps({
  dim: { type: String, default: 'flux' } // flux | req
});

const DIMS = [
  'statusCode', 'domain', 'url', 'resourceType', 'sip', 'referers',
  'ua_device', 'ua_browser', 'ua_os', 'ua'
];

const ids = computed(() => {
  const prefix = props.dim === 'flux' ? 'l7Flow_outFlux_' : 'l7Flow_request_';
  return DIMS.map((s) => prefix + s);
});
const unit = computed(() => (props.dim === 'flux' ? 'bytes' : 'count'));

const { data, loading, error } = useMetrics(ids.value, { compare: false });

const cards = computed(() => DIMS.map((s) => {
  const id = ids.value[DIMS.indexOf(s)];
  const m = meta(id);
  return { id, label: m.label, color: m.color };
}));

function displayKey(id, key) {
  if (id.endsWith('_referers') && key === '-') return '（直接访问 / 无 Referer）';
  return String(key);
}

function rowsOf(id) {
  const m = data[id];
  if (!m || m.kind !== 'top' || !Array.isArray(m.data)) return [];
  return m.data.map((r) => ({ name: displayKey(id, r.key), value: r.value }));
}

function fmtOf(id) {
  return (v) => formatByUnit(v, unit.value);
}
</script>

<style scoped>
.top-loading { padding: 8px 2px; }
</style>
