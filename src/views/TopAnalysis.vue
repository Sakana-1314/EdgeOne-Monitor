<template>
  <div class="page">
    <div class="top-head">
      <Segmented
        v-model="dim"
        :options="[
          { label: '响应流量维度', value: 'flux' },
          { label: '请求数维度', value: 'req' }
        ]"
      />
      <span class="top-note">国家 / 地区与国内省份排行请查看「地区分布」页</span>
    </div>

    <TopDimension :key="dim" :dim="dim" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Segmented from '../components/Segmented.vue';
import TopDimension from './TopDimension.vue';

const dim = ref('flux');
</script>

<style scoped>
.top-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.top-note {
  font-size: 12px;
  color: var(--eo-text-3);
}
</style>
