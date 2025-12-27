<template>
  <div class="login">
    <div class="login-container">
      <h1>登入會員</h1>

      <!-- 標籤切換 -->
      <div class="tabs">
        <button :class="['tab', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
          登入
        </button>
        <button :class="['tab', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
          註冊新帳號
        </button>
        <button :class="['tab', { active: activeTab === 'forgot' }]" @click="activeTab = 'forgot'">
          忘記密碼
        </button>
      </div>

      <!-- 登入表單 -->
      <div v-if="activeTab === 'login'" class="form-container">
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label for="login-email">電子郵件 <span class="required">*</span></label>
            <input id="login-email" v-model="loginForm.email" type="email" placeholder="請輸入您的電子郵件" required />
          </div>

          <div class="form-group">
            <label for="login-password">密碼 <span class="required">*</span></label>
            <input id="login-password" v-model="loginForm.password" type="password" placeholder="請輸入您的密碼" required />
          </div>

          <div v-if="loginErrors.length > 0" class="error-message">
            <ul>
              <li v-for="(error, index) in loginErrors" :key="index">{{ error }}</li>
            </ul>
          </div>

          <div v-if="loginSuccess" class="success-message">
            {{ loginSuccess }}
          </div>

          <button type="submit" :disabled="loginSubmitting" class="btn-primary">
            {{ loginSubmitting ? '登入中...' : '登入' }}
          </button>
        </form>
      </div>

      <!-- 註冊表單 -->
      <div v-if="activeTab === 'register'" class="form-container">
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label for="register-name">姓名 <span class="required">*</span></label>
            <input id="register-name" v-model="registerForm.name" type="text" placeholder="請輸入您的姓名" required />
          </div>

          <div class="form-group">
            <label for="register-email">電子郵件 <span class="required">*</span></label>
            <input id="register-email" v-model="registerForm.email" type="email" placeholder="請輸入您的電子郵件" required />
          </div>

          <div class="form-group">
            <label for="register-phone">聯絡電話</label>
            <input id="register-phone" v-model="registerForm.phone" type="tel" placeholder="例如：0912-345-678" />
          </div>

          <div class="form-group">
            <label for="register-password">密碼 <span class="required">*</span></label>
            <input id="register-password" v-model="registerForm.password" type="password" placeholder="至少 6 個字元"
              required minlength="6" />
          </div>

          <div class="form-group">
            <label for="register-password-confirm">確認密碼 <span class="required">*</span></label>
            <input id="register-password-confirm" v-model="registerForm.passwordConfirm" type="password"
              placeholder="請再次輸入密碼" required />
          </div>

          <div v-if="registerErrors.length > 0" class="error-message">
            <ul>
              <li v-for="(error, index) in registerErrors" :key="index">{{ error }}</li>
            </ul>
          </div>

          <div v-if="registerSuccess" class="success-message">
            {{ registerSuccess }}
          </div>

          <button type="submit" :disabled="registerSubmitting" class="btn-primary">
            {{ registerSubmitting ? '註冊中...' : '註冊' }}
          </button>
        </form>
      </div>

      <!-- 忘記密碼表單 -->
      <div v-if="activeTab === 'forgot'" class="form-container">
        <form @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-group">
            <label for="forgot-email">電子郵件 <span class="required">*</span></label>
            <input id="forgot-email" v-model="forgotForm.email" type="email" placeholder="請輸入您的電子郵件" required />
          </div>

          <div v-if="forgotErrors.length > 0" class="error-message">
            <ul>
              <li v-for="(error, index) in forgotErrors" :key="index">{{ error }}</li>
            </ul>
          </div>

          <div v-if="forgotSuccess" class="success-message">
            {{ forgotSuccess }}
          </div>

          <button type="submit" :disabled="forgotSubmitting" class="btn-primary">
            {{ forgotSubmitting ? '發送中...' : '發送密碼重設郵件' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { login, register, forgotPassword } from '../utils/auth.js';
import { getUserById } from '../utils/auth.js';

const router = useRouter();

// 當前活動的標籤
const activeTab = ref('login');

// 登入表單
const loginForm = reactive({
  email: '',
  password: ''
});
const loginErrors = ref([]);
const loginSuccess = ref('');
const loginSubmitting = ref(false);

// 註冊表單
const registerForm = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: ''
});
const registerErrors = ref([]);
const registerSuccess = ref('');
const registerSubmitting = ref(false);

// 忘記密碼表單
const forgotForm = reactive({
  email: ''
});
const forgotErrors = ref([]);
const forgotSuccess = ref('');
const forgotSubmitting = ref(false);

// 處理登入（UC-01）
async function handleLogin() {
  loginErrors.value = [];
  loginSuccess.value = '';
  loginSubmitting.value = true;

  try {
    const result = await login(loginForm.email, loginForm.password);

    if (result.success) {
      loginSuccess.value = result.message;

      // 取得使用者資料以檢查權限
      const userResult = await getUserById(result.user.userId);
      if (userResult.success) {
        const user = userResult.user;

        // 根據權限導向（UC-01）
        // 管理員導向後台，一般使用者導向平台首頁
        if (user.role === 'Admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        router.push('/');
      }
    } else {
      loginErrors.value.push(result.message);
      if (result.remainingAttempts !== undefined) {
        loginErrors.value.push(`剩餘嘗試次數：${result.remainingAttempts}`);
      }
    }
  } catch (error) {
    console.error('登入失敗:', error);
    loginErrors.value.push(`登入失敗: ${error.message}`);
  } finally {
    loginSubmitting.value = false;
  }
}

// 處理註冊（UC-01）
async function handleRegister() {
  registerErrors.value = [];
  registerSuccess.value = '';
  registerSubmitting.value = true;

  try {
    // 驗證密碼確認
    if (registerForm.password !== registerForm.passwordConfirm) {
      registerErrors.value.push('密碼與確認密碼不一致');
      registerSubmitting.value = false;
      return;
    }

    const result = await register(
      registerForm.email,
      registerForm.password,
      {
        name: registerForm.name,
        phone: registerForm.phone,
        role: 'User'
      }
    );

    if (result.success) {
      registerSuccess.value = result.message;
      // 註冊成功後，切換到登入標籤，讓用戶手動登入
      // 等待 1 秒讓用戶看到成功訊息，然後切換到登入標籤
      setTimeout(() => {
        activeTab.value = 'login';
        loginForm.email = registerForm.email;
        // 清空註冊表單
        registerForm.name = '';
        registerForm.email = '';
        registerForm.phone = '';
        registerForm.password = '';
        registerForm.passwordConfirm = '';
      }, 1000);
    } else {
      registerErrors.value.push(result.message);
    }
  } catch (error) {
    console.error('註冊失敗:', error);
    registerErrors.value.push(`註冊失敗: ${error.message}`);
  } finally {
    registerSubmitting.value = false;
  }
}

// 處理忘記密碼（UC-01）
async function handleForgotPassword() {
  forgotErrors.value = [];
  forgotSuccess.value = '';
  forgotSubmitting.value = true;

  try {
    const result = await forgotPassword(forgotForm.email);

    if (result.success) {
      forgotSuccess.value = result.message;
      // 3 秒後清空表單
      setTimeout(() => {
        forgotForm.email = '';
      }, 3000);
    } else {
      forgotErrors.value.push(result.message);
    }
  } catch (error) {
    console.error('發送密碼重設郵件失敗:', error);
    forgotErrors.value.push(`發送失敗: ${error.message}`);
  } finally {
    forgotSubmitting.value = false;
  }
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-container {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  width: 100%;
}

h1 {
  text-align: center;
  color: #111827;
  margin: 0 0 32px;
  font-size: 1.75rem;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 32px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}

.tab:hover {
  color: #16a085;
}

.tab.active {
  color: #16a085;
  border-bottom-color: #16a085;
}

.form-container {
  margin-top: 24px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.required {
  color: #ef4444;
}

input[type="text"],
input[type="email"],
input[type="tel"],
input[type="password"] {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #16a085;
  box-shadow: 0 0 0 3px rgba(22, 160, 133, 0.1);
}

.error-message {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #fca5a5;
}

.error-message ul {
  margin: 0;
  padding-left: 20px;
}

.success-message {
  background: #dcfce7;
  color: #166534;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #86efac;
}

.btn-primary {
  padding: 12px 24px;
  background: #16a085;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #13866f;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .login-container {
    padding: 24px 16px;
  }

  .tabs {
    flex-direction: column;
    gap: 0;
  }

  .tab {
    border-bottom: 1px solid #e5e7eb;
    border-radius: 0;
    margin-bottom: 0;
  }

  .tab.active {
    border-bottom-color: #16a085;
    background: #f0fdfa;
  }
}
</style>
