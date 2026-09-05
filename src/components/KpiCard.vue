<template>
  <div class="kpi-card" :style="{ '--accent': color || 'var(--eo-primary)' }">
    <div class="kpi-top">
      <span v-if="icon" class="kpi-icon"><n-icon :component="icon" /></span>
      <span class="kpi-label">{{ label }}</span>
      <n-tooltip v-if="tip" trigger="hover">
        <template #trigger>
          <span class="kpi-tip"><n-icon :component="HelpCircleOutline" /></span>
        </template>
        {{ tip }}
      </n-tooltip>
    </div>

    <n-skeleton v-if="loading" text :repeat="1" style="width: 60%; margin-top: 10px" />
    <template v-else>
      <div class="kpi-value-row">
        <span class="kpi-value">{{ valueText }}</span>
        <span v-if="unitText" class="kpi-unit">{{ unitText }}</span>
      </div>
      <div v-if="error" class="kpi-error">{{ error }}</div>
      <div v-else-if="growth !== null && Number.isFinite(growth)" class="kpi-growth">
        <span class="kpi-growth-label">较上一周期</span>
        <span class="kpi-growth-badge" :class="growthClass">
          <n-icon :component="growth >= 0 ? ArrowUpOutline : ArrowDownOutline" />
          {{ Math.abs(growth).toFixed(2) }}%
        </span>
      </div>
      <div v-else class="kpi-sub">{{ sub || '·' }}</div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { HelpCircleOutline, ArrowUpOutline, ArrowDownOutline } from '@vicons/ionicons5';

const props = withDefaults(
  defineProps<{
    label: string;
    valueText?: string | number;
    unitText?: string;
    icon?: Component | null;
    color?: string;
    tip?: string;
    sub?: string;
    loading?: boolean;
    error?: string;
    /** 百分比，如 -5.2 */
    growth?: number | null;
    /** up | down：哪个方向算“好” */
    goodWhen?: 'up' | 'down';
  }>(),
  {
    valueText: '—',
    unitText: '',
    icon: null,
    color: '',
    tip: '',
    sub: '',
    loading: false,
    error: '',
    growth: null,
    goodWhen: 'down'
  }
);

const growthClass = computed<'flat' | 'good' | 'bad'>(() => {
  const up = (props.growth ?? 0) >= 0;
  const good = props.goodWhen === 'up' ? up : !up;
  if (props.growth === 0) return 'flat';
  return good ? 'good' : 'bad';
});
</script>

<style scoped>
.kpi-card {
  position: relative;
  padding: 14px 16px 12px;
  border-radius: var(--eo-radius, 6px);
  background: var(--eo-card);
  border: 1px solid var(--eo-border, rgba(128, 128, 128, 0.15));
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: box-shadow 0.2s, background-color 0.2s, border-color 0.2s;
}
.kpi-card:hover {
  box-shadow: 0 2px 8px rgba(1, 4, 9, 0.12);
}
.kpi-top {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--eo-text-2);
}
.kpi-icon {
  color: var(--accent);
  font-size: 16px;
  display: inline-flex;
}
.kpi-label {
  font-size: 13px;
  font-weight: 500;
}
.kpi-tip {
  color: var(--eo-text-3);
  display: inline-flex;
  cursor: help;
}
.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 8px;
  flex-wrap: wrap;
}
.kpi-value {
  font-size: 25px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1.15;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
}
.kpi-unit {
  font-size: 12px;
  color: var(--eo-text-2);
}
.kpi-growth {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.kpi-growth-label {
  font-size: 12px;
  color: var(--eo-text-3);
}
.kpi-growth-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
}
/* 与主题 success/error 变量对齐（用半透明底色弱化） */
.kpi-growth-badge.good {
  color: var(--eo-success, #16a34a);
  background: color-mix(in srgb, var(--eo-success, #16a34a) 14%, transparent);
}
.kpi-growth-badge.bad {
  color: var(--eo-error, #dc2626);
  background: color-mix(in srgb, var(--eo-error, #dc2626) 14%, transparent);
}
.kpi-growth-badge.flat {
  color: var(--eo-text-3);
  background: color-mix(in srgb, var(--eo-text-3) 14%, transparent);
}
.kpi-sub {
  margin-top: 10px;
  font-size: 12px;
  color: var(--eo-text-3);
}
.kpi-error {
  margin-top: 8px;
  font-size: 12px;
  color: var(--eo-error, #dc2626);
}
</style>
