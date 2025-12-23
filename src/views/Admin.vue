<template>
  <div class="admin-page">
    <div class="admin-container">
      <h1>管理後台</h1>
      <div class="admin-content">
        <div class="welcome-section">
          <p>歡迎，{{ userData?.name || userData?.email || '管理員' }}！</p>
          <p class="role-badge">角色：{{ userData?.role || 'Admin' }}</p>
        </div>

        <div class="admin-sections">
          <div class="section-card">
            <h2>待審核寵物</h2>
            <p>管理待審核的寵物上架申請</p>
            <p class="coming-soon">功能開發中...</p>
          </div>

          <div class="section-card">
            <h2>待審核領養申請</h2>
            <p>管理待審核的領養申請</p>
            <p class="coming-soon">功能開發中...</p>
          </div>

          <div class="section-card">
            <h2>使用者管理</h2>
            <p>管理使用者帳號與權限</p>
            <p class="coming-soon">功能開發中...</p>
          </div>
        </div>

        <div class="admin-actions">
          <button @click="handleLogout" class="btn-logout">登出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';

const router = useRouter();
const { userData, logout } = useAuth();

// 處理登出
async function handleLogout() {
  try {
    await logout();
    router.push('/');
  } catch (error) {
    console.error('登出失敗:', error);
  }
}

onMounted(() => {
  // 確保只有管理員可以訪問
  if (userData.value?.role !== 'Admin') {
    router.push('/');
  }
});
</script>

<style scoped>
.admin-page {
  min-height: 100vh;
  background: #f9fafb;
  padding: 40px 20px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 2rem;
  color: #111827;
  margin-bottom: 32px;
  text-align: center;
}

.admin-content {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.welcome-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.welcome-section p {
  font-size: 1.1rem;
  color: #374151;
  margin: 8px 0;
}

.role-badge {
  display: inline-block;
  padding: 6px 12px;
  background: #16a085;
  color: #ffffff;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 8px;
}

.admin-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.section-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
}

.section-card:hover {
  border-color: #16a085;
  box-shadow: 0 4px 12px rgba(22, 160, 133, 0.1);
}

.section-card h2 {
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 12px;
}

.section-card p {
  color: #6b7280;
  margin: 8px 0;
  font-size: 0.95rem;
}

.coming-soon {
  color: #9ca3af;
  font-style: italic;
  margin-top: 16px;
}

.admin-actions {
  display: flex;
  justify-content: center;
  padding-top: 24px;
  border-top: 2px solid #e5e7eb;
}

.btn-logout {
  padding: 12px 24px;
  background: #ef4444;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-logout:hover {
  background: #dc2626;
}

@media (max-width: 640px) {
  .admin-container {
    padding: 0;
  }

  .admin-content {
    padding: 24px 16px;
  }

  .admin-sections {
    grid-template-columns: 1fr;
  }
}
</style>

