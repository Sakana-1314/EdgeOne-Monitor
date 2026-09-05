<template>
  <div class="geo-map">
    <EChart :option="ready ? option : null" :loading="loading" :height="height" />
    <n-empty v-if="ready && !rows.length" size="small" description="暂无地图数据" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none" />
    <n-alert v-else-if="mapError" type="warning" size="small" style="margin-top:6px">{{ mapError }}</n-alert>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import EChart from './EChart.vue';
import { ensureMaps, buildMapOption } from '../utils/chart.js';

const props = defineProps({
  mapName: { type: String, default: 'world' }, // world | china
  rows: { type: Array, default: () => [] }, // [{ name, value }]
  dark: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  height: { type: [String, Number], default: 420 },
  unit: { type: String, default: 'count' }
});

const ready = ref(false);
const mapError = ref('');

onMounted(async () => {
  try {
    await ensureMaps();
    ready.value = true;
  } catch (e) {
    mapError.value = '地图数据加载失败：' + e.message;
  }
});

const option = computed(() => {
  if (!props.rows.length) return null;
  return buildMapOption(props.mapName, props.rows, { dark: props.dark, unit: props.unit });
});
</script>

<style scoped>
.geo-map { position: relative; width: 100%; }
</style>
