/**
 * src/composables/useMetrics.js —— 让视图与“全局查询条件”联动并自动拉取指标
 */
import { reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { api } from '../api/index.js';
import { useDashboardStore } from '../store/dashboard.js';

/**
 * @param {string[]} ids      指标 id 列表
 * @param {object}   opts     { compare=true, capDays? } capDays 限制查询跨度
 */
export function useMetrics(ids, opts = {}) {
  const dash = useDashboardStore();
  const data = reactive({});
  const loading = ref(true);
  const error = ref('');
  const raw = ref({});
  let seq = 0;

  async function fetchData() {
    const my = ++seq;
    loading.value = true;
    error.value = '';
    const win = dash.getWindow({ capDays: opts.capDays });
    try {
      const res = await api.metrics(ids, { ...win, compare: opts.compare !== false });
      if (my !== seq) return;
      Object.keys(data).forEach((k) => delete data[k]);
      Object.assign(data, res.metrics || {});
      raw.value = { ...res };
    } catch (e) {
      if (my === seq) error.value = e.message;
    } finally {
      if (my === seq) loading.value = false;
    }
  }

  onMounted(() => fetchData());
  watch(() => dash.revision, () => fetchData());
  onBeforeUnmount(() => {
    seq += 1; // 使在途请求失效
  });

  return { data, loading, error, raw, reload: fetchData };
}

/**
 * 一次性拉取并本地维护（如 Pages 接口等非 metrics 数据）
 */
export function useLoader(fetcher) {
  const dash = useDashboardStore();
  const value = ref(null);
  const loading = ref(true);
  const error = ref('');
  let seq = 0;

  async function load() {
    const my = ++seq;
    loading.value = true;
    error.value = '';
    try {
      const v = await fetcher(dash);
      if (my === seq) value.value = v;
    } catch (e) {
      if (my === seq) error.value = e.message;
    } finally {
      if (my === seq) loading.value = false;
    }
  }
  onMounted(() => load());
  watch(() => dash.revision, () => load());
  onBeforeUnmount(() => {
    seq += 1;
  });
  return { value, loading, error, reload: load };
}
