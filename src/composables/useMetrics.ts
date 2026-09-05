/**
 * src/composables/useMetrics.ts —— 让视图与“全局查询条件”联动并自动拉取指标
 */
import { reactive, ref, shallowRef, watch, onMounted, onBeforeUnmount, type Ref, type ShallowRef } from 'vue';
import { api } from '../api/index';
import { useDashboardStore } from '../store/dashboard';
import { errText } from '../utils/format';
import type { MetricResult, MetricsData } from '../types/model';

/** useMetrics 选项 */
export interface UseMetricsOptions {
  /** 是否同时拉取上一周期用于环比（默认 true） */
  compare?: boolean;
  /** 限制查询跨度（天），超长窗口在 store 内被截断 */
  capDays?: number;
}

/** useMetrics 返回 */
export interface UseMetricsResult {
  data: Record<string, MetricResult | undefined>;
  loading: Ref<boolean>;
  error: Ref<string>;
  raw: Ref<MetricsData | null>;
  reload: () => Promise<void>;
}

/**
 * @param ids  指标 id 列表
 * @param opts { compare=true, capDays? } capDays 限制查询跨度
 */
export function useMetrics(ids: string[], opts: UseMetricsOptions = {}): UseMetricsResult {
  const dash = useDashboardStore();
  const data: Record<string, MetricResult | undefined> = reactive({} as Record<string, MetricResult | undefined>);
  const loading = ref(true);
  const error = ref('');
  const raw = ref<MetricsData | null>(null);
  let seq = 0;

  async function fetchData(): Promise<void> {
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
      if (my === seq) error.value = errText(e);
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

/** useLoader 返回 */
export interface UseLoaderResult<T> {
  value: ShallowRef<T | null>;
  loading: Ref<boolean>;
  error: Ref<string>;
  reload: () => Promise<void>;
}

/**
 * 一次性拉取并本地维护（如 Pages 接口等非 metrics 数据）
 */
export function useLoader<T>(fetcher: (dash: ReturnType<typeof useDashboardStore>) => Promise<T>): UseLoaderResult<T> {
  const dash = useDashboardStore();
  const value = shallowRef<T | null>(null);
  const loading = ref(true);
  const error = ref('');
  let seq = 0;

  async function load(): Promise<void> {
    const my = ++seq;
    loading.value = true;
    error.value = '';
    try {
      const v = await fetcher(dash);
      if (my === seq) value.value = v;
    } catch (e) {
      if (my === seq) error.value = errText(e);
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
