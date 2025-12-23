<template>
  <div id="app">
    <nav>
      <div class="nav-links">
        <router-link to="/">首頁</router-link>
        <router-link to="/pet-upload">寵物上架</router-link>
        <router-link to="/filter">條件篩選</router-link>
        <router-link to="/nearby">鄰近站點搜尋</router-link>
        <router-link v-if="isAdmin" to="/admin" class="admin-link">管理後台</router-link>
      </div>
      <div class="nav-user">
        <div v-if="!isAuthenticated" class="user-actions">
          <router-link to="/login" class="btn-auth">登入</router-link>
        </div>
        <div v-else class="user-info">
          <span class="user-name">{{ userData?.name || userData?.email || '使用者' }}</span>
          <button @click="handleLogout" class="btn-auth btn-logout">登出</button>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth.js';

const router = useRouter();
const { currentUser, userData, isAuthenticated, isAdmin, logout } = useAuth();

// 處理登出
async function handleLogout() {
  try {
    await logout();
    router.push('/');
  } catch (error) {
    console.error('登出失敗:', error);
  }
}
</script>

<style>
#app {
  font-family: Arial, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

nav {
  padding: 20px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.nav-links a {
  text-decoration: none;
  color: #42b983;
  font-weight: bold;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-links a:hover {
  background: #f0fdfa;
  color: #16a085;
}

.nav-links a.router-link-active {
  color: #2c3e50;
  background: #f3f4f6;
}

.admin-link {
  background: #fef3c7;
  color: #92400e;
  font-weight: 600;
}

.admin-link:hover {
  background: #fde68a;
  color: #78350f;
}

.admin-link.router-link-active {
  background: #fbbf24;
  color: #78350f;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-auth {
  padding: 8px 16px;
  background: #16a085;
  color: #ffffff;
  text-decoration: none;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  display: inline-block;
}

.btn-auth:hover {
  background: #13866f;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f3f4f6;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.user-name {
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
}

.btn-auth.btn-logout {
  background: #ef4444;
  padding: 6px 12px;
  font-size: 0.85rem;
}

.btn-auth.btn-logout:hover {
  background: #dc2626;
}

@media (max-width: 640px) {
  nav {
    flex-direction: column;
    align-items: flex-start;
  }

  .nav-links {
    width: 100%;
    justify-content: space-between;
  }

  .nav-user {
    width: 100%;
    justify-content: flex-end;
  }

  .user-info {
    flex-direction: column;
    gap: 8px;
    padding: 8px 12px;
  }
}
</style>
