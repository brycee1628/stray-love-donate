<template>
  <div id="app">
    <nav>
      <div class="nav-links">
        <router-link to="/">首頁</router-link>
        <router-link to="/pet-upload">寵物上架</router-link>
        <router-link to="/filter">條件篩選</router-link>
        <router-link to="/nearby">站點搜尋</router-link>
        <router-link v-if="isAuthenticated && !isAdmin" to="/notifications">我的通知</router-link>
        <router-link v-if="isAdmin" to="/admin" class="admin-link">管理後台</router-link>
      </div>
      <div class="nav-user">
        <div v-if="!isAuthenticated" class="user-actions">
          <router-link to="/login" class="btn-auth">登入</router-link>
        </div>
        <div v-else class="user-info">
          <!-- 通知顯示（管理員：待審核申請數量，一般使用者：審核結果通知） -->
          <div v-if="notificationCount > 0" class="notification-icon" @click="goToNotifications">
            <span :class="['notification-badge', { 'badge-large': notificationCount > 9 }]">
              {{ notificationCount > 99 ? '99+' : notificationCount }}
            </span>
            <span class="notification-text">🔔</span>
          </div>
          <span class="user-name">{{ userData?.name || userData?.email || '使用者' }}</span>
          <button @click="handleLogout" class="btn-auth btn-logout">登出</button>
        </div>
      </div>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth.js';
import { getAdminUnreadNotificationCount, getUserNotifications, getPendingAdoptionApplications } from './utils/adoption.js';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config.js';

const router = useRouter();
const { currentUser, userData, isAuthenticated, isAdmin, logout } = useAuth();

const notificationCount = ref(0);

// 載入通知數量
async function loadNotificationCount() {
  if (!isAuthenticated.value) {
    notificationCount.value = 0;
    return;
  }

  try {
    if (isAdmin.value) {
      // 管理員：顯示待審核申請數量
      const result = await getPendingAdoptionApplications();
      if (result.success) {
        notificationCount.value = result.applications.length;
      }
    } else {
      // 一般使用者：顯示未讀通知數量
      const result = await getUserNotifications(currentUser.value?.uid);
      if (result.success) {
        notificationCount.value = result.notifications.length;
      }
    }
  } catch (error) {
    console.error('載入通知數量失敗:', error);
    notificationCount.value = 0;
  }
}

// 前往通知頁面
function goToNotifications() {
  if (isAdmin.value) {
    router.push('/admin');
  } else {
    // 一般使用者導向通知列表頁面
    router.push('/notifications');
  }
}

let notificationInterval = null;
let notificationUnsubscribe = null;

// 降級方案：監聽所有申請並在客戶端過濾（管理員用）
function setupFallbackListener() {
  // 清除舊的監聽器
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }

  // 監聽所有申請（不使用 where 和 orderBy，避免索引問題）
  const allApplicationsQuery = query(collection(db, 'adoptionApplications'));

  notificationUnsubscribe = onSnapshot(
    allApplicationsQuery,
    (snapshot) => {
      // 客戶端過濾：只計算狀態為 Pending 的申請
      const pendingCount = snapshot.docs.filter(
        doc => doc.data().status === 'Pending'
      ).length;
      notificationCount.value = pendingCount;
    },
    (error) => {
      console.error('降級監聽也失敗，改用輪詢:', error);
      // 最終降級：使用輪詢
      loadNotificationCount();
      if (notificationInterval) {
        clearInterval(notificationInterval);
      }
      notificationInterval = setInterval(() => {
        if (isAuthenticated.value && isAdmin.value) {
          loadNotificationCount();
        } else {
          clearInterval(notificationInterval);
          notificationInterval = null;
        }
      }, 5000); // 每 5 秒輪詢一次
    }
  );
}

// 設置實時監聽通知（使用 Firestore onSnapshot）
function setupNotificationListener() {
  // 清除舊的監聽器
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }

  if (!isAuthenticated.value) {
    notificationCount.value = 0;
    return;
  }

  try {
    if (isAdmin.value) {
      // 管理員：監聽待審核申請（通過監聽 adoptionApplications）
      try {
        const applicationsQuery = query(
          collection(db, 'adoptionApplications'),
          where('status', '==', 'Pending'),
          orderBy('createTime', 'desc')
        );

        notificationUnsubscribe = onSnapshot(
          applicationsQuery,
          (snapshot) => {
            notificationCount.value = snapshot.size;
          },
          (error) => {
            console.warn('監聽申請失敗（可能需要索引），改用降級方案:', error);
            // 降級為監聽所有申請，然後客戶端過濾
            setupFallbackListener();
          }
        );
      } catch (queryError) {
        console.warn('建立查詢失敗，使用降級方案:', queryError);
        setupFallbackListener();
      }
    } else {
      // 一般使用者：監聽未讀通知
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('recipientId', '==', currentUser.value?.uid),
        where('read', '==', false),
        orderBy('createTime', 'desc')
      );

      notificationUnsubscribe = onSnapshot(
        notificationsQuery,
        (snapshot) => {
          notificationCount.value = snapshot.size;
        },
        (error) => {
          console.warn('使用 where 查詢通知失敗，改用輪詢:', error);
          // 降級為輪詢
          loadNotificationCount();
          // 每 30 秒更新一次通知數量
          if (notificationInterval) {
            clearInterval(notificationInterval);
          }
          notificationInterval = setInterval(() => {
            if (isAuthenticated.value) {
              loadNotificationCount();
            } else {
              clearInterval(notificationInterval);
              notificationInterval = null;
            }
          }, 30000);
        }
      );
    }
  } catch (error) {
    console.error('設置通知監聽失敗:', error);
    // 降級為輪詢
    loadNotificationCount();
    notificationInterval = setInterval(() => {
      if (isAuthenticated.value) {
        loadNotificationCount();
      } else {
        clearInterval(notificationInterval);
        notificationInterval = null;
      }
    }, 30000);
  }
}

// 監聽登入狀態變化
watch([isAuthenticated, isAdmin], () => {
  // 清除舊的定時器和監聽器
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }

  if (isAuthenticated.value) {
    // 設置實時監聽
    setupNotificationListener();
  } else {
    notificationCount.value = 0;
  }
}, { immediate: true });

onMounted(() => {
  // 實時監聽已在 watch 中設置
  // 保留事件監聽作為備用（當實時監聽失敗時）
  window.addEventListener('notification-updated', loadNotificationCount);
});

onUnmounted(() => {
  // 組件卸載時移除監聽器和定時器
  window.removeEventListener('notification-updated', loadNotificationCount);
  if (notificationUnsubscribe) {
    notificationUnsubscribe();
    notificationUnsubscribe = null;
  }
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
});

// 處理登出
async function handleLogout() {
  try {
    await logout();
    notificationCount.value = 0;
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

.notification-icon {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.notification-icon:hover {
  background: #e5e7eb;
}

.notification-text {
  font-size: 1.2rem;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: #ffffff;
  border-radius: 50%;
  min-width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid #ffffff;
  box-sizing: border-box;
  line-height: 1;
  text-align: center;
}

.notification-badge.badge-large {
  border-radius: 12px;
  padding: 0 4px;
  min-width: 24px;
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
