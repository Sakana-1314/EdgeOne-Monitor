<template>
  <div class="seg" role="tablist">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="tab"
      class="seg-item"
      :class="{ active: o.value === modelValue }"
      @click="$emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  options: { type: Array, default: () => [] }, // [{ label, value }]
  modelValue: { type: [String, Number], default: '' }
});
defineEmits(['update:modelValue']);
</script>

<style scoped>
.seg {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  background: var(--eo-fill-1);
  border: 1px solid var(--eo-border);
  border-radius: var(--eo-radius, 6px);
}
.seg-item {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--eo-text-2);
  font-size: 12.5px;
  line-height: 1;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.seg-item:hover {
  color: var(--eo-text-1);
}
.seg-item.active {
  color: #fff;
  background: var(--eo-primary);
  box-shadow: 0 1px 3px rgba(1, 4, 9, 0.25);
}
</style>
