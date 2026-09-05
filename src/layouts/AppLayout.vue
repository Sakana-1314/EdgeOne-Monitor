<template>
  <div class="app-layout" :class="{ 'is-mobile': isMobile }">
    <!-- 桌面端：左侧 Tab 栏 -->
    <aside v-if="!isMobile" class="sider" :class="{ collapsed }">
      <div class="brand" :class="{ collapsed }" @click="router.push('/region')">
        <span class="brand-logo"><n-icon :component="LogoEdgeoneIcon" /></span>
        <transition name="fade">
          <div v-if="!collapsed" class="brand-text">
            <span class="brand-title">{{ app.siteName }}</span>
            <span class="brand-sub">EdgeOne 实时监控</span>
          </div>
        </transition>
      </div>
      <div class="sider-menu">
        <n-menu
          :value="activeKey"
          :options="menuOptions"
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="20"
          @update:value="onMenu"
        />
      </div>
      <div class="sider-foot" v-if="!collapsed">
        <n-tag size="small" :bordered="false" :type="app.demo ? 'warning' : 'success'">
          {{ app.demo ? '演示数据' : '实时数据' }}
        </n-tag>
        <n-tag size="small" :bordered="false" type="info">v{{ app.version || '2.0' }}</n-tag>
      </div>
    </aside>

    <!-- 移动端抽屉导航 -->
    <n-drawer v-model:show="drawerOpen" placement="left" :width="268">
      <div class="drawer-brand">
        <span class="brand-logo"><n-icon :component="LogoEdgeoneIcon" /></span>
        <div class="brand-text">
          <span class="brand-title">{{ app.siteName }}</span>
          <span class="brand-sub">EdgeOne 实时监控</span>
        </div>
      </div>
      <n-menu :value="activeKey" :options="menuOptions" @update:value="onMenuMobile" />
    </n-drawer>

    <!-- 主区域 -->
    <div class="main-area">
      <header class="app-header">
        <div class="header-line">
          <div class="h-left">
            <n-button quaternary circle class="menu-btn" @click="isMobile ? (drawerOpen = true) : (collapsed = !collapsed)">
              <template #icon><n-icon :component="isMobile ? MenuOutline : collapsed ? MenuOutline : MenuOutline" /></template>
            </n-button>
            <span v-if="isMobile" class="h-brand">{{ app.siteName }}</span>
            <span v-else class="h-title">{{ currentTab?.title || '' }}</span>
          </div>
          <div class="h-right">
            <n-tag class="mode-tag" size="small" :bordered="false" :type="app.demo ? 'warning' : 'success'">
              {{ app.demo ? '演示' : '实时' }}
            </n-tag>
            <n-tooltip>
              <template #trigger>
                <n-button quaternary circle @click="app.toggleTheme()">
                  <template #icon><n-icon :component="app.isDark ? SunnyOutline : MoonOutline" /></template>
                </n-button>
              </template>
              {{ app.isDark ? '切换到浅色模式' : '切换到深色模式' }}
            </n-tooltip>
            <n-dropdown trigger="click" :options="userMenuOptions" @select="onUserMenu">
              <n-button quaternary circle>
                <template #icon><n-icon :component="PersonCircleOutline" /></template>
              </n-button>
            </n-dropdown>
          </div>
        </div>

        <div class="controls-line">
          <n-select
            v-model:value="dash.rangeKey"
            :options="rangeOptions"
            size="small"
            class="ctl-range"
            @update:value="onRange"
          />
          <n-select
            v-model:value="dash.interval"
            :options="intervalOptions"
            size="small"
            class="ctl-interval"
            @update:value="onInterval"
          />
          <n-select
            v-model:value="dash.zoneId"
            :options="zoneOptions"
            size="small"
            class="ctl-zone"
            filterable
            @update:value="onZone"
          />
          <n-button size="small" @click="dash.bump()" class="ctl-refresh">
            <template #icon><n-icon :component="RefreshOutline" /></template>
            <span class="ref-label">刷新</span>
          </n-button>
          <n-select
            v-model:value="dash.autoRefresh"
            :options="autoOptions"
            size="small"
            class="ctl-auto"
            @update:value="dash.setAutoRefresh"
          />
          <span class="ctl-time">更新于 {{ lastTime }}</span>
        </div>
      </header>

      <!-- 自定义时间范围 -->
      <n-modal v-model:show="showCustom" preset="dialog" title="自定义时间范围" :show-icon="false" style="width: 380px; max-width: 92vw">
        <div class="custom-form">
          <div class="custom-row">
            <n-input-number v-model:value="customForm.d" :min="0" :max="31" size="small" style="width: 84px" />
            <span class="custom-unit">天</span>
            <n-input-number v-model:value="customForm.h" :min="0" :max="23" size="small" style="width: 84px" />
            <span class="custom-unit">小时</span>
            <n-input-number v-model:value="customForm.m" :min="0" :max="59" size="small" style="width: 84px" />
            <span class="custom-unit">分钟</span>
          </div>
          <div class="custom-hint">
            当前所选时长约 {{ customDurText }}（最多 31 天）
          </div>
        </div>
        <template #action>
          <n-button size="small" @click="showCustom = false">取消</n-button>
          <n-button size="small" type="primary" @click="applyCustom">应用</n-button>
        </template>
      </n-modal>

      <main class="content">
        <div class="tab-hero" v-if="currentTab">
          <div class="tab-hero-text">
            <h2>{{ currentTab.label }}</h2>
            <p>{{ currentTab.desc }}</p>
          </div>
          <div class="tab-hero-badge">
            <span>{{ dash.rangeLabel }}</span>
            <i></i>
            <span>粒度 {{ intervalLabel }}</span>
          </div>
        </div>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <footer class="app-footer">
        {{ app.siteName }} · 前端 Vue3 + NaiveUI + ECharts · 后端边缘函数 (EdgeOne Pages Functions / Edge Functions)
      </footer>
    </div>
  </div>
</template>

<script setup>
import { h, ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NIcon, useMessage } from 'naive-ui';
import {
  EarthOutline, PulseOutline, StatsChartOutline, GitNetworkOutline, ShieldCheckmarkOutline,
  ConstructOutline, AlbumsOutline, TrophyOutline, MenuOutline, SunnyOutline, MoonOutline,
  RefreshOutline, PersonCircleOutline, LogOutOutline, RocketOutline
} from '@vicons/ionicons5';
import { useAppStore } from '../store/app.js';
import { useDashboardStore, RANGES, INTERVALS } from '../store/dashboard.js';
import { TABS } from '../config/tabs.js';

const router = useRouter();
const route = useRoute();
const app = useAppStore();
const dash = useDashboardStore();
const message = useMessage();

const LogoEdgeoneIcon = RocketOutline;

/* ---------- 响应式 ---------- */
const isMobile = ref(false);
function checkMobile() {
  isMobile.value = window.matchMedia('(max-width: 900px)').matches;
}
let mq;
function bindMq() {
  mq = window.matchMedia('(max-width: 900px)');
  mq.addEventListener('change', checkMobile);
}
onMounted(() => {
  checkMobile();
  bindMq();
  if (app.isLoggedIn) dash.loadZones();
});
onBeforeUnmount(() => mq && mq.removeEventListener('change', checkMobile));

/* ---------- 菜单 ---------- */
const ICONS = {
  EarthOutline, PulseOutline, StatsChartOutline, GitNetworkOutline, ShieldCheckmarkOutline,
  ConstructOutline, AlbumsOutline, TrophyOutline
};
const menuOptions = TABS.map((t) => ({
  label: t.label,
  key: t.path,
  icon: () => h(NIcon, { component: ICONS[t.icon] })
}));
const activeKey = computed(() => {
  const hit = TABS.find((t) => route.path.startsWith(t.path));
  return hit ? hit.path : '/region';
});
const currentTab = computed(() => TABS.find((t) => t.path === activeKey.value));

function onMenu(key) {
  if (route.path !== key) router.push(key);
}
function onMenuMobile(key) {
  drawerOpen.value = false;
  if (route.path !== key) router.push(key);
}

/* ---------- 工具栏 ---------- */
const collapsed = ref(false);
const drawerOpen = ref(false);
const rangeOptions = RANGES.map((r) => ({ label: r.label, value: r.key }));
const intervalOptions = INTERVALS.map((r) => ({ label: r.label, value: r.key }));
const autoOptions = [
  { label: '自动刷新: 关', value: 0 },
  { label: '30 秒', value: 30 },
  { label: '1 分钟', value: 60 },
  { label: '5 分钟', value: 300 }
];
const intervalLabel = computed(() => INTERVALS.find((i) => i.key === dash.interval)?.label || '自动');
const zoneOptions = computed(() => dash.zonesWithAll.map((z) => ({ label: z.name, value: z.id })));
const lastTime = ref('--:--:--');

function onRange() {
  if (dash.rangeKey === 'custom') {
    openCustomOnce();
    return;
  }
  dash.bump();
}
function onInterval() {
  dash.bump();
}
function onZone() {
  dash.bump();
}

/* 自定义时间范围 */
const showCustom = ref(false);
const customForm = ref({ d: 0, h: 0, m: 0 });
function openCustomOnce() {
  customForm.value = { ...dash.custom };
  showCustom.value = true;
}
const customDurText = computed(() => {
  const c = customForm.value || {};
  const ms = ((c.d * 24 + (c.h || 0)) * 60 + (c.m || 0)) * 60000;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  const parts = [];
  if (d) parts.push(`${d} 天`);
  if (h) parts.push(`${h} 小时`);
  if (m || !parts.length) parts.push(`${m} 分钟`);
  return parts.join(' ');
});
function applyCustom() {
  dash.applyCustom({ ...customForm.value });
  showCustom.value = false;
}

/* 自动刷新 */
let timer = null;
watch(
  () => dash.autoRefresh,
  (v) => {
    clearInterval(timer);
    if (v > 0) timer = setInterval(() => dash.bump(), v * 1000);
  },
  { immediate: true }
);
watch(
  () => dash.refreshedAt,
  (v) => {
    if (v) {
      const d = new Date(v);
      const p = (x) => String(x).padStart(2, '0');
      lastTime.value = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    }
  },
  { immediate: true }
);
onBeforeUnmount(() => clearInterval(timer));

/* 用户菜单 */
const userMenuOptions = [
  { label: 'admin（管理员）', key: 'who', disabled: true },
  { type: 'divider', key: 'd1' },
  { label: '退出登录', key: 'logout', icon: () => h(NIcon, { component: LogOutOutline }) }
];
function onUserMenu(key) {
  if (key === 'logout') {
    app.logout();
    message.success('已退出登录');
    router.push('/login');
  }
}

/* 主题变化时按需加载站点（登录成功后才调用） */
watch(
  () => app.isLoggedIn,
  (v) => {
    if (v) dash.loadZones();
  }
);
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--eo-bg);
}

/* 侧栏 */
.sider {
  position: sticky;
  top: 0;
  height: 100vh;
  flex: 0 0 232px;
  width: 232px;
  display: flex;
  flex-direction: column;
  background: var(--eo-card);
  border-right: 1px solid var(--eo-border);
  transition: flex-basis 0.2s, width 0.2s;
  overflow: hidden;
  z-index: 20;
}
.sider.collapsed {
  flex-basis: 64px;
  width: 64px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--eo-border);
}
.brand.collapsed {
  justify-content: center;
  padding: 14px 0;
}
.brand-logo {
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #fff;
  font-size: 20px;
  background: linear-gradient(135deg, #2f6bff, #7c5cff);
  box-shadow: 0 4px 12px rgba(47, 107, 255, 0.35);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
  overflow: hidden;
}
.brand-title {
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--eo-text-1);
}
.brand-sub {
  font-size: 11px;
  color: var(--eo-text-3);
  white-space: nowrap;
}
.sider-menu {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
.sider-foot {
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--eo-border);
}

/* 主区域 */
.main-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 15;
  background: var(--eo-card);
  border-bottom: 1px solid var(--eo-border);
  padding: 8px 18px;
  backdrop-filter: blur(6px);
}
.header-line {
  display: flex;
  align-items: center;
  gap: 12px;
}
.h-left {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.menu-btn { color: var(--eo-text-1); }
.h-brand {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.h-title {
  font-weight: 600;
  color: var(--eo-text-1);
}
.h-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.mode-tag { margin-right: 4px; }

.controls-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.ctl-range { width: 138px; }
.ctl-interval { width: 116px; }
.ctl-zone { width: 200px; }
.ctl-auto { width: 120px; }
.ctl-refresh { margin-right: 2px; }
.ctl-time {
  font-size: 12px;
  color: var(--eo-text-3);
  margin-left: auto;
  white-space: nowrap;
}
.ref-label { margin-left: 4px; }

/* 内容 */
.content {
  flex: 1;
  padding: 16px 18px 8px;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
}
.tab-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.tab-hero-text h2 {
  margin: 0 0 2px;
  font-size: 20px;
  font-weight: 700;
  color: var(--eo-text-1);
}
.tab-hero-text p {
  margin: 0;
  font-size: 13px;
  color: var(--eo-text-3);
}
.tab-hero-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--eo-text-2);
  background: var(--eo-fill-1);
  padding: 4px 12px;
  border-radius: 999px;
  white-space: nowrap;
}
.tab-hero-badge i {
  width: 1px;
  height: 12px;
  background: var(--eo-border);
}
.app-footer {
  padding: 10px 18px;
  text-align: center;
  font-size: 12px;
  color: var(--eo-text-3);
  border-top: 1px solid var(--eo-border);
}

.drawer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px;
  border-bottom: 1px solid var(--eo-border);
}

/* 窄屏适配 */
@media (max-width: 760px) {
  .app-header { padding: 8px 10px; }
  .content { padding: 12px 10px 4px; }
  .tab-hero { flex-direction: column; align-items: flex-start; gap: 6px; }
  .ctl-zone { width: 150px; }
  .ctl-range { width: 126px; }
  .ctl-interval { width: 104px; }
  .ctl-auto { width: 108px; }
  .ctl-time { display: none; }
  .mode-tag { display: none; }
  .tab-hero-badge { display: none; }
}
</style>
