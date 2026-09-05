<template>
  <div class="echart-wrap" :style="{ height: h }">
    <div ref="el" class="echart-el"></div>
    <n-spin v-if="loading" class="echart-spin" size="small" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';

const props = withDefaults(
  defineProps<{
    option: EChartsOption | null;
    height?: string | number;
    loading?: boolean;
    notMerge?: boolean;
  }>(),
  {
    option: null,
    height: '320px',
    loading: false,
    notMerge: true
  }
);

const el = ref<HTMLDivElement | null>(null);
const h = computed<string>(() => (typeof props.height === 'number' ? props.height + 'px' : props.height || '320px'));

let chart: ReturnType<typeof echarts.init> | null = null;
let ro: ResizeObserver | null = null;

function apply(): void {
  if (!chart) return;
  if (props.option) {
    chart.setOption(props.option, { notMerge: props.notMerge });
  } else {
    chart.clear();
  }
}

onMounted(() => {
  if (!el.value) return;
  chart = echarts.init(el.value);
  apply();
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => {
      if (chart) chart.resize();
    });
    ro.observe(el.value);
  }
  window.addEventListener('resize', onWindowResize);
});

function onWindowResize(): void {
  if (chart) {
    try {
      chart.resize();
    } catch {
      /* ignore */
    }
  }
}

watch(() => props.option, apply, { deep: false });

onBeforeUnmount(() => {
  window.removeEventListener('resize', onWindowResize);
  if (ro) ro.disconnect();
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<style scoped>
.echart-wrap {
  position: relative;
  width: 100%;
}
.echart-el {
  width: 100%;
  height: 100%;
}
.echart-spin {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}
</style>
