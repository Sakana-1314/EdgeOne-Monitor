/**
 * src/types/shims-vue.d.ts —— 让 TS 能解析 .vue 模块导入（Vite 构建期负责真实转换）
 */
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>;
  export default component;
}
