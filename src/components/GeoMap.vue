<template>
  <div class="geo-map">
    <EChart :option="ready ? option : null" :loading="loading" :height="height" />
    <n-empty v-if="ready && !rows.length" size="small" description="暂无地图数据" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none" />
    <n-alert v-else-if="mapError" type="warning" size="small" style="margin-top:6px">{{ mapError }}</n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import EChart from './EChart.vue';
import { ensureMaps, buildMapOption } from '../utils/chart';
import type { MapDatum } from '../utils/chart';
import type { MetricUnit } from '../types/model';
import { errText } from '../utils/format';

const props = withDefaults(
  defineProps<{
    mapName?: 'world' | 'china';
    rows?: MapDatum[];
    dark?: boolean;
    loading?: boolean;
    height?: string | number;
    unit?: MetricUnit;
  }>(),
  {
    mapName: 'world',
    rows: () => [],
    dark: false,
    loading: false,
    height: 420,
    unit: 'count'
  }
);

const ready = ref(false);
const mapError = ref('');

onMounted(async () => {
  try {
    await ensureMaps();
    ready.value = true;
  } catch (e) {
    mapError.value = '地图数据加载失败：' + errText(e);
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
