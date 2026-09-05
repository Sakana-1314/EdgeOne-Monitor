<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-aside">
        <div class="login-logo">
          <img class="brand-logo-img" src="/logo.png" alt="EdgeOne" />
          <div>
            <div class="login-name">{{ app.siteName || 'EdgeOne 监控大屏' }}</div>
            <div class="login-slogan">边缘加速 · 实时可观测</div>
          </div>
        </div>
        <ul class="login-feats">
          <li><n-icon :component="CheckmarkCircleOutline" /> 站点流量 · 带宽 · 请求 · 回源全维度分析</li>
          <li><n-icon :component="CheckmarkCircleOutline" /> 全球 / 国内地区分布可视化</li>
          <li><n-icon :component="CheckmarkCircleOutline" /> 安全防护 · 边缘函数 · Pages 应用监控</li>
          <li><n-icon :component="CheckmarkCircleOutline" /> 桌面 / 移动端 · 深色 / 浅色模式自适应</li>
        </ul>
        <div class="login-foot">后端运行于 边缘函数（Edge Functions）</div>
      </div>

      <div class="login-form-side">
        <div class="form-head">
          <h1>管理员登录</h1>
          <p>请输入管理员账号密码登录</p>
        </div>

        <n-alert v-if="error" type="error" :show-icon="false" closable @close="error = ''" style="margin-bottom: 12px">
          {{ error }}
        </n-alert>

        <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" size="large">
          <n-form-item label="账号" path="username">
            <n-input v-model:value="form.username" placeholder="请输入账号">
              <template #prefix><n-icon :component="PersonOutline" /></template>
            </n-input>
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="form.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              @keyup.enter="submit"
            >
              <template #prefix><n-icon :component="LockClosedOutline" /></template>
            </n-input>
          </n-form-item>
          <n-button
            type="primary"
            block
            size="large"
            :loading="loading"
            @click="submit"
            class="login-btn"
          >
            登 录
          </n-button>
        </n-form>

        <div class="login-tip">
          登录态有效期 7 天 · 支持深色 / 浅色模式
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMessage } from 'naive-ui';
import { PersonOutline, LockClosedOutline, CheckmarkCircleOutline } from '@vicons/ionicons5';
import { useAppStore } from '../store/app.js';

const router = useRouter();
const route = useRoute();
const app = useAppStore();
const message = useMessage();

const formRef = ref(null);
const form = reactive({ username: 'admin', password: '' });
const loading = ref(false);
const error = ref('');

const rules = {
  username: { required: true, message: '请输入账号', trigger: ['blur', 'input'] },
  password: { required: true, message: '请输入密码', trigger: ['blur', 'input'] }
};

async function submit() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    await app.login(form.username.trim(), form.password);
    message.success('登录成功，欢迎回来');
    const redirect = route.query.redirect ? String(route.query.redirect) : '/';
    router.replace(redirect);
  } catch (e) {
    error.value = e.message || '登录失败';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!app.booted) app.boot();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(1200px 500px at 10% -10%, rgba(47, 129, 247, 0.16), transparent 60%),
    radial-gradient(900px 500px at 110% 110%, rgba(88, 166, 255, 0.12), transparent 55%),
    var(--eo-bg);
}
.login-card {
  width: 860px;
  max-width: 100%;
  min-height: 520px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 12px;
  overflow: hidden;
  background: var(--eo-card);
  border: 1px solid var(--eo-border);
  box-shadow: 0 24px 60px rgba(1, 4, 9, 0.2);
}
.login-aside {
  background:
    radial-gradient(420px 260px at 15% 0%, rgba(47, 129, 247, 0.24), transparent 60%),
    linear-gradient(160deg, #0d1117, #161b22 58%, #101d33);
  color: #e6edf3;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.login-aside::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(47, 129, 247, 0.35), transparent 70%);
  right: -80px;
  bottom: -80px;
}
.login-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo-img {
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 6px 16px rgba(1, 4, 9, 0.4);
}
.login-name { font-size: 17px; font-weight: 700; }
.login-slogan { font-size: 12px; opacity: 0.7; }
.login-feats {
  margin: 36px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 13px;
  opacity: 0.92;
  position: relative;
  z-index: 1;
}
.login-feats li {
  display: flex;
  align-items: center;
  gap: 8px;
}
.login-feats .n-icon { color: #3fb950; font-size: 16px; }
.login-foot {
  margin-top: auto;
  font-size: 12px;
  opacity: 0.55;
  position: relative;
  z-index: 1;
}

.login-form-side {
  padding: 42px 36px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.form-head h1 { margin: 0 0 6px; font-size: 22px; color: var(--eo-text-1); }
.form-head p {
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--eo-text-3);
}
.form-head b, .login-tip code, .form-head code {
  background: var(--eo-fill-1);
  border-radius: 4px;
  padding: 0 6px;
  font-family: inherit;
}
.login-btn {
  margin-top: 8px;
}
.login-tip {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--eo-text-3);
}
.login-tip code {
  background: var(--eo-fill-1);
  padding: 1px 6px;
  border-radius: 4px;
}

@media (max-width: 720px) {
  .login-aside { display: none; }
  .login-card { grid-template-columns: 1fr; width: 420px; }
  .login-form-side { padding: 32px 24px; }
}
</style>
