<template>
  <div class="echart-wrap" :style="{ height: h }">
    <div ref="el" class="echart-el"></div>
    <n-spin v-if="loading" class="echart-spin" size="small" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  option: { type: Object, default: null },
  height: { type: [String, Number], default: '320px' },
  loading: { type: Boolean, default: false },
  notMerge: { type: Boolean, default: true }
});

const el = ref(null);
const h = computed(() => (typeof props.height === 'number' ? props.height + 'px' : props.height));

let chart = null;
let ro = null;

function apply() {
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
    ro = new ResizeObserver(() => chart && chart.resize());
    ro.observe(el.value);
  }
  window.addEventListener('resize', onWindowResize);
});

function onWindowResize() {
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
