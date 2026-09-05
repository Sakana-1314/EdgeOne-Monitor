/**
 * src/types/router.d.ts —— vue-router RouteMeta 增强
 * 为路由 meta 提供确定的 title/public 字段，便于在守卫与视图里读取。
 */
import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题（用于 <title> 与菜单高亮） */
    title?: string;
    /** 是否免登录（如登录页） */
    public?: boolean;
  }
}
